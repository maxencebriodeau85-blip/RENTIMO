import Image from "next/image";
import Link from "next/link";
import "./accueil.css";
import { Experience } from "@/components/accueil/Experience";
import { HeroImmobilier } from "@/components/accueil/HeroImmobilier";
import { ApercuSimulation } from "@/components/accueil/ApercuSimulation";
import { Compteur } from "@/components/accueil/Compteur";
import { Eclat } from "@/components/accueil/Eclat";
import { MARCHE } from "@/lib/marche";
import { exempleSecteur } from "@/lib/exemples";
import { m2, pct } from "@/lib/format";
import { OFFRE } from "@/lib/config";

const SECTEURS = [
  { cp: "85100", nom: "Les Sables-d’Olonne", esprit: "L’appel du littoral", image: "/images/maison-littorale.webp", alt: "Maison de caractère dans un jardin côtier" },
  { cp: "85000", nom: "La Roche-sur-Yon", esprit: "L’énergie de la ville", image: "/images/interieur-lumiere.webp", alt: "Intérieur lumineux avec de grandes fenêtres" },
  { cp: "85110", nom: "Chantonnay", esprit: "Une autre qualité de vie", image: "/images/villa-atlantique.webp", alt: "Maison contemporaine ouverte sur la nature" },
];
const FAQ = [
  { q: "Puis-je commencer sans créer de compte ?", r: `Oui. Le simulateur, la comparaison fiscale et les prix du marché sont accessibles gratuitement. Un compte gratuit permet ensuite de sauvegarder jusqu’à ${OFFRE.gratuitSauvegardes} simulations.` },
  { q: "Sur quelles données reposent les estimations ?", r: "Sur les actes de vente DVF publiés par la DGFiP pour 2024 et 2025, et sur la carte des loyers 2025 du ministère du Logement. Les prix et loyers de référence sont actuellement disponibles en Vendée. Le simulateur fonctionne partout en France avec vos propres chiffres." },
  { q: "Puis-je analyser un bien à rénover ?", r: "Oui. L’outil de rénovation estime les travaux, le gain de classes DPE, la valeur après rénovation et le prix d’achat à ne pas dépasser. Le radar Pro complète l’analyse avec les données DPE des communes de Vendée." },
  { q: "Et si je suis professionnel de l’immobilier ?", r: `L’offre Pro permet des simulations illimitées, des rapports à votre nom et des études partageables avec vos acquéreurs. Elle est proposée à ${OFFRE.proMensuel} € par mois, avec ${OFFRE.essaiJours} jours d’essai sans carte bancaire.` },
];

