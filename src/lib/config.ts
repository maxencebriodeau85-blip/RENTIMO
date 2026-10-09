// Réglages centraux du site. Tout ce qui dépend de l'entreprise ou du paiement se règle ici
// (ou par variables d'environnement Vercel), sans toucher aux pages.

export const MARQUE = "Rentimo";
export const URL_SITE = process.env.NEXT_PUBLIC_URL_SITE || "https://rentimo-seven.vercel.app";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lczposnwvngxihpltnzh.supabase.co";
// Clé publique (anon) : conçue pour être exposée côté navigateur, la sécurité repose sur les règles RLS.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjenBvc253dm5neGlocGx0bnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMzk4NTEsImV4cCI6MjA5OTkxNTg1MX0.p_RIfXMi62oV9TBp_kS-g8KK20R3Oii3eMXQ39daElE";

export const OFFRE = {
  gratuitSauvegardes: 3,
  essaiJours: 14,
  proMensuel: 29,
  proAnnuel: 290,
  fondateurMensuel: 19,
  fondateurPlaces: 20,
};

// Liens de paiement Stripe (Payment Links). Vides tant que Stripe n'est pas configuré :
// les boutons basculent alors sur une demande de contact.
export const STRIPE = {
  proMensuel: process.env.NEXT_PUBLIC_STRIPE_PRO_MENSUEL || "",
  proAnnuel: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUEL || "",
  fondateur: process.env.NEXT_PUBLIC_STRIPE_FONDATEUR || "",
};

// Identité légale de l'éditeur — à compléter avant toute vente (mentions légales, CGV).
export const EDITEUR = {
  nom: process.env.NEXT_PUBLIC_EDITEUR_NOM || "Maxence Briodeau",
  statut: process.env.NEXT_PUBLIC_EDITEUR_STATUT || "Entrepreneur individuel (micro-entreprise)",
  siret: process.env.NEXT_PUBLIC_EDITEUR_SIRET || "",
  adresse: process.env.NEXT_PUBLIC_EDITEUR_ADRESSE || "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  telephone: process.env.NEXT_PUBLIC_EDITEUR_TELEPHONE || "",
  tvaFranchise: true, // TVA non applicable, art. 293 B du CGI
};

export const EDITEUR_COMPLET = Boolean(EDITEUR.siret && EDITEUR.adresse && EDITEUR.email);
