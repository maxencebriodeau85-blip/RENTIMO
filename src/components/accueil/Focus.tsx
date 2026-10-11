"use client";

import { useEffect } from "react";

const borne = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lisse = (t: number) => t * t * (3 - 2 * t);
const segment = (v: number, a: number, b: number) => borne((v - a) / (b - a), 0, 1);

/**
 * Chaque couche de la plongée : agrandissement, part du chemin vers le centre du cadre (k),
 * opacité et flou, en fonction de la progression adoucie e (0 → 1).
 * 1. Le Remblai des Sables la nuit : on avance vers les immeubles éclairés.
 * 2. Une façade éclairée apparaît, floue puis nette : on entre dans une fenêtre.
 * 3. Le salon : la caméra recule légèrement, comme quand on passe la porte.
 */
const COUCHES = [
  (e: number) => ({ s: Math.pow(3, segment(e, 0, 0.46)), k: segment(e, 0, 0.46), o: 1, flou: 7 * segment(e, 0.34, 0.5) }),
  (e: number) => ({
    s: 1.12 * Math.pow(3.4, segment(e, 0.38, 0.9)),
    k: 1,
    o: segment(e, 0.36, 0.5),
    flou: 6 * (1 - segment(e, 0.36, 0.5)) + 7 * segment(e, 0.8, 0.92),
  }),
  (e: number) => ({ s: 1.28 - 0.28 * segment(e, 0.8, 1), k: 0, o: segment(e, 0.8, 0.94), flou: 5 * (1 - segment(e, 0.8, 0.94)) }),
];

/**
 * Pilote la descente de l'accueil.
 * - Plongée : pendant que le haut de page reste fixé, la caméra traverse trois photos
 *   (--q progression brute, --e progression adoucie sur .plongee).
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
    const couches = plongee ? Array.from(plongee.querySelectorAll<HTMLImageElement>("img[data-couche]")) : [];
    const lueur = plongee?.querySelector<HTMLElement>("[data-lueur]") ?? null;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      bandes.forEach((b) => {
        b.style.setProperty("--focus", "1");
        b.classList.add("vu");
      });
      return;
    }
    racine.classList.add("anim");
    const petitEcran = window.matchMedia("(max-width: 900px)");

    // Place une couche : la photo entière, dimensionnée pour couvrir le cadre, est agrandie autour
    // de son point focal, qui glisse vers le centre sans jamais découvrir le bord du cadre.
    const placer = (img: HTMLImageElement, s: number, k: number, o: number, flou: number) => {
      const cadre = img.parentElement?.closest<HTMLElement>(".plongee-couches");
      const W = cadre?.clientWidth ?? 0;
      const H = cadre?.clientHeight ?? 0;
      const iw = Number(img.getAttribute("width")) || W;
      const ih = Number(img.getAttribute("height")) || H;
      if (!W || !H) return;
      const c = Math.max(W / iw, H / ih);
      const dW = iw * c;
      const dH = ih * c;
      const x0 = (W - dW) / 2;
      const y0 = (H - dH) / 2;
      const ox = (Number(img.dataset.fx) || 0.5) * dW;
      const oy = (Number(img.dataset.fy) || 0.5) * dH;
      const tx = borne((W / 2 - x0 - ox) * k, W - x0 - ox - s * (dW - ox), -x0 + ox * (s - 1));
      const ty = borne((H / 2 - y0 - oy) * k, H - y0 - oy - s * (dH - oy), -y0 + oy * (s - 1));
      img.style.left = `${x0.toFixed(1)}px`;
      img.style.top = `${y0.toFixed(1)}px`;
      img.style.width = `${dW.toFixed(1)}px`;
      img.style.height = `${dH.toFixed(1)}px`;
      img.style.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
      img.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
      img.style.opacity = o.toFixed(3);
      img.style.visibility = o > 0.001 ? "visible" : "hidden";
      img.style.filter = !petitEcran.matches && flou > 0.15 ? `blur(${flou.toFixed(1)}px)` : "none";
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
        const e = lisse(q);
        plongee.style.setProperty("--q", q.toFixed(4));
        plongee.style.setProperty("--e", e.toFixed(4));
        if (r.bottom > 0) {
          const etats = COUCHES.map((f) => f(e));
          couches.forEach((img, i) => {
            const v = etats[i];
            if (!v) return;
            // Une couche entièrement recouverte par la suivante n'est plus dessinée.
            const cachee = etats[i + 1] && etats[i + 1].o >= 1 && etats[i + 1].flou < 0.15;
            placer(img, v.s, v.k, cachee ? 0 : v.o, v.flou);
          });
          if (lueur) {
            const l = segment(e, 0.66, 0.8) * (1 - segment(e, 0.86, 0.98));
            lueur.style.opacity = l.toFixed(3);
            lueur.style.transform = `scale(${(0.6 + segment(e, 0.6, 0.95) * 1.2).toFixed(3)})`;
          }
        }
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

    maj();
    couches.forEach((img) => img.addEventListener("load", demander));
    window.addEventListener("scroll", demander, { passive: true });
    window.addEventListener("resize", demander);
    return () => {
      couches.forEach((img) => img.removeEventListener("load", demander));
      window.removeEventListener("scroll", demander);
      window.removeEventListener("resize", demander);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
