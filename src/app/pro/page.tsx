import type { Metadata } from "next";
import Link from "next/link";
import "../offres.css";
import { OFFRE } from "@/lib/config";
import { exempleSecteur } from "@/lib/exemples";
import { Rapport } from "@/components/Rapport";
import { FormulaireContact } from "@/components/FormulaireContact";
import { MARCHE } from "@/lib/marche";
import { nombre } from "@/lib/format";

export const metadata: Metadata = {
  title: "Offre pro : l'étude de rentabilité à votre nom",
  description:
    "Agents immobiliers, mandataires, courtiers : envoyez à vos acquéreurs investisseurs une étude de rentabilité complète à votre nom, avec les prix DVF du secteur.",
};

export default function PagePro() {
  const ex = exempleSecteur("85000");
  return (
    <div className="page conteneur">
      <section className="pro-hero">
        <div className="pro-hero-texte">
          <h1 className="titre-l">L'étude de rentabilité à votre nom, en deux minutes.</h1>
          <p className="chapo">
            Un acquéreur investisseur vous demande « ça rapporte combien ? ». Envoyez-lui une étude complète : rendement net-net,
            cash-flow, fiscalité, prix réels du secteur. À votre nom, avec vos coordonnées, prête à montrer au banquier.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/connexion?mode=inscription&suite=/compte" className="btn btn-clair">
              Essayer {OFFRE.essaiJours} jours gratuitement <span className="fleche" aria-hidden="true">→</span>
            </Link>
            <a href="#contact" className="btn-texte">Demander une démonstration</a>
          </div>
          <p className="petit" style={{ margin: 0 }}>
            {OFFRE.proMensuel} € par mois, sans engagement. Offre fondateur à {OFFRE.fondateurMensuel} € pour les {OFFRE.fondateurPlaces} premiers.
          </p>
        </div>
        {ex ? (
          <div className="pro-apercu" aria-label="Exemple de rapport à votre nom">
            <Rapport
              e={{ ...ex.e, nom: "T2 meublé · centre-ville" }}
              r={ex.r}
              score={ex.score}
              date="Exemple"
              conseiller={{ nom: "Votre nom", societe: "Votre agence", telephone: "06 00 00 00 00", email_contact: "vous@agence.fr", site_web: null }}
              marche={{ commune: ex.c.commune, n: ex.prixRef.n, med: ex.prixRef.med, p25: ex.prixRef.p25, p75: ex.prixRef.p75, repli: ex.prixRef.repli, loyerM2: ex.c.loyerA }}
            />
          </div>
        ) : null}
      </section>

      <ol className="etapes">
        <li>
          <h3>Saisissez le bien</h3>
          <p>Prix, surface, code postal. Rentimo propose le loyer de marché et estime les frais de notaire.</p>
        </li>
        <li>
          <h3>Vérifiez les chiffres</h3>
          <p>Rendements, cash-flow, quatre régimes fiscaux, TRI avec revente, position du prix face aux ventes DVF.</p>
        </li>
        <li>
          <h3>Envoyez l'étude</h3>
          <p>Un lien en lecture seule avec vos coordonnées, ou un PDF à votre nom à joindre à l'annonce.</p>
        </li>
      </ol>

      <section className="arguments">
        <div>
          <h3>Vous répondez avant la visite</h3>
          <p>L'investisseur trie les annonces sur le rendement. Celle qui arrive avec l'étude complète passe devant.</p>
        </div>
        <div>
          <h3>Vous défendez votre prix</h3>
          <p>
            {nombre(MARCHE.total_ventes)} ventes réelles en Vendée : montrez au vendeur comme à l'acheteur où se situe le bien face au marché.
          </p>
        </div>
        <div>
          <h3>Le banquier a ce qu'il attend</h3>
          <p>Plan de financement, projection sur vingt ans, fiscalité expliquée. Le dossier de votre acquéreur avance plus vite.</p>
        </div>
        <div>
          <h3>Votre nom circule</h3>
          <p>Chaque étude partagée porte vos coordonnées. L'acquéreur la transfère à son conjoint, son courtier, son comptable.</p>
        </div>
      </section>

      <section className="verre pro-radar">
        <div>
          <h2 className="titre-m">Prospectez là où les passoires arrivent</h2>
          <p>
            Le radar des passoires compte chaque jour les DPE F et G établis en Vendée, commune par commune. Ce sont des propriétaires qui vendent,
            ou qui devront rénover avant l'interdiction de louer. Vous savez où chercher les mandats, et vous arrivez avec le chiffrage des travaux.
          </p>
        </div>
        <Link href="/radar" className="btn btn-contour">
          Voir le radar
        </Link>
      </section>

      <section className="contact-pro" id="contact">
        <div style={{ display: "grid", gap: 14 }}>
          <h2 className="titre-l">Une démonstration de 15 minutes</h2>
          <p className="chapo">
            Envoyez l'adresse d'un de vos biens à vendre : vous recevrez son étude de rentabilité à votre nom, gratuitement, pour juger sur pièce.
          </p>
        </div>
        <div className="verre" style={{ padding: 24 }}>
          <FormulaireContact
            type="pro"
            bouton="Recevoir mon étude"
            placeholderMessage="Lien de l'annonce ou adresse du bien, et vos disponibilités"
            succes="Merci. Vous recevez l'étude de votre bien sous 24 h ouvrées."
          />
        </div>
      </section>
    </div>
  );
}
