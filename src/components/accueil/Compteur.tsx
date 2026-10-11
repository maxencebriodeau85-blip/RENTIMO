"use client";

import { useEffect, useRef, useState } from "react";
import { euros, eurosSigne, nombre, pct } from "@/lib/format";
import { useMouvement } from "./Experience";

const FORMATS = {
  nombre: (v: number) => nombre(Math.round(v)),
  pct: (v: number) => pct(v),
  euros: (v: number) => euros(v),
  eurosSigne: (v: number) => eurosSigne(v),
};

export type FormatCompteur = keyof typeof FORMATS;

const doux = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Chiffre qui se déroule jusqu'à sa valeur la première fois qu'il entre à l'écran,
 * puis glisse vers la nouvelle valeur à chaque changement. Sans JavaScript, ou avec
 * le mouvement réduit, la valeur s'affiche telle quelle.
 */
export function Compteur({ valeur, format = "nombre", duree = 1200 }: { valeur: number | null; format?: FormatCompteur; duree?: number }) {
  const { pause } = useMouvement();
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  const ref = useRef<HTMLSpanElement>(null);
  const cible = useRef(valeur);
  const affiche = useRef<number | null>(valeur);
  const pret = useRef(false);
  const raf = useRef(0);
  const [, rendre] = useState(0);
  cible.current = valeur;

  const animer = (de: number, vers: number, ms: number) => {
    cancelAnimationFrame(raf.current);
    if (pauseRef.current) {
      affiche.current = vers;
      rendre((n) => n + 1);
      return;
    }
    const t0 = performance.now();
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      affiche.current = de + (vers - de) * doux(k);
      rendre((n) => n + 1);
      if (k < 1) raf.current = requestAnimationFrame(pas);
    };
    raf.current = requestAnimationFrame(pas);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pret.current = true;
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      pret.current = true;
      return;
    }
    affiche.current = 0;
    rendre((n) => n + 1);
    const io = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((e) => e.isIntersecting)) return;
        io.disconnect();
        pret.current = true;
        if (cible.current !== null) animer(0, cible.current, duree);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pause) {
      cancelAnimationFrame(raf.current);
      affiche.current = valeur;
      rendre((n) => n + 1);
      return;
    }
    if (valeur === null) {
      affiche.current = null;
      return;
    }
    if (!pret.current) return;
    const de = affiche.current ?? valeur;
    if (de !== valeur) animer(de, valeur, 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeur, pause]);

  const v = valeur === null ? null : affiche.current ?? valeur;
  return (
    <span ref={ref} className="chiffre">
      {v === null ? "—" : FORMATS[format](v)}
    </span>
  );
}
