// Radar des passoires : agrège les DPE récents de Vendée (base ADEME « DPE logements existants »)
// par code postal. Liste complète pour un compte Pro (jeton Supabase dans l'en-tête Authorization),
// aperçu des trois premiers codes postaux pour les autres.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";
import { estPro, type Abonnement } from "@/lib/supabase";
import { classer, composerRadar, RADAR_JOURS, RADAR_MIN_PASSOIRES, type CompteCp, type ReponseRadar } from "@/lib/radar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADEME = "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/values_agg";
const APERCU = 3;

async function agreger(qs: string, surface = false): Promise<Map<string, CompteCp>> {
  const p = new URLSearchParams({ field: "code_postal_ban", agg_size: "150", size: "0", qs });
  if (surface) {
    p.set("metric", "avg");
    p.set("metric_field", "surface_habitable_logement");
  }
  const r = await fetch(`${ADEME}?${p}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 43200 },
    signal: AbortSignal.timeout(9000),
  });
  if (!r.ok) throw new Error(`ADEME ${r.status}`);
  const j = (await r.json()) as { aggs?: { value: string | number; total: number; metric?: number }[] };
  return new Map((j.aggs ?? []).map((a) => [String(a.value), { n: Number(a.total) || 0, metric: a.metric }]));
}

async function compteEstPro(entete: string | null): Promise<boolean> {
  if (!entete?.startsWith("Bearer ")) return false;
  const jeton = entete.slice(7).trim();
  if (!jeton) return false;
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${jeton}` },
      // Jamais de cache Next sur les requêtes liées à un compte.
      fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
    },
  });
  const { data: u, error } = await sb.auth.getUser(jeton);
  if (error || !u.user) return false;
  const [abo, admin] = await Promise.all([
    sb.from("subscriptions").select("plan,status,current_period_end").eq("user_id", u.user.id).maybeSingle(),
    sb.rpc("is_admin"),
  ]);
  return estPro(abo.data as Abonnement | null) || Boolean(admin.data);
}

export async function GET(req: Request) {
  // Date arrondie au jour : la même requête sert le cache ADEME pendant 12 heures.
  const depuis = new Date(Date.now() - RADAR_JOURS * 86400000).toISOString().slice(0, 10);
  const periode = `date_etablissement_dpe:[${depuis} TO *]`;
  const dep = "code_departement_ban:85";

  let pro = false;
  try {
    pro = await compteEstPro(req.headers.get("authorization"));
  } catch {
    pro = false;
  }

  try {
    const [tous, fg, g, maisons] = await Promise.all([
      agreger(`${dep} AND ${periode}`),
      agreger(`${dep} AND etiquette_dpe:(F OR G) AND ${periode}`, true),
      agreger(`${dep} AND etiquette_dpe:G AND ${periode}`),
      agreger(`${dep} AND etiquette_dpe:(F OR G) AND type_batiment:maison AND ${periode}`),
    ]);
    const lignes = classer(composerRadar(tous, fg, g, maisons));
    const somme = (m: Map<string, CompteCp>) => [...m.values()].reduce((s, x) => s + x.n, 0);
    const corps: ReponseRadar = {
      depuis,
      jours: RADAR_JOURS,
      maj: new Date().toISOString(),
      total_dpe: somme(tous),
      total_passoires: somme(fg),
      total_g: somme(g),
      communes: lignes.filter((l) => l.passoires >= RADAR_MIN_PASSOIRES).length,
      pro,
      lignes: pro ? lignes : lignes.slice(0, APERCU),
      masquees: pro ? 0 : Math.max(0, lignes.length - APERCU),
    };
    return Response.json(corps, { headers: { "cache-control": "private, no-store" } });
  } catch (e) {
    return Response.json(
      { erreur: "La base DPE de l'ADEME ne répond pas pour le moment. Réessayez dans quelques minutes.", detail: String(e).slice(0, 120) },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
