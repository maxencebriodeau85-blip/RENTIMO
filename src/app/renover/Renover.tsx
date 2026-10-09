"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculer, ENTREE_DEFAUT, fraisNotaireEstimes, type Regime, type TypeLocal } from "@/lib/calculs";
import { euros, eurosSigne, loyerM2, m2, nombre, pct } from "@/lib/format";
import { MARCHE, loyerMarche, parCodePostal, statPrix } from "@/lib/marche";
import {
  CLASSES,
  COULEUR_CLASSE,
  classesGagnees,
  eligibleSuperDeficit,
  estimerTravaux,
  interdiction,
  lireAnnonce,
  rang,
  SUPER_DEFICIT,
  type AnnonceLue,
  type Classe,
} from "@/lib/renovation";
import { LigneNombre } from "@/components/ChampNombre";

type RegimeRenov = Extract<Regime, "nue_reel" | "lmnp_reel">;

interface Saisie {
  type: TypeLocal;
  cp: string;
  surface: number;
  prix: number;
  dpe: Classe;
  cible: Classe;
  electrique: boolean;
  travaux: number | null; // null = estimation automatique
  autres: number;
  loyer: number | null;
  charges: number | null;
  apport: number;
  taux: number;
  regime: RegimeRenov;
  tmi: number;
}

const EXEMPLE: Saisie = {
  type: "Maison",
  cp: "85200",
  surface: 95,
  prix: 105000,
  dpe: "G",
  cible: "D",
  electrique: false,
  travaux: null,
  autres: 8000,
  loyer: null,
  charges: null,
  apport: 20000,
  taux: 3.3,
  regime: "nue_reel",
  tmi: 30,
};

const MARGE_VISEE = 0.1; // coût de revient au moins 10 % sous la valeur du secteur

