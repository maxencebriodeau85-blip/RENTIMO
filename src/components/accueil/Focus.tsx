"use client";

import { useEffect } from "react";

/** Éclaire la bande la plus proche du centre de l'écran, assombrit les autres (effet « descente »). */
export function Focus() {
  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bandes = Array.from(document.querySelectorAll<HTMLElement>("[data-bande]"));
    if (reduit || !bandes.length) {
      bandes.forEach((b) => b.style.setProperty("--focus", "1"));
      return;
    }
    let raf = 0;
    const maj = () => {
      raf = 0;
      const centre = window.innerHeight / 2;
      for (const b of bandes) {
        const r = b.getBoundingClientRect();
        const milieu = r.top + r.height / 2;
        const d = Math.abs(milieu - centre) / (window.innerHeight * 0.75);
        const focus = Math.max(0, Math.min(1, 1 - d));
        b.style.setProperty("--focus", focus.toFixed(3));
      }
      const fond = document.querySelector<HTMLElement>("[data-descente]");
      if (fond) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        fond.style.setProperty("--descente", String(max > 0 ? window.scrollY / max : 0));
      }
    };
    const demander = () => {
      if (!raf) raf = requestAnimationFrame(maj);
    };
    maj();
    window.addEventListener("scroll", demander, { passive: true });
    window.addEventListener("resize", demander);
    return () => {
      window.removeEventListener("scroll", demander);
      window.removeEventListener("resize", demander);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
