// Moteur de calcul RENTIMO — rentabilité locative, fiscalité française, projection et TRI.
// Fichier autonome (aucun import) : il est aussi exécuté tel quel par scripts/test-calculs.ts.
//
// Conventions :
// - montants en euros ; loyer en €/mois hors charges ; charges en €/an
// - rendement brut = loyer annuel / prix d'achat (convention des annonces)
// - rendements net et net-net = rapportés au coût d'acquisition (prix + notaire + travaux + mobilier)

export type TypeBien = "ancien" | "neuf";
export type TypeLocal = "Appartement" | "Maison";
export type Regime = "lmnp_micro" | "lmnp_reel" | "nue_micro" | "nue_reel";

export interface Entree {
  nom: string;
  type_local: TypeLocal;
  type_bien: TypeBien;
  prix_achat: number;
  frais_notaire: number; // 0 = estimation automatique
  travaux: number;
  mobilier: number;
  surface: number;
  code_postal: string;
  ville: string;
  loyer_mensuel: number; // hors charges
  charges_copro: number; // part non récupérable, €/an
  taxe_fonciere: number;
  assurance_pno: number;
  gestion_pct: number; // % des loyers encaissés (agence)
  autres_charges: number; // entretien, CFE, comptable… €/an
  vacance_pct: number; // % du loyer annuel
  apport: number;
  taux_credit: number; // % annuel
  duree_credit: number; // années
  assurance_emprunteur_pct: number; // % du capital / an
  frais_bancaires: number; // dossier + garantie
  regime_fiscal: Regime;
  tmi_utilisateur: number; // 0, 11, 30, 41, 45
  revalo_bien_pct: number;
  revalo_loyer_pct: number;
  horizon: number; // années de détention avant revente
  frais_revente_pct: number;
}

export const ENTREE_DEFAUT: Entree = {
  nom: "T2 meublé, centre-ville",
  type_local: "Appartement",
  type_bien: "ancien",
  prix_achat: 105000,
  frais_notaire: 0,
  travaux: 3000,
  mobilier: 4000,
  surface: 42,
  code_postal: "85000",
  ville: "La Roche-sur-Yon",
  loyer_mensuel: 520,
  charges_copro: 480,
  taxe_fonciere: 650,
  assurance_pno: 110,
  gestion_pct: 0,
  autres_charges: 250,
  vacance_pct: 4,
  apport: 15000,
  taux_credit: 3.3,
  duree_credit: 20,
  assurance_emprunteur_pct: 0.3,
  frais_bancaires: 1500,
  regime_fiscal: "lmnp_reel",
  tmi_utilisateur: 30,
  revalo_bien_pct: 1,
  revalo_loyer_pct: 1.5,
  horizon: 20,
  frais_revente_pct: 5,
};

// Paramètres fiscaux (revenus 2025-2026)
export const FISCAL = {
  ps_lmnp: 0.186, // prélèvements sociaux sur les revenus de location meublée non professionnelle
  ps_foncier: 0.172, // revenus fonciers (location nue)
  ps_plus_value: 0.172,
  ir_plus_value: 0.19,
  micro_bic_abattement: 0.5, // meublé de longue durée
  micro_bic_plafond: 77700,
  micro_foncier_abattement: 0.3,
  micro_foncier_plafond: 15000,
  deficit_foncier_plafond: 10700,
  part_terrain: { Appartement: 0.15, Maison: 0.2 },
  duree_amort_bati: 30,
  duree_amort_travaux: 15,
  duree_amort_mobilier: 7,
  inflation_charges: 0.02,
  notaire_ancien: 0.08,
  notaire_neuf: 0.025,
};

export const LIBELLES_REGIME: Record<Regime, string> = {
  lmnp_micro: "LMNP micro-BIC",
  lmnp_reel: "LMNP réel",
  nue_micro: "Location nue micro-foncier",
  nue_reel: "Location nue réel",
};

