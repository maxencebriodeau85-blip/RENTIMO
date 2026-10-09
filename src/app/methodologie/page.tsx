import type { Metadata } from "next";
import Link from "next/link";
import { FISCAL } from "@/lib/calculs";

export const metadata: Metadata = {
  title: "Méthode de calcul",
  description: "Formules, hypothèses fiscales et sources de données utilisées par le simulateur Rentimo.",
};

const p = (x: number) => `${(x * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export default function PageMethodologie() {
  return (
    <div className="page conteneur">
      <div className="page-titre">
        <h1 className="titre-l">Méthode de calcul</h1>
        <p className="chapo">Ce que Rentimo calcule, comment, et ce qu'il ne calcule pas. Règles applicables aux revenus 2025-2026.</p>
      </div>
      <div className="prose">
        <h2>Rendements</h2>
        <p>
          <strong>Rendement brut</strong> : loyer annuel hors charges divisé par le prix d'achat, la convention des annonces.{" "}
          <strong>Rendement net</strong> : loyers réellement encaissés (après vacance) moins les charges d'exploitation, divisés par le
          coût d'acquisition (prix, notaire, travaux, mobilier). <strong>Net-net</strong> : idem, après l'impôt de la première année.
        </p>
        <p>
          <strong>Cash-flow</strong> : loyers encaissés moins charges, mensualité de crédit (intérêts et capital), assurance emprunteur et
          impôt. <strong>TRI</strong> : taux de rendement interne de votre apport, en tenant compte des cash-flows de chaque année et du
          produit net de la revente (prix revalorisé, frais de vente, capital restant dû et impôt sur la plus-value).
        </p>

        <h2>Frais et crédit</h2>
        <p>
          Frais de notaire estimés à {p(FISCAL.notaire_ancien)} du prix dans l'ancien et {p(FISCAL.notaire_neuf)} dans le neuf, modifiables.
          Crédit amortissable à mensualités constantes, calculé mois par mois. Assurance emprunteur sur le capital initial.
        </p>

        <h2>Fiscalité</h2>
        <h3>LMNP micro-BIC</h3>
        <p>
          Abattement de {p(FISCAL.micro_bic_abattement)} sur les loyers (meublé de longue durée), dans la limite de{" "}
          {FISCAL.micro_bic_plafond.toLocaleString("fr-FR")} € de recettes. Le reste est imposé à votre tranche marginale, plus{" "}
          {p(FISCAL.ps_lmnp)} de prélèvements sociaux.
        </p>
        <h3>LMNP réel</h3>
        <p>
          Charges réelles déduites (frais de notaire et de dossier passés en charges la première année, intérêts, assurance, charges
          d'exploitation). Amortissement du bâti hors terrain ({p(FISCAL.part_terrain.Appartement)} de terrain pour un appartement,{" "}
          {p(FISCAL.part_terrain.Maison)} pour une maison) sur {FISCAL.duree_amort_bati} ans, des travaux sur {FISCAL.duree_amort_travaux} ans, du
          mobilier sur {FISCAL.duree_amort_mobilier} ans. L'amortissement ne crée pas de déficit : l'excédent est reporté sans limite. Les
          déficits de charges se reportent dix ans.
        </p>
        <h3>Location nue</h3>
        <p>
          Micro-foncier : abattement de {p(FISCAL.micro_foncier_abattement)} jusqu'à {FISCAL.micro_foncier_plafond.toLocaleString("fr-FR")} € de
          loyers. Réel : charges, travaux et intérêts déduits ; le déficit hors intérêts s'impute sur le revenu global dans la limite de{" "}
          {FISCAL.deficit_foncier_plafond.toLocaleString("fr-FR")} € par an, le reste se reporte dix ans sur les revenus fonciers.
          Prélèvements sociaux : {p(FISCAL.ps_foncier)}.
        </p>
        <h3>Plus-value à la revente</h3>
        <p>
          Régime des particuliers : {p(FISCAL.ir_plus_value)} d'impôt et {p(FISCAL.ps_plus_value)} de prélèvements sociaux, avec abattements pour
          durée de détention (exonération d'impôt après 22 ans, de prélèvements sociaux après 30 ans). Majorations forfaitaires de 7,5 % pour
          frais d'acquisition et de 15 % pour travaux au-delà de cinq ans. En LMNP réel, les amortissements déduits sont réintégrés dans le
          calcul, comme le prévoit la loi de finances pour 2025. La surtaxe sur les plus-values de plus de 50 000 € n'est pas calculée.
        </p>

        <h2 id="score">Score sur 100</h2>
        <p>Quatre critères, notés de façon linéaire entre deux bornes :</p>
        <ul>
          <li><strong>Rendement net</strong> (30 points) : 0 à 2 %, maximum à 6 %.</li>
          <li><strong>Cash-flow mensuel après impôt</strong> (25 points) : 0 à −300 €, maximum à +150 €.</li>
          <li><strong>Prix face au marché</strong> (20 points) : 0 à 125 % de la médiane DVF du secteur, maximum à 85 %. Sans donnée de marché : 10 points.</li>
          <li><strong>TRI avec revente</strong> (25 points) : 0 à 0 %, maximum à 10 %.</li>
        </ul>
        <p>75 et plus : très bon. 60 à 74 : bon. 45 à 59 : moyen. En dessous : fragile.</p>

        <h2>Données</h2>
        <p>
          <strong>Prix</strong> : demandes de valeurs foncières (DVF) publiées par la DGFiP, ventes de logements de janvier 2024 à décembre 2025 en
          Vendée, prix au m² compris entre 300 € et 25 000 €. <strong>Loyers</strong> : carte des loyers 2025 du ministère du Logement, loyers
          d'annonce charges comprises de logements non meublés, rattachés aux codes postaux au prorata des ventes.
        </p>

        <h2>Limites</h2>
        <p>
          Rentimo ne calcule pas : la CFE, le statut LMP, les dispositifs de défiscalisation (Pinel, Denormandie, Loc'Avantages), la location
          saisonnière, la détention en SCI, l'IFI. Les résultats sont des estimations qui dépendent de vos hypothèses ; ils ne constituent ni
          un conseil en investissement ni un conseil fiscal. Pour décider, faites valider votre situation par un professionnel.
        </p>
        <p>
          <Link href="/simulateur">Retour au simulateur</Link>
        </p>
      </div>
    </div>
  );
}
