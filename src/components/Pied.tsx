import Link from "next/link";
import { Marque } from "./Logo";
import { MARCHE } from "@/lib/marche";

export function Pied() {
  return (
    <footer className="pied">
      <div className="conteneur">
        <div className="pied-grille">
          <div>
            <Link href="/" className="logo" style={{ color: "var(--texte)" }}>
              <Marque />
              Rentimo
            </Link>
            <p style={{ maxWidth: "34ch", marginTop: 14 }}>
              Simulateur de rentabilité locative appuyé sur les ventes réelles DVF et la carte des loyers.
              Conçu en Vendée.
            </p>
          </div>
          <div>
            <h4>Outils</h4>
            <ul>
              <li><Link href="/simulateur">Simulateur</Link></li>
              <li><Link href="/marche">Prix du marché</Link></li>
              <li><Link href="/methodologie">Méthode de calcul</Link></li>
            </ul>
          </div>
          <div>
            <h4>Offre</h4>
            <ul>
              <li><Link href="/pro">Pour les pros</Link></li>
              <li><Link href="/tarifs">Tarifs</Link></li>
              <li><Link href="/connexion">Connexion</Link></li>
            </ul>
          </div>
          <div>
            <h4>Légal</h4>
            <ul>
              <li><Link href="/mentions-legales">Mentions légales</Link></li>
              <li><Link href="/cgv">CGV</Link></li>
              <li><Link href="/confidentialite">Confidentialité</Link></li>
            </ul>
          </div>
        </div>
        <div className="pied-bas">
          <span>© {new Date().getFullYear()} Rentimo</span>
          <span>
            Données : DVF (DGFiP), {MARCHE.periode} ; carte des loyers 2025. Résultats indicatifs, pas un conseil en investissement.
          </span>
        </div>
      </div>
    </footer>
  );
}
