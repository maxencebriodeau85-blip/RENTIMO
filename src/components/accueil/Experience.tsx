"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const Mouvement = createContext({ pause: false, reduit: false, basculer: () => {} });
export const useMouvement = () => useContext(Mouvement);

export function Experience({ children }: { children: React.ReactNode }) {
  const racine = useRef<HTMLDivElement>(null);
  const [pause, setPause] = useState(false);
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const suivre = () => setReduit(media.matches);
    suivre();
    media.addEventListener("change", suivre);
    return () => media.removeEventListener("change", suivre);
  }, []);

  useEffect(() => {
    const el = racine.current;
    if (!el || reduit || pause) return;
    const observateur = new IntersectionObserver((entrees) => {
      for (const entree of entrees) {
        if (entree.isIntersecting) {
          entree.target.classList.add("est-visible");
          observateur.unobserve(entree.target);
        }
      }
    }, { threshold: 0.12 });
    el.querySelectorAll("[data-reveal]").forEach((noeud) => observateur.observe(noeud));
    el.classList.add("experience-prete");
    return () => { observateur.disconnect(); el.classList.remove("experience-prete"); };
  }, [reduit, pause]);

  return (
    <Mouvement.Provider value={{ pause: pause || reduit, reduit, basculer: () => setPause((p) => !p) }}>
      <div ref={racine} className="experience" data-pause={pause || reduit}>{children}</div>
    </Mouvement.Provider>
  );
}
