"use client";

import { useEffect, useId, useState } from "react";

const fmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

function analyser(s: string): number {
  const propre = s.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.\-]/g, "");
  const v = parseFloat(propre);
  return Number.isFinite(v) ? v : 0;
}

/** Ligne « libellé … valeur unité » au style du simulateur : saisie libre, formatage à la sortie du champ. */
export function LigneNombre({
  label,
  valeur,
  onChange,
  unite = "€",
  aide,
  min = 0,
  max,
}: {
  label: string;
  valeur: number;
  onChange: (v: number) => void;
  unite?: string;
  aide?: string;
  min?: number;
  max?: number;
}) {
  const id = useId();
  const [texte, setTexte] = useState(fmt.format(valeur));
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    if (!focus) setTexte(fmt.format(valeur));
  }, [valeur, focus]);

  const borner = (v: number) => {
    let x = Math.max(min, v);
    if (max !== undefined) x = Math.min(max, x);
    return x;
  };

  return (
    <div className="ligne-champ">
      <label htmlFor={id} title={aide}>
        {label}
        {aide ? <span className="sr-only"> — {aide}</span> : null}
      </label>
      <span className="saisie">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={texte}
          onFocus={(e) => {
            setFocus(true);
            requestAnimationFrame(() => e.target.select());
          }}
          onBlur={() => {
            setFocus(false);
            const v = borner(analyser(texte));
            onChange(v);
            setTexte(fmt.format(v));
          }}
          onChange={(e) => {
            setTexte(e.target.value);
            onChange(borner(analyser(e.target.value)));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
        <span className="unite">{unite}</span>
      </span>
    </div>
  );
}
