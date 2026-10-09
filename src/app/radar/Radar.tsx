"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompte } from "@/lib/useCompte";
import { supabase } from "@/lib/supabase";
import { OFFRE } from "@/lib/config";
import { MARCHE } from "@/lib/marche";
import { euros, m2, loyerM2, nombre, pct } from "@/lib/format";
import { RADAR_MIN_PASSOIRES, type LigneRadar, type ReponseRadar } from "@/lib/radar";
import { COULEUR_CLASSE, DECOTE_PASSOIRE } from "@/lib/renovation";
import { CONTOUR, NOIRMOUTIER, chemin, px, py } from "@/components/accueil/CarteVendee";

type Etat = { phase: "chargement" } | { phase: "erreur"; message: string } | { phase: "pret"; d: ReponseRadar };
type Cle = "commune" | "passoires" | "part" | "prixM2" | "travauxM2" | "loyerM2" | "rendement";

const dateLongue = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function lienAnalyse(l: LigneRadar) {
  const q = new URLSearchParams({ cp: l.cp, type: l.type, dpe: l.g * 2 > l.passoires ? "G" : "F" });
  if (l.surface) q.set("surface", String(l.surface));
  return `/renover?${q}`;
}

function Carte({ lignes, max }: { lignes: LigneRadar[]; max: number }) {
  const parCp = new Map(lignes.map((l) => [l.cp, l]));
  const meilleur = Math.max(...lignes.map((l) => l.rendement ?? 0), 0.01);
  return (
    <svg viewBox="0 0 560 372" className="radar-carte" role="img" aria-label={`Carte des passoires énergétiques récentes par code postal en Vendée${lignes.length < MARCHE.codes_postaux.length ? " (aperçu)" : ""}`}>
      <defs>
        <radialGradient id="radar-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={COULEUR_CLASSE.F} stopOpacity="0.9" />
          <stop offset="0.55" stopColor={COULEUR_CLASSE.G} stopOpacity="0.45" />
          <stop offset="1" stopColor={COULEUR_CLASSE.G} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={chemin(CONTOUR)} fill="rgba(236,239,243,0.025)" stroke="rgba(236,239,243,0.22)" strokeWidth="1" />
      <path d={chemin(NOIRMOUTIER)} fill="rgba(236,239,243,0.025)" stroke="rgba(236,239,243,0.22)" strokeWidth="1" />
      <ellipse cx={px(-2.35)} cy={py(46.72)} rx="12" ry="5" fill="rgba(236,239,243,0.025)" stroke="rgba(236,239,243,0.22)" strokeWidth="1" />
      {MARCHE.codes_postaux.map((c) => {
        const l = parCp.get(c.cp);
        if (!l) return <circle key={c.cp} cx={px(c.lon)} cy={py(c.lat)} r="2" fill="rgba(236,239,243,0.18)" />;
        const r = 5 + Math.sqrt(l.passoires / max) * 22;
        const fort = (l.rendement ?? 0) / meilleur;
        return (
          <g key={c.cp} className="radar-point">
            <circle cx={px(c.lon)} cy={py(c.lat)} r={r} fill="url(#radar-halo)" opacity={0.45 + 0.55 * fort} />
            <circle cx={px(c.lon)} cy={py(c.lat)} r="2.5" fill="#fff3dc" />
            <title>{`${l.commune} (${l.cp}) : ${l.passoires} DPE F ou G, rendement après travaux ${pct(l.rendement)}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

function Verrou({ masquees }: { masquees: number }) {
  const compte = useCompte();
  const [msg, setMsg] = useState<{ type: "ok" | "erreur"; texte: React.ReactNode } | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function essai() {
    setOccupe(true);
    setMsg(null);
    const { error } = await supabase().rpc("demarrer_essai_pro");
    setOccupe(false);
    if (error) {
      setMsg({
        type: "erreur",
        texte: error.message.includes("ESSAI_DEJA_UTILISE") ? (
          <>
            L'essai gratuit a déjà été utilisé sur ce compte. <Link href="/tarifs">Voir les tarifs</Link>
          </>
        ) : (
          error.message
        ),
      });
      return;
    }
    await compte.recharger();
  }

  return (
    <div className="radar-verrou">
      <div className="radar-fantomes" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="radar-fantome">
            <i style={{ width: `${46 + ((i * 17) % 30)}%` }} />
            <i />
            <i />
            <i />
          </div>
        ))}
      </div>
      <div className="verre radar-offre">
        <h2 className="titre-m">
          {masquees} autres code{masquees > 1 ? "s" : ""} postaux dans le radar complet
        </h2>
        <p className="petit">
          Classement complet, tri par rendement, part de passoires ou prix, et lien direct vers l'analyse de chaque secteur. Réservé à l'offre
          Pro, mis à jour chaque jour.
        </p>
        {!compte.pret ? null : !compte.session ? (
          <Link href="/connexion?mode=inscription&suite=/radar" className="btn btn-clair">
            Essayer {OFFRE.essaiJours} jours gratuitement <span className="fleche" aria-hidden="true">→</span>
          </Link>
        ) : (
          <button type="button" className="btn btn-clair" onClick={essai} disabled={occupe}>
            Activer l'essai Pro de {OFFRE.essaiJours} jours
          </button>
        )}
        <p className="aide">Sans carte bancaire. Ensuite {OFFRE.proMensuel} € par mois, sans engagement.</p>
        {msg ? <p className={`message ${msg.type}`}>{msg.texte}</p> : null}
      </div>
    </div>
  );
}

export function Radar() {
  const compte = useCompte();
  const [etat, setEtat] = useState<Etat>({ phase: "chargement" });
  const [tri, setTri] = useState<{ cle: Cle; sens: 1 | -1 } | null>(null);
  const [filtre, setFiltre] = useState("");
  const jeton = compte.session?.access_token ?? null;

  const charger = useCallback(
    async (signal?: AbortSignal) => {
      setEtat({ phase: "chargement" });
      try {
        const r = await fetch("/api/radar", { headers: jeton ? { Authorization: `Bearer ${jeton}` } : {}, signal, cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.erreur ?? "Le radar est indisponible pour le moment.");
        setEtat({ phase: "pret", d: j as ReponseRadar });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setEtat({ phase: "erreur", message: (e as Error).message || "Le radar est indisponible pour le moment." });
      }
    },
    [jeton],
  );

  useEffect(() => {
    if (!compte.pret) return;
    const ctrl = new AbortController();
    charger(ctrl.signal);
    return () => ctrl.abort();
  }, [compte.pret, compte.pro, charger]);

  const d = etat.phase === "pret" ? etat.d : null;

  const visibles = useMemo(() => {
    if (!d) return [];
    const f = filtre.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
    const lignes = d.lignes.filter((l) => !f || `${l.cp} ${l.commune}`.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().includes(f));
    if (!tri) return lignes;
    const val = (l: LigneRadar): number | string => (tri.cle === "commune" ? l.commune : (l[tri.cle] as number | null) ?? -1);
    return [...lignes].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return (typeof x === "string" ? x.localeCompare(y as string, "fr") : (x as number) - (y as number)) * tri.sens;
    });
  }, [d, tri, filtre]);

  const maxPassoires = d ? Math.max(1, ...d.lignes.map((l) => l.passoires)) : 1;
  const th = (cle: Cle, label: string, num = true) => (
    <th className={num ? "num" : ""} aria-sort={tri?.cle === cle ? (tri.sens === 1 ? "ascending" : "descending") : "none"}>
      {d?.pro ? (
        <button type="button" className="tri" onClick={() => setTri((t) => ({ cle, sens: t?.cle === cle ? ((-t.sens) as 1 | -1) : cle === "commune" ? 1 : -1 }))}>
          {label}
          {tri?.cle === cle ? (tri.sens === 1 ? " ↑" : " ↓") : ""}
        </button>
      ) : (
        label
      )}
    </th>
  );

  return (
    <div className="page conteneur radar">
      <div className="page-titre radar-tete">
        <h1 className="titre-l">Radar des passoires</h1>
        <p className="chapo">
          Pour vendre ou louer un logement, il faut un DPE. Quand une commune enchaîne les DPE classés F ou G, des passoires arrivent sur le
          marché. Le radar les compte chaque jour, code postal par code postal, et calcule ce qu'elles rapporteraient une fois rénovées.
        </p>
      </div>

      {etat.phase === "chargement" ? (
        <div className="radar-attente" role="status">
          <span className="sr-only">Chargement du radar…</span>
          <div className="radar-squelette" />
          <div className="radar-squelette" />
        </div>
      ) : etat.phase === "erreur" ? (
        <div className="verre radar-erreur" role="alert">
          <p>{etat.message}</p>
          <button type="button" className="btn btn-contour" onClick={() => charger()}>
            Réessayer
          </button>
        </div>
      ) : d ? (
        <>
          <section className="radar-synthese">
            <p className="radar-phrase">
              Depuis le {dateLongue(d.depuis)}, <b className="chiffre">{nombre(d.total_passoires)}</b> logements de Vendée ont reçu un DPE F ou G, soit{" "}
              <b className="chiffre">{pct(d.total_dpe ? (d.total_passoires / d.total_dpe) * 100 : null)}</b> des {nombre(d.total_dpe)} diagnostics
              réalisés. Dont <b className="chiffre">{nombre(d.total_g)}</b> classés G, interdits à la location pour tout nouveau bail.
            </p>
            <Carte lignes={d.lignes} max={maxPassoires} />
          </section>

          <section className="radar-table">
            <div className="radar-outils">
              <h2 className="titre-m">{d.pro ? `Les ${nombre(d.communes)} secteurs à suivre` : "Les trois secteurs en tête"}</h2>
              {d.pro ? (
                <div className="champ radar-filtre">
                  <label htmlFor="filtre-radar">Rechercher une commune</label>
                  <input id="filtre-radar" value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Code postal ou commune" />
                </div>
              ) : null}
            </div>
            <div className="defile-x">
              <table className="tableau">
                <thead>
                  <tr>
                    {th("commune", "Commune", false)}
                    {th("passoires", `DPE F ou G, ${d.jours} j`)}
                    {th("part", "Part des DPE")}
                    {th("prixM2", "Prix médian")}
                    {th("travauxM2", "Travaux vers D")}
                    {th("loyerM2", "Loyer de marché")}
                    {th("rendement", "Rendement après travaux")}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((l) => (
                    <tr key={l.cp} className={l.passoires < RADAR_MIN_PASSOIRES ? "discret" : ""}>
                      <td>
                        <Link href={`/marche/${l.slug}`} className="radar-commune">
                          {l.commune}
                        </Link>
                        <span className="petit"> {l.cp}</span>
                        <div className="aide">
                          {l.type === "Maison" ? "Surtout des maisons" : "Surtout des appartements"}
                          {l.surface ? `, ${nombre(l.surface)} m² en moyenne` : ""}
                        </div>
                      </td>
                      <td className="num">
                        <span className="radar-jauge" style={{ ["--w" as string]: `${(l.passoires / maxPassoires) * 100}%` }} aria-hidden="true" />
                        <span className="chiffre">{nombre(l.passoires)}</span>
                        <div className="aide">dont {nombre(l.g)} G</div>
                      </td>
                      <td className="num">{pct(l.part)}</td>
                      <td className="num">
                        {m2(l.prixM2)}
                        <div className="aide">visé : {m2(l.prixCible)}</div>
                      </td>
                      <td className="num">{m2(l.travauxM2)}</td>
                      <td className="num">{l.loyerM2 ? loyerM2(l.loyerM2) : "—"}</td>
                      <td className="num">
                        <b className={`chiffre ${l.rendement !== null && l.rendement >= 7 ? "positif" : ""}`}>{pct(l.rendement)}</b>
                      </td>
                      <td className="num">
                        <Link href={lienAnalyse(l)} className="btn-texte">
                          Analyser
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {d.pro && !visibles.length ? (
                    <tr>
                      <td colSpan={8} className="discret">
                        Aucune commune ne correspond à « {filtre} ».
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {!d.pro && d.masquees > 0 ? <Verrou masquees={d.masquees} /> : null}
          </section>

          <section className="radar-notes">
            <h2 className="titre-m">Comment lire le radar</h2>
            <dl>
              <div>
                <dt>DPE F ou G</dt>
                <dd>
                  Diagnostics de logements existants classés F ou G et établis sur les {d.jours} derniers jours, d'après la base publique de l'ADEME. Un
                  DPE récent accompagne le plus souvent une mise en vente ou en location.
                </dd>
              </div>
              <div>
                <dt>Prix visé</dt>
                <dd>
                  Médiane des ventes DVF 2024-2025 du type de bien dominant, moins {DECOTE_PASSOIRE * 100} %. Les notaires mesurent jusqu'à 25 % de décote
                  pour une maison classée G : la nôtre reste prudente.
                </dd>
              </div>
              <div>
                <dt>Travaux vers D</dt>
                <dd>Coût moyen pour gagner deux classes depuis F, trois depuis G, par m² habitable. Remplacez-le par l'audit ou un devis.</dd>
              </div>
              <div>
                <dt>Rendement après travaux</dt>
                <dd>Loyer de marché hors charges sur douze mois, divisé par le prix visé plus les travaux. Hors frais de notaire et aides.</dd>
              </div>
            </dl>
            <p className="aide">
              Données agrégées par code postal : aucune adresse ni aucun propriétaire. Codes postaux de moins de {RADAR_MIN_PASSOIRES} passoires en fin de
              classement. Mis à jour le {dateLongue(d.maj)}.
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}