export interface AnneeProjection {
  annee: number;
  loyers: number;
  charges: number;
  interets: number;
  capital_rembourse: number;
  assurance_emprunteur: number;
  impot: number;
  cashflow: number;
  cashflow_cumule: number;
  capital_restant: number;
  valeur_bien: number;
  patrimoine_net: number;
}

export interface FiscaliteRegime {
  regime: Regime;
  eligible: boolean;
  raison?: string;
  impot_annee1: number;
  impot_moyen_10ans: number;
  cashflow_mensuel_annee1: number;
  rendement_net_net_pct: number;
  tri_pct: number | null;
}

export interface Resultats {
  frais_notaire_retenus: number;
  cout_acquisition: number;
  cout_total: number;
  capital_emprunte: number;
  mensualite: number; // hors assurance
  mensualite_assurance: number;
  loyer_annuel_brut: number;
  loyer_annuel_effectif: number;
  charges_annuelles: number;
  rendement_brut_pct: number;
  rendement_net_pct: number;
  rendement_net_net_pct: number;
  impot_annee1: number;
  cashflow_avant_impot_mensuel: number;
  cashflow_mensuel: number;
  effort_epargne_mensuel: number;
  prix_m2: number;
  cout_m2: number;
  tri_pct: number | null;
  plus_value_nette: number;
  impot_plus_value: number;
  patrimoine_net_final: number;
  enrichissement_total: number;
  projection: AnneeProjection[];
  regimes: FiscaliteRegime[];
  meilleur_regime: Regime;
}

// ---------------------------------------------------------------------------

function n(x: number): number {
  return Number.isFinite(x) ? x : 0;
}

export function normaliser(e: Partial<Entree>): Entree {
  const out = { ...ENTREE_DEFAUT, ...e } as Entree;
  const nums: (keyof Entree)[] = [
    "prix_achat", "frais_notaire", "travaux", "mobilier", "surface", "loyer_mensuel",
    "charges_copro", "taxe_fonciere", "assurance_pno", "gestion_pct", "autres_charges",
    "vacance_pct", "apport", "taux_credit", "duree_credit", "assurance_emprunteur_pct",
    "frais_bancaires", "tmi_utilisateur", "revalo_bien_pct", "revalo_loyer_pct", "horizon",
    "frais_revente_pct",
  ];
  for (const k of nums) {
    const v = Number((out as unknown as Record<string, unknown>)[k]);
    (out as unknown as Record<string, number>)[k] = Number.isFinite(v) ? Math.max(0, v) : 0;
  }
  out.horizon = Math.min(30, Math.max(1, Math.round(out.horizon || 20)));
  out.duree_credit = Math.min(30, Math.round(out.duree_credit));
  out.vacance_pct = Math.min(100, out.vacance_pct);
  return out;
}

export function fraisNotaireEstimes(prix: number, type: TypeBien): number {
  return Math.round(prix * (type === "neuf" ? FISCAL.notaire_neuf : FISCAL.notaire_ancien));
}

/** Tableau d'amortissement annuel (agrégé depuis un calcul mensuel). */
export function tableauCredit(capital: number, tauxPct: number, dureeAns: number) {
  const nMois = Math.round(dureeAns * 12);
  const r = tauxPct / 100 / 12;
  let mensualite = 0;
  if (capital > 0 && nMois > 0) {
    mensualite = r === 0 ? capital / nMois : (capital * r) / (1 - Math.pow(1 + r, -nMois));
  }
  const annees: { interets: number; capital: number; restant: number }[] = [];
  let restant = capital;
  for (let a = 0; a < 30; a++) {
    let interets = 0;
    let cap = 0;
    for (let m = 0; m < 12; m++) {
      const mois = a * 12 + m;
      if (mois >= nMois || restant <= 0.005) break;
      const i = restant * r;
      let c = mensualite - i;
      if (c > restant) c = restant;
      interets += i;
      cap += c;
      restant -= c;
    }
    annees.push({ interets, capital: cap, restant: Math.max(0, restant) });
  }
  return { mensualite, annees };
}

