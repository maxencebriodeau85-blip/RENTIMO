"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, estPro, type Abonnement } from "./supabase";

export interface Profil {
  nom: string | null;
  societe: string | null;
  telephone: string | null;
  email_contact: string | null;
  site_web: string | null;
}

export interface Compte {
  pret: boolean;
  session: Session | null;
  abonnement: Abonnement | null;
  profil: Profil | null;
  pro: boolean;
  admin: boolean;
  recharger: () => Promise<void>;
}

/** Session, abonnement et profil de l'utilisateur connecté. */
export function useCompte(): Compte {
  const [pret, setPret] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [admin, setAdmin] = useState(false);

  const charger = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) {
      setAbonnement(null);
      setProfil(null);
      setAdmin(false);
      setPret(true);
      return;
    }
    const sb = supabase();
    const [a, p, ad] = await Promise.all([
      sb.from("subscriptions").select("plan,status,current_period_end").eq("user_id", s.user.id).maybeSingle(),
      sb.from("profils").select("nom,societe,telephone,email_contact,site_web").eq("user_id", s.user.id).maybeSingle(),
      sb.rpc("is_admin"),
    ]);
    setAbonnement((a.data as Abonnement) ?? null);
    setProfil((p.data as Profil) ?? null);
    setAdmin(Boolean(ad.data));
    setPret(true);
  }, []);

  useEffect(() => {
    const sb = supabase();
    sb.auth
      .getSession()
      .then(({ data }) => charger(data.session))
      .catch(() => setPret(true));
    const { data } = sb.auth.onAuthStateChange((_e, s) => {
      charger(s);
    });
    return () => data.subscription.unsubscribe();
  }, [charger]);

  return {
    pret,
    session,
    abonnement,
    profil,
    pro: estPro(abonnement),
    admin,
    recharger: async () => {
      const { data } = await supabase().auth.getSession();
      await charger(data.session);
    },
  };
}
