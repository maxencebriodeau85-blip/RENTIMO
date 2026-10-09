"use client";

import { useEffect } from "react";

const borne = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lisse = (t: number) => t * t * (3 - 2 * t);

/**
 * Pilote la descente de l'accueil.
 * - Plongée : pendant que le haut de page reste fixé, la caméra avance vers une fenêtre
 *   allumée de l'immeuble (--q progression brute, --e progression adoucie).
 * - Bandes : chaque bande reçoit --p (position par rapport au centre de l'écran, de -1 à 1)
 *   et --focus (1 au centre, 0 hors champ) ; la classe « vu » déclenche ses animations une fois.
 * Avec le mouvement réduit, tout est affiché d'emblée, sans transformation.
 */
export function Focus() {
  useEffect(() => {
    const racine = document.querySelector<HTMLElement>("[data-descente]");
    if (!racine) return;
    const bandes = Array.from(document.querySelectorAll<HTMLElement>("[data-bande]"));
    const plongee = document.querySelector<HTMLElement>("[data-plongee]");
    const tour = document.querySelector<HTMLElement>("[data-tour]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      bandes.forEach((b) => {
        b.style.setProperty("--focus", "1");
        b.classList.add("vu");
      });
      return;
    }
    racine.classList.add("anim");

    // Déplacement qui amène la fenêtre visée au centre du cadre fixe.
    const cadrer = () => {
      if (!tour) return;
      const cadre = tour.parentElement;
      if (!cadre) return;
      const style = getComputedStyle(tour);
      const ox = parseFloat(style.getPropertyValue("--ox")) || 0.5;
      const oy = parseFloat(style.getPropertyValue("--oy")) || 0.5;
      const wx = tour.offsetLeft + ox * tour.offsetWidth;
      const wy = tour.offsetTop + oy * tour.offsetHeight;
      tour.style.setProperty("--dx", `${(cadre.clientWidth / 2 - wx).toFixed(1)}px`);
      tour.style.setProperty("--dy", `${(cadre.clientHeight / 2 - wy).toFixed(1)}px`);
    };

    let raf = 0;
    const maj = () => {
      raf = 0;
      const vh = window.innerHeight;
      if (plongee) {
        const r = plongee.getBoundingClientRect();
        const cadre = plongee.firstElementChild as HTMLElement | null;
        const hauteurCadre = cadre ? cadre.offsetHeight : vh;
        const haut = cadre ? parseFloat(getComputedStyle(cadre).top) || 0 : 0;
        const course = r.height - hauteurCadre;
        const q = course > 1 ? borne((haut - r.top) / course, 0, 1) : 0;
        plongee.style.setProperty("--q", q.toFixed(4));
        plongee.style.setProperty("--e", lisse(q).toFixed(4));
      }
      for (const b of bandes) {
        const r = b.getBoundingClientRect();
        if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
        const p = borne((r.top + r.height / 2 - vh / 2) / (vh * 0.8), -1, 1);
        const focus = lisse(borne(1 - Math.abs(p) * 1.15, 0, 1));
        b.style.setProperty("--p", p.toFixed(4));
        b.style.setProperty("--focus", focus.toFixed(4));
        if (focus > 0.45) b.classList.add("vu");
      }
    };
    const demander = () => {
      if (!raf) raf = requestAnimationFrame(maj);
    };
    const redimensionner = () => {
      cadrer();
      demander();
    };

    cadrer();
    maj();
    window.addEventListener("scroll", demander, { passive: true });
    window.addEventListener("resize", redimensionner);
    return () => {
      window.removeEventListener("scroll", demander);
      window.removeEventListener("resize", redimensionner);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
