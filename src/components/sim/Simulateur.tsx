"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculer,
  ENTREE_DEFAUT,
  fraisNotaireEstimes,
  LIBELLES_REGIME,
  normaliser,
  scorer,
  type Entree,
  type Regime,
  type Resultats,
  type TypeLocal,
} from "@/lib/calculs";
import { euros, eurosSigne, loyerM2, m2, nombre, pct } from "@/lib/format";
import { MARCHE, loyerMarche, parCodePostal, statPrix } from "@/lib/marche";
import { supabase } from "@/lib/supabase";
import { useCompte } from "@/lib/useCompte";
import { OFFRE } from "@/lib/config";
import { LigneNombre } from "@/components/ChampNombre";
import { GraphiqueProjection } from "@/components/Courbe";
import { Rapport } from "@/components/Rapport";

const CLE_BROUILLON = "rentimo:brouillon";

export function resumer(r: Resultats, score: number) {
  return {
    rendement_brut_pct: r.rendement_brut_pct,
    rendement_net_pct: r.rendement_net_pct,
    rendement_net_net_pct: r.rendement_net_net_pct,
    cashflow_mensuel: r.cashflow_mensuel,
    tri_pct: r.tri_pct,
    impot_annee1: r.impot_annee1,
    mensualite: r.mensualite,
    cout_total: r.cout_total,
    prix_m2: r.prix_m2,
    enrichissement_total: r.enrichissement_total,
    meilleur_regime: r.meilleur_regime,
    score,
  };
}

function lireBrouillon(): Partial<Entree> | null {
  try {
    const t = localStorage.getItem(CLE_BROUILLON);
    return t ? (JSON.parse(t) as Partial<Entree>) : null;
  } catch {
    return null;
  }
}

function ecrireBrouillon(e: Entree) {
  try {
    localStorage.setItem(CLE_BROUILLON, JSON.stringify(e));
  } catch {
    /* stockage indisponible : sans conséquence */
  }
}

function Pilules<T extends string | number>({ options, valeur, onChange, label }: { options: { v: T; l: string }[]; valeur: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="pilules" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.v)} type="button" className="pilule" aria-pressed={valeur === o.v} onClick={() => onChange(o.v)}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Anneau({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(236,239,243,.1)" strokeWidth="6" />
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        stroke={score >= 60 ? "var(--maree)" : score >= 45 ? "var(--lueur)" : "var(--alerte)"}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        transform="rotate(-90 42 42)"
      />
    </svg>
  );
}

