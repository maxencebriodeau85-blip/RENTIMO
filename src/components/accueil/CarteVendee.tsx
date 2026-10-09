import { MARCHE } from "@/lib/marche";
import { nombre } from "@/lib/format";

// Contour simplifié de la Vendée (lon, lat) — illustration, pas une carte de précision.
const CONTOUR: [number, number][] = [
  [-2.03, 46.99], [-1.92, 46.97], [-1.84, 46.94], [-1.74, 46.92], [-1.64, 46.87], [-1.57, 46.92], [-1.52, 47.02],
  [-1.42, 47.04], [-1.32, 47.05], [-1.25, 47.09], [-1.16, 47.08], [-1.07, 47.07], [-0.98, 47.05], [-0.89, 47.02],
  [-0.84, 46.97], [-0.8, 46.9], [-0.74, 46.84], [-0.7, 46.77], [-0.65, 46.7], [-0.62, 46.62], [-0.63, 46.53],
  [-0.57, 46.45], [-0.54, 46.38], [-0.62, 46.33], [-0.75, 46.31], [-0.9, 46.31], [-1.0, 46.31], [-1.1, 46.33],
  [-1.2, 46.3], [-1.3, 46.28], [-1.33, 46.33], [-1.43, 46.34], [-1.52, 46.39], [-1.6, 46.41], [-1.7, 46.44],
  [-1.79, 46.48], [-1.83, 46.55], [-1.87, 46.63], [-1.94, 46.69], [-2.0, 46.74], [-2.07, 46.8], [-2.14, 46.85],
  [-2.13, 46.9], [-2.07, 46.93],
];
const NOIRMOUTIER: [number, number][] = [
  [-2.15, 46.89], [-2.2, 46.93], [-2.27, 46.98], [-2.31, 47.02], [-2.26, 47.04], [-2.22, 47.0], [-2.17, 46.95],
];

const K = 420;
const px = (lon: number) => (lon + 2.42) * 0.686 * K;
const py = (lat: number) => (47.13 - lat) * K;
const chemin = (pts: [number, number][]) => "M" + pts.map(([lo, la]) => `${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join(" L") + "Z";

const ETIQUETTES = ["85000", "85100", "85160", "85200", "85500", "85300"];

export function CarteVendee() {
  const max = Math.max(...MARCHE.codes_postaux.map((c) => c.n));
  // Les points s'allument de la côte vers l'intérieur des terres.
  const lons = MARCHE.codes_postaux.map((c) => c.lon);
  const ouest = Math.min(...lons);
  const est = Math.max(...lons);
  const delai = (lon: number) => ((lon - ouest) / (est - ouest || 1)).toFixed(3);
  return (
    <svg viewBox="0 0 560 372" className="carte" role="img" aria-label={`Carte des ${nombre(MARCHE.total_ventes)} ventes DVF par code postal en Vendée`}>
      <defs>
        <radialGradient id="point" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3dc" />
          <stop offset="0.35" stopColor="#f0b467" />
          <stop offset="1" stopColor="#f0b467" stopOpacity="0" />
        </radialGradient>
        <filter id="lueur-carte" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <path className="contour" pathLength={1} d={chemin(CONTOUR)} fill="rgba(76,195,148,0.035)" stroke="rgba(76,195,148,0.55)" strokeWidth="1.2" />
      <path className="contour" pathLength={1} d={chemin(CONTOUR)} fill="none" stroke="rgba(76,195,148,0.35)" strokeWidth="5" filter="url(#lueur-carte)" />
      <path className="contour" pathLength={1} d={chemin(NOIRMOUTIER)} fill="rgba(76,195,148,0.035)" stroke="rgba(76,195,148,0.55)" strokeWidth="1.2" />
      <ellipse className="ile" cx={px(-2.35)} cy={py(46.72)} rx="12" ry="5" fill="rgba(76,195,148,0.035)" stroke="rgba(76,195,148,0.55)" strokeWidth="1.2" />
      {MARCHE.codes_postaux.map((c) => {
        const r = 3 + Math.sqrt(c.n / max) * 16;
        return (
          <circle
            key={c.cp}
            className="point"
            style={{ ["--d" as string]: delai(c.lon) }}
            cx={px(c.lon)}
            cy={py(c.lat)}
            r={r}
            fill="url(#point)"
            opacity={0.55 + 0.45 * Math.sqrt(c.n / max)}
          />
        );
      })}
      {MARCHE.codes_postaux
        .filter((c) => ETIQUETTES.includes(c.cp))
        .map((c) => (
          <text key={c.cp} className="etiquette" x={px(c.lon) + 10} y={py(c.lat) - 10} fontSize="11" fill="var(--texte-2)">
            {c.commune.replace(/\s*\(.*\)$/, "")}
          </text>
        ))}
    </svg>
  );
}
