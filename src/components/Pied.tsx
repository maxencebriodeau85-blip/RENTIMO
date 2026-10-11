import Link from "next/link";
import { Marque } from "./Logo";
import { MARCHE } from "@/lib/marche";
import "./site-chrome.css";

export function Pied() {
  return (
    <footer className="rt-footer">
      <div className="rt-shell">
        <div className="rt-footer__intro">
          <div>
            <span className="rt-footer__eyebrow"><span /> Voir plus loin que les murs.</span>
            <h2>Votre prochain chapitre<br />commence par un bien.</h2>
          </div>
          <Link href="/simulateur" className="rt-footer__project">Explorer mon projet <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
        </div>
        <div className="rt-footer__grid">
          <div className="rt-footer__about">
            <Link href="/" className="rt-brand" aria-label="Rentimo, accueil"><Marque taille={26} /><span>rentimo.</span></Link>
            <p>Des adresses réelles. Des chiffres clairs.<br />Pour avancer dans votre projet locatif.</p>
            <span className="rt-footer__origin">Pensé et conçu en Vendée.</span>
          </div>
          <div>
            <h3>Explorer</h3>
            <ul>
              <li><Link href="/simulateur">Simulateur</Link></li>
              <li><Link href="/marche">Prix du marché</Link></li>
              <li><Link href="/renover">Biens à rénover</Link></li>
              <li><Link href="/methodologie">Méthode de calcul</Link></li>
            </ul>
          </div>
          <div>
            <h3>Aller plus loin</h3>
            <ul>
              <li><Link href="/pro">Pour les professionnels</Link></li>
              <li><Link href="/radar">Radar des passoires</Link></li>
              <li><Link href="/tarifs">Nos tarifs</Link></li>
              <li><Link href="/connexion">Mon compte</Link></li>
            </ul>
          </div>
          <div>
            <h3>En confiance</h3>
            <ul>
              <li><Link href="/mentions-legales">Mentions légales</Link></li>
              <li><Link href="/cgv">Conditions de vente</Link></li>
              <li><Link href="/confidentialite">Confidentialité</Link></li>
            </ul>
          </div>
        </div>
        <div className="rt-footer__wordmark" aria-hidden="true">rentimo<span>.</span></div>
        <div className="rt-footer__bottom">
          <span>© {new Date().getFullYear()} Rentimo</span>
          <p>Données : DVF (DGFiP), {MARCHE.periode} ; carte des loyers 2025.<br />Résultats indicatifs, pas un conseil en investissement.</p>
          <a href="#contenu" className="rt-footer__top">Haut de page <span aria-hidden="true">↑</span></a>
        </div>
      </div>
    </footer>
  );
}
