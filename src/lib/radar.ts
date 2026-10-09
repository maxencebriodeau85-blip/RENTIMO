// Radar des passoires : DPE F et G récents par code postal (ADEME), croisés avec les prix DVF et les loyers de marché.
// Données agrégées par code postal uniquement : aucune adresse, aucun propriétaire.

import { MARCHE, loyerMarche, slugCp, statPrix } from "./marche";
import { COUT_CLASSE_M2, DECOTE_PASSOIRE } from "./renovation";

export const RADAR_JOURS = 90;
export const RADAR_MIN_PASSOIRES = 5; // en dessous, la commune n'entre pas dans le classement

export interface CompteCp {
  n: number;
  metric?: number;
}

export interface LigneRadar {
  cp: string;
  commune: string;
  slug: string;
  passoires: number; // DPE F + G établis sur la période
  g: number;
  part: number | null; // part des DPE de la période classés F ou G, en %
  maisons: number;
  type: "Appartement" | "Maison"; // type dominant parmi les passoires
  surface: number | null; // surface moyenne des passoires
  prixM2: number; // médiane DVF du type dominant
  loyerM2: number | null; // loyer de marché, charges comprises
  prixCible: number; // prix au m² visé pour une passoire (décote appliquée)
  travauxM2: number; // travaux pour atteindre D
  rendement: number | null; // rendement brut après travaux, en %
}

export interface ReponseRadar {
  depuis: string;
  jours: number;
  maj: string;
  total_dpe: number;
  total_passoires: number;
  total_g: number;
  communes: number; // codes postaux classés
  pro: boolean;
  lignes: LigneRadar[]; // complet pour un compte Pro, les 3 premières sinon
  masquees: number;
}

export function composerRadar(
  tous: Map<string, CompteCp>,
  fg: Map<string, CompteCp>,
  g: Map<string, CompteCp>,
  maisons: Map<string, CompteCp>,
): LigneRadar[] {
  const lignes: LigneRadar[] = [];
  for (const c of MARCHE.codes_postaux) {
    const passoires = fg.get(c.cp)?.n ?? 0;
    if (!passoires) continue;
    const nG = Math.min(passoires, g.get(c.cp)?.n ?? 0);
    const nMaisons = Math.min(passoires, maisons.get(c.cp)?.n ?? 0);
    const total = tous.get(c.cp)?.n ?? 0;
    const type = nMaisons * 2 >= passoires ? "Maison" : "Appartement";
    const prixM2 = statPrix(c, type).med;
    const loyer = loyerMarche(c, type);
    // Classes à gagner pour atteindre D : 2 depuis F, 3 depuis G (moyenne pondérée).
    const classes = (2 * (passoires - nG) + 3 * nG) / passoires;
    const travauxM2 = Math.round(classes * COUT_CLASSE_M2[type]);
    const prixCible = Math.round(prixM2 * (1 - DECOTE_PASSOIRE));
    const cout = prixCible + travauxM2;
    const surf = fg.get(c.cp)?.metric;
    lignes.push({
      cp: c.cp,
      commune: c.commune.replace(/\s*\(.*\)$/, ""),
      slug: slugCp(c),
      passoires,
      g: nG,
      part: total > 0 ? (passoires / total) * 100 : null,
      maisons: nMaisons,
      type,
      surface: surf && Number.isFinite(surf) ? Math.round(surf) : null,
      prixM2,
      loyerM2: loyer,
      prixCible,
      travauxM2,
      // Loyer hors charges ≈ 92 % du loyer d'annonce charges comprises.
      rendement: loyer && cout > 0 ? ((loyer * 0.92 * 12) / cout) * 100 : null,
    });
  }
  return lignes;
}

/** Classement par défaut : rendement après travaux, parmi les codes postaux qui ont assez de passoires. */
export function classer(lignes: LigneRadar[]): LigneRadar[] {
  const assez = lignes.filter((l) => l.passoires >= RADAR_MIN_PASSOIRES && l.rendement !== null);
  const reste = lignes.filter((l) => !assez.includes(l));
  const parRendement = (a: LigneRadar, b: LigneRadar) => (b.rendement ?? 0) - (a.rendement ?? 0);
  return [...assez.sort(parRendement), ...reste.sort((a, b) => b.passoires - a.passoires)];
}
