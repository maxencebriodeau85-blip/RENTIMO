import data from "@/data/marche.json";
import { slugCommune } from "./format";

export interface StatType {
  n: number;
  med: number;
  p25: number;
  p75: number;
}

export interface CodePostal {
  cp: string;
  commune: string;
  lat: number;
  lon: number;
  n: number;
  med: number;
  p25: number;
  p75: number;
  A: StatType | null;
  M: StatType | null;
  med2024: number;
  med2025: number;
  loyerA: number | null;
  loyerM: number | null;
}

export const MARCHE = data as {
  source: string;
  periode: string;
  total_ventes: number;
  communes_loyers: number;
  codes_postaux: CodePostal[];
};

export const SEUIL_FIABILITE = 20; // ventes minimum pour afficher une médiane par type

export function parCodePostal(cp: string): CodePostal | undefined {
  return MARCHE.codes_postaux.find((c) => c.cp === cp);
}

export function slugCp(c: CodePostal) {
  return `${c.cp}-${slugCommune(c.commune.replace(/\s*\(.*\)$/, ""))}`;
}

export function parSlug(slug: string): CodePostal | undefined {
  const cp = slug.slice(0, 5);
  return parCodePostal(cp);
}

/** Statistique de prix la plus pertinente pour un type de bien (repli sur l'ensemble si trop peu de ventes). */
export function statPrix(c: CodePostal, type: "Appartement" | "Maison"): StatType & { repli: boolean } {
  const s = type === "Appartement" ? c.A : c.M;
  if (s && s.n >= SEUIL_FIABILITE) return { ...s, repli: false };
  return { n: c.n, med: c.med, p25: c.p25, p75: c.p75, repli: true };
}

export function loyerMarche(c: CodePostal, type: "Appartement" | "Maison"): number | null {
  return type === "Appartement" ? c.loyerA ?? c.loyerM : c.loyerM ?? c.loyerA;
}

/** Rendement brut indicatif du secteur : loyer de marché annuel / prix médian. */
export function rendementSecteur(c: CodePostal, type: "Appartement" | "Maison"): number | null {
  const l = loyerMarche(c, type);
  const p = statPrix(c, type).med;
  if (!l || !p) return null;
  return ((l * 12) / p) * 100;
}

export function evolution(c: CodePostal): number | null {
  if (!c.med2024 || !c.med2025) return null;
  return ((c.med2025 - c.med2024) / c.med2024) * 100;
}
