import type { Metadata } from "next";
import { MARCHE, SEUIL_FIABILITE, evolution, rendementSecteur } from "@/lib/marche";
import { nombre } from "@/lib/format";
import { TableMarche, type LigneMarche } from "./TableMarche";
import { FormulaireContact } from "@/components/FormulaireContact";
import "./marche.css";

export const metadata: Metadata = {
  title: "Prix immobilier et rentabilité locative en Vendée, commune par commune",
  description: `Prix médian au m², loyers de marché et rendement brut indicatif pour ${MARCHE.codes_postaux.length} codes postaux de Vendée, d'après ${nombre(MARCHE.total_ventes)} ventes réelles DVF 2024-2025.`,
};

export default function PageMarche() {
  const lignes: LigneMarche[] = MARCHE.codes_postaux.map((c) => {
    const typeRef = c.A && c.A.n >= c.n / 2 ? "Appartement" : "Maison";
    return {
      c,
      prixA: c.A && c.A.n >= SEUIL_FIABILITE ? c.A.med : null,
      prixM: c.M && c.M.n >= SEUIL_FIABILITE ? c.M.med : null,
      evolution: evolution(c),
      rendement: rendementSecteur(c, typeRef),
    };
  });

  return (
    <div className="page conteneur">
      <div className="page-titre">
        <h1 className="titre-l">Prix du marché en Vendée</h1>
        <p className="chapo">
          {nombre(MARCHE.total_ventes)} ventes réelles de logements entre janvier 2024 et décembre 2025, et les loyers de marché de la carte
          des loyers 2025. Cliquez sur une commune pour le détail et un exemple chiffré.
        </p>
      </div>

      <TableMarche lignes={lignes} />

      <div className="marche-notes">
        <p className="aide">
          Prix médian : la moitié des ventes s'est faite au-dessus, l'autre en dessous. Médianes par type affichées à partir de {SEUIL_FIABILITE} ventes.
          Loyer : loyer d'annonce charges comprises d'un appartement, carte des loyers 2025 (ministère du Logement). Rendement brut indicatif :
          loyer de marché sur douze mois divisé par le prix médian du type de bien dominant. Source des ventes : DVF, DGFiP.
        </p>
      </div>

      <section className="barometre verre">
        <div>
          <h2 className="titre-m">Le baromètre trimestriel de la rentabilité en Vendée</h2>
          <p className="petit" style={{ margin: "8px 0 0" }}>
            Où le rendement monte, où il baisse, quelles communes décrochent. Un e-mail par trimestre, rien d'autre.
          </p>
        </div>
        <FormulaireContact type="barometre" bouton="Recevoir le baromètre" champsPro={false} succes="Inscription enregistrée. Prochain baromètre en début de trimestre." />
      </section>
    </div>
  );
}
