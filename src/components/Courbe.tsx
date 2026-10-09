// Petite courbe SVG sans dépendance (sparkline ou graphique simple).
export function Sparkline({ valeurs, largeur = 160, hauteur = 48, couleur = "var(--maree)" }: { valeurs: number[]; largeur?: number; hauteur?: number; couleur?: string }) {
  if (valeurs.length < 2) return null;
  const min = Math.min(...valeurs, 0);
  const max = Math.max(...valeurs, 1);
  const pts = valeurs.map((v, i) => {
    const x = (i / (valeurs.length - 1)) * largeur;
    const y = hauteur - 2 - ((v - min) / (max - min || 1)) * (hauteur - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const aire = `0,${hauteur} ${pts.join(" ")} ${largeur},${hauteur}`;
  return (
    <svg width={largeur} height={hauteur} viewBox={`0 0 ${largeur} ${hauteur}`} aria-hidden="true" style={{ overflow: "visible" }}>
      <polygon className="trace-aire" points={aire} fill={couleur} opacity="0.08" />
      <path className="trace" pathLength={1} d={`M${pts.join(" L")}`} fill="none" stroke={couleur} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

interface Serie {
  nom: string;
  valeurs: number[];
  couleur: string;
  tirets?: boolean;
}

/** Graphique linéaire à axes, pour la projection pluriannuelle. */
export function GraphiqueProjection({ series, etiquettes, format }: { series: Serie[]; etiquettes: string[]; format: (v: number) => string }) {
  const L = 520, H = 230, mg = { g: 58, d: 10, h: 12, b: 28 };
  const toutes = series.flatMap((s) => s.valeurs);
  let min = Math.min(0, ...toutes);
  let max = Math.max(0, ...toutes);
  if (max === min) max = min + 1;
  const pas = echelon((max - min) / 4);
  min = Math.floor(min / pas) * pas;
  max = Math.ceil(max / pas) * pas;
  const n = etiquettes.length;
  const x = (i: number) => mg.g + (i / Math.max(1, n - 1)) * (L - mg.g - mg.d);
  const y = (v: number) => mg.h + (1 - (v - min) / (max - min)) * (H - mg.h - mg.b);
  const pasX = Math.ceil(n / 8);
  const graduations: number[] = [];
  for (let v = min; v <= max + pas / 2; v += pas) graduations.push(v);

  return (
    <svg viewBox={`0 0 ${L} ${H}`} width="100%" role="img" aria-label={series.map((s) => s.nom).join(", ")} style={{ display: "block" }}>
      {graduations.map((g) => (
        <g key={g}>
          <line x1={mg.g} x2={L - mg.d} y1={y(g)} y2={y(g)} stroke={g === 0 ? "rgba(236,239,243,.28)" : "rgba(236,239,243,.07)"} />
          <text x={mg.g - 10} y={y(g) + 4} textAnchor="end" fontSize="12" fill="var(--texte-3)" style={{ fontVariantNumeric: "tabular-nums" }}>
            {format(g)}
          </text>
        </g>
      ))}
      {etiquettes.map((e, i) =>
        (i % pasX === 0 && n - 1 - i >= pasX / 2) || i === n - 1 ? (
          <text key={i} x={x(i)} y={H - 8} textAnchor={i === n - 1 ? "end" : i === 0 ? "start" : "middle"} fontSize="12" fill="var(--texte-3)">
            {e}
          </text>
        ) : null,
      )}
      {series.map((s) => (
        <polyline
          key={s.nom}
          points={s.valeurs.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={s.couleur}
          strokeWidth="2"
          strokeDasharray={s.tirets ? "5 4" : undefined}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

function echelon(brut: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.abs(brut) || 1)));
  const m = brut / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}
