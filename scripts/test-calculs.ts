// Tests du moteur de calcul : `node scripts/test-calculs.ts` (Node 22.18+)
import { calculer, tableauCredit, tri, abattementsPV, scorer, ENTREE_DEFAUT } from "../src/lib/calculs.ts";

let echecs = 0;
function proche(nom: string, obtenu: number, attendu: number, tol = 0.01) {
  const ok = Math.abs(obtenu - attendu) <= tol;
  if (!ok) echecs++;
  console.log(`${ok ? "ok  " : "ÉCHEC"} ${nom}: ${obtenu.toFixed(4)} (attendu ${attendu})`);
}

// Crédit : 100 000 € à 3 % sur 20 ans → 554,60 €/mois
const c = tableauCredit(100000, 3, 20);
proche("mensualité 100k 3% 20 ans", c.mensualite, 554.6, 0.01);
proche("capital restant fin année 20", c.annees[19].restant, 0, 0.01);
proche("somme capital remboursé", c.annees.reduce((s, a) => s + a.capital, 0), 100000, 0.01);
proche("intérêts année 1", c.annees[0].interets, 2950.6, 2);

// TRI
proche("TRI [-100, 110]", tri([-100, 110])!, 0.1, 1e-6);
proche("TRI [-1000, 100×10 + 1000]", tri([-1000, 100, 100, 100, 100, 100, 100, 100, 100, 100, 1100])!, 0.1, 1e-6);

// Abattements plus-value
proche("abattement IR 10 ans", abattementsPV(10).ir, 0.3);
proche("abattement PS 10 ans", abattementsPV(10).ps, 0.0825, 1e-9);
proche("abattement IR 22 ans", abattementsPV(22).ir, 1);
proche("abattement PS 22 ans", abattementsPV(22).ps, 0.28, 1e-9);
proche("abattement PS 25 ans", abattementsPV(25).ps, 0.55, 1e-9);
proche("abattement PS 30 ans", abattementsPV(30).ps, 1);

// Scénario par défaut
const r = calculer(ENTREE_DEFAUT);
const D = ENTREE_DEFAUT;
const notaire = Math.round(D.prix_achat * 0.08);
proche("rendement brut", r.rendement_brut_pct, ((D.loyer_mensuel * 12) / D.prix_achat) * 100, 1e-9);
proche("frais de notaire auto 8 %", r.frais_notaire_retenus, notaire, 0);
proche("coût d'acquisition", r.cout_acquisition, D.prix_achat + notaire + D.travaux + D.mobilier, 0);
proche("capital emprunté", r.capital_emprunte, D.prix_achat + notaire + D.travaux + D.mobilier + D.frais_bancaires - D.apport, 0);
proche("LMNP réel : impôt année 1 nul", r.impot_annee1, 0, 0.001);

const micro = r.regimes.find((x) => x.regime === "lmnp_micro")!;
const loyersEncaisses = D.loyer_mensuel * 12 * (1 - D.vacance_pct / 100);
proche("LMNP micro : impôt année 1", micro.impot_annee1, loyersEncaisses * 0.5 * (0.3 + 0.186), 0.01);

const nueMicro = r.regimes.find((x) => x.regime === "nue_micro")!;
proche("nue micro : impôt année 1", nueMicro.impot_annee1, loyersEncaisses * 0.7 * (0.3 + 0.172), 0.01);

console.log("\nScénario par défaut :");
console.log({
  brut: r.rendement_brut_pct.toFixed(2),
  net: r.rendement_net_pct.toFixed(2),
  netnet: r.rendement_net_net_pct.toFixed(2),
  mensualite: r.mensualite.toFixed(0),
  cashflow: r.cashflow_mensuel.toFixed(0),
  tri: r.tri_pct?.toFixed(2),
  meilleur: r.meilleur_regime,
  regimes: r.regimes.map((x) => `${x.regime}: impôt an1 ${x.impot_annee1.toFixed(0)} / moy10 ${x.impot_moyen_10ans.toFixed(0)} / TRI ${x.tri_pct?.toFixed(2)}`),
  pv: r.impot_plus_value.toFixed(0),
  score: scorer(r, { med: 2482, p25: 2065, p75: 3033, n: 804 }),
});

// Cohérence : la somme des flux = enrichissement total
const sommeCf = r.projection.reduce((s, p) => s + p.cashflow, 0);
proche("cumul cash-flow", r.projection[r.projection.length - 1].cashflow_cumule, sommeCf, 0.01);

// Location nue réel avec gros travaux : déficit imputable sur le revenu global plafonné
const nue = calculer({ ...ENTREE_DEFAUT, regime_fiscal: "nue_reel", travaux: 30000, mobilier: 0 });
console.log("nue réel 30k travaux — impôt an1 (négatif = économie) :", nue.impot_annee1.toFixed(0));
if (nue.impot_annee1 < -10700 * 0.3 - 0.01) { echecs++; console.log("ÉCHEC économie au-delà du plafond"); }
else console.log("ok   économie plafonnée à 10 700 × TMI");

// Sans crédit
const cash = calculer({ ...ENTREE_DEFAUT, apport: 500000 });
proche("sans crédit : capital emprunté", cash.capital_emprunte, 0, 0);
proche("sans crédit : mensualité", cash.mensualite, 0, 0);
console.log("sans crédit TRI:", cash.tri_pct?.toFixed(2));

// Entrées invalides
const vide = calculer({ prix_achat: 0, loyer_mensuel: 0 });
console.log("entrées nulles → brut", vide.rendement_brut_pct, "TRI", vide.tri_pct);

console.log(echecs === 0 ? "\nTous les tests passent." : `\n${echecs} échec(s).`);
process.exit(echecs === 0 ? 0 : 1);
