import type { Metadata } from "next";
import { EDITEUR } from "@/lib/config";
import { PHOTOS } from "@/lib/photos";

export const metadata: Metadata = { title: "Mentions légales" };

const aCompleter = <em className="discret">en cours de renseignement</em>;

export default function MentionsLegales() {
  return (
    <div className="page conteneur">
      <div className="page-titre">
        <h1 className="titre-l">Mentions légales</h1>
      </div>
      <div className="prose">
        <h2>Éditeur</h2>
        <p>
          {EDITEUR.nom}, {EDITEUR.statut}.<br />
          SIRET : {EDITEUR.siret || aCompleter}<br />
          Adresse : {EDITEUR.adresse || aCompleter}<br />
          Contact : {EDITEUR.email ? <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a> : aCompleter}
          {EDITEUR.telephone ? <> · {EDITEUR.telephone}</> : null}
          <br />
          Directeur de la publication : {EDITEUR.nom}.
          {EDITEUR.tvaFranchise ? <><br />TVA non applicable, article 293 B du CGI.</> : null}
        </p>
        <h2>Hébergement</h2>
        <p>
          Site : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis.<br />
          Données des comptes : Supabase, hébergement dans la région Europe (Paris).
        </p>
        <h2>Données publiques</h2>
        <p>
          Les prix de vente proviennent de la base « Demandes de valeurs foncières » publiée par la DGFiP sous licence ouverte. Les loyers
          proviennent de la carte des loyers publiée par le ministère chargé du Logement, sous licence ouverte. Les diagnostics de performance énergétique proviennent de la base « DPE logements existants » de
          l'ADEME, sous licence ouverte.
        </p>
        <h2>Crédits photos</h2>
        <p>
          Photographies publiées sur Unsplash, sous licence Unsplash. Celles des Sables-d'Olonne ont été prises sur place ; les autres
          illustrent un type de logement ou de commune.
        </p>
        <ul>
          {Object.entries(PHOTOS).map(([nom, p]) => (
            <li key={nom}>
              <a href={p.page} rel="noopener">
                {p.lieu ? `${p.lieu}` : "Photo"}
              </a>{" "}
              par <a href={p.profil} rel="noopener">{p.auteur}</a>
            </li>
          ))}
        </ul>
        <p>
          Les visuels d’ambiance de la nouvelle page d’accueil sont des illustrations photoréalistes originales générées avec OpenAI.
          Ils représentent des lieux imaginaires et ne correspondent pas à des biens proposés à la vente ou à la location.
        </p>
        <h2>Responsabilité</h2>
        <p>
          Les simulations sont des estimations fondées sur les hypothèses saisies et sur une lecture simplifiée des règles fiscales. Elles ne
          constituent ni un conseil en investissement financier, ni un conseil fiscal ou juridique.
        </p>
      </div>
    </div>
  );
}
