import { calculer, ENTREE_DEFAUT, normaliser, scorer, type TypeLocal } from "./calculs";
import { loyerMarche, parCodePostal, statPrix } from "./marche";

/** Exemple normalisé : un T2 de 42 m² acheté au prix médian DVF, loué meublé au loyer de marché. */
export function exempleSecteur(cp: string, type: TypeLocal = "Appartement", surface = 42) {
  const c = parCodePostal(cp);
  if (!c) return null;
  const prixRef = statPrix(c, type);
  const loyerM2 = loyerMarche(c, type) ?? 0;
  const prix = Math.round((prixRef.med * surface) / 1000) * 1000;
  const loyer = Math.round(loyerM2 * surface);
  const e = normaliser({
    ...ENTREE_DEFAUT,
    nom: `T2 · ${c.commune}`,
    type_local: type,
    code_postal: cp,
    ville: c.commune,
    surface,
    prix_achat: prix,
    loyer_mensuel: loyer,
    travaux: 0,
    apport: Math.round(prix * 0.1),
  });
  const r = calculer(e);
  const score = scorer(r, prixRef);
  return { c, e, prix, loyer, prixM2: prixRef.med, prixRef, r, score };
}
