"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMouvement } from "./Experience";
import { Eclat } from "./Eclat";

const SCENES = [
  { image: "/images/villa-atlantique.webp", alt: "Villa contemporaine en pierre claire, baies vitrées et jardin à l’heure dorée", titre: "Voir le potentiel" },
  { image: "/images/interieur-lumiere.webp", alt: "Appartement lumineux aux matières naturelles et aux grandes ouvertures", titre: "Se projeter" },
  { image: "/images/maison-littorale.webp", alt: "Maison de caractère sur la côte, entre jardin et lumière atlantique", titre: "Choisir avec clarté" },
];

export function HeroImmobilier() {
  const [scene, setScene] = useState(0);
  const [visible, setVisible] = useState(true);
  const [ongletVisible, setOngletVisible] = useState(true);
  const { pause, reduit, basculer } = useMouvement();
  const cadre = useRef<HTMLElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    const suivre = () => setOngletVisible(!document.hidden);
    document.addEventListener("visibilitychange", suivre);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", suivre); cancelAnimationFrame(frame.current); };
  }, []);

  useEffect(() => {
    if (pause || !visible || !ongletVisible) return;
    const timer = window.setInterval(() => setScene((s) => (s + 1) % SCENES.length), 8500);
    return () => window.clearInterval(timer);
  }, [pause, visible, ongletVisible, scene]);

  const suivreSouris = (e: React.PointerEvent<HTMLElement>) => {
    if (pause || e.pointerType !== "mouse") return;
    const el = cadre.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--regard-x", `${x * 14}px`);
      el.style.setProperty("--regard-y", `${y * 10}px`);
    });
  };

  return (
    <section ref={cadre} className="immo-hero" aria-label="Une nouvelle perspective sur l’immobilier" onPointerMove={suivreSouris}
      onPointerLeave={() => { cadre.current?.style.setProperty("--regard-x", "0px"); cadre.current?.style.setProperty("--regard-y", "0px"); }} data-active={visible && ongletVisible}>
      <div className="hero-camera">
        {SCENES.map((s, i) => (
          <div key={s.image} className={`hero-scene ${scene === i ? "scene-active" : ""}`} aria-hidden={scene !== i}>
            <Image src={s.image} alt={s.alt} fill priority={i === 0} sizes="(max-width: 760px) 150vh, 100vw" quality={85} className="hero-photo mouvement-continu" />
          </div>
        ))}
      </div>
      <div className="hero-ombre" aria-hidden="true" />
      <div className="hero-reperes" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="hero-edition"><span className="point-vivant mouvement-continu" /> L’immobilier, en perspective <span className="edition-lieu">Né en Vendée. Pensé pour vous.</span></div>
      <div className="hero-redaction">
        <p className="sur-titre hero-intro">Du premier regard à la bonne décision</p>
        <h1><span>L’immobilier,</span><span>à sa <em>juste</em></span><span><em>valeur.</em><span className="hero-asterisque mouvement-continu" aria-hidden="true"><Eclat /></span></span></h1>
        <p className="hero-description">Un lieu vous inspire. Nos chiffres vous éclairent.<br />Révélez le potentiel de votre prochain investissement.</p>
        <div className="hero-liens">
          <Link href="/simulateur" className="lien-plein lien-creme">Explorer mon projet <span aria-hidden="true">↗</span></Link>
          <a href="#approche" className="lien-souligne">L’approche Rentimo <span aria-hidden="true">↓</span></a>
        </div>
        <p className="hero-gratuit">Simulation gratuite · Sans carte bancaire</p>
      </div>
      <div className="hero-note" aria-hidden="true"><span className="note-croix">+</span><span>Des lieux de vie.<br />Des projets d’avenir.</span><span className="note-ligne" /></div>
      <div className="hero-bas">
        <a href="#approche" className="invitation-defiler"><span className="scroll-fleche mouvement-continu">↓</span> Prendre de la hauteur</a>
        <div className="hero-scenes" role="group" aria-label="Choisir une ambiance architecturale">
          {SCENES.map((s, i) => <button key={s.titre} type="button" className={scene === i ? "scene-choisie" : ""} aria-label={`Ambiance ${i + 1} : ${s.titre}`} aria-pressed={scene === i} onClick={() => setScene(i)}>
            <span className="scene-numero">0{i + 1}</span><span className="scene-nom">{s.titre}</span><span className="scene-piste"><i key={`${scene}-${i}`} className="mouvement-continu" /></span>
          </button>)}
        </div>
        <button type="button" className="pause-mouvement" onClick={basculer} disabled={reduit} aria-label={reduit ? "Animations réduites selon vos préférences" : pause ? "Reprendre les animations" : "Mettre les animations en pause"} title={pause ? "Reprendre les animations" : "Mettre les animations en pause"}>
          {pause ? <span aria-hidden="true">▷</span> : <span aria-hidden="true">Ⅱ</span>}
        </button>
      </div>
    </section>
  );
}
