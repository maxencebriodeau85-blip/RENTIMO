import type { Metadata } from "next";
import Link from "next/link";
import { OFFRE, EDITEUR } from "@/lib/config";
import { BoutonsPro } from "./BoutonsPro";
import "../offres.css";

export const metadata: Metadata = {
  title: "Tarifs",
  description: `Gratuit pour les particuliers. Offre Pro à ${OFFRE.proMensuel} € par mois pour les agents, mandataires et courtiers : rapports à votre nom, simulations illimitées.`,
};

export default function PageTarifs() {
  return (
    <div className="page conteneur">
      <div className="page-titre">
        <h1 className="titre-l">Tarifs</h1>
        <p className="chapo">Le simulateur reste gratuit pour les particuliers. Les professionnels paient pour vendre avec.</p>
      </div>

      <div className="offres">
        <section className="offre">
          <h2>Particulier</h2>
          <p className="offre-prix"><span className="chiffre">0 €</span></p>
          <p className="petit">Pour analyser vos propres projets.</p>
          <ul>
            <li>Simulateur complet : rendements, cash-flow, TRI avec revente</li>
            <li>Quatre régimes fiscaux comparés</li>
            <li>Prix DVF et loyers de marché du secteur</li>
            <li>{OFFRE.gratuitSauvegardes} simulations enregistrées</li>
            <li>Rapport imprimable et lien de partage</li>
            <li>Analyse d'un bien à rénover : travaux DPE, prix maximum, déficit foncier</li>
          </ul>
          <Link href="/simulateur" className="btn btn-contour">Lancer une simulation</Link>
        </section>

        <section className="offre offre-pro">
          <h2>Pro</h2>
          <p className="offre-prix">
            <span className="chiffre">{OFFRE.proMensuel} €</span> <span className="petit">par mois, sans engagement</span>
          </p>
          <p className="petit">Ou {OFFRE.proAnnuel} € par an, deux mois offerts. Pour les agents, mandataires, courtiers et conseillers.</p>
          <ul>
            <li>Tout ce qui est gratuit, sans limite de simulations</li>
            <li>Rapport PDF à votre nom et vos coordonnées, sans marque Rentimo</li>
            <li>Lien de partage avec votre contact pour l'acquéreur</li>
            <li>Comparaison de plusieurs biens côte à côte</li>
            <li>Radar des passoires : les DPE F et G récents par commune, classés par rendement après travaux</li>
            <li>Réponse par e-mail sous 24 h ouvrées</li>
          </ul>
          <BoutonsPro />
        </section>
      </div>

      <section className="fondateur">
        <div>
          <h2 className="titre-m">Offre fondateur</h2>
          <p className="petit" style={{ margin: "8px 0 0" }}>
            Les {OFFRE.fondateurPlaces} premiers comptes Pro paient {OFFRE.fondateurMensuel} € par mois, à vie, tant que l'abonnement reste actif. En
            échange : un retour franc sur l'outil après un mois d'utilisation.
          </p>
        </div>
        <Link href="/pro#contact" className="btn btn-clair">Réserver une place</Link>
      </section>

      <section className="faq-tarifs">
        <h2 className="titre-m">Questions sur l'abonnement</h2>
        <dl>
          <div>
            <dt>Puis-je résilier quand je veux ?</dt>
            <dd>Oui. L'abonnement mensuel s'arrête à la fin du mois payé, sans frais ni préavis.</dd>
          </div>
          <div>
            <dt>Faut-il une carte bancaire pour l'essai ?</dt>
            <dd>Non. Les {OFFRE.essaiJours} jours d'essai s'activent depuis votre compte, sans moyen de paiement.</dd>
          </div>
          <div>
            <dt>Comment payer ?</dt>
            <dd>Par carte bancaire via Stripe. Une facture est envoyée à chaque paiement.</dd>
          </div>
          {EDITEUR.tvaFranchise ? (
            <div>
              <dt>Les prix incluent-ils la TVA ?</dt>
              <dd>TVA non applicable, article 293 B du CGI : le prix affiché est le prix payé.</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </div>
  );
}
