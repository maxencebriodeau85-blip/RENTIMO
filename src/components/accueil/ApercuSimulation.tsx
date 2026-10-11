"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { calculer, ENTREE_DEFAUT } from "@/lib/calculs";
import { euros, eurosSigne, pct } from "@/lib/format";

/** Le même moteur que le simulateur complet, avec les hypothèses par défaut. */
export function ApercuSimulation() {
  const [prix, setPrix] = useState(150000);
  const [loyer, setLoyer] = useState(850);
  const r = useMemo(() => calculer({ ...ENTREE_DEFAUT, prix_achat: prix, loyer_mensuel: loyer, travaux: 0 }), [prix, loyer]);
  return (
    <div className="apercu-simulation">
      <div className="apercu-entete"><span className="sur-titre">Votre première projection</span><span className="apercu-statut"><i /> En direct</span></div>
      <div className="apercu-champ">
        <div><label htmlFor="apercu-prix">Prix d’acquisition</label><output htmlFor="apercu-prix">{euros(prix)}</output></div>
        <input id="apercu-prix" type="range" min="50000" max="500000" step="5000" value={prix} onChange={(e) => setPrix(Number(e.target.value))} aria-valuetext={euros(prix)} style={{ "--rempli": `${(prix - 50000) / 4500}%` } as React.CSSProperties} />
        <div className="bornes"><span>50 000 €</span><span>500 000 €</span></div>
      </div>
      <div className="apercu-champ">
        <div><label htmlFor="apercu-loyer">Loyer mensuel hors charges</label><output htmlFor="apercu-loyer">{euros(loyer)}</output></div>
        <input id="apercu-loyer" type="range" min="300" max="2500" step="25" value={loyer} onChange={(e) => setLoyer(Number(e.target.value))} aria-valuetext={euros(loyer)} style={{ "--rempli": `${(loyer - 300) / 22}%` } as React.CSSProperties} />
        <div className="bornes"><span>300 €</span><span>2 500 €</span></div>
      </div>
      <div className="apercu-resultat" aria-live="polite" aria-atomic="true">
        <div><span>Rendement brut</span><strong>{pct(r.rendement_brut_pct)}</strong><span>Un premier repère, avant charges.</span></div>
        <svg viewBox="0 0 180 88" fill="none" aria-hidden="true"><path d="M0 74H180M0 46H180M0 18H180" stroke="currentColor" opacity=".1" /><path className="courbe-vivante mouvement-continu" d="M3 77L26 65L47 69L69 43L91 50L115 27L139 33L177 6" stroke="currentColor" strokeWidth="2" pathLength="1" /><circle cx="177" cy="6" r="4" fill="currentColor" /></svg>
      </div>
      <div className="apercu-secondaires"><span>Rendement net <b>{pct(r.rendement_net_pct)}</b></span><span>Cash-flow mensuel <b>{eurosSigne(r.cashflow_mensuel)}</b></span></div>
      <Link href={`/simulateur?prix=${prix}&loyer=${loyer}`} className="lien-plein">Affiner ma simulation <span aria-hidden="true">↗</span></Link>
      <p className="apercu-note">Estimation illustrative avec les hypothèses par défaut du simulateur. Ajustez financement, charges et fiscalité dans l’étude complète.</p>
    </div>
  );
}
