"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CodePostal } from "@/lib/marche";
import { m2, nombre, pct, loyerM2 } from "@/lib/format";

export interface LigneMarche {
  c: CodePostal;
  prixA: number | null;
  prixM: number | null;
  evolution: number | null;
  rendement: number | null;
}

type Cle = "commune" | "n" | "med" | "prixA" | "prixM" | "evolution" | "loyer" | "rendement";

export function TableMarche({ lignes }: { lignes: LigneMarche[] }) {
  const [tri, setTri] = useState<{ cle: Cle; sens: 1 | -1 }>({ cle: "n", sens: -1 });
  const [filtre, setFiltre] = useState("");

  const visibles = useMemo(() => {
    const f = filtre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
    const val = (l: LigneMarche): number | string => {
      switch (tri.cle) {
        case "commune": return l.c.commune;
        case "n": return l.c.n;
        case "med": return l.c.med;
        case "prixA": return l.prixA ?? -1;
        case "prixM": return l.prixM ?? -1;
        case "evolution": return l.evolution ?? -999;
        case "loyer": return l.c.loyerA ?? -1;
        case "rendement": return l.rendement ?? -1;
      }
    };
    return lignes
      .filter((l) => !f || `${l.c.cp} ${l.c.commune}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(f))
      .sort((a, b) => {
        const x = val(a), y = val(b);
        return (typeof x === "string" ? x.localeCompare(y as string, "fr") : (x as number) - (y as number)) * tri.sens;
      });
  }, [lignes, tri, filtre]);

  const th = (cle: Cle, label: string, num = true) => (
    <th className={num ? "num" : ""} aria-sort={tri.cle === cle ? (tri.sens === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" className="tri" onClick={() => setTri((t) => ({ cle, sens: t.cle === cle ? ((-t.sens) as 1 | -1) : cle === "commune" ? 1 : -1 }))}>
        {label}
        {tri.cle === cle ? (tri.sens === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="champ" style={{ maxWidth: 360 }}>
        <label htmlFor="filtre">Rechercher une commune ou un code postal</label>
        <input id="filtre" value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Ex. Challans, 85300" />
      </div>
      <div className="verre defile-x" style={{ padding: 8 }}>
        <table className="tableau">
          <thead>
            <tr>
              {th("commune", "Commune", false)}
              {th("n", "Ventes")}
              {th("med", "Prix médian")}
              {th("prixA", "Appartements")}
              {th("prixM", "Maisons")}
              {th("evolution", "2024 → 2025")}
              {th("loyer", "Loyer appart.")}
              {th("rendement", "Rendement brut")}
            </tr>
          </thead>
          <tbody>
            {visibles.map((l) => (
              <tr key={l.c.cp}>
                <td>
                  <Link href={`/marche/${l.c.cp}`}>{l.c.commune}</Link> <span className="discret">{l.c.cp}</span>
                </td>
                <td className="num">{nombre(l.c.n)}</td>
                <td className="num">{m2(l.c.med)}</td>
                <td className="num">{l.prixA ? m2(l.prixA) : <span className="discret">—</span>}</td>
                <td className="num">{l.prixM ? m2(l.prixM) : <span className="discret">—</span>}</td>
                <td className={`num ${l.evolution === null ? "" : l.evolution >= 0 ? "positif" : "negatif"}`}>
                  {l.evolution === null ? "—" : `${l.evolution >= 0.05 ? "+" : ""}${pct(l.evolution)}`}
                </td>
                <td className="num">{l.c.loyerA ? loyerM2(l.c.loyerA) : <span className="discret">—</span>}</td>
                <td className="num">{pct(l.rendement)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
