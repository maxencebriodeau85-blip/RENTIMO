import type { Metadata } from "next";
import { EDITEUR, OFFRE } from "@/lib/config";

export const metadata: Metadata = { title: "Conditions générales" };

export default function CGV() {
  return (
    <div className="page conteneur">
      <div className="page-titre">
        <h1 className="titre-l">Conditions générales d'utilisation et de vente</h1>
        <p className="petit">Version du 9 octobre 2026.</p>
      </div>
      <div className="prose">
        <h2>1. Objet</h2>
        <p>
          Rentimo est un service en ligne de simulation de rentabilité locative édité par {EDITEUR.nom} ({EDITEUR.statut}). Les présentes
          conditions régissent l'utilisation du site et la souscription de l'offre Pro.
        </p>
        <h2>2. Accès gratuit</h2>
        <p>
          Le simulateur est accessible gratuitement, avec ou sans compte. Un compte gratuit permet d'enregistrer jusqu'à{" "}
          {OFFRE.gratuitSauvegardes} simulations et de les partager par lien.
        </p>
        <h2>3. Offre Pro</h2>
        <p>
          L'offre Pro est un abonnement destiné aux professionnels de l'immobilier et du financement. Elle comprend les simulations illimitées,
          les rapports et liens de partage portant les coordonnées de l'abonné. Prix : {OFFRE.proMensuel} € par mois ou {OFFRE.proAnnuel} € par an
          {EDITEUR.tvaFranchise ? " (TVA non applicable, article 293 B du CGI)" : " hors taxes"}. L'offre fondateur, à {OFFRE.fondateurMensuel} € par mois,
          est réservée aux {OFFRE.fondateurPlaces} premiers abonnés et maintenue tant que l'abonnement n'est pas interrompu.
        </p>
        <p>
          Un essai gratuit de {OFFRE.essaiJours} jours, sans moyen de paiement, peut être activé une fois par compte. À son terme, le compte
          revient à l'offre gratuite sans frais.
        </p>
        <h2>4. Paiement, durée et résiliation</h2>
        <p>
          Le paiement s'effectue par carte bancaire via Stripe, à la souscription puis à chaque échéance. L'abonnement mensuel est sans
          engagement et se renouvelle chaque mois ; l'abonnement annuel se renouvelle chaque année. L'abonné peut résilier à tout moment depuis le
          lien de gestion reçu par e-mail ou sur simple demande écrite : la résiliation prend effet à la fin de la période payée, sans
          remboursement de la période en cours.
        </p>
        <h2>5. Nature des résultats</h2>
        <p>
          Les résultats sont des estimations qui dépendent des hypothèses saisies et de données publiques susceptibles d'erreurs. Ils ne
          constituent pas un conseil en investissement, fiscal ou juridique. L'abonné professionnel reste seul responsable des documents qu'il
          remet à ses clients.
        </p>
        <h2>6. Disponibilité</h2>
        <p>
          L'éditeur s'efforce d'assurer l'accès au service en continu, sans garantie de disponibilité permanente. Une interruption pour
          maintenance peut intervenir.
        </p>
        <h2>7. Données personnelles</h2>
        <p>Voir la politique de confidentialité.</p>
        <h2>8. Droit applicable</h2>
        <p>
          Droit français. En cas de litige avec un consommateur, celui-ci peut recourir gratuitement à un médiateur de la consommation avant
          toute action judiciaire.
        </p>
      </div>
    </div>
  );
}
