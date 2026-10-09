// Génère les visuels SVG du site (immeuble de nuit, vignettes) de façon déterministe.
// Usage : node scripts/gen-visuels.mjs  → public/visuels/*.svg
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const sortie = join(racine, "public", "visuels");
mkdirSync(sortie, { recursive: true });

function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (x) => Math.round(x * 10) / 10;

const DEFS = `
  <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#070c14"/>
    <stop offset="0.55" stop-color="#0d1726"/>
    <stop offset="0.82" stop-color="#16243a"/>
    <stop offset="1" stop-color="#1c2a3d"/>
  </linearGradient>
  <linearGradient id="mer" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0f1b2b"/>
    <stop offset="1" stop-color="#070d16"/>
  </linearGradient>
  <radialGradient id="chaud" cx="0.5" cy="0.55" r="0.75">
    <stop offset="0" stop-color="#ffe2b0"/>
    <stop offset="0.45" stop-color="#f3b36a"/>
    <stop offset="1" stop-color="#9c5a2a"/>
  </radialGradient>
  <radialGradient id="tiede" cx="0.35" cy="0.6" r="0.9">
    <stop offset="0" stop-color="#e9b77a"/>
    <stop offset="1" stop-color="#6e4224"/>
  </radialGradient>
  <linearGradient id="vitre" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1b2a3e"/>
    <stop offset="0.5" stop-color="#0e1724"/>
    <stop offset="1" stop-color="#0a121d"/>
  </linearGradient>
  <linearGradient id="facade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#1a2433"/>
    <stop offset="1" stop-color="#131c29"/>
  </linearGradient>
  <linearGradient id="flanc" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0b111a"/>
    <stop offset="1" stop-color="#101824"/>
  </linearGradient>
  <linearGradient id="reflet" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f3b36a" stop-opacity="0.55"/>
    <stop offset="1" stop-color="#f3b36a" stop-opacity="0"/>
  </linearGradient>
  <filter id="halo" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
  <filter id="flou" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="1.4"/>
  </filter>`;

