import type { Metadata } from "next";
import { EDITEUR } from "@/lib/config";

export const metadata: Metadata = { title: "Confidentialité" };

export default function Confidentialite() {
  return (
    <div className="page conteneur">
      <div className="page-titre">
        <h1 className="titre-l">Politique de confidentialité</h1>
        <p className="petit">Version du 9 octobre 2026.</p>
      </div>
      <div className="prose">
        <h2>Responsable du traitement</h2>
        <p>{EDITEUR.nom}, éditeur de Rentimo.{EDITEUR.email ? ` Contact : ${EDITEUR.email}.` : ""}</p>
        <h2>Données collectées</h2>
        <ul>
          <li><strong>Compte</strong> : adresse e-mail, mot de passe chiffré, date d'inscription. Base : exécution du service.</li>
          <li><strong>Simulations enregistrées</strong> : les hypothèses et résultats que vous enregistrez. Base : exécution du service.</li>
          <li><strong>Coordonnées professionnelles</strong> (offre Pro) : nom, société, téléphone, e-mail, site, affichés sur vos rapports. Base : exécution du service.</li>
          <li><strong>Demandes de contact et baromètre</strong> : e-mail et informations saisies. Base : votre demande, ou votre consentement pour le baromètre.</li>
          <li><strong>Paiement</strong> : traité par Stripe ; Rentimo ne voit jamais votre numéro de carte.</li>
        </ul>
        <p>
          Les simulations faites sans compte restent dans votre navigateur. Aucun cookie publicitaire, aucun traceur tiers. Le navigateur
          conserve votre session de connexion et votre brouillon de simulation.
        </p>
        <h2>Hébergement et destinataires</h2>
        <p>
          Données des comptes hébergées par Supabase en Europe (région de Paris). Site servi par Vercel. Paiements traités par Stripe. Aucune
          donnée n'est vendue ni cédée.
        </p>
        <h2>Durée de conservation</h2>
        <p>
          Compte et simulations : jusqu'à la suppression du compte, ou trois ans après la dernière connexion. Demandes de contact : trois ans.
          Données de facturation : dix ans, obligation comptable.
        </p>
        <h2>Vos droits</h2>
        <p>
          Accès, rectification, effacement, portabilité, opposition et limitation : écrivez à l'éditeur
          {EDITEUR.email ? ` (${EDITEUR.email})` : ""}. Vous pouvez saisir la CNIL (cnil.fr) si vous estimez que vos droits ne sont pas respectés.
        </p>
      </div>
    </div>
  );
}