export function Simulateur() {
  const params = useSearchParams();
  const router = useRouter();
  const compte = useCompte();
  const [e, setE] = useState<Entree>(ENTREE_DEFAUT);
  const [id, setId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "erreur"; texte: React.ReactNode } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [vueTableau, setVueTableau] = useState(false);
  const initialise = useRef(false);

  const maj = <K extends keyof Entree>(k: K, v: Entree[K]) => setE((x) => ({ ...x, [k]: v }));

  // Initialisation : simulation enregistrée (?id=), paramètres d'URL, ou brouillon local
  useEffect(() => {
    if (initialise.current) return;
    initialise.current = true;
    const idUrl = params.get("id");
    if (idUrl) {
      supabase()
        .from("simulations")
        .select("id,input_json,share_token")
        .eq("id", idUrl)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setE(normaliser(data.input_json as Partial<Entree>));
            setId(data.id as string);
            setShareToken((data.share_token as string) ?? null);
          }
        });
      return;
    }
    const brouillon = lireBrouillon();
    const depart: Partial<Entree> = { ...(brouillon ?? {}) };
    const num = (k: string) => {
      const v = params.get(k);
      return v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined;
    };
    const t = params.get("type");
    const cp = params.get("cp");
    const surcharges: Partial<Entree> = {};
    if (t === "Appartement" || t === "Maison") surcharges.type_local = t;
    if (num("prix") !== undefined) surcharges.prix_achat = num("prix");
    if (num("loyer") !== undefined) surcharges.loyer_mensuel = num("loyer");
    if (num("apport") !== undefined) surcharges.apport = num("apport");
    if (num("surface") !== undefined) surcharges.surface = num("surface");
    if (num("travaux") !== undefined) surcharges.travaux = num("travaux");
    const regimeUrl = params.get("regime");
    if (regimeUrl && regimeUrl in LIBELLES_REGIME) {
      surcharges.regime_fiscal = regimeUrl as Regime;
      if (regimeUrl.startsWith("nue")) surcharges.mobilier = 0;
    }
    if (num("charges") !== undefined) {
      surcharges.charges_copro = num("charges");
      surcharges.taxe_fonciere = 0;
      surcharges.assurance_pno = 0;
      surcharges.autres_charges = 0;
    }
    if (cp && /^\d{5}$/.test(cp)) {
      surcharges.code_postal = cp;
      const c = parCodePostal(cp);
      if (c) surcharges.ville = c.commune.replace(/\s*\(.*\)$/, "");
    }
    if (Object.keys(surcharges).length) {
      surcharges.travaux = surcharges.travaux ?? 0;
      setE(normaliser({ ...ENTREE_DEFAUT, ...surcharges }));
    } else if (brouillon) {
      setE(normaliser(depart));
    }
  }, [params]);

  useEffect(() => {
    const t = setTimeout(() => ecrireBrouillon(e), 400);
    return () => clearTimeout(t);
  }, [e]);

  const r = useMemo(() => calculer(e), [e]);
  const cpData = parCodePostal(e.code_postal);
  const stat = cpData ? statPrix(cpData, e.type_local) : null;
  const loyerSecteur = cpData ? loyerMarche(cpData, e.type_local) : null;
  const score = useMemo(() => scorer(r, stat), [r, stat]);
  const meilleur = r.regimes.find((g) => g.regime === r.meilleur_regime)!;
  const actuel = r.regimes.find((g) => g.regime === e.regime_fiscal)!;

  const constats: string[] = [];
  if (stat && r.prix_m2 > stat.p75) constats.push(`Prix au m² au-dessus de 75 % des ventes du secteur (${m2(stat.p75)}) : il y a probablement de la marge de négociation.`);
  if (stat && r.prix_m2 > 0 && r.prix_m2 < stat.p25) constats.push(`Prix au m² sous le premier quart des ventes du secteur : vérifiez l'état du bien et les travaux.`);
  if (loyerSecteur && e.surface > 0 && e.loyer_mensuel / e.surface > loyerSecteur * 1.15)
    constats.push(`Loyer au-dessus du marché local (${loyerM2(loyerSecteur)} charges comprises) : vérifiez-le sur des annonces comparables.`);
  if (r.cashflow_mensuel < 0) constats.push(`Effort d'épargne de ${euros(-r.cashflow_mensuel)} par mois la première année.`);
  if (actuel.eligible && meilleur.regime !== e.regime_fiscal && actuel.impot_moyen_10ans - meilleur.impot_moyen_10ans > 50)
    constats.push(`${LIBELLES_REGIME[meilleur.regime]} réduirait l'impôt d'environ ${euros(actuel.impot_moyen_10ans - meilleur.impot_moyen_10ans)} par an.`);
  if (!actuel.eligible) constats.push(`${LIBELLES_REGIME[e.regime_fiscal]} : ${actuel.raison}.`);
  if (e.regime_fiscal.startsWith("lmnp") && e.mobilier === 0) constats.push("En LMNP, le logement doit être loué meublé : ajoutez le coût du mobilier.");

  async function enregistrer(): Promise<string | null> {
    setMessage(null);
    if (!compte.session) {
      ecrireBrouillon(e);
      router.push("/connexion?suite=/simulateur");
      return null;
    }
    setOccupe(true);
    const sb = supabase();
    const ligne = {
      user_id: compte.session.user.id,
      nom: e.nom || "Simulation",
      prix_achat: e.prix_achat,
      type_bien: e.type_bien,
      frais_notaire: r.frais_notaire_retenus,
      travaux: e.travaux,
      mobilier: e.mobilier,
      surface: e.surface,
      code_postal: e.code_postal || null,
      ville: e.ville || null,
      loyer_mensuel: e.loyer_mensuel,
      charges_copro: e.charges_copro,
      taxe_fonciere: e.taxe_fonciere,
      assurance_pno: e.assurance_pno,
      vacance_pct: e.vacance_pct,
      apport: e.apport,
      taux_credit: e.taux_credit,
      duree_credit: e.duree_credit,
      regime_fiscal: e.regime_fiscal,
      tmi_utilisateur: e.tmi_utilisateur,
      input_json: e,
      resultats_json: resumer(r, score.total),
    };
    const res = id
      ? await sb.from("simulations").update(ligne).eq("id", id).select("id").single()
      : await sb.from("simulations").insert(ligne).select("id").single();
    setOccupe(false);
    if (res.error) {
      if (res.error.message.includes("QUOTA_ATTEINT")) {
        setMessage({
          type: "erreur",
          texte: (
            <>
              Vous avez atteint les {OFFRE.gratuitSauvegardes} simulations sauvegardées du compte gratuit. Supprimez-en une depuis{" "}
              <Link href="/dashboard">votre espace</Link> ou <Link href="/tarifs">passez en Pro</Link>.
            </>
          ),
        });
      } else {
        setMessage({ type: "erreur", texte: `Enregistrement impossible : ${res.error.message}` });
      }
      return null;
    }
    const nouvelId = res.data.id as string;
    setId(nouvelId);
    if (!id) window.history.replaceState(null, "", `/simulateur?id=${nouvelId}`);
    setMessage({ type: "ok", texte: "Simulation enregistrée dans votre espace." });
    return nouvelId;
  }

  async function partager() {
    const simId = id ?? (await enregistrer());
    if (!simId) return;
    setOccupe(true);
    let token = shareToken;
    if (!token) {
      token = crypto.randomUUID();
      const { error } = await supabase().from("simulations").update({ share_token: token }).eq("id", simId);
      if (error) {
        setOccupe(false);
        setMessage({ type: "erreur", texte: `Lien impossible à créer : ${error.message}` });
        return;
      }
      setShareToken(token);
    }
    setOccupe(false);
    const url = `${window.location.origin}/s/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage({ type: "ok", texte: <>Lien copié : <a href={url}>{url}</a></> });
    } catch {
      setMessage({ type: "ok", texte: <>Lien de partage : <a href={url}>{url}</a></> });
    }
  }

  const notaireEstime = fraisNotaireEstimes(e.prix_achat, e.type_bien);
  const H = r.projection.length;
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <div className="simulateur conteneur pas-imprime">
        <div className="sim-entete">
          <div>
            <h1 className="titre-l">Simulateur</h1>
            <p className="chapo">Chaque chiffre se recalcule pendant que vous tapez. Commencez par le code postal, le prix et le loyer.</p>
          </div>
        </div>

        <div className="sim-grille">
          <form className="sim-form" onSubmit={(ev) => ev.preventDefault()} aria-label="Hypothèses de la simulation">
            <fieldset className="verre sim-bloc">
              <legend>Le bien</legend>
              <div className="champ">
                <label htmlFor="nom">Nom de la simulation</label>
                <input id="nom" value={e.nom} maxLength={80} onChange={(x) => maj("nom", x.target.value)} />
              </div>
              <div className="sim-pilules">
                <Pilules<TypeLocal> label="Type de bien" valeur={e.type_local} onChange={(v) => maj("type_local", v)} options={[{ v: "Appartement", l: "Appartement" }, { v: "Maison", l: "Maison" }]} />
                <Pilules label="Ancien ou neuf" valeur={e.type_bien} onChange={(v) => maj("type_bien", v)} options={[{ v: "ancien", l: "Ancien" }, { v: "neuf", l: "Neuf" }]} />
              </div>
              <div className="champ" style={{ marginTop: 14 }}>
                <label htmlFor="cp">Code postal</label>
                <input
                  id="cp"
                  list="liste-cp"
                  inputMode="numeric"
                  value={e.code_postal}
                  maxLength={5}
                  onChange={(x) => {
                    const v = x.target.value.replace(/\D/g, "").slice(0, 5);
                    const c = parCodePostal(v);
                    setE((s) => ({ ...s, code_postal: v, ville: c ? c.commune.replace(/\s*\(.*\)$/, "") : v.length === 5 ? s.ville : "" }));
                  }}
                />
                <datalist id="liste-cp">
                  {MARCHE.codes_postaux.map((c) => (
                    <option key={c.cp} value={c.cp}>
                      {c.commune}
                    </option>
                  ))}
                </datalist>
                <span className="aide">{cpData ? `${cpData.commune} · prix et loyers du secteur disponibles` : "Prix du marché disponibles pour la Vendée (85)."}</span>
              </div>
              <LigneNombre label="Surface" unite="m²" valeur={e.surface} onChange={(v) => maj("surface", v)} />
              <LigneNombre label="Prix d'achat (net vendeur)" valeur={e.prix_achat} onChange={(v) => maj("prix_achat", v)} />
              <LigneNombre label={`Frais de notaire (0 = auto : ${euros(notaireEstime)})`} valeur={e.frais_notaire} onChange={(v) => maj("frais_notaire", v)} />
              <LigneNombre label="Travaux" valeur={e.travaux} onChange={(v) => maj("travaux", v)} />
              <LigneNombre label="Mobilier (location meublée)" valeur={e.mobilier} onChange={(v) => maj("mobilier", v)} />
            </fieldset>

            <fieldset className="verre sim-bloc">
              <legend>Les loyers</legend>
              <LigneNombre label="Loyer mensuel hors charges" valeur={e.loyer_mensuel} onChange={(v) => maj("loyer_mensuel", v)} />
              <LigneNombre label="Vacance locative" unite="%" valeur={e.vacance_pct} max={100} onChange={(v) => maj("vacance_pct", v)} aide="4 % ≈ deux semaines par an" />
              {loyerSecteur && e.surface > 0 ? (
                <p className="aide sim-indice">
                  Loyer de marché à {cpData?.commune.replace(/\s*\(.*\)$/, "")} : {loyerM2(loyerSecteur)} charges comprises, soit environ{" "}
                  {euros(loyerSecteur * e.surface)} par mois pour {nombre(e.surface)} m².{" "}
                  <button type="button" className="btn-texte" onClick={() => maj("loyer_mensuel", Math.round(loyerSecteur * e.surface * 0.92))}>
                    Utiliser ce loyer (hors charges)
                  </button>
                </p>
              ) : null}
            </fieldset>

            <fieldset className="verre sim-bloc">
              <legend>Les charges annuelles</legend>
              <LigneNombre label="Copropriété (part non récupérable)" valeur={e.charges_copro} onChange={(v) => maj("charges_copro", v)} />
              <LigneNombre label="Taxe foncière" valeur={e.taxe_fonciere} onChange={(v) => maj("taxe_fonciere", v)} />
              <LigneNombre label="Assurance propriétaire non occupant" valeur={e.assurance_pno} onChange={(v) => maj("assurance_pno", v)} />
              <LigneNombre label="Gestion locative" unite="%" valeur={e.gestion_pct} max={30} onChange={(v) => maj("gestion_pct", v)} aide="Pourcentage des loyers encaissés" />
              <LigneNombre label="Entretien, comptable, CFE" valeur={e.autres_charges} onChange={(v) => maj("autres_charges", v)} />
            </fieldset>

            <fieldset className="verre sim-bloc">
              <legend>Le financement</legend>
              <LigneNombre label="Apport personnel" valeur={e.apport} onChange={(v) => maj("apport", v)} />
              <LigneNombre label="Taux du crédit" unite="%" valeur={e.taux_credit} max={15} onChange={(v) => maj("taux_credit", v)} />
              <LigneNombre label="Durée" unite="ans" valeur={e.duree_credit} max={30} onChange={(v) => maj("duree_credit", v)} />
              <LigneNombre label="Assurance emprunteur" unite="%" valeur={e.assurance_emprunteur_pct} max={2} onChange={(v) => maj("assurance_emprunteur_pct", v)} aide="Pourcentage du capital emprunté, par an" />
              <LigneNombre label="Frais de dossier et de garantie" valeur={e.frais_bancaires} onChange={(v) => maj("frais_bancaires", v)} />
            </fieldset>

            <fieldset className="verre sim-bloc">
              <legend>La fiscalité</legend>
              <div className="champ">
                <label htmlFor="regime">Régime fiscal</label>
                <select id="regime" value={e.regime_fiscal} onChange={(x) => maj("regime_fiscal", x.target.value as Regime)}>
                  {(Object.keys(LIBELLES_REGIME) as Regime[]).map((g) => (
                    <option key={g} value={g}>
                      {LIBELLES_REGIME[g]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="champ" style={{ marginTop: 14 }}>
                <span className="petit">Tranche marginale d'imposition</span>
                <Pilules label="Tranche marginale d'imposition" valeur={e.tmi_utilisateur} onChange={(v) => maj("tmi_utilisateur", v)} options={[0, 11, 30, 41, 45].map((v) => ({ v, l: `${v} %` }))} />
              </div>
            </fieldset>

            <details className="verre sim-bloc sim-avance">
              <summary>Revente et revalorisation</summary>
              <LigneNombre label="Revente après" unite="ans" valeur={e.horizon} min={1} max={30} onChange={(v) => maj("horizon", v)} />
              <LigneNombre label="Revalorisation du bien" unite="%/an" valeur={e.revalo_bien_pct} max={10} onChange={(v) => maj("revalo_bien_pct", v)} />
              <LigneNombre label="Revalorisation des loyers" unite="%/an" valeur={e.revalo_loyer_pct} max={10} onChange={(v) => maj("revalo_loyer_pct", v)} />
              <LigneNombre label="Frais de revente" unite="%" valeur={e.frais_revente_pct} max={15} onChange={(v) => maj("frais_revente_pct", v)} />
            </details>

            <button type="button" className="btn-texte" style={{ justifySelf: "start" }} onClick={() => { setE(ENTREE_DEFAUT); setId(null); setShareToken(null); window.history.replaceState(null, "", "/simulateur"); }}>
              Repartir de l'exemple
            </button>
          </form>

          <section className="sim-resultats" id="resultats" aria-label="Résultats" aria-live="polite">
            <div className="verre sim-synthese">
              <div className="sim-score">
                <div className="sim-anneau">
                  <Anneau score={score.total} />
                  <span className="chiffre">{score.total}</span>
                </div>
                <div>
                  <div className="petit">Score Rentimo</div>
                  <div className="titre-m">{score.libelle}</div>
                  <Link href="/methodologie#score" className="aide">Comment est-il calculé ?</Link>
                </div>
              </div>
              <div className="sim-kpi">
                <div className="tuile"><div className="tuile-label">Rendement brut</div><div className="tuile-valeur">{pct(r.rendement_brut_pct)}</div></div>
                <div className="tuile"><div className="tuile-label">Rendement net</div><div className="tuile-valeur">{pct(r.rendement_net_pct)}</div></div>
                <div className="tuile"><div className="tuile-label">Net-net après impôt</div><div className={`tuile-valeur ${r.rendement_net_net_pct >= 0 ? "positif" : "negatif"}`}>{pct(r.rendement_net_net_pct)}</div></div>
                <div className="tuile"><div className="tuile-label">Cash-flow mensuel</div><div className={`tuile-valeur ${r.cashflow_mensuel >= 0 ? "positif" : "negatif"}`}>{eurosSigne(r.cashflow_mensuel)}</div></div>
                <div className="tuile"><div className="tuile-label">TRI sur {H} ans</div><div className="tuile-valeur">{pct(r.tri_pct)}</div></div>
                <div className="tuile"><div className="tuile-label">Mensualité avec assurance</div><div className="tuile-valeur">{euros(r.mensualite + r.mensualite_assurance)}</div></div>
              </div>
              {constats.length ? (
                <ul className="sim-constats">
                  {constats.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : null}
              <div className="sim-actions">
                <button type="button" className="btn btn-clair" onClick={enregistrer} disabled={occupe}>
                  {id ? "Mettre à jour" : "Enregistrer"}
                </button>
                <button type="button" className="btn btn-contour" onClick={partager} disabled={occupe}>
                  Partager un lien
                </button>
                <button type="button" className="btn btn-contour" onClick={() => window.print()}>
                  Imprimer le rapport
                </button>
              </div>
              {message ? <p className={`message ${message.type}`}>{message.texte}</p> : null}
              {!compte.session && compte.pret ? (
                <p className="aide">Enregistrer et partager demandent un compte gratuit. Votre saisie est conservée sur cet appareil.</p>
              ) : null}
            </div>

            {stat && cpData ? (
              <div className="verre sim-bloc">
                <h2 className="sim-h2">Le marché à {cpData.commune.replace(/\s*\(.*\)$/, "")}</h2>
                <Jauge valeur={r.prix_m2} p25={stat.p25} med={stat.med} p75={stat.p75} />
                <p className="petit" style={{ marginTop: 12 }}>
                  Médiane {m2(stat.med)} sur {nombre(stat.n)} ventes DVF 2024-2025{stat.repli ? " (tous types confondus, trop peu de ventes de ce type)" : ` (${e.type_local.toLowerCase()}s)`}.
                  La moitié des ventes se situe entre {m2(stat.p25)} et {m2(stat.p75)}.
                  {r.prix_m2 > 0 ? <> Ce bien : <b className="chiffre">{m2(r.prix_m2)}</b>.</> : null}
                </p>
                <Link href={`/marche/${cpData.cp}`} className="aide">Voir toutes les données de {cpData.cp}</Link>
              </div>
            ) : null}

            <div className="verre sim-bloc">
              <h2 className="sim-h2">Fiscalité comparée</h2>
              <div className="defile-x">
                <table className="tableau">
                  <thead>
                    <tr>
                      <th>Régime</th>
                      <th className="num">Impôt an 1</th>
                      <th className="num">Moyenne 10 ans</th>
                      <th className="num">Cash-flow an 1</th>
                      <th className="num">TRI</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {r.regimes.map((g) => (
                      <tr key={g.regime} className={g.regime === e.regime_fiscal ? "ligne-active" : ""}>
                        <td>
                          {LIBELLES_REGIME[g.regime]}
                          {g.regime === r.meilleur_regime ? <span className="badge lueur" style={{ marginLeft: 8 }}>Le moins imposé</span> : null}
                        </td>
                        {g.eligible ? (
                          <>
                            <td className="num">{euros(g.impot_annee1)}</td>
                            <td className="num">{euros(g.impot_moyen_10ans)}</td>
                            <td className={`num ${g.cashflow_mensuel_annee1 >= 0 ? "positif" : "negatif"}`}>{eurosSigne(g.cashflow_mensuel_annee1)}</td>
                            <td className="num">{pct(g.tri_pct)}</td>
                          </>
                        ) : (
                          <td colSpan={4} className="discret">{g.raison}</td>
                        )}
                        <td className="num">
                          {g.regime !== e.regime_fiscal && g.eligible ? (
                            <button type="button" className="btn-texte" onClick={() => maj("regime_fiscal", g.regime)}>
                              Choisir
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="aide" style={{ marginTop: 10 }}>
                Impôt sur le revenu à votre TMI plus prélèvements sociaux (18,6 % en LMNP, 17,2 % en location nue). Un montant négatif est une économie d'impôt (déficit foncier).
              </p>
            </div>

            <div className="verre sim-bloc">
              <div className="sim-bloc-tete">
                <h2 className="sim-h2">Projection sur {H} ans</h2>
                <Pilules label="Affichage" valeur={vueTableau ? "t" : "g"} onChange={(v) => setVueTableau(v === "t")} options={[{ v: "g", l: "Graphique" }, { v: "t", l: "Tableau" }]} />
              </div>
              {vueTableau ? (
                <div className="defile-x">
                  <table className="tableau">
                    <thead>
                      <tr><th>An</th><th className="num">Loyers</th><th className="num">Charges</th><th className="num">Intérêts</th><th className="num">Impôt</th><th className="num">Cash-flow</th><th className="num">Capital dû</th><th className="num">Patrimoine net</th></tr>
                    </thead>
                    <tbody>
                      {r.projection.map((p) => (
                        <tr key={p.annee}>
                          <td>{p.annee}</td>
                          <td className="num">{nombre(p.loyers)}</td>
                          <td className="num">{nombre(p.charges)}</td>
                          <td className="num">{nombre(p.interets)}</td>
                          <td className="num">{nombre(p.impot)}</td>
                          <td className={`num ${p.cashflow >= 0 ? "positif" : "negatif"}`}>{nombre(p.cashflow)}</td>
                          <td className="num">{nombre(p.capital_restant)}</td>
                          <td className="num">{nombre(p.patrimoine_net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  <GraphiqueProjection
                    etiquettes={r.projection.map((p) => `${p.annee}`)}
                    format={(v) => `${Math.round(v / 1000)} k€`}
                    series={[
                      { nom: "Patrimoine net", valeurs: r.projection.map((p) => p.patrimoine_net), couleur: "var(--maree)" },
                      { nom: "Cash-flow cumulé", valeurs: r.projection.map((p) => p.cashflow_cumule), couleur: "var(--lueur)", tirets: true },
                    ]}
                  />
                  <p className="sim-legende">
                    <span className="trait maree" /> Patrimoine net (valeur du bien moins capital restant dû)
                    <span className="trait lueur" /> Cash-flow cumulé
                  </p>
                </>
              )}
              <dl className="sim-revente">
                <div><dt>Plus-value nette d'impôt</dt><dd className="chiffre">{euros(r.plus_value_nette)}</dd></div>
                <div><dt>Impôt sur la plus-value</dt><dd className="chiffre">{euros(r.impot_plus_value)}</dd></div>
                <div><dt>Enrichissement total</dt><dd className={`chiffre ${r.enrichissement_total >= 0 ? "positif" : "negatif"}`}>{euros(r.enrichissement_total)}</dd></div>
              </dl>
            </div>

            <div className="verre sim-bloc">
              <h2 className="sim-h2">Plan de financement</h2>
              <dl className="sim-plan">
                <div><dt>Prix d'achat</dt><dd>{euros(e.prix_achat)}</dd></div>
                <div><dt>Frais de notaire</dt><dd>{euros(r.frais_notaire_retenus)}</dd></div>
                <div><dt>Travaux et mobilier</dt><dd>{euros(e.travaux + e.mobilier)}</dd></div>
                <div><dt>Frais bancaires</dt><dd>{euros(e.frais_bancaires)}</dd></div>
                <div className="total"><dt>Coût total</dt><dd>{euros(r.cout_total)}</dd></div>
                <div><dt>Apport</dt><dd>{euros(Math.min(e.apport, r.cout_total))}</dd></div>
                <div><dt>Montant emprunté</dt><dd>{euros(r.capital_emprunte)}</dd></div>
                <div><dt>Coût du crédit (intérêts + assurance)</dt><dd>{euros(r.projection.reduce((s, p) => s + p.interets + p.assurance_emprunteur, 0))}</dd></div>
              </dl>
            </div>

            {!compte.pro ? (
              <p className="aide sim-pro">
                Vous êtes agent, mandataire ou courtier ? Le rapport peut porter votre nom et vos coordonnées.{" "}
                <Link href="/pro">Découvrir l'offre pro</Link>
              </p>
            ) : null}
          </section>
        </div>
      </div>

      <div className="sim-barre pas-imprime" aria-hidden="true">
        <a href="#resultats">
          <span>Score <b className="chiffre">{score.total}</b></span>
          <span>Net-net <b className="chiffre">{pct(r.rendement_net_net_pct)}</b></span>
          <span>Cash-flow <b className={`chiffre ${r.cashflow_mensuel >= 0 ? "positif" : "negatif"}`}>{eurosSigne(r.cashflow_mensuel)}</b></span>
        </a>
      </div>

      <div className="rapport-impression">
        <Rapport
          e={e}
          r={r}
          score={score}
          date={date}
          conseiller={compte.pro ? compte.profil : null}
          marche={
            stat && cpData
              ? { commune: cpData.commune, n: stat.n, med: stat.med, p25: stat.p25, p75: stat.p75, repli: stat.repli, loyerM2: loyerSecteur }
              : null
          }
        />
      </div>
    </>
  );
}

function Jauge({ valeur, p25, med, p75 }: { valeur: number; p25: number; med: number; p75: number }) {
  const min = Math.min(p25 * 0.6, valeur || p25);
  const max = Math.max(p75 * 1.4, valeur || p75);
  const pos = (v: number) => `${(((v - min) / (max - min)) * 100).toFixed(2)}%`;
  return (
    <div className="jauge" role="img" aria-label={`Prix du bien ${m2(valeur)} ; médiane du secteur ${m2(med)}`}>
      <div className="jauge-piste">
        <div className="jauge-zone" style={{ left: pos(p25), width: `calc(${pos(p75)} - ${pos(p25)})` }} />
        <div className="jauge-med" style={{ left: pos(med) }} />
        {valeur > 0 ? <div className="jauge-bien" style={{ left: pos(valeur) }} /> : null}
      </div>
      <div className="jauge-legende">
        <span><i className="jl-zone" /> moitié des ventes</span>
        <span><i className="jl-med" /> médiane</span>
        <span><i className="jl-bien" /> ce bien</span>
      </div>
    </div>
  );
}
