"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculer, ENTREE_DEFAUT, LIBELLES_REGIME, type Regime, type TypeLocal } from "@/lib/calculs";
import { euros } from "@/lib/format";
import { LigneNombre } from "@/components/ChampNombre";
import { Sparkline } from "@/components/Courbe";
import { Compteur } from "./Compteur";
import { Photo } from "@/components/Photo";

const PRESETS: Record<TypeLocal, { prix: number; loyer: number; charges: number; apport: number; surface: number }> = {
  Appartement: { prix: 105000, loyer: 520, charges: 1490, apport: 15000, surface: 42 },
  Maison: { prix: 195000, loyer: 880, charges: 1650, apport: 25000, surface: 85 },
};

const REGIMES: Regime[] = ["lmnp_micro", "lmnp_reel", "nue_micro", "nue_reel"];
const COURTS: Record<Regime, string> = {
  lmnp_micro: "LMNP micro",
  lmnp_reel: "LMNP réel",
  nue_micro: "Nue micro",
  nue_reel: "Nue réel",
};
const CADENCE = 2800;

const TAILLE_BANDE = "(max-width: 900px) 100vw, 1240px";

export function Demonstration() {
  const [type, setType] = useState<TypeLocal>("Appartement");
  const [v, setV] = useState(PRESETS.Appartement);
  const [regime, setRegime] = useState<Regime>("lmnp_reel");
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const panneauFisc = useRef<HTMLDivElement>(null);

  const r = useMemo(
    () =>
      calculer({
        ...ENTREE_DEFAUT,
        type_local: type,
        prix_achat: v.prix,
        loyer_mensuel: v.loyer,
        charges_copro: v.charges,
        taxe_fonciere: 0,
        assurance_pno: 0,
        autres_charges: 0,
        apport: v.apport,
        surface: v.surface,
        travaux: 0,
        regime_fiscal: "lmnp_reel",
      }),
    [type, v],
  );

  // Les onglets fiscaux défilent seuls tant que le panneau est à l'écran et que personne n'y touche.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAuto(false);
      return;
    }
    const el = panneauFisc.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible) return;
    const t = setTimeout(() => setRegime((g) => REGIMES[(REGIMES.indexOf(g) + 1) % REGIMES.length]), CADENCE);
    return () => clearTimeout(t);
  }, [auto, visible, regime]);

  const fisc = r.regimes.find((x) => x.regime === regime)!;
  const meilleur = r.regimes.find((x) => x.regime === r.meilleur_regime);
  const lien = `/simulateur?type=${encodeURIComponent(type)}&prix=${v.prix}&loyer=${v.loyer}&charges=${v.charges}&apport=${v.apport}&surface=${v.surface}`;
  const patrimoine = r.projection.map((p) => p.patrimoine_net + p.cashflow_cumule);

  return (
    <>
      <section className="bande" data-bande>
        <div className="bande-texte">
          <h2 className="titre-l">Simulez votre bien</h2>
          <p className="chapo">
            Prix, loyer, charges, apport. Rentimo calcule le reste : frais de notaire, crédit, impôt et revente.
            Modifiez un chiffre, tout se met à jour.
          </p>
        </div>
        <div className="bande-scene">
          <div className="scene-fond" style={{ ["--pos" as string]: "38% 60%" }} aria-hidden="true">
            <Photo nom="salon" sizes={TAILLE_BANDE} />
          </div>
          <div className="verre panneau panneau-sim">
            <div className="panneau-tete">
              <h3>Simulation</h3>
              <div className="pilules" role="group" aria-label="Type de bien">
                {(["Appartement", "Maison"] as TypeLocal[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="pilule"
                    aria-pressed={type === t}
                    onClick={() => {
                      setType(t);
                      setV(PRESETS[t]);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <LigneNombre label="Prix d'achat" valeur={v.prix} onChange={(x) => setV({ ...v, prix: x })} />
            <LigneNombre label="Loyer mensuel (meublé, hors charges)" valeur={v.loyer} onChange={(x) => setV({ ...v, loyer: x })} />
            <LigneNombre label="Charges annuelles" valeur={v.charges} onChange={(x) => setV({ ...v, charges: x })} aide="Taxe foncière, copropriété non récupérable, assurance" />
            <LigneNombre label="Apport personnel" valeur={v.apport} onChange={(x) => setV({ ...v, apport: x })} />
            <Link href={lien} className="btn btn-clair btn-large" style={{ marginTop: 22 }}>
              Ouvrir la simulation complète <span className="fleche" aria-hidden="true">→</span>
            </Link>
            <p className="aide" style={{ marginTop: 10 }}>
              Hypothèses : crédit 20 ans à 3,3 %, TMI 30 %, {v.surface} m², mobilier 4 000 €.
            </p>
          </div>
        </div>
      </section>

      <section className="bande" data-bande>
        <div className="bande-texte">
          <h2 className="titre-l">Ce qui reste vraiment dans votre poche</h2>
          <p className="chapo">
            Rendement brut, net, puis net-net après impôt. Le cash-flow mensuel, mensualité comprise. Et le TRI si vous
            revendez dans vingt ans.
          </p>
        </div>
        <div className="bande-scene">
          <div className="scene-fond" style={{ ["--pos" as string]: "30% 55%" }} aria-hidden="true">
            <Photo nom="canape-lampe" sizes={TAILLE_BANDE} />
          </div>
          <div className="verre panneau panneau-kpi">
            <div className="tuile">
              <div className="tuile-label">Rendement brut</div>
              <div className="tuile-valeur"><Compteur valeur={r.rendement_brut_pct} format="pct" /></div>
            </div>
            <div className="tuile">
              <div className="tuile-label">Rendement net</div>
              <div className="tuile-valeur"><Compteur valeur={r.rendement_net_pct} format="pct" /></div>
            </div>
            <div className="tuile">
              <div className="tuile-label">Net-net après impôt</div>
              <div className={`tuile-valeur ${r.rendement_net_net_pct >= 0 ? "positif" : "negatif"}`}><Compteur valeur={r.rendement_net_net_pct} format="pct" /></div>
            </div>
            <div className="tuile">
              <div className="tuile-label">Cash-flow mensuel</div>
              <div className={`tuile-valeur ${r.cashflow_mensuel >= 0 ? "positif" : "negatif"}`}><Compteur valeur={r.cashflow_mensuel} format="eurosSigne" /></div>
            </div>
            <div className="tuile">
              <div className="tuile-label">TRI avec revente</div>
              <div className="tuile-valeur"><Compteur valeur={r.tri_pct} format="pct" /></div>
            </div>
            <div className="tuile tuile-courbe">
              <div className="tuile-label">Enrichissement net sur 20 ans</div>
              <div className="tuile-valeur"><Compteur valeur={r.enrichissement_total} format="euros" duree={1600} /></div>
              <Sparkline valeurs={patrimoine} largeur={200} hauteur={40} />
            </div>
          </div>
        </div>
      </section>

      <section className="bande" data-bande>
        <div className="bande-texte">
          <h2 className="titre-l">Comparez les régimes fiscaux</h2>
          <p className="chapo">
            LMNP micro ou réel, location nue : le même bien, quatre fiscalités. Rentimo vous montre laquelle vous coûte le
            moins sur dix ans.
          </p>
        </div>
        <div className="bande-scene">
          <div className="scene-fond" style={{ ["--pos" as string]: "28% 55%" }} aria-hidden="true">
            <Photo nom="bureau" sizes={TAILLE_BANDE} />
          </div>
          <div
            ref={panneauFisc}
            className={`verre panneau panneau-fisc${auto && visible ? " auto" : ""}`}
            style={{ ["--cadence" as string]: `${CADENCE}ms` }}
            onPointerDown={() => setAuto(false)}
            onFocus={() => setAuto(false)}
          >
            <div className="pilules" role="tablist" aria-label="Régime fiscal">
              {REGIMES.map((g) => (
                <button
                  key={g}
                  type="button"
                  role="tab"
                  className="pilule"
                  aria-selected={regime === g}
                  onClick={() => {
                    setAuto(false);
                    setRegime(g);
                  }}
                >
                  {COURTS[g]}
                </button>
              ))}
            </div>
            <div className="fisc-grille" role="tabpanel" aria-label={LIBELLES_REGIME[regime]}>
              <div>
                <div className="tuile-label">Loyers encaissés, an 1</div>
                <div className="tuile-valeur"><Compteur valeur={r.loyer_annuel_effectif} format="euros" /></div>
              </div>
              <div>
                <div className="tuile-label">Impôt moyen par an (10 ans)</div>
                <div className="tuile-valeur"><Compteur valeur={fisc.eligible ? fisc.impot_moyen_10ans : null} format="euros" /></div>
              </div>
              <div>
                <div className="tuile-label">TRI avec revente</div>
                <div className={`tuile-valeur ${fisc.tri_pct !== null && fisc.tri_pct > 0 ? "positif" : ""}`}><Compteur valeur={fisc.tri_pct} format="pct" /></div>
              </div>
            </div>
            <p className="fisc-verdict">
              {!fisc.eligible
                ? fisc.raison
                : regime === r.meilleur_regime
                  ? "Le régime le plus avantageux pour ce bien."
                  : `${COURTS[r.meilleur_regime]} coûte ${euros(fisc.impot_moyen_10ans - (meilleur?.impot_moyen_10ans ?? 0))} de moins par an.`}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
