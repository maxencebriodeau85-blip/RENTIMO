import Link from "next/link";
import "./accueil.css";
import { Focus } from "@/components/accueil/Focus";
import { Demonstration } from "@/components/accueil/Demonstration";
import { CarteVendee } from "@/components/accueil/CarteVendee";
import { Compteur } from "@/components/accueil/Compteur";
import { MARCHE } from "@/lib/marche";
import { exempleSecteur } from "@/lib/exemples";
import { euros, eurosSigne, m2, nombre, pct } from "@/lib/format";
import { OFFRE } from "@/lib/config";

const CARTES = [
  { cp: "85100", nom: "Les Sables-d'Olonne", vignette: "cote" },
  { cp: "85000", nom: "La Roche-sur-Yon", vignette: "ville" },
  { cp: "85110", nom: "Chantonnay", vignette: "bourg" },
] as const;

const FAQ = [
  {
    q: "Rentimo est-il vraiment gratuit ?",
    r: `Oui pour les particuliers : simulateur complet, comparaison des régimes, prix du secteur et ${OFFRE.gratuitSauvegardes} simulations sauvegardées. L'offre payante s'adresse aux professionnels qui veulent des rapports à leur nom.`,
  },
  {
    q: "D'où viennent les prix et les loyers ?",
    r: "Les prix au m² viennent des actes de vente publiés par l'État (base DVF, 2024 et 2025). Les loyers de marché viennent de la carte des loyers 2025 du ministère du Logement : loyers d'annonce, charges comprises.",
  },
  {
    q: "Les calculs fiscaux sont-ils fiables ?",
    r: "Ils appliquent les règles en vigueur pour les revenus 2025-2026 : abattements micro, amortissements LMNP, déficit foncier plafonné, plus-value avec abattements et réintégration des amortissements LMNP. Ce sont des estimations : pour décider, faites valider votre cas par un expert-comptable.",
  },
  {
    q: "Rentimo aide-t-il à trouver un bien à rénover ?",
    r: "Oui. L'analyse d'un bien à rénover estime les travaux pour gagner des classes DPE, la valeur une fois rénové, le déficit foncier et le prix d'achat à ne pas dépasser. Le radar des passoires, réservé à l'offre Pro, repère chaque jour les communes de Vendée où les DPE F et G se multiplient.",
  },
  {
    q: "Quelles villes sont couvertes ?",
    r: `Le simulateur fonctionne partout en France avec vos propres chiffres. Les prix du marché couvrent pour l'instant les ${MARCHE.codes_postaux.length} codes postaux de Vendée ; les départements voisins arrivent.`,
  },
  {
    q: "Que deviennent mes simulations ?",
    r: "Elles restent privées et sont hébergées en Europe (région de Paris). Elles ne sont visibles par personne d'autre, sauf si vous créez vous-même un lien de partage.",
  },
];

