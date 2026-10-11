"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Marque } from "./Logo";
import { supabase } from "@/lib/supabase";
import "./site-chrome.css";

const LIENS = [
  { href: "/simulateur", label: "Simulateur" },
  { href: "/marche", label: "Le marché" },
  { href: "/renover", label: "À rénover" },
  { href: "/pro", label: "Professionnels" },
  { href: "/tarifs", label: "Tarifs" },
];

function Fleche() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function Entete() {
  const chemin = usePathname();
  const [connecte, setConnecte] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [defile, setDefile] = useState(false);
  const entete = useRef<HTMLElement>(null);
  const menu = useRef<HTMLElement>(null);
  const boutonMenu = useRef<HTMLButtonElement>(null);

  const fermerMenu = useCallback((rendreFocus = false) => {
    setMenuOuvert(false);
    if (rendreFocus) boutonMenu.current?.focus();
  }, []);

  useEffect(() => {
    let actif = true;
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => {
      if (actif) setConnecte(Boolean(data.session));
    }).catch(() => {});
    const { data } = sb.auth.onAuthStateChange((_e, s) => setConnecte(Boolean(s)));
    return () => {
      actif = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => { setMenuOuvert(false); }, [chemin]);

  useEffect(() => {
    const suivreDefilement = () => setDefile(window.scrollY > 20);
    suivreDefilement();
    window.addEventListener("scroll", suivreDefilement, { passive: true });
    const ecranLarge = window.matchMedia("(min-width: 1120px)");
    const adapterMenu = () => { if (ecranLarge.matches) setMenuOuvert(false); };
    ecranLarge.addEventListener("change", adapterMenu);
    return () => {
      window.removeEventListener("scroll", suivreDefilement);
      ecranLarge.removeEventListener("change", adapterMenu);
    };
  }, []);

  useEffect(() => {
    if (!menuOuvert) return;

    const debordement = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menu.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    const auClavier = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        fermerMenu(true);
      }
      if (event.key === "Tab") {
        const liens = Array.from(menu.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
        const controles = [boutonMenu.current, ...liens].filter((element): element is HTMLButtonElement | HTMLAnchorElement => Boolean(element));
        const premier = controles[0];
        const dernier = controles[controles.length - 1];
        if (event.shiftKey && document.activeElement === premier) {
          event.preventDefault();
          dernier?.focus();
        } else if (!event.shiftKey && document.activeElement === dernier) {
          event.preventDefault();
          premier?.focus();
        }
      }
    };
    const auClicExterieur = (event: PointerEvent) => {
      if (event.target instanceof Node && !entete.current?.contains(event.target)) fermerMenu(true);
    };

    document.addEventListener("keydown", auClavier);
    document.addEventListener("pointerdown", auClicExterieur);
    return () => {
      document.body.style.overflow = debordement;
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("pointerdown", auClicExterieur);
    };
  }, [menuOuvert, fermerMenu]);

  const compte = { href: connecte ? "/dashboard" : "/connexion", label: connecte ? "Mon espace" : "Connexion" };

  return (
    <>
      <header ref={entete} className={`rt-header${defile ? " rt-header--scrolled" : ""}${menuOuvert ? " rt-header--open" : ""}`}>
        <div className="rt-shell rt-header__inner">
          <Link href="/" className="rt-brand" aria-label="Rentimo, accueil" onClick={() => fermerMenu()}>
            <Marque taille={29} />
            <span>rentimo<span className="rt-brand__dot">.</span></span>
          </Link>
          <nav className="rt-desktop-nav" aria-label="Navigation principale">
            {LIENS.map((lien) => (
              <Link key={lien.href} href={lien.href} aria-current={chemin?.startsWith(lien.href) ? "page" : undefined}>{lien.label}</Link>
            ))}
          </nav>
          <div className="rt-header__actions">
            <Link href={compte.href} className="rt-account">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5 20v-1.5a7 7 0 0 1 14 0V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              {compte.label}
            </Link>
            <Link href="/simulateur" className="rt-header__cta">Simuler un bien <Fleche /></Link>
          </div>
          <button ref={boutonMenu} className="rt-menu-button" type="button" aria-expanded={menuOuvert} aria-controls="rt-mobile-navigation" aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenuOuvert((ouvert) => !ouvert)}>
            <span aria-hidden="true" /><span aria-hidden="true" />
          </button>
        </div>
        <nav ref={menu} id="rt-mobile-navigation" className="rt-mobile-nav" aria-label="Navigation mobile" hidden={!menuOuvert}>
          <div className="rt-shell">
            <span className="rt-mobile-nav__eyebrow">Votre prochain projet commence ici</span>
            {LIENS.map((lien, index) => (
              <Link key={lien.href} href={lien.href} aria-current={chemin?.startsWith(lien.href) ? "page" : undefined} onClick={() => fermerMenu()}>
                <span className="rt-mobile-nav__number">0{index + 1}</span><span>{lien.label}</span><Fleche />
              </Link>
            ))}
            <div className="rt-mobile-nav__bottom">
              <Link href={compte.href} className="rt-mobile-nav__account" onClick={() => fermerMenu()}>{compte.label}</Link>
              <Link href="/simulateur" className="rt-header__cta" onClick={() => fermerMenu()}>Simuler un bien <Fleche /></Link>
            </div>
          </div>
        </nav>
      </header>
      {menuOuvert && <div className="rt-menu-backdrop" aria-hidden="true" />}
    </>
  );
}