/** TRI annuel d'une série de flux (flux[0] = mise initiale, négative). */
export function tri(flux: number[]): number | null {
  const van = (t: number) => flux.reduce((s, f, i) => s + f / Math.pow(1 + t, i), 0);
  let lo = -0.99;
  let hi = 1.0;
  let vlo = van(lo);
  let vhi = van(hi);
  if (!Number.isFinite(vlo) || !Number.isFinite(vhi)) return null;
  if (vlo * vhi > 0) {
    hi = 10;
    vhi = van(hi);
    if (vlo * vhi > 0) return null;
  }
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const v = van(mid);
    if (Math.abs(v) < 1e-7) return mid;
    if (v * vlo > 0) {
      lo = mid;
      vlo = v;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/** Abattements pour durée de détention (plus-values immobilières des particuliers). */
export function abattementsPV(duree: number) {
  let ir = 0;
  if (duree >= 22) ir = 1;
  else if (duree > 5) ir = (duree - 5) * 0.06;
  let ps = 0;
  if (duree >= 30) ps = 1;
  else if (duree > 22) ps = 0.28 + (duree - 22) * 0.09;
  else if (duree === 22) ps = 0.28;
  else if (duree > 5) ps = (duree - 5) * 0.0165;
  return { ir: Math.min(1, ir), ps: Math.min(1, ps) };
}

interface Report {
  annee: number;
  montant: number;
}

interface Etat {
  deficitBic: Report[]; // déficits BIC reportables 10 ans
  ard: number; // amortissements réputés différés (sans limite de durée)
  deficitFoncier: Report[]; // déficits fonciers reportables 10 ans
  amortCumuleBati: number; // pour la réintégration dans la plus-value LMNP
}

/** Impute les reports encore valides (10 ans, les plus anciens d'abord) sur un résultat positif. */
function imputer(reports: Report[], annee: number, resultat: number): { reste: number; reports: Report[] } {
  const valides = reports.filter((r) => annee - r.annee <= 10 && r.montant > 0.005).sort((a, b) => a.annee - b.annee);
  let reste = resultat;
  for (const r of valides) {
    if (reste <= 0) break;
    const u = Math.min(r.montant, reste);
    r.montant -= u;
    reste -= u;
  }
  return { reste, reports: valides.filter((r) => r.montant > 0.005) };
}

interface ContexteAnnee {
  annee: number; // 1..H
  loyers: number; // encaissés
  chargesExploitation: number;
  interets: number;
  assuranceEmprunteur: number;
}

function impotAnnee(e: Entree, regime: Regime, c: ContexteAnnee, etat: Etat, base: { notaire: number; partBati: number }): number {
  const tmi = e.tmi_utilisateur / 100;
  const fraisAnnee1 = c.annee === 1 ? base.notaire + e.frais_bancaires : 0;

  if (regime === "lmnp_micro") {
    const imposable = c.loyers * (1 - FISCAL.micro_bic_abattement);
    return imposable * (tmi + FISCAL.ps_lmnp);
  }

  if (regime === "nue_micro") {
    const imposable = c.loyers * (1 - FISCAL.micro_foncier_abattement);
    return imposable * (tmi + FISCAL.ps_foncier);
  }

  if (regime === "lmnp_reel") {
    // Charges déductibles (frais d'acquisition et bancaires passés en charges l'année 1)
    const charges = c.chargesExploitation + c.interets + c.assuranceEmprunteur + fraisAnnee1;
    let resultat = c.loyers - charges;
    if (resultat < 0) {
      etat.deficitBic.push({ annee: c.annee, montant: -resultat });
      resultat = 0;
    } else {
      const imp = imputer(etat.deficitBic, c.annee, resultat);
      resultat = imp.reste;
      etat.deficitBic = imp.reports;
    }
    // Amortissements de l'année (bâti 30 ans, travaux 15 ans, mobilier 7 ans)
    const amortBati = c.annee <= FISCAL.duree_amort_bati ? base.partBati / FISCAL.duree_amort_bati : 0;
    const amortTravaux = c.annee <= FISCAL.duree_amort_travaux ? e.travaux / FISCAL.duree_amort_travaux : 0;
    const amortMob = c.annee <= FISCAL.duree_amort_mobilier ? e.mobilier / FISCAL.duree_amort_mobilier : 0;
    const amortDispo = amortBati + amortTravaux + amortMob + etat.ard;
    const amortUtilise = Math.min(amortDispo, resultat);
    etat.ard = amortDispo - amortUtilise;
    // Pour la plus-value : on retient la part bâti + travaux effectivement déduite (prorata)
    if (amortDispo > 0) {
      const partImmo = (amortBati + amortTravaux) / Math.max(amortBati + amortTravaux + amortMob, 1e-9);
      etat.amortCumuleBati += amortUtilise * partImmo;
    }
    resultat -= amortUtilise;
    return Math.max(0, resultat) * (tmi + FISCAL.ps_lmnp);
  }

  // nue_reel
  const travauxDeductibles = c.annee === 1 ? e.travaux : 0;
  const fraisGestionForfait = 20;
  const chargesNonFin = c.chargesExploitation + travauxDeductibles + fraisGestionForfait;
  const chargesFin = c.interets + c.assuranceEmprunteur + (c.annee === 1 ? e.frais_bancaires : 0);
  let resultat = c.loyers - chargesNonFin - chargesFin;
  let economieRevenuGlobal = 0;
  if (resultat >= 0) {
    const imp = imputer(etat.deficitFoncier, c.annee, resultat);
    resultat = imp.reste;
    etat.deficitFoncier = imp.reports;
  } else {
    const deficit = -resultat;
    // Part imputable sur le revenu global : déficit issu des charges non financières, plafonné
    const imputable = Math.min(FISCAL.deficit_foncier_plafond, Math.max(0, chargesNonFin - Math.max(0, c.loyers - chargesFin)), deficit);
    economieRevenuGlobal = imputable * tmi;
    const reportable = deficit - imputable;
    if (reportable > 0) etat.deficitFoncier.push({ annee: c.annee, montant: reportable });
    resultat = 0;
  }
  return resultat * (tmi + FISCAL.ps_foncier) - economieRevenuGlobal;
}

function eligibilite(e: Entree, regime: Regime): { ok: boolean; raison?: string } {
  const loyers = e.loyer_mensuel * 12;
  if (regime === "lmnp_micro" && loyers > FISCAL.micro_bic_plafond)
    return { ok: false, raison: "Recettes au-delà de 77 700 €" };
  if (regime === "nue_micro" && loyers > FISCAL.micro_foncier_plafond)
    return { ok: false, raison: "Loyers au-delà de 15 000 €" };
  return { ok: true };
}

function simulerRegime(e: Entree, regime: Regime) {
  const notaire = e.frais_notaire > 0 ? e.frais_notaire : fraisNotaireEstimes(e.prix_achat, e.type_bien);
  const coutAcquisition = e.prix_achat + notaire + e.travaux + e.mobilier;
  const coutTotal = coutAcquisition + e.frais_bancaires;
  const capital = Math.max(0, coutTotal - e.apport);
  const miseInitiale = coutTotal - capital;
  const credit = tableauCredit(capital, e.taux_credit, e.duree_credit);
  const assuranceAn = (capital * e.assurance_emprunteur_pct) / 100;
  // Frais de notaire passés en charges l'année 1 (option) : seul le prix est amorti, hors terrain
  const partBati = e.prix_achat * (1 - FISCAL.part_terrain[e.type_local]);
  const etat: Etat = { deficitBic: [], ard: 0, deficitFoncier: [], amortCumuleBati: 0 };

  const projection: AnneeProjection[] = [];
  let cumul = 0;
  const H = e.horizon;
  for (let a = 1; a <= H; a++) {
    const indexLoyer = Math.pow(1 + e.revalo_loyer_pct / 100, a - 1);
    const indexCharges = Math.pow(1 + FISCAL.inflation_charges, a - 1);
    const loyers = e.loyer_mensuel * 12 * indexLoyer * (1 - e.vacance_pct / 100);
    const charges =
      (e.charges_copro + e.taxe_fonciere + e.assurance_pno + e.autres_charges) * indexCharges +
      loyers * (e.gestion_pct / 100);
    const ligne = credit.annees[a - 1] ?? { interets: 0, capital: 0, restant: 0 };
    const enCours = a <= e.duree_credit && capital > 0;
    const assurance = enCours ? assuranceAn : 0;
    const impot = impotAnnee(e, regime, { annee: a, loyers, chargesExploitation: charges, interets: ligne.interets, assuranceEmprunteur: assurance }, etat, { notaire, partBati });
    const cashflow = loyers - charges - ligne.interets - ligne.capital - assurance - impot;
    cumul += cashflow;
    const valeur = e.prix_achat * Math.pow(1 + e.revalo_bien_pct / 100, a);
    projection.push({
      annee: a,
      loyers,
      charges,
      interets: ligne.interets,
      capital_rembourse: ligne.capital,
      assurance_emprunteur: assurance,
      impot,
      cashflow,
      cashflow_cumule: cumul,
      capital_restant: ligne.restant,
      valeur_bien: valeur,
      patrimoine_net: valeur - ligne.restant,
    });
  }

  // Revente à l'horizon
  const fin = projection[H - 1];
  const prixCession = fin.valeur_bien * (1 - e.frais_revente_pct / 100);
  const majorationAcquisition = Math.max(notaire, e.prix_achat * 0.075);
  // Travaux déjà déduits des revenus fonciers : non ajoutables (forfait de 15 % au-delà de 5 ans)
  const travauxReels = regime === "nue_reel" ? 0 : e.travaux;
  const travauxRetenus = H > 5 ? Math.max(travauxReels, e.prix_achat * 0.15) : travauxReels;
  let prixAcquisitionCorrige = e.prix_achat + majorationAcquisition + travauxRetenus;
  if (regime === "lmnp_reel") prixAcquisitionCorrige -= etat.amortCumuleBati; // réintégration (LF 2025)
  const pvBrute = Math.max(0, prixCession - prixAcquisitionCorrige);
  const ab = abattementsPV(H);
  const impotPV = pvBrute * (1 - ab.ir) * FISCAL.ir_plus_value + pvBrute * (1 - ab.ps) * FISCAL.ps_plus_value;
  const produitNet = prixCession - fin.capital_restant - impotPV;

  const flux = [-miseInitiale, ...projection.map((p) => p.cashflow)];
  flux[H] += produitNet;
  const t = miseInitiale > 0 ? tri(flux) : null;

  const p1 = projection[0];
  const impots10 = projection.slice(0, Math.min(10, H));
  return {
    notaire,
    coutAcquisition,
    coutTotal,
    capital,
    miseInitiale,
    credit,
    assuranceAn,
    projection,
    impot1: p1.impot,
    impotMoyen10: impots10.reduce((s, p) => s + p.impot, 0) / impots10.length,
    tri: t,
    pvBrute,
    impotPV,
    produitNet,
  };
}

export function calculer(entree: Partial<Entree>): Resultats {
  const e = normaliser(entree);
  const sim = simulerRegime(e, e.regime_fiscal);
  const p1 = sim.projection[0];

  const loyerBrut = e.loyer_mensuel * 12;
  const loyerEffectif = p1.loyers;
  const charges = p1.charges;
  const rendBrut = e.prix_achat > 0 ? (loyerBrut / e.prix_achat) * 100 : 0;
  const rendNet = sim.coutAcquisition > 0 ? ((loyerEffectif - charges) / sim.coutAcquisition) * 100 : 0;
  const rendNetNet = sim.coutAcquisition > 0 ? ((loyerEffectif - charges - p1.impot) / sim.coutAcquisition) * 100 : 0;
  const cfAvant = (loyerEffectif - charges - p1.interets - p1.capital_rembourse - p1.assurance_emprunteur) / 12;
  const cf = p1.cashflow / 12;

  const regimes: FiscaliteRegime[] = (["lmnp_micro", "lmnp_reel", "nue_micro", "nue_reel"] as Regime[]).map((r) => {
    const el = eligibilite(e, r);
    const s = r === e.regime_fiscal ? sim : simulerRegime(e, r);
    const q1 = s.projection[0];
    return {
      regime: r,
      eligible: el.ok,
      raison: el.raison,
      impot_annee1: s.impot1,
      impot_moyen_10ans: s.impotMoyen10,
      cashflow_mensuel_annee1: q1.cashflow / 12,
      rendement_net_net_pct: s.coutAcquisition > 0 ? ((q1.loyers - q1.charges - q1.impot) / s.coutAcquisition) * 100 : 0,
      tri_pct: s.tri === null ? null : s.tri * 100,
    };
  });
  const eligibles = regimes.filter((r) => r.eligible);
  const meilleur = (eligibles.length ? eligibles : regimes).reduce((a, b) => (b.impot_moyen_10ans < a.impot_moyen_10ans ? b : a)).regime;

  const fin = sim.projection[sim.projection.length - 1];
  return {
    frais_notaire_retenus: sim.notaire,
    cout_acquisition: sim.coutAcquisition,
    cout_total: sim.coutTotal,
    capital_emprunte: sim.capital,
    mensualite: sim.credit.mensualite,
    mensualite_assurance: sim.assuranceAn / 12,
    loyer_annuel_brut: loyerBrut,
    loyer_annuel_effectif: loyerEffectif,
    charges_annuelles: charges,
    rendement_brut_pct: n(rendBrut),
    rendement_net_pct: n(rendNet),
    rendement_net_net_pct: n(rendNetNet),
    impot_annee1: p1.impot,
    cashflow_avant_impot_mensuel: n(cfAvant),
    cashflow_mensuel: n(cf),
    effort_epargne_mensuel: cf < 0 ? -cf : 0,
    prix_m2: e.surface > 0 ? e.prix_achat / e.surface : 0,
    cout_m2: e.surface > 0 ? sim.coutAcquisition / e.surface : 0,
    tri_pct: sim.tri === null ? null : sim.tri * 100,
    plus_value_nette: sim.pvBrute - sim.impotPV,
    impot_plus_value: sim.impotPV,
    patrimoine_net_final: fin.patrimoine_net,
    enrichissement_total: sim.produitNet + fin.cashflow_cumule - sim.miseInitiale,
    projection: sim.projection,
    regimes,
    meilleur_regime: meilleur,
  };
}

// ---------------------------------------------------------------------------
// Score /100 — pondérations publiées dans la méthodologie

export interface MarcheRef {
  med: number;
  p25: number;
  p75: number;
  n: number;
}

export interface Score {
  total: number;
  libelle: string;
  details: { critere: string; points: number; max: number }[];
}

function lin(x: number, x0: number, x1: number, max: number) {
  if (!Number.isFinite(x)) return 0;
  const t = (x - x0) / (x1 - x0);
  return Math.max(0, Math.min(1, t)) * max;
}

export function scorer(r: Resultats, marche?: MarcheRef | null): Score {
  const details = [
    { critere: "Rendement net", points: lin(r.rendement_net_pct, 2, 6, 30), max: 30 },
    { critere: "Cash-flow après impôt", points: lin(r.cashflow_mensuel, -300, 150, 25), max: 25 },
    {
      critere: "Prix face au marché",
      points: marche && marche.med > 0 && r.prix_m2 > 0 ? lin(-(r.prix_m2 / marche.med), -1.25, -0.85, 20) : 10,
      max: 20,
    },
    { critere: "TRI avec revente", points: lin(r.tri_pct ?? 0, 0, 10, 25), max: 25 },
  ].map((d) => ({ ...d, points: Math.round(d.points) }));
  const total = Math.max(0, Math.min(100, details.reduce((s, d) => s + d.points, 0)));
  const libelle = total >= 75 ? "Très bon" : total >= 60 ? "Bon" : total >= 45 ? "Moyen" : "Fragile";
  return { total, libelle, details };
}