export default function Accueil() {
  return (
    <Experience>
      <HeroImmobilier />
      <div className="signature-donnees conteneur">
        <p>De l’intuition.<br /><strong>Et des fondations solides.</strong></p>
        <div><strong><Compteur valeur={MARCHE.total_ventes} /></strong><span>ventes réelles analysées</span></div>
        <div><strong><Compteur valeur={MARCHE.codes_postaux.length} /></strong><span>codes postaux en Vendée</span></div>
        <div className="signature-source"><span className="source-monogramme" aria-hidden="true">RF</span><p>Données publiques<br /><strong>DVF · DGFiP · Loyers 2025</strong></p></div>
      </div>

      <section className="approche-section conteneur" id="approche">
        <div className="chapitre" data-reveal><span>01 / Une autre perspective</span><span>Voir au-delà des murs <span aria-hidden="true">↙</span></span></div>
        <div className="approche-grille">
          <div className="approche-photo" data-reveal>
            <Image src="/images/interieur-lumiere.webp" alt="Salon contemporain baigné de lumière, bois clair et matières naturelles" fill sizes="(max-width: 760px) 100vw, 50vw" />
            <div className="photo-cartouche"><span className="point-vivant mouvement-continu" /><span>L’espace d’un projet.<br /><strong>La lumière sur son potentiel.</strong></span><span aria-hidden="true">↗</span></div>
            <span className="photo-index">RENTIMO — PERSPECTIVES N° 01</span>
          </div>
          <div className="approche-texte" data-reveal>
            <span className="sur-titre">L’émotion rencontre la précision</span>
            <h2>Le coup de cœur.<br /><em>Les chiffres en plus.</em></h2>
            <p>Une adresse, une lumière, un volume. Tout commence par une envie. Rentimo vous aide à savoir si elle peut devenir un investissement qui a du sens.</p>
            <div className="approche-points">
              <div><span>01</span><div><h3>Un prix remis en perspective.</h3><p>Comparez votre bien aux ventes réelles de son secteur.</p></div></div>
              <div><span>02</span><div><h3>Une rentabilité sans angle mort.</h3><p>Crédit, charges, fiscalité : regardez ce qu’il reste vraiment.</p></div></div>
              <div><span>03</span><div><h3>Une décision qui vous ressemble.</h3><p>Ajustez vos hypothèses. Comparez. Avancez avec clarté.</p></div></div>
            </div>
            <Link className="lien-editorial" href="/methodologie">Découvrir notre méthode <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <div className="bande-mots" aria-hidden="true"><div className="mots-piste mouvement-continu">{[0, 1].map((n) => <span key={n}>Des lieux <i>à vivre.</i> <b><Eclat /></b> Des projets <i>à faire grandir.</i> <b><Eclat /></b> </span>)}</div></div>

      <section className="projection-section" id="projection">
        <div className="conteneur projection-grille">
          <div className="projection-texte" data-reveal>
            <span className="sur-titre">02 / Du possible au concret</span>
            <h2>Et si on parlait<br /><em>de votre projet ?</em></h2>
            <p>Quelques chiffres suffisent pour ouvrir le champ des possibles. Faites varier le prix et le loyer : votre première projection prend vie.</p>
            <div className="projection-signature"><span className="empreinte mouvement-continu" aria-hidden="true"><Eclat /></span><div>Votre intuition, éclairée.<br /><strong>Votre investissement, maîtrisé.</strong></div></div>
            <Link href="/simulateur" className="lien-editorial">Passer à l’étude complète <span aria-hidden="true">↗</span></Link>
            <div className="projection-reperes"><span>4 régimes fiscaux comparés</span><span>Projection avec revente</span><span>Rapport partageable</span></div>
          </div>
          <div data-reveal><ApercuSimulation /></div>
        </div>
        <svg className="plan-architecture" viewBox="0 0 700 500" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1"><path d="M50 450V50H590V450ZM50 260H360V50M360 450V320H590M210 260V450M50 80H590M620 50V450M50 20H590" /><path className="plan-trace mouvement-continu" pathLength="1" d="M50 450V50H590V450H50M210 450V260H360V50" strokeWidth="2" /><path d="M400 320A80 80 0 0 1 480 240V320M210 300A65 65 0 0 1 275 365H210" /><circle cx="470" cy="170" r="48" /><path d="M410 110H530V230H410ZM80 310H160V410H80ZM80 120H270V190H80" /></g></svg>
      </section>

      <section className="territoires-section conteneur">
        <div className="chapitre" data-reveal><span>03 / Chaque territoire a son potentiel</span><span>46°40′ N · 1°26′ O</span></div>
        <div className="section-intro" data-reveal><h2>Une adresse.<br /><em>De nouvelles perspectives.</em></h2><div><p>Le même projet, une autre ville, une autre équation. Explorez les marchés de Vendée à partir de ventes réellement enregistrées.</p><Link href="/marche" className="lien-editorial">Explorer les communes <span aria-hidden="true">↗</span></Link></div></div>
        <div className="territoires-cartes">
          {SECTEURS.map((s, i) => {
            const ex = exempleSecteur(s.cp);
            if (!ex) return null;
            return <Link className="territoire-carte" href={`/marche/${s.cp}`} key={s.cp} data-reveal>
              <div className="territoire-photo"><Image src={s.image} alt={s.alt} fill sizes="(max-width: 680px) 100vw, 33vw" /><span className="territoire-numero">0{i + 1}</span><span className="territoire-fleche" aria-hidden="true">↗</span><span className="territoire-cp">VENDÉE / {s.cp}</span></div>
              <div className="territoire-entete"><span>{s.esprit}</span><h3>{s.nom}</h3></div>
              <div className="territoire-chiffres"><div><span>Prix médian de référence</span><strong>{m2(ex.prixM2)}</strong></div><div><span>Rendement brut simulé</span><strong>{pct(ex.r.rendement_brut_pct)}</strong></div></div>
            </Link>;
          })}
        </div>
        <p className="territoires-note">Visuels d’ambiance, sans lien avec des biens à vendre. Exemples : T2 de 42 m² au prix médian DVF, loyer de marché charges comprises. Rendements indicatifs.</p>
      </section>

      <section className="renovation-editoriale">
        <div className="renovation-ambiance"><Image src="/images/maison-littorale.webp" alt="Maison côtière de caractère aux volets verts et jardin naturel" fill sizes="100vw" /></div>
        <div className="conteneur renovation-contenu" data-reveal><span className="sur-titre">Révéler ce qui ne se voit pas encore</span><h2>Les plus beaux projets<br />commencent parfois<br /><em>par un autre regard.</em></h2><p>Travaux, performance énergétique, valeur après rénovation : donnez une seconde lecture au potentiel d’un bien.</p><Link href="/renover" className="lien-plein lien-creme">Explorer le potentiel d’un bien <span aria-hidden="true">↗</span></Link></div>
        <span className="renovation-caption">LE POTENTIEL EST DÉJÀ LÀ.</span>
      </section>

      <section className="pro-editorial conteneur">
        <div className="pro-editorial-titre" data-reveal><span className="sur-titre">Rentimo pour les professionnels</span><h2>Votre expertise.<br /><em>Une longueur d’avance.</em></h2></div>
        <div className="pro-editorial-detail" data-reveal><p>Donnez à vos acquéreurs plus qu’une visite. Une vision chiffrée, un rapport à votre nom et les bons arguments pour faire avancer leur projet.</p><div className="pro-editorial-prix"><strong>{OFFRE.proMensuel} €<small>/ mois</small></strong><span>{OFFRE.essaiJours} jours d’essai<br />Sans carte bancaire</span></div><Link href="/pro" className="lien-plein">Découvrir Rentimo Pro <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section className="faq-editoriale conteneur">
        <div data-reveal><span className="sur-titre">Tout simplement</span><h2>Les bonnes<br /><em>questions.</em></h2><Link href="/methodologie" className="lien-editorial">En savoir plus <span aria-hidden="true">↗</span></Link></div>
        <div className="faq-editoriale-liste" data-reveal>{FAQ.map((f, i) => <details key={f.q}><summary><span className="faq-index">0{i + 1}</span><span>{f.q}</span><span className="faq-signe" aria-hidden="true">+</span></summary><p>{f.r}</p></details>)}</div>
      </section>
    </Experience>
  );
}
