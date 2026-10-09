// Biens à rénover : étiquettes DPE, coût des travaux, interdictions de louer, lecture d'une annonce.
// Hypothèses publiées sur /methodologie#renovation.

import { MARCHE, parCodePostal } from "./marche";

export type Classe = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export const CLASSES: Classe[] = ["A", "B", "C", "D", "E", "F", "G"];

/** Couleurs officielles de l'étiquette énergie (du vert au rouge). */
export const COULEUR_CLASSE: Record<Classe, string> = {
  A: "#009c6d",
  B: "#52b153",
  C: "#a5cc74",
  D: "#f4e70f",
  E: "#f0b40f",
  F: "#eb8235",
  G: "#d7221f",
};

/**
 * Coût moyen des travaux par classe DPE gagnée, en € TTC par m² habitable.
 * Ordres de grandeur tirés de chantiers types (isolation, chauffage, ventilation) :
 * une maison passe de G à D pour ~330 €/m², un appartement pour ~210 €/m².
 */
export const COUT_CLASSE_M2 = { Maison: 110, Appartement: 70 } as const;

/** Décote retenue pour une passoire (F ou G) face à la médiane du secteur. Prudente : les notaires mesurent jusqu'à 25 % pour une maison G. */
export const DECOTE_PASSOIRE = 0.15;

/** Déficit foncier majoré pour une rénovation énergétique qui fait passer de E, F ou G à A, B, C ou D. */
export const SUPER_DEFICIT = { plafond: 21400, finPaiements: "31 décembre 2027" };

/** Calendrier de la loi Climat et résilience : interdiction de louer (nouveaux baux et renouvellements). */
export const INTERDICTIONS: { classe: Classe; date: string; libelle: string }[] = [
  { classe: "G", date: "2025-01-01", libelle: "depuis le 1er janvier 2025" },
  { classe: "F", date: "2028-01-01", libelle: "à partir du 1er janvier 2028" },
  { classe: "E", date: "2034-01-01", libelle: "à partir du 1er janvier 2034" },
];

export const rang = (c: Classe) => CLASSES.indexOf(c);

export function classesGagnees(de: Classe, vers: Classe) {
  return Math.max(0, rang(de) - rang(vers));
}

/** Estimation des travaux énergétiques, arrondie à 500 €. */
export function estimerTravaux(type: "Appartement" | "Maison", surface: number, de: Classe, vers: Classe) {
  const brut = classesGagnees(de, vers) * COUT_CLASSE_M2[type] * Math.max(0, surface);
  return Math.round(brut / 500) * 500;
}

export function interdiction(c: Classe) {
  return INTERDICTIONS.find((i) => i.classe === c) ?? null;
}

/** Une étiquette est-elle (ou sera-t-elle) interdite à la location à une date donnée ? */
export function interditeLe(c: Classe, date: Date) {
  const i = interdiction(c);
  return Boolean(i && date >= new Date(i.date));
}

export function eligibleSuperDeficit(de: Classe, vers: Classe) {
  return rang(de) >= rang("E") && rang(vers) <= rang("D");
}

// ---------------------------------------------------------------------------
// Lecture d'une annonce collée par l'utilisateur (tout reste dans le navigateur).

export interface AnnonceLue {
  prix?: number;
  surface?: number;
  dpe?: Classe;
  cp?: string;
  type?: "Appartement" | "Maison";
}

const sansAccents = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const entier = (s: string) => Number(s.replace(/[\s.]/g, ""));

export function lireAnnonce(texte: string): AnnonceLue {
  const t = texte.replace(/\s+/g, " ");
  const bas = sansAccents(t);
  const out: AnnonceLue = {};

  // Prix : montant en euros entre 10 000 et 5 000 000, hors loyers, charges et prix au m².
  const montants: { v: number; i: number }[] = [];
  const reMontant = /(\d{1,3}(?:[\s.]\d{3})+|\d{5,7})\s*(?:€|euros?\b|eur\b)(?!\s*(?:\/|par)\s*(?:m|mois|an))/gi;
  for (const m of t.matchAll(reMontant)) {
    const v = entier(m[1]);
    const avant = bas.slice(Math.max(0, (m.index ?? 0) - 40), m.index ?? 0);
    if (v < 10000 || v > 5000000) continue;
    if (/(charges|honoraires|taxe|loyer|depot|caution|frais)[^.]{0,30}$/.test(avant)) continue;
    montants.push({ v, i: m.index ?? 0 });
  }
  const apresPrix = montants.find((m) => /prix[^.]{0,25}$/.test(bas.slice(Math.max(0, m.i - 30), m.i)));
  if (apresPrix) out.prix = apresPrix.v;
  else if (montants.length) out.prix = Math.max(...montants.map((m) => m.v));

  // Surface habitable : celle qui est dite « habitable », sinon la première qui n'est ni un terrain ni une pièce.
  const surfaces: { v: number; sure: boolean }[] = [];
  for (const m of t.matchAll(/(\d{1,4}(?:[.,]\d{1,2})?)\s*m(?:²|2)(?![\d])/gi)) {
    const v = Number(m[1].replace(",", "."));
    const i = m.index ?? 0;
    const avant = bas.slice(Math.max(0, i - 24), i);
    const apres = bas.slice(i + m[0].length, i + m[0].length + 14);
    if (v < 9 || v > 1000) continue;
    const habitable = /habitable/.test(avant + apres) || /surface[^,.;]*$/.test(avant);
    if (!habitable && /(terrain|jardin|parcelle|garage|terrasse|balcon|cave|grenier|combles|sejour|salon|cuisine|chambre|piece|salle|bureau|veranda|dependance|atelier|hangar)[^,.;]*$/.test(avant)) continue;
    if (!habitable && /^\s*(de\s+|d')?(terrain|jardin|terrasse|dependance)/.test(apres)) continue;
    surfaces.push({ v, sure: habitable });
  }
  const surface = surfaces.find((s) => s.sure) ?? surfaces[0];
  if (surface) out.surface = surface.v;

  // Étiquette énergie : la lettre doit être une majuscule dans le texte d'origine.
  const reDpe = /(dpe|classe\s+(?:e|é)nergie|(?:e|é)tiquette\s+(?:e|é)nergie|performance\s+(?:e|é)nerg(?:e|é)tique|consommation\s+(?:e|é)nerg(?:e|é)tique)\s*(?:\(?\s*dpe\s*\)?)?\s*(?:[:=\-–]|est|de|classe)?\s*(?:classe\s*)?([a-g])\b/gi;
  for (const m of t.matchAll(reDpe)) {
    const l = m[2];
    if (l === l.toUpperCase()) {
      out.dpe = l as Classe;
      break;
    }
  }

  // Code postal : d'abord un code connu du marché, sinon le nom d'une commune.
  for (const m of t.matchAll(/\b(\d{5})\b/g)) {
    if (parCodePostal(m[1])) {
      out.cp = m[1];
      break;
    }
  }
  if (!out.cp) {
    const communes = MARCHE.codes_postaux
      .map((c) => ({ cp: c.cp, nom: sansAccents(c.commune.replace(/\s*\(.*\)$/, "")) }))
      .sort((a, b) => b.nom.length - a.nom.length);
    const trouve = communes.find((c) => c.nom.length > 3 && bas.includes(c.nom));
    if (trouve) out.cp = trouve.cp;
  }

  if (/\b(maison|pavillon|longere|villa|corps de ferme|echoppe|chaumiere)\b/.test(bas)) out.type = "Maison";
  else if (/\b(appartement|studio|duplex|triplex|t[1-6]|f[1-6])\b/.test(bas)) out.type = "Appartement";

  return out;
}