function estimerCharges(type: TypeLocal, surface: number) {
  // Taxe foncière, assurance propriétaire, entretien (et copropriété pour un appartement), en €/an.
  const v = type === "Maison" ? surface * 11 + 480 : surface * 24 + 270;
  return Math.round(v / 10) * 10;
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

function ChoixClasse({ label, valeur, onChange, min }: { label: string; valeur: Classe; onChange: (c: Classe) => void; min?: Classe }) {
  return (
    <div className="ren-classes" role="group" aria-label={label}>
      {CLASSES.map((c) => {
        const horsLimite = min !== undefined && rang(c) > rang(min);
        return (
          <button
            key={c}
            type="button"
            className="ren-classe"
            style={{ ["--c" as string]: COULEUR_CLASSE[c] }}
            aria-pressed={valeur === c}
            disabled={horsLimite}
            onClick={() => onChange(c)}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

const PAS = 35; // hauteur d'une ligne de l'échelle + écart, en px (voir renover.css)

function Echelle({ dpe, cible, travaux }: { dpe: Classe; cible: Classe; travaux: number }) {
  const gagnees = classesGagnees(dpe, cible);
  const pluriel = gagnees > 1 ? "s" : "";
  return (
    <figure className="echelle">
      <div className="echelle-corps">
        <ol className="echelle-barres" aria-label="Étiquette énergie">
          {CLASSES.map((c, i) => {
            const dans = rang(c) >= rang(cible) && rang(c) <= rang(dpe);
            return (
              <li
                key={c}
                className={`${dans ? "dans" : ""}${c === dpe ? " actuel" : ""}${c === cible && gagnees > 0 ? " cible" : ""}`}
                style={{ ["--c" as string]: COULEUR_CLASSE[c], ["--i" as string]: i }}
              >
                <span className="echelle-barre">
                  <b>{c}</b>
                </span>
                <span className="echelle-mot">
                  {c === dpe ? "Aujourd'hui" : c === cible && gagnees > 0 ? "Après travaux" : ""}
                </span>
              </li>
            );
          })}
        </ol>
        {gagnees > 0 ? (
          <span
            className="echelle-saut"
            aria-hidden="true"
            style={{
              top: rang(cible) * PAS + 15,
              height: gagnees * PAS,
              ["--de" as string]: COULEUR_CLASSE[dpe],
              ["--vers" as string]: COULEUR_CLASSE[cible],
            }}
          />
        ) : null}
      </div>
      <figcaption className="echelle-legende">
        {gagnees > 0 ? (
          <>
            <b className="chiffre">{euros(travaux)}</b> de travaux pour passer de {dpe} à {cible}, soit {gagnees} classe{pluriel} gagnée{pluriel}.
          </>
        ) : (
          <>Choisissez un objectif au-dessus de la classe actuelle pour chiffrer les travaux.</>
        )}
      </figcaption>
    </figure>
  );
}

export function Renover() {
  const params = useSearchParams();
  const [s, setS] = useState<Saisie>(EXEMPLE);
  const [annonce, setAnnonce] = useState("");
  const [lu, setLu] = useState<{ trouve: AnnonceLue; vide: boolean } | null>(null);
  const init = useRef(false);

  const maj = <K extends keyof Saisie>(k: K, v: Saisie[K]) => setS((x) => ({ ...x, [k]: v }));

  // Paramètres d'URL (depuis le radar des passoires ou un lien partagé)
  useEffect(() => {
    if (init.current) return;
    init.current = true;
    const p: Partial<Saisie> = {};
    const cp = params.get("cp");
    const t = params.get("type");
    const dpe = params.get("dpe");
    const num = (k: string) => {
      const v = Number(params.get(k));
      return params.get(k) && Number.isFinite(v) && v > 0 ? v : undefined;
    };
    if (cp && /^\d{5}$/.test(cp)) p.cp = cp;
    if (t === "Maison" || t === "Appartement") p.type = t;
    if (dpe && (CLASSES as string[]).includes(dpe)) p.dpe = dpe as Classe;
    if (num("surface")) p.surface = num("surface");
    if (num("prix")) p.prix = num("prix");
    if (Object.keys(p).length) {
      // Venu du radar sans prix : on part du prix visé pour une passoire du secteur.
      if (!p.prix && p.cp) {
        const c = parCodePostal(p.cp);
        if (c) p.prix = Math.round((statPrix(c, p.type ?? EXEMPLE.type).med * 0.85 * (p.surface ?? EXEMPLE.surface)) / 1000) * 1000;
      }
      setS((x) => ({ ...x, ...p, travaux: null, loyer: null, charges: null }));
    }
  }, [params]);

  function lire() {
    const trouve = lireAnnonce(annonce);
    const vide = !Object.keys(trouve).length;
    setLu({ trouve, vide });
    if (vide) return;
    setS((x) => ({
      ...x,
      ...trouve,
      cible: trouve.dpe && rang(x.cible) >= rang(trouve.dpe) ? (rang(trouve.dpe) > rang("D") ? "D" : trouve.dpe) : x.cible,
      travaux: null,
      loyer: null,
      charges: null,
    }));
  }

  const c = parCodePostal(s.cp);
  const commune = c ? c.commune.replace(/\s*\(.*\)$/, "") : null;
  const stat = c ? statPrix(c, s.type) : null;
  const loyerSecteur = c ? loyerMarche(c, s.type) : null;
  const travauxAuto = estimerTravaux(s.type, s.surface, s.dpe, s.cible);
  const travaux = s.travaux ?? travauxAuto;
  const loyerAuto = loyerSecteur && s.surface > 0 ? Math.round((loyerSecteur * s.surface * 0.92) / 5) * 5 : 0;
  const loyer = s.loyer ?? loyerAuto;
  const chargesAuto = estimerCharges(s.type, s.surface);
  const charges = s.charges ?? chargesAuto;
  const superDeficit = s.regime === "nue_reel" && eligibleSuperDeficit(s.dpe, s.cible) && travaux > 0;
  const mobilier = s.regime === "lmnp_reel" ? (s.type === "Maison" ? 7000 : 4500) : 0;

  const r = useMemo(
    () =>
      calculer({
        ...ENTREE_DEFAUT,
        nom: "Bien à rénover",
        type_local: s.type,
        prix_achat: s.prix,
        frais_notaire: 0,
        travaux: travaux + s.autres,
        mobilier,
        surface: s.surface,
        code_postal: s.cp,
        ville: commune ?? "",
        loyer_mensuel: loyer,
        charges_copro: charges,
        taxe_fonciere: 0,
        assurance_pno: 0,
        autres_charges: 0,
        apport: s.apport,
        taux_credit: s.taux,
        regime_fiscal: s.regime,
        tmi_utilisateur: s.tmi,
        plafond_deficit_foncier: superDeficit ? SUPER_DEFICIT.plafond : undefined,
      }),
    [s, travaux, mobilier, commune, loyer, charges, superDeficit],
  );

  const notaire = fraisNotaireEstimes(s.prix, "ancien");
  const coutRevient = s.prix + notaire + travaux + s.autres;
  const prixM2 = s.surface > 0 ? s.prix / s.surface : 0;
  const ecartPrix = stat && prixM2 > 0 ? (prixM2 / stat.med - 1) * 100 : null;
  const valeur = stat ? stat.med * s.surface : null;
  const marge = valeur !== null ? valeur - coutRevient : null;
  const margePct = valeur ? (marge! / valeur) * 100 : null;
  const prixMax = valeur ? Math.max(0, Math.floor((valeur * (1 - MARGE_VISEE) - travaux - s.autres) / 1.08 / 1000) * 1000) : null;
  const rendementApres = coutRevient - notaire > 0 ? ((loyer * 12) / (s.prix + travaux + s.autres)) * 100 : null;
  const economieAn1 = r.impot_annee1 < 0 ? -r.impot_annee1 : 0;
  const croisiere = r.projection[1] ?? r.projection[0];

  const verdict =
    margePct === null
      ? { ton: "neutre", titre: "Ajoutez un code postal de Vendée", texte: "Rentimo compare alors le prix, travaux compris, aux ventes réelles du secteur." }
      : margePct >= MARGE_VISEE * 100
        ? {
            ton: "bon",
            titre: "Le prix laisse de la marge",
            texte: `Travaux et notaire compris, vous restez ${pct(margePct)} sous la valeur d'un bien comparable du secteur.`,
          }
        : margePct >= 0
          ? {
              ton: "juste",
              titre: "Opération à l'équilibre",
              texte: `Travaux compris, vous payez presque le prix du marché. Visez ${euros(prixMax ?? 0)} ou moins pour garder ${MARGE_VISEE * 100} % de marge.`,
            }
          : {
              ton: "cher",
              titre: "Trop cher pour les travaux à prévoir",
              texte: `Travaux et notaire compris, le bien vous coûterait ${euros(-marge!)} de plus qu'un bien comparable déjà rénové.`,
            };

  const banni = interdiction(s.dpe);
  const cibleBannie = interdiction(s.cible);
  const lienSimu = `/simulateur?type=${encodeURIComponent(s.type)}&prix=${s.prix}&loyer=${loyer}&surface=${s.surface}&cp=${s.cp}&apport=${s.apport}&charges=${charges}&travaux=${travaux + s.autres}&regime=${s.regime}`;

  return (
    <div className="simulateur conteneur ren">
      <div className="sim-entete">
        <h1 className="titre-l">Analyser un bien à rénover</h1>
        <p className="chapo">
          Une passoire bien achetée peut devenir le meilleur placement du secteur. Collez l'annonce ou saisissez les chiffres : Rentimo estime
          les travaux pour gagner des classes DPE, la valeur une fois rénové et le prix à ne pas dépasser.
        </p>
        <p className="petit" style={{ margin: 0 }}>
          Où chercher ? <Link href="/radar">Le radar des passoires</Link> repère les communes de Vendée où les DPE F et G se multiplient.
        </p>
      </div>

      <div className="sim-grille">
        <form className="sim-form" onSubmit={(ev) => ev.preventDefault()} aria-label="Le bien à rénover">
          <fieldset className="verre sim-bloc">
            <legend>L'annonce</legend>
            <div className="champ">
              <label htmlFor="annonce">Collez le texte de l'annonce (facultatif)</label>
              <textarea
                id="annonce"
                rows={4}
                value={annonce}
                placeholder="Maison de 95 m² à Fontenay-le-Comte, DPE G, 105 000 €…"
                onChange={(e) => setAnnonce(e.target.value)}
              />
              <span className="aide">Le texte est lu dans votre navigateur. Il n'est ni envoyé ni enregistré.</span>
            </div>
            <div className="ren-lire">
              <button type="button" className="btn btn-contour" onClick={lire} disabled={!annonce.trim()}>
                Remplir depuis l'annonce
              </button>
              {lu ? (
                <p className={`petit ren-lu${lu.vide ? " vide" : ""}`} role="status">
                  {lu.vide
                    ? "Aucun chiffre reconnu. Saisissez-les ci-dessous."
                    : `Repris : ${[
                        lu.trouve.prix ? euros(lu.trouve.prix) : null,
                        lu.trouve.surface ? `${nombre(lu.trouve.surface)} m²` : null,
                        lu.trouve.dpe ? `DPE ${lu.trouve.dpe}` : null,
                        lu.trouve.cp ? lu.trouve.cp : null,
                        lu.trouve.type ? lu.trouve.type.toLowerCase() : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}. Vérifiez les champs.`}
                </p>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="verre sim-bloc">
            <legend>Le bien</legend>
            <Pilules<TypeLocal>
              label="Type de bien"
              valeur={s.type}
              onChange={(v) => setS((x) => ({ ...x, type: v, travaux: null, loyer: null, charges: null }))}
              options={[
                { v: "Maison", l: "Maison" },
                { v: "Appartement", l: "Appartement" },
              ]}
            />
            <div className="champ" style={{ marginTop: 14 }}>
              <label htmlFor="cp">Code postal</label>
              <input
                id="cp"
                list="liste-cp"
                inputMode="numeric"
                maxLength={5}
                value={s.cp}
                onChange={(e) => setS((x) => ({ ...x, cp: e.target.value.replace(/\D/g, "").slice(0, 5), loyer: null }))}
              />
              <datalist id="liste-cp">
                {MARCHE.codes_postaux.map((k) => (
                  <option key={k.cp} value={k.cp}>
                    {k.commune}
                  </option>
                ))}
              </datalist>
              <span className="aide">{commune ? `${commune} : prix et loyers du secteur disponibles` : "Prix du marché disponibles pour la Vendée (85)."}</span>
            </div>
            <LigneNombre label="Surface habitable" unite="m²" valeur={s.surface} onChange={(v) => setS((x) => ({ ...x, surface: v, travaux: null, loyer: null, charges: null }))} />
            <LigneNombre label="Prix affiché (net vendeur)" valeur={s.prix} onChange={(v) => maj("prix", v)} />
          </fieldset>

          <fieldset className="verre sim-bloc">
            <legend>L'étiquette énergie</legend>
            <div className="ren-ligne-classe">
              <span className="petit">DPE actuel</span>
              <ChoixClasse
                label="DPE actuel"
                valeur={s.dpe}
                onChange={(v) => setS((x) => ({ ...x, dpe: v, cible: rang(x.cible) > rang(v) ? v : x.cible, travaux: null }))}
              />
            </div>
            <div className="ren-ligne-classe">
              <span className="petit">Objectif après travaux</span>
              <ChoixClasse label="Objectif après travaux" valeur={s.cible} min={s.dpe} onChange={(v) => setS((x) => ({ ...x, cible: v, travaux: null }))} />
            </div>
            <label className="ren-case">
              <input type="checkbox" checked={s.electrique} onChange={(e) => maj("electrique", e.target.checked)} />
              <span>Chauffage électrique et DPE réalisé avant 2026</span>
            </label>
          </fieldset>

          <fieldset className="verre sim-bloc">
            <legend>Les travaux</legend>
            <LigneNombre label="Travaux énergétiques" valeur={travaux} onChange={(v) => maj("travaux", v)} />
            <p className="aide sim-indice">
              {s.travaux === null ? (
                <>Estimation : {euros(travauxAuto)} pour {classesGagnees(s.dpe, s.cible)} classe{classesGagnees(s.dpe, s.cible) > 1 ? "s" : ""} gagnée{classesGagnees(s.dpe, s.cible) > 1 ? "s" : ""} sur {nombre(s.surface)} m². Remplacez-la par le devis ou l'audit énergétique dès que vous l'avez.</>
              ) : (
                <>
                  Montant saisi. L'estimation était de {euros(travauxAuto)}.{" "}
                  <button type="button" className="btn-texte" onClick={() => maj("travaux", null)}>
                    Revenir à l'estimation
                  </button>
                </>
              )}
            </p>
            <LigneNombre label="Autres travaux (cuisine, sols, électricité…)" valeur={s.autres} onChange={(v) => maj("autres", v)} />
          </fieldset>

          <fieldset className="verre sim-bloc">
            <legend>Location et financement</legend>
            <LigneNombre label="Loyer après travaux, hors charges" valeur={loyer} onChange={(v) => maj("loyer", v)} />
            {loyerSecteur ? (
              <p className="aide sim-indice">
                Loyer de marché à {commune} : {loyerM2(loyerSecteur)} charges comprises.
                {s.loyer !== null ? (
                  <>
                    {" "}
                    <button type="button" className="btn-texte" onClick={() => maj("loyer", null)}>
                      Reprendre le loyer de marché
                    </button>
                  </>
                ) : null}
              </p>
            ) : null}
            <LigneNombre label="Charges annuelles (taxe foncière, assurance, entretien)" valeur={charges} onChange={(v) => maj("charges", v)} />
            <LigneNombre label="Apport personnel" valeur={s.apport} onChange={(v) => maj("apport", v)} />
            <LigneNombre label="Taux du crédit (20 ans)" unite="%" valeur={s.taux} max={15} onChange={(v) => maj("taux", v)} />
            <div className="champ" style={{ marginTop: 14 }}>
              <span className="petit">Fiscalité</span>
              <Pilules<RegimeRenov>
                label="Régime fiscal"
                valeur={s.regime}
                onChange={(v) => maj("regime", v)}
                options={[
                  { v: "nue_reel", l: "Location nue, réel" },
                  { v: "lmnp_reel", l: "Meublé LMNP, réel" },
                ]}
              />
            </div>
            <div className="champ" style={{ marginTop: 14 }}>
              <span className="petit">Tranche marginale d'imposition</span>
              <Pilules label="Tranche marginale d'imposition" valeur={s.tmi} onChange={(v) => maj("tmi", v)} options={[0, 11, 30, 41, 45].map((v) => ({ v, l: `${v} %` }))} />
            </div>
          </fieldset>

          <button type="button" className="btn-texte" style={{ justifySelf: "start" }} onClick={() => { setS(EXEMPLE); setAnnonce(""); setLu(null); }}>
            Repartir de l'exemple
          </button>
        </form>

        <section className="sim-resultats" id="analyse" aria-label="Analyse">
          <div className={`verre sim-synthese ren-verdict ton-${verdict.ton}`}>
            <div>
              <h2 className="titre-m">{verdict.titre}</h2>
              <p className="ren-verdict-texte">{verdict.texte}</p>
            </div>
            {prixMax !== null ? (
              <div className="ren-prixmax">
                <span className="petit">Prix d'achat maximum conseillé</span>
                <b className="chiffre">{euros(prixMax)}</b>
                <span className="aide">
                  {s.prix > prixMax ? `Soit ${pct(((s.prix - prixMax) / s.prix) * 100)} sous le prix affiché.` : "Le prix affiché est en dessous."}
                </span>
              </div>
            ) : null}
            <div className="sim-kpi">
              <div className="tuile">
                <div className="tuile-label">Coût de revient</div>
                <div className="tuile-valeur">{euros(coutRevient)}</div>
              </div>
              <div className="tuile">
                <div className="tuile-label">Valeur d'un bien rénové</div>
                <div className="tuile-valeur">{valeur !== null ? euros(valeur) : "—"}</div>
              </div>
              <div className="tuile">
                <div className="tuile-label">Marge</div>
                <div className={`tuile-valeur ${marge !== null ? (marge >= 0 ? "positif" : "negatif") : ""}`}>{marge !== null ? eurosSigne(marge) : "—"}</div>
              </div>
              <div className="tuile">
                <div className="tuile-label">Rendement brut après travaux</div>
                <div className="tuile-valeur">{pct(rendementApres)}</div>
              </div>
              <div className="tuile">
                <div className="tuile-label">Cash-flow mensuel, an 2</div>
                <div className={`tuile-valeur ${croisiere.cashflow >= 0 ? "positif" : "negatif"}`}>{eurosSigne(croisiere.cashflow / 12)}</div>
              </div>
              <div className="tuile">
                <div className="tuile-label">TRI sur 20 ans</div>
                <div className="tuile-valeur">{pct(r.tri_pct)}</div>
              </div>
            </div>
            <Link href={lienSimu} className="btn btn-clair">
              Ouvrir dans le simulateur complet <span className="fleche" aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="verre sim-bloc">
            <h2 className="sim-h2">Le saut de classe</h2>
            <Echelle dpe={s.dpe} cible={s.cible} travaux={travaux} />
            <ul className="ren-alertes">
              {banni ? (
                <li className={rang(s.dpe) === rang("G") ? "alerte" : ""}>
                  Classé {s.dpe} : location interdite {banni.libelle} (nouveau bail ou renouvellement).
                  {rang(s.cible) < rang(s.dpe) && !cibleBannie ? " Les travaux prévus règlent la question." : ""}
                </li>
              ) : null}
              {cibleBannie && rang(s.cible) < rang(s.dpe) ? <li className="alerte">Visez D au minimum : un logement classé {s.cible} sera interdit à la location {cibleBannie.libelle}.</li> : null}
              {s.type === "Maison" && rang(s.dpe) >= rang("E") ? (
                <li>Pour une maison classée E, F ou G, le vendeur doit fournir un audit énergétique avec des scénarios de travaux chiffrés. Demandez-le avant de faire une offre.</li>
              ) : null}
              {s.electrique ? (
                <li>
                  Depuis le 1er janvier 2026, l'électricité compte pour 1,9 au lieu de 2,3 dans le DPE. Une attestation gratuite sur l'observatoire DPE de
                  l'ADEME peut faire gagner une classe sans travaux : vérifiez-la avant de chiffrer quoi que ce soit.
                </li>
              ) : null}
            </ul>
          </div>

          <div className="verre sim-bloc">
            <h2 className="sim-h2">Prix et fiscalité</h2>
            <dl className="ren-liste">
              <div>
                <dt>Prix au m² affiché</dt>
                <dd className="chiffre">{m2(prixM2)}</dd>
              </div>
              {stat ? (
                <div>
                  <dt>
                    Médiane des ventes à {commune} ({stat.repli ? "tous types" : `${s.type.toLowerCase()}s`}, {nombre(stat.n)} ventes)
                  </dt>
                  <dd className="chiffre">
                    {m2(stat.med)}
                    {ecartPrix !== null ? <span className={ecartPrix <= 0 ? "positif" : "negatif"}> · {ecartPrix > 0 ? "+" : ""}{pct(ecartPrix)}</span> : null}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Frais de notaire estimés</dt>
                <dd className="chiffre">{euros(notaire)}</dd>
              </div>
              {s.regime === "nue_reel" ? (
                <div>
                  <dt>Économie d'impôt l'année des travaux</dt>
                  <dd className={`chiffre ${economieAn1 > 0 ? "positif" : ""}`}>{euros(economieAn1)}</dd>
                </div>
              ) : (
                <div>
                  <dt>Impôt sur les loyers, an 1</dt>
                  <dd className="chiffre">{euros(Math.max(0, r.impot_annee1))}</dd>
                </div>
              )}
            </dl>
            <p className="aide" style={{ marginTop: 12 }}>
              {s.regime === "nue_reel"
                ? superDeficit
                  ? `Location nue au réel : les travaux créent un déficit foncier imputable sur vos autres revenus jusqu'à ${euros(SUPER_DEFICIT.plafond)} par an, plafond doublé pour une rénovation qui sort le logement de E, F ou G vers D ou mieux (dépenses payées jusqu'au ${SUPER_DEFICIT.finPaiements}). Le bien doit rester loué trois ans.`
                  : "Location nue au réel : les travaux créent un déficit foncier imputable sur vos autres revenus jusqu'à 10 700 € par an, le reste se reporte sur les loyers des dix années suivantes. Le bien doit rester loué trois ans."
                : "Meublé LMNP au réel : les travaux s'amortissent sur quinze ans et effacent l'impôt sur les loyers pendant plusieurs années. Les amortissements sont réintégrés dans la plus-value à la revente."}
            </p>
          </div>

          <p className="aide">
            Estimations à affiner avec un devis ou l'audit énergétique. Valeur d'un bien rénové : médiane des ventes DVF 2024-2025 du secteur. Aides à
            la rénovation non comptées. <Link href="/methodologie#renovation">Hypothèses détaillées</Link>
          </p>
        </section>
      </div>

      <div className="sim-barre" aria-hidden="true">
        <a href="#analyse">
          <span>Prix max <b className="chiffre">{prixMax !== null ? euros(prixMax) : "—"}</b></span>
          <span>Marge <b className={`chiffre ${marge !== null && marge >= 0 ? "positif" : "negatif"}`}>{marge !== null ? eurosSigne(marge) : "—"}</b></span>
          <span>Brut <b className="chiffre">{pct(rendementApres)}</b></span>
        </a>
      </div>
    </div>
  );
}
