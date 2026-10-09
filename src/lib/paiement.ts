import { STRIPE } from "./config";

export type Formule = "proMensuel" | "proAnnuel" | "fondateur";

/** Lien de paiement Stripe pré-rempli (identifiant du compte + e-mail), ou null si Stripe n'est pas configuré. */
export function lienPaiement(formule: Formule, userId?: string | null, email?: string | null): string | null {
  const base = STRIPE[formule];
  if (!base) return null;
  const u = new URL(base);
  if (userId) u.searchParams.set("client_reference_id", userId);
  if (email) u.searchParams.set("prefilled_email", email);
  return u.toString();
}