function tour({ seed = 7, anime = true } = {}) {
  const r = prng(seed);
  const W = 800, H = 1400;
  const x0 = 300, x1 = 660, haut = 120, base = 1215, etage = 62;
  const flancX = 210;
  const nEtages = Math.floor((base - haut) / etage);
  const parts = [];

  // Ciel et étoiles
  parts.push(`<rect width="${W}" height="${H}" fill="url(#ciel)"/>`);
  for (let i = 0; i < 70; i++) {
    parts.push(`<circle cx="${f(r() * W)}" cy="${f(r() * 700)}" r="${f(0.4 + r() * 0.9)}" fill="#cfd8e6" opacity="${f(0.1 + r() * 0.45)}"/>`);
  }
  // Côte lointaine et lumières de la ville
  parts.push(`<path d="M0 1168 C 120 1156, 220 1162, 330 1158 S 560 1150, 800 1160 L800 1176 L0 1176Z" fill="#0b1320"/>`);
  for (let i = 0; i < 160; i++) {
    const x = r() * W;
    const y = 1158 + r() * 14;
    const c = r() > 0.25 ? "#f0b467" : "#dfe8f5";
    parts.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + r() * 1.3)}" fill="${c}" opacity="${f(0.35 + r() * 0.6)}"/>`);
  }
  // Mer
  parts.push(`<rect y="1176" width="${W}" height="${H - 1176}" fill="url(#mer)"/>`);
  for (let i = 0; i < 70; i++) {
    const y = 1182 + r() * 210;
    const x = r() * W;
    const l = 10 + r() * 60;
    parts.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(l)}" height="1" fill="#9fb3cc" opacity="${f(0.04 + r() * 0.08)}"/>`);
  }
  // Reflet chaud de l'immeuble dans l'eau
  for (let i = 0; i < 26; i++) {
    const y = 1230 + i * 6.5 + r() * 3;
    const w = 40 + r() * 160;
    const x = 470 - w / 2 + (r() - 0.5) * 120;
    parts.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(1.2 + r() * 1.5)}" fill="#f3b36a" opacity="${f(0.05 + (1 - i / 26) * 0.22 * r())}"/>`);
  }

  // Flanc (perspective)
  parts.push(`<polygon points="${flancX},${haut + 34} ${x0},${haut} ${x0},${base} ${flancX},${base + 16}" fill="url(#flanc)"/>`);
  // Façade
  parts.push(`<rect x="${x0}" y="${haut}" width="${x1 - x0}" height="${base - haut}" fill="url(#facade)"/>`);
  // Toit
  parts.push(`<rect x="${x0 - 8}" y="${haut - 10}" width="${x1 - x0 + 16}" height="12" fill="#222e3f"/>`);
  parts.push(`<polygon points="${flancX - 6},${haut + 26} ${x0 - 8},${haut - 10} ${x0 - 8},${haut + 2} ${flancX - 6},${haut + 36}" fill="#141d2a"/>`);
  parts.push(`<rect x="${x0 + 40}" y="${haut - 46}" width="110" height="36" fill="#121a26"/>`);
  parts.push(`<circle cx="${x0 + 140}" cy="${haut - 52}" r="2.2" fill="#ff5a4a" opacity="0.85"/>`);

  const halos = [];
  const fenetres = [];
  const allumees = [];
  const bays = 4;
  const largeurBay = (x1 - x0 - 24) / bays;
  for (let e = 0; e < nEtages; e++) {
    const y = haut + 6 + e * etage;
    // Dalle
    parts.push(`<rect x="${x0 - 14}" y="${y + etage - 10}" width="${x1 - x0 + 28}" height="8" fill="#1f2a3a"/>`);
    parts.push(`<rect x="${x0 - 14}" y="${y + etage - 10}" width="${x1 - x0 + 28}" height="1.2" fill="#3a4a60" opacity="0.8"/>`);
    // Dalle sur le flanc
    const t = (e * etage + etage - 10) / (base - haut);
    const yf0 = haut + 34 + t * (base + 16 - haut - 34);
    const yf1 = haut + t * (base - haut);
    parts.push(`<polygon points="${flancX - 4},${f(yf0)} ${x0 - 14},${f(yf1)} ${x0 - 14},${f(yf1 + 8)} ${flancX - 4},${f(yf0 + 8)}" fill="#161f2c"/>`);

    for (let b = 0; b < bays; b++) {
      const wx = x0 + 12 + b * largeurBay + 6;
      const wy = y + 4;
      const ww = largeurBay - 12;
      const wh = etage - 22;
      const p = r();
      const allumee = p < 0.42 - e * 0.004;
      if (allumee) {
        const tiede = r() < 0.3;
        const delai = f(0.2 + r() * 2.6);
        allumees.push({ wx, wy, ww, wh, tiede, delai });
        fenetres.push(`<rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" fill="url(#vitre)"/>`);
      } else {
        fenetres.push(`<rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" fill="url(#vitre)"/>`);
        // Reflet discret sur vitre éteinte
        fenetres.push(`<polygon points="${f(wx)},${f(wy)} ${f(wx + ww * 0.45)},${f(wy)} ${f(wx + ww * 0.15)},${f(wy + wh)} ${f(wx)},${f(wy + wh)}" fill="#8fa6c4" opacity="0.05"/>`);
      }
      // Meneau
      fenetres.push(`<rect x="${f(wx + ww / 2 - 0.8)}" y="${f(wy)}" width="1.6" height="${f(wh)}" fill="#141d2a" opacity="0.9"/>`);
    }
    // Garde-corps vitré
    parts.push(`<rect x="${x0 - 12}" y="${y + etage - 27}" width="${x1 - x0 + 24}" height="17" fill="#a9c2de" opacity="0.07"/>`);
    parts.push(`<rect x="${x0 - 12}" y="${y + etage - 27}" width="${x1 - x0 + 24}" height="1" fill="#dfe8f5" opacity="0.22"/>`);
    // Plantes sur certains balcons
    if (r() < 0.45) {
      const px = x0 + 10 + r() * (x1 - x0 - 40);
      const py = y + etage - 12;
      let g = "";
      for (let k = 0; k < 6; k++) {
        g += `<ellipse cx="${f(px + (r() - 0.5) * 18)}" cy="${f(py - 8 - r() * 16)}" rx="${f(3 + r() * 5)}" ry="${f(6 + r() * 7)}" transform="rotate(${f((r() - 0.5) * 60)} ${f(px)} ${f(py)})"/>`;
      }
      parts.push(`<g fill="#071009" opacity="0.92">${g}</g>`);
    }
    // Fenêtres du flanc
    for (let k = 0; k < 2; k++) {
      const fx0 = flancX + 10 + k * 40;
      const tA = (e * etage + 6) / (base - haut);
      const yA = haut + 34 + tA * (base + 16 - haut - 34) - (fx0 - flancX) * (34 / (x0 - flancX));
      const lit = r() < 0.18;
      parts.push(`<polygon points="${f(fx0)},${f(yA)} ${f(fx0 + 26)},${f(yA - 10)} ${f(fx0 + 26)},${f(yA + 28)} ${f(fx0)},${f(yA + 38)}" fill="${lit ? "url(#tiede)" : "#0b131e"}" opacity="${lit ? 0.75 : 1}"/>`);
    }
  }

  // Fenêtres allumées : halo + vitre chaude + silhouettes
  const allum = allumees
    .map(({ wx, wy, ww, wh, tiede, delai }) => {
      const cls = anime ? ` class="a" style="animation-delay:${delai}s"` : "";
      let interieur = "";
      const rr = prng(Math.round(wx * 13 + wy * 7));
      const q = rr();
      if (q < 0.25) {
        // Rideau
        interieur = `<rect x="${f(wx + ww * 0.62)}" y="${f(wy)}" width="${f(ww * 0.38)}" height="${f(wh)}" fill="#b9733a" opacity="0.55"/>`;
      } else if (q < 0.45) {
        // Lampe sur pied
        interieur = `<rect x="${f(wx + ww * 0.2)}" y="${f(wy + wh * 0.35)}" width="1.6" height="${f(wh * 0.65)}" fill="#3a2414" opacity="0.8"/><path d="M${f(wx + ww * 0.2 - 6)} ${f(wy + wh * 0.38)} L${f(wx + ww * 0.2 + 7)} ${f(wy + wh * 0.38)} L${f(wx + ww * 0.2 + 4)} ${f(wy + wh * 0.22)} L${f(wx + ww * 0.2 - 3)} ${f(wy + wh * 0.22)}Z" fill="#fff1d6" opacity="0.9"/>`;
      } else if (q < 0.6) {
        // Plante d'intérieur
        interieur = `<g fill="#2b1a0e" opacity="0.75"><ellipse cx="${f(wx + ww * 0.78)}" cy="${f(wy + wh * 0.62)}" rx="5" ry="9"/><ellipse cx="${f(wx + ww * 0.72)}" cy="${f(wy + wh * 0.7)}" rx="4" ry="8"/><rect x="${f(wx + ww * 0.73)}" y="${f(wy + wh * 0.8)}" width="8" height="${f(wh * 0.2)}"/></g>`;
      }
      return `<g${cls}><rect x="${f(wx - 6)}" y="${f(wy - 6)}" width="${f(ww + 12)}" height="${f(wh + 12)}" fill="#f3b36a" opacity="0.32" filter="url(#halo)"/><rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" fill="url(#${tiede ? "tiede" : "chaud"})"/>${interieur}<rect x="${f(wx + ww / 2 - 0.8)}" y="${f(wy)}" width="1.6" height="${f(wh)}" fill="#3b2614" opacity="0.6"/></g>`;
    })
    .join("");

  // Pied de l'immeuble : hall éclairé
  parts.push(`<rect x="${x0}" y="${base - 2}" width="${x1 - x0}" height="14" fill="#0e151f"/>`);

  const style = anime
    ? `<style>.a{opacity:0;animation:allume .9s ease-out forwards}@keyframes allume{0%{opacity:0}60%{opacity:1}75%{opacity:.82}100%{opacity:1}}@media (prefers-reduced-motion:reduce){.a{animation:none;opacity:1}}</style>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${style}<defs>${DEFS}</defs>${parts.join("")}${fenetres.join("")}${allum}${halos.join("")}</svg>`;
}

