# Rentimo v5

Simulateur de rentabilité locative (Next.js 14 + Supabase), déployé sur Vercel (projet `rentimo`).

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # tests du moteur de calcul
```

## Arborescence

- `src/lib/calculs.ts` : moteur de calcul (rendements, crédit, fiscalité LMNP / nue, plus-value, TRI, score). Testé par `scripts/test-calculs.ts`.
- `src/data/marche.json` : instantané DVF 2024-2025 Vendée + carte des loyers 2025, généré par `scripts/build-snapshot.py`.
- `public/visuels/*.svg` : immeuble de nuit et vignettes, générés par `node scripts/gen-visuels.mjs`.
- `supabase/migrations/` : schéma v6 appliqué au projet Supabase `rentimo`.
- `src/app/api/stripe/webhook` : activation automatique de l'offre Pro après paiement.

## Variables d'environnement (Vercel)

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_STRIPE_PRO_MENSUEL`, `NEXT_PUBLIC_STRIPE_PRO_ANNUEL`, `NEXT_PUBLIC_STRIPE_FONDATEUR` | Liens de paiement Stripe (Payment Links). Sans eux, les boutons renvoient vers le formulaire de contact. |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook `https://<site>/api/stripe/webhook` (événements `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase, utilisée uniquement par le webhook. |
| `NEXT_PUBLIC_EDITEUR_SIRET`, `NEXT_PUBLIC_EDITEUR_ADRESSE`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_EDITEUR_TELEPHONE` | Mentions légales. |
| `NEXT_PUBLIC_URL_SITE` | URL publique (domaine personnalisé). |

## Administration

Connecté avec l'e-mail présent dans la table `admins`, la page `/compte` affiche les statistiques, les demandes reçues, la liste des comptes et un bouton pour activer l'offre Pro à la main.