export default function Accueil() {
  const exemples = CARTES.map((c) => ({ ...c, ex: exempleSecteur(c.cp) })).filter((c) => c.ex);
  const sables = exemples.find((e) => e.cp === "85100")?.ex;

  return (
    <div className="accueil" data-descente>
      <Focus />

      <section className="plongee" data-plongee>
        <div className="plongee-cadre">
          <div className="plongee-tour" data-tour aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/visuels/tour-nuit.svg" alt="" />
          </div>
          <div className="plongee-voile" aria-hidden="true" />
          <div className="plongee-lueur" aria-hidden="true" />
          <div className="plongee-interieur" aria-hidden="true" />
          <div className="plongee-indice" aria-hidden="true" />
        <div className="conteneur hero-int plongee-texte">
          <h1 className="titre-xl">
            Investissement locatif,
            <br />
            en toute clarté.
          </h1>
          <p className="chapo hero-chapo">
            Rendement réel, cash-flow, fiscalité et prix du secteur : analysez un bien en deux minutes, à partir des
            ventes réelles qui l'entourent.
          </p>
          <div className="hero-actions">
            <Link href="/simulateur" className="btn btn-clair">
              Lancer une simulation <span className="fleche" aria-hidden="true">→</span>
            </Link>
            <Link href="/pro" className="btn-texte">
              Vous êtes agent ou courtier ?
            </Link>
          </div>
          <ul className="hero-faits">
            <li>
              <strong className="chiffre">{nombre(MARCHE.total_ventes)}</strong> ventes réelles analysées en Vendée
            </li>
            <li>
              <strong className="chiffre">{nombre(MARCHE.communes_loyers)}</strong> communes avec un loyer de marché
            </li>
            <li>
              <strong>Gratuit</strong>, sans carte bancaire
            </li>
          </ul>
        </div>
        </div>
      </section>

      <div className="conteneur bandes">
        <Demonstration />

        <section className="bande" data-bande>
          <div className="bande-texte">
            <h2 className="titre-l">Comparez plusieurs biens</h2>
            <p className="chapo">
              Le même T2 de 42 m², acheté au prix médian et loué meublé au loyer de marché, ne rapporte pas la même chose
              partout. Sur la côte, le prix monte bien plus vite que le loyer. Le score sur 100 résume rendement,
              cash-flow, prix et TRI.
            </p>
          </div>
          <div className="bande-scene scene-cartes">
            <div className="scene-fond" style={{ ["--image" as string]: "url(/visuels/scene-baie.svg)" }} aria-hidden="true" />
            <div className="cartes-biens">
              {exemples.map(({ cp, nom, vignette, ex }, i) => (
                <article key={cp} className="carte-bien" style={{ ["--i" as string]: i }}>
                  <div className="carte-image" style={{ backgroundImage: `url(/visuels/vignette-${vignette}.svg)` }}>
                    <span className="carte-score">
                      <Compteur valeur={ex!.score.total} />
                      <span className="discret">/100</span>
                    </span>
                  </div>
                  <div className="carte-corps">
                    <h3>{nom}</h3>
                    <p className="petit">T2 · 42 m² · {euros(ex!.prix)}</p>
                    <dl>
                      <div>
                        <dt>Rendement net</dt>
                        <dd className="chiffre">{pct(ex!.r.rendement_net_pct)}</dd>
                      </div>
                      <div>
                        <dt>Cash-flow</dt>
                        <dd className={`chiffre ${ex!.r.cashflow_mensuel >= 0 ? "positif" : "negatif"}`}>{eurosSigne(ex!.r.cashflow_mensuel)}/mois</dd>
                      </div>
                      <div>
                        <dt>Prix médian</dt>
                        <dd className="chiffre">{m2(ex!.prixM2)}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bande" data-bande>
          <div className="bande-texte">
            <h2 className="titre-l">Des chiffres qui viennent du terrain</h2>
            <p className="chapo">
              Chaque prix au m² vient des actes de vente enregistrés par l'État. Chaque loyer de marché, de la carte des
              loyers du ministère du Logement. Vous savez tout de suite si un prix se négocie.
            </p>
            <Link href="/marche" className="btn btn-contour" style={{ marginTop: 24 }}>
              Voir les prix par commune
            </Link>
          </div>
          <div className="bande-scene scene-carte">
            <div className="scene-fond" aria-hidden="true" />
            <CarteVendee />
            <div className="verre panneau panneau-donnees">
              <div className="tuile-valeur positif">
                <Compteur valeur={MARCHE.total_ventes} duree={1800} /> ventes réelles
              </div>
              <p className="petit" style={{ margin: "4px 0 0" }}>en Vendée, {MARCHE.periode} (DVF)</p>
              <span className="badge" style={{ marginTop: 12 }}>
                Données publiques de l'État
              </span>
            </div>
          </div>
        </section>

        <section className="bande" data-bande>
          <div className="bande-texte">
            <h2 className="titre-l">Un rapport prêt pour votre banquier</h2>
            <p className="chapo">
              Hypothèses, plan de financement, fiscalité, projection sur vingt ans : imprimez le rapport ou envoyez un lien
              en lecture seule. Votre interlocuteur voit exactement ce que vous voyez.
            </p>
          </div>
          <div className="bande-scene scene-rapport">
            <div className="scene-fond" style={{ ["--image" as string]: "url(/visuels/scene-table.svg)" }} aria-hidden="true" />
            <div className="pile" aria-hidden="true">
              <div className="feuille f3" />
              <div className="feuille f2" />
              <div className="feuille f1">
                <div className="feuille-tete">
                  <span>Rentimo</span>
                  <span>Rapport de simulation</span>
                </div>
                <div className="feuille-titre">T2 meublé · Les Sables-d'Olonne</div>
                <div className="feuille-kpi">
                  <div><span>Rendement net</span><b>{pct(sables?.r.rendement_net_pct)}</b></div>
                  <div><span>Cash-flow</span><b>{eurosSigne(sables?.r.cashflow_mensuel ?? 0)}</b></div>
                  <div><span>TRI 20 ans</span><b>{pct(sables?.r.tri_pct)}</b></div>
                </div>
                <svg viewBox="0 0 200 60" className="feuille-courbe">
                  <path className="trace" pathLength={1} d="M0,52 L20,50 L40,47 L60,43 L80,39 L100,34 L120,28 L140,22 L160,16 L180,10 L200,4" fill="none" stroke="#2f7d5f" strokeWidth="1.6" />
                  <polyline points="0,40 20,41 40,42 60,43 80,44 100,44 120,45 140,45 160,46 180,46 200,46" fill="none" stroke="#b0b8c2" strokeWidth="1.2" strokeDasharray="4 3" />
                </svg>
                <div className="feuille-lignes">
                  <i /><i /><i /><i style={{ width: "60%" }} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="conteneur pro-bandeau">
        <div className="pro-texte">
          <h2 className="titre-l">Agents, mandataires, courtiers : l'étude de rentabilité à votre nom.</h2>
          <p className="chapo">
            Vos acquéreurs investisseurs veulent des chiffres avant de visiter. Envoyez-leur en deux minutes une étude
            complète, avec vos coordonnées et les prix réels du secteur.
          </p>
        </div>
        <ul className="pro-liste">
          <li>Rapport PDF à votre nom, sans logo Rentimo</li>
          <li>Page de partage avec votre contact pour l'acquéreur</li>
          <li>Prix DVF du secteur pour défendre un prix de vente</li>
          <li>Radar des passoires : où les DPE F et G arrivent sur le marché</li>
          <li>Simulations illimitées et sauvegardées</li>
        </ul>
        <div className="pro-action">
          <p className="titre-m">
            <span className="chiffre">{OFFRE.proMensuel} €</span> par mois
          </p>
          <p className="petit">Sans engagement. {OFFRE.essaiJours} jours d'essai gratuit, sans carte.</p>
          <Link href="/pro" className="btn btn-clair">
            Découvrir l'offre pro <span className="fleche" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="conteneur faq">
        <h2 className="titre-l">Questions fréquentes</h2>
        <div className="faq-liste">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="conteneur final">
        <h2 className="titre-xl">Faites le calcul avant de faire une offre.</h2>
        <Link href="/simulateur" className="btn btn-clair">
          Lancer une simulation <span className="fleche" aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