function vignette(type, seed) {
  const r = prng(seed);
  const W = 480, H = 300;
  const p = [];
  p.push(`<rect width="${W}" height="${H}" fill="url(#ciel)"/>`);
  for (let i = 0; i < 30; i++) p.push(`<circle cx="${f(r() * W)}" cy="${f(r() * 140)}" r="${f(0.4 + r() * 0.8)}" fill="#cfd8e6" opacity="${f(0.1 + r() * 0.4)}"/>`);
  const win = (x, y, w, h, on) =>
    on
      ? `<rect x="${f(x - 4)}" y="${f(y - 4)}" width="${f(w + 8)}" height="${f(h + 8)}" fill="#f3b36a" opacity="0.3" filter="url(#halo)"/><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#chaud)"/>`
      : `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#vitre)"/>`;

  if (type === "cote") {
    p.push(`<rect y="222" width="${W}" height="78" fill="url(#mer)"/>`);
    for (let i = 0; i < 60; i++) p.push(`<circle cx="${f(r() * W)}" cy="${f(214 + r() * 8)}" r="${f(0.5 + r())}" fill="#f0b467" opacity="${f(0.3 + r() * 0.6)}"/>`);
    for (let i = 0; i < 14; i++) p.push(`<rect x="${f(250 + (r() - 0.5) * 120)}" y="${f(232 + i * 4.5)}" width="${f(30 + r() * 70)}" height="1.4" fill="#f3b36a" opacity="${f(0.08 + r() * 0.15)}"/>`);
    p.push(`<polygon points="150,70 200,58 200,226 150,232" fill="url(#flanc)"/><rect x="200" y="58" width="150" height="168" fill="url(#facade)"/>`);
    for (let e = 0; e < 7; e++) {
      for (let b = 0; b < 3; b++) p.push(win(208 + b * 47, 64 + e * 23, 38, 14, r() < 0.45));
      p.push(`<rect x="194" y="${80 + e * 23}" width="162" height="3" fill="#24324a"/>`);
    }
  } else if (type === "ville") {
    p.push(`<rect y="236" width="${W}" height="64" fill="#0a111b"/>`);
    const blocs = [[40, 120, 90], [140, 80, 110], [262, 100, 80], [352, 130, 96]];
    for (const [x, y, w] of blocs) {
      p.push(`<rect x="${x}" y="${y}" width="${w}" height="${236 - y}" fill="url(#facade)"/>`);
      for (let yy = y + 10; yy < 226; yy += 20) for (let xx = x + 8; xx < x + w - 14; xx += 22) p.push(win(xx, yy, 14, 10, r() < 0.32));
    }
  } else if (type === "bourg") {
    p.push(`<rect y="236" width="${W}" height="64" fill="#0a111b"/>`);
    const blocs = [[60, 140, 130, 26], [210, 118, 150, 30], [380, 150, 80, 20]];
    for (const [x, y, w, toit] of blocs) {
      p.push(`<polygon points="${x - 6},${y} ${x + w / 2},${y - toit} ${x + w + 6},${y}" fill="#18212e"/>`);
      p.push(`<rect x="${x}" y="${y}" width="${w}" height="${236 - y}" fill="url(#facade)"/>`);
      for (let yy = y + 12; yy < 222; yy += 28) for (let xx = x + 12; xx < x + w - 20; xx += 30) p.push(win(xx, yy, 18, 16, r() < 0.38));
    }
  } else {
    p.push(`<rect y="232" width="${W}" height="68" fill="#09110d"/>`);
    p.push(`<polygon points="130,150 240,88 350,150" fill="#18212e"/><rect x="146" y="150" width="188" height="86" fill="url(#facade)"/>`);
    p.push(win(166, 172, 40, 30, true), win(274, 172, 40, 30, r() < 0.5), win(222, 196, 36, 40, false));
    p.push(`<rect x="300" y="100" width="16" height="34" fill="#141c27"/>`);
    for (let i = 0; i < 9; i++) p.push(`<ellipse cx="${f(40 + r() * 70)}" cy="${f(210 + r() * 26)}" rx="${f(10 + r() * 14)}" ry="${f(14 + r() * 18)}" fill="#060d09"/>`);
    for (let i = 0; i < 7; i++) p.push(`<ellipse cx="${f(390 + r() * 70)}" cy="${f(206 + r() * 30)}" rx="${f(10 + r() * 14)}" ry="${f(14 + r() * 20)}" fill="#060d09"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${DEFS}</defs>${p.join("")}</svg>`;
}

const fichiers = {
  "tour-nuit.svg": tour({ seed: 7, anime: true }),
  "tour-nuit-statique.svg": tour({ seed: 7, anime: false }),
  "vignette-cote.svg": vignette("cote", 3),
  "vignette-ville.svg": vignette("ville", 11),
  "vignette-maison.svg": vignette("maison", 5),
  "vignette-bourg.svg": vignette("bourg", 21),
};
for (const [nom, contenu] of Object.entries(fichiers)) {
  writeFileSync(join(sortie, nom), contenu);
  console.log(nom, Math.round(contenu.length / 1024), "Ko");
}
