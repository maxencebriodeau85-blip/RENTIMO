// Photos du site (licence Unsplash), préparées par scripts/optimiser-photos.mjs.
import data from "@/data/photos.json";

export interface InfoPhoto {
  largeur: number;
  hauteur: number;
  largeurs: number[];
  apercu: string;
  auteur: string;
  profil: string;
  page: string;
  lieu?: string;
}

export const PHOTOS = data as Record<string, InfoPhoto>;
export type NomPhoto = keyof typeof data;

export function srcset(nom: NomPhoto, format: "avif" | "webp") {
  return PHOTOS[nom].largeurs.map((w) => `/photos/${nom}-${w}.${format} ${w}w`).join(", ");
}

export function srcDefaut(nom: NomPhoto) {
  const ls = PHOTOS[nom].largeurs;
  return `/photos/${nom}-${ls[Math.min(1, ls.length - 1)]}.webp`;
}
