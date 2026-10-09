-- Rentimo v6 — essai Pro en libre-service, quota aligné sur l'offre, partage à la marque du pro,
-- administration (activer une offre, lister les comptes), baromètre, anti-abus des formulaires.

-- 1. Essai Pro (une seule fois par compte)
alter table public.subscriptions add column if not exists essai_utilise boolean not null default false;

create or replace function public.demarrer_essai_pro()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'NON_CONNECTE';
  end if;
  insert into public.subscriptions (user_id, plan, status, current_period_end, essai_utilise, updated_at)
  values (uid, 'pro', 'trialing', now() + interval '14 days', true, now())
  on conflict (user_id) do update
    set plan = 'pro', status = 'trialing', current_period_end = now() + interval '14 days', essai_utilise = true, updated_at = now()
    where public.subscriptions.essai_utilise = false and public.subscriptions.status <> 'active';
  if not found then
    raise exception 'ESSAI_DEJA_UTILISE';
  end if;
end;
$$;

revoke execute on function public.demarrer_essai_pro() from public, anon;
grant execute on function public.demarrer_essai_pro() to authenticated;

-- 2. Quota : illimité pour un Pro actif ou en essai non expiré
create or replace function public.enforce_simulation_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nb integer;
  pro boolean;
begin
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = new.user_id
      and s.plan = 'pro'
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  ) into pro;
  if not pro then
    select count(*) into nb from public.simulations where user_id = new.user_id;
    if nb >= 3 then
      raise exception 'QUOTA_ATTEINT: plan gratuit limité à 3 simulations sauvegardées';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_simulation_quota() from public, anon, authenticated;

-- 3. Partage : jeton unique, coordonnées du conseiller seulement s'il est Pro
create unique index if not exists simulations_share_token_idx on public.simulations (share_token) where share_token is not null;

create or replace function public.partage_simulation(jeton uuid)
returns table (
  nom text, ville text, code_postal text, input_json jsonb, resultats_json jsonb, created_at timestamptz,
  pro boolean, conseiller_nom text, conseiller_societe text, conseiller_telephone text, conseiller_email text, conseiller_site text
)
language sql
stable
security definer
set search_path = public
as $$
  with s as (
    select sim.*, exists (
      select 1 from public.subscriptions a
      where a.user_id = sim.user_id and a.plan = 'pro' and a.status in ('active', 'trialing')
        and (a.current_period_end is null or a.current_period_end > now())
    ) as est_pro
    from public.simulations sim
    where sim.share_token = jeton
    limit 1
  )
  select s.nom, s.ville, s.code_postal, s.input_json, s.resultats_json, s.created_at, s.est_pro,
    case when s.est_pro then p.nom end,
    case when s.est_pro then p.societe end,
    case when s.est_pro then p.telephone end,
    case when s.est_pro then p.email_contact end,
    case when s.est_pro then p.site_web end
  from s left join public.profils p on p.user_id = s.user_id;
$$;

grant execute on function public.partage_simulation(uuid) to anon, authenticated;

-- 4. Administration
create or replace function public.admin_definir_plan(email_cible text, nouveau_plan text, mois integer default 1)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  if not public.is_admin() then
    raise exception 'interdit';
  end if;
  if nouveau_plan not in ('pro', 'free') then
    raise exception 'PLAN_INCONNU';
  end if;
  select id into uid from auth.users where lower(email) = lower(trim(email_cible));
  if uid is null then
    raise exception 'UTILISATEUR_INCONNU: aucun compte avec cet e-mail';
  end if;
  insert into public.subscriptions (user_id, plan, status, current_period_end, updated_at)
  values (
    uid, nouveau_plan,
    case when nouveau_plan = 'pro' then 'active' else 'inactive' end,
    case when nouveau_plan = 'pro' then now() + make_interval(months => greatest(1, least(mois, 36))) else null end,
    now()
  )
  on conflict (user_id) do update
    set plan = excluded.plan, status = excluded.status, current_period_end = excluded.current_period_end, updated_at = now();
end;
$$;

revoke execute on function public.admin_definir_plan(text, text, integer) from public, anon;
grant execute on function public.admin_definir_plan(text, text, integer) to authenticated;

create or replace function public.admin_utilisateurs()
returns table (email text, inscrit_le timestamptz, plan text, statut text, fin timestamptz, nb_simulations bigint, derniere_connexion timestamptz)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'interdit';
  end if;
  return query
    select u.email::text, u.created_at, coalesce(s.plan, 'free'), coalesce(s.status, 'inactive'), s.current_period_end,
      (select count(*) from public.simulations x where x.user_id = u.id), u.last_sign_in_at
    from auth.users u
    left join public.subscriptions s on s.user_id = u.id
    order by u.created_at desc
    limit 500;
end;
$$;

revoke execute on function public.admin_utilisateurs() from public, anon;
grant execute on function public.admin_utilisateurs() to authenticated;

-- 5. Formulaires : garde-fou contre l'envoi massif (les inscriptions au baromètre sont des « contact », source « barometre »)

create or replace function public.limiter_leads()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.leads where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'TROP_DE_DEMANDES';
  end if;
  if (select count(*) from public.leads where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'TROP_DE_DEMANDES';
  end if;
  return new;
end;
$$;

revoke execute on function public.limiter_leads() from public, anon, authenticated;
create or replace trigger trg_limiter_leads before insert on public.leads for each row execute function public.limiter_leads();

-- 6. Droits : statistiques réservées aux comptes connectés (contrôle admin dans la fonction)
revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;
revoke execute on function public.partage_simulation(uuid) from public;
grant execute on function public.partage_simulation(uuid) to anon, authenticated;
