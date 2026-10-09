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

  // Fenêtre visée par la plongée de l'accueil : la plus proche d'un point choisi, éclairage chaud.
  const vise = allumees
    .filter((a) => !a.tiede)
    .map((a) => ({ ...a, d: Math.hypot(a.wx + a.ww / 2 - 470, a.wy + a.wh / 2 - 700) }))
    .sort((a, b) => a.d - b.d)[0];
  dernierCible = vise
    ? { x: (vise.wx + vise.ww / 2) / W, y: (vise.wy + vise.wh / 2) / H, w: vise.ww / W, h: vise.wh / H }
    : null;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${style}<defs>${DEFS}</defs>${parts.join("")}${fenetres.join("")}${allum}${halos.join("")}</svg>`;
}
let dernierCible = null;

// ---------- Scènes d'intérieur (la descente dans l'appartement) ----------
// Une seule source chaude par scène, le reste en bleu nuit. Les détails sont placés
// là où le panneau de verre ne les couvre pas (bord gauche visible, marge droite) ;
// les halos passent derrière le verre et s'y diffusent.

const SW = 1200, SH = 700;
const DEFS_INT = `
  <linearGradient id="mur" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#131c29"/><stop offset="1" stop-color="#0b1119"/>
  </linearGradient>
  <linearGradient id="sol" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0b1017"/><stop offset="1" stop-color="#05080c"/>
  </linearGradient>
  <radialGradient id="halo-chaud">
    <stop offset="0" stop-color="#ffd59a" stop-opacity="1"/>
    <stop offset="0.25" stop-color="#f3b36a" stop-opacity="0.55"/>
    <stop offset="0.6" stop-color="#c97a36" stop-opacity="0.16"/>
    <stop offset="1" stop-color="#c97a36" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="halo-froid">
    <stop offset="0" stop-color="#7fa3d1" stop-opacity="0.5"/>
    <stop offset="1" stop-color="#7fa3d1" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="abat-jour" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffefcf"/><stop offset="1" stop-color="#f1a75a"/>
  </linearGradient>
  <linearGradient id="nuit-vue" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#060b14"/><stop offset="0.6" stop-color="#0e1b2e"/><stop offset="1" stop-color="#15263c"/>
  </linearGradient>
  <linearGradient id="bois" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3a2a1c"/><stop offset="0.5" stop-color="#241a12"/><stop offset="1" stop-color="#140f0b"/>
  </linearGradient>
  <linearGradient id="tissu" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3a3029"/><stop offset="0.55" stop-color="#1d1a19"/><stop offset="1" stop-color="#121315"/>
  </linearGradient>
  <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffd59a" stop-opacity="0.22"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/>
  </linearGradient>`;

const halo = (cx, cy, rx, ry, op = 1, froid = false) =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${froid ? "halo-froid" : "halo-chaud"})" opacity="${op}"/>`;

/** Fenêtre donnant sur la côte de nuit : ciel, lumières de la ville, mer et reflets. */
function vueNuit(x, y, w, h, seed, { meneaux = 2, cadre = 10 } = {}) {
  const r = prng(seed);
  const p = [`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#nuit-vue)"/>`];
  for (let i = 0; i < 26; i++) p.push(`<circle cx="${f(x + r() * w)}" cy="${f(y + r() * h * 0.45)}" r="${f(0.5 + r() * 0.8)}" fill="#cfd8e6" opacity="${f(0.15 + r() * 0.4)}"/>`);
  const horizon = y + h * 0.62;
  p.push(`<path d="M${x} ${f(horizon)} C ${f(x + w * 0.3)} ${f(horizon - 10)}, ${f(x + w * 0.6)} ${f(horizon - 4)}, ${x + w} ${f(horizon - 8)} L${x + w} ${f(horizon + 6)} L${x} ${f(horizon + 6)}Z" fill="#0a1220"/>`);
  for (let i = 0; i < Math.round(w / 3); i++) {
    p.push(`<circle cx="${f(x + r() * w)}" cy="${f(horizon - 4 + r() * 9)}" r="${f(0.6 + r() * 1.4)}" fill="${r() > 0.3 ? "#f0b467" : "#dfe8f5"}" opacity="${f(0.35 + r() * 0.6)}"/>`);
  }
  p.push(`<rect x="${x}" y="${f(horizon + 6)}" width="${w}" height="${f(y + h - horizon - 6)}" fill="#08111c"/>`);
  for (let i = 0; i < 22; i++) {
    const ly = horizon + 10 + r() * (y + h - horizon - 14);
    p.push(`<rect x="${f(x + r() * w * 0.9)}" y="${f(ly)}" width="${f(12 + r() * 50)}" height="1.2" fill="#f3b36a" opacity="${f(0.05 + r() * 0.16)}"/>`);
  }
  // Cadre et meneaux
  p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#05080c" stroke-width="${cadre}"/>`);
  for (let k = 1; k <= meneaux; k++) p.push(`<rect x="${f(x + (w * k) / (meneaux + 1) - 3)}" y="${y}" width="6" height="${h}" fill="#05080c"/>`);
  p.push(`<rect x="${x}" y="${f(y + h * 0.3)}" width="${w}" height="5" fill="#05080c" opacity="0.9"/>`);
  // Reflet froid sur le sol devant la fenêtre
  return p.join("");
}

function plante(x, y, s, seed, couleur = "#060b09") {
  const r = prng(seed);
  let g = `<path d="M${f(x - 18 * s)} ${f(y)} L${f(x + 18 * s)} ${f(y)} L${f(x + 14 * s)} ${f(y + 44 * s)} L${f(x - 14 * s)} ${f(y + 44 * s)}Z" fill="#1a1512"/>`;
  for (let i = 0; i < 16; i++) {
    const a = (r() - 0.5) * 120;
    const l = (40 + r() * 70) * s;
    g += `<ellipse cx="${f(x)}" cy="${f(y - l / 2)}" rx="${f((7 + r() * 8) * s)}" ry="${f(l / 2)}" fill="${couleur}" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`;
  }
  return g;
}

function lampeSol(x, sol, haut) {
  const yAbat = sol - haut;
  return [
    halo(x, yAbat + 10, 330, 290, 0.75),
    `<polygon points="${x - 40},${yAbat + 44} ${x + 40},${yAbat + 44} ${x + 190},${sol + 40} ${x - 190},${sol + 40}" fill="url(#cone)"/>`,
    `<rect x="${x - 1.5}" y="${yAbat + 40}" width="3" height="${haut - 40}" fill="#2a2018"/>`,
    `<ellipse cx="${x}" cy="${sol}" rx="22" ry="4" fill="#1b1510"/>`,
    `<path d="M${x - 26} ${yAbat} L${x + 26} ${yAbat} L${x + 40} ${yAbat + 46} L${x - 40} ${yAbat + 46}Z" fill="url(#abat-jour)"/>`,
    halo(x, yAbat + 22, 70, 46, 0.9),
    halo(x, sol + 6, 230, 34, 0.55),
  ].join("");
}

function lampeTable(x, plateau, echelle = 1) {
  const s = echelle;
  const yAbat = plateau - 110 * s;
  return [
    halo(x, yAbat + 20 * s, 300 * s, 240 * s, 0.8),
    `<path d="M${f(x - 14 * s)} ${f(plateau)} Q ${x} ${f(plateau - 70 * s)} ${f(x + 14 * s)} ${f(plateau)}Z" fill="#2c2119"/>`,
    `<rect x="${f(x - 1.5)}" y="${f(yAbat + 40 * s)}" width="3" height="${f(40 * s)}" fill="#2c2119"/>`,
    `<path d="M${f(x - 30 * s)} ${f(yAbat)} L${f(x + 30 * s)} ${f(yAbat)} L${f(x + 44 * s)} ${f(yAbat + 46 * s)} L${f(x - 44 * s)} ${f(yAbat + 46 * s)}Z" fill="url(#abat-jour)"/>`,
    halo(x, plateau + 4, 260 * s, 26 * s, 0.6),
  ].join("");
}

function scene(contenu) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMid slice"><defs>${DEFS_INT}</defs>${contenu}</svg>`;
}

/** Le salon vu en entrant par la fenêtre : fin de la plongée. */
function salon() {
  const r = prng(41);
  const p = [`<rect width="${SW}" height="${SH}" fill="url(#mur)"/>`];
  p.push(halo(420, 300, 640, 420, 0.38));
  // Tableau
  p.push(`<rect x="220" y="150" width="230" height="150" fill="#0c1119" stroke="#2a2420" stroke-width="5"/>`);
  p.push(`<circle cx="330" cy="236" r="36" fill="#c97a36" opacity="0.35"/><rect x="226" y="246" width="218" height="48" fill="#0a0f16" opacity="0.85"/>`);
  // Baie vitrée à droite
  p.push(vueNuit(700, 60, 460, 470, 13, { meneaux: 2 }));
  p.push(`<rect x="1138" y="40" width="62" height="520" fill="#1a130e" opacity="0.75"/>`);
  // Sol, tapis
  p.push(`<rect y="560" width="${SW}" height="${SH - 560}" fill="url(#sol)"/>`);
  p.push(`<ellipse cx="520" cy="640" rx="380" ry="56" fill="#151b25" opacity="0.8"/>`);
  for (let i = 0; i < 18; i++) p.push(`<rect x="${f(700 + r() * 460)}" y="${f(572 + r() * 110)}" width="${f(20 + r() * 80)}" height="1.4" fill="#7fa3d1" opacity="${f(0.04 + r() * 0.07)}"/>`);
  // Lampe sur pied
  p.push(lampeSol(640, 590, 360));
  // Canapé
  p.push(`<rect x="120" y="410" width="500" height="92" rx="22" fill="url(#tissu)"/>`);
  p.push(`<rect x="100" y="470" width="540" height="98" rx="18" fill="#1a1716"/>`);
  p.push(`<rect x="96" y="440" width="58" height="128" rx="20" fill="#221d19"/><rect x="590" y="440" width="58" height="128" rx="20" fill="#161517"/>`);
  p.push(`<rect x="170" y="420" width="120" height="78" rx="16" fill="#3d3127" opacity="0.9"/><rect x="420" y="424" width="112" height="72" rx="16" fill="#2b241f" opacity="0.9"/>`);
  p.push(`<rect x="100" y="560" width="540" height="8" fill="#0b0a0a" opacity="0.8"/>`);
  // Table basse et bougies
  p.push(`<rect x="300" y="600" width="270" height="14" rx="4" fill="#2a1f16"/><rect x="316" y="614" width="8" height="40" fill="#160f0a"/><rect x="546" y="614" width="8" height="40" fill="#160f0a"/>`);
  p.push(halo(420, 590, 90, 40, 0.8), `<rect x="412" y="586" width="9" height="14" fill="#efe2c8"/><rect x="430" y="590" width="9" height="10" fill="#efe2c8"/>`);
  p.push(plante(60, 540, 1.3, 7));
  // Assombrissement des bords
  p.push(`<rect width="${SW}" height="${SH}" fill="url(#nuit-vue)" opacity="0.12"/>`);
  return scene(p.join(""));
}

/** Buffet et lampe de table : derrière le panneau « Simulation ». */
function buffet() {
  const p = [`<rect width="${SW}" height="${SH}" fill="url(#mur)"/>`];
  p.push(halo(560, 330, 560, 360, 0.52));
  // Œuvre au mur
  p.push(`<rect x="620" y="140" width="320" height="210" fill="#0b1018" stroke="#2b241e" stroke-width="6"/>`);
  p.push(`<circle cx="780" cy="250" r="54" fill="#d08a45" opacity="0.28"/><path d="M626 300 C 700 270, 820 300, 934 280 L934 344 L626 344Z" fill="#090d14"/>`);
  // Buffet
  p.push(`<rect x="300" y="452" width="760" height="18" fill="#3b2b1d"/><rect x="310" y="470" width="740" height="120" fill="url(#bois)"/>`);
  for (const x of [495, 680, 865]) p.push(`<rect x="${x}" y="476" width="2" height="108" fill="#0d0907" opacity="0.8"/>`);
  p.push(`<rect x="330" y="590" width="10" height="34" fill="#140e0a"/><rect x="1020" y="590" width="10" height="34" fill="#140e0a"/>`);
  p.push(lampeTable(420, 452, 1.15));
  // Livres et vase
  p.push(`<rect x="930" y="420" width="70" height="12" fill="#5a3b26"/><rect x="936" y="408" width="60" height="12" fill="#2d3a4a"/><rect x="928" y="432" width="74" height="20" fill="#423226"/>`);
  p.push(`<path d="M720 452 Q 706 410 724 392 L740 392 Q 758 410 744 452Z" fill="#1d2632"/><path d="M732 392 C 720 330, 690 300, 660 280 M732 392 C 744 320, 770 300, 800 286" stroke="#0e0b09" stroke-width="3" fill="none"/>`);
  // Sol
  p.push(`<rect y="624" width="${SW}" height="${SH - 624}" fill="url(#sol)"/>`, halo(560, 630, 420, 40, 0.35));
  // Fenêtre étroite à droite (lumière froide)
  p.push(vueNuit(1110, 80, 90, 520, 9, { meneaux: 0, cadre: 8 }), halo(1150, 400, 160, 300, 0.25, true));
  p.push(plante(220, 560, 1.4, 12));
  return scene(p.join(""));
}

/** Fauteuil de lecture : derrière les indicateurs. */
function fauteuil() {
  const p = [`<rect width="${SW}" height="${SH}" fill="url(#mur)"/>`];
  p.push(halo(470, 300, 520, 380, 0.42));
  // Bibliothèque murale
  for (let k = 0; k < 3; k++) {
    const y = 150 + k * 110;
    p.push(`<rect x="700" y="${y}" width="420" height="8" fill="#2a2018"/>`);
    const r = prng(70 + k);
    let x = 712;
    while (x < 1100) {
      const w = 10 + r() * 16;
      const h = 50 + r() * 38;
      const c = ["#2b3442", "#3a2a1e", "#1d2430", "#4a3626", "#232a33"][Math.floor(r() * 5)];
      p.push(`<rect x="${f(x)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" fill="${c}" opacity="0.9"/>`);
      x += w + 2 + (r() < 0.12 ? 26 : 0);
    }
  }
  p.push(`<rect width="${SW}" height="${SH}" fill="#06090e" opacity="0.25"/>`);
  // Fauteuil
  p.push(`<path d="M300 360 Q 300 330 330 328 L520 328 Q 550 330 550 360 L556 560 L294 560Z" fill="url(#tissu)"/>`);
  p.push(`<rect x="270" y="450" width="310" height="96" rx="20" fill="#1c1917"/><rect x="262" y="420" width="54" height="140" rx="18" fill="#2a231e"/><rect x="536" y="420" width="54" height="140" rx="18" fill="#171617"/>`);
  p.push(`<rect x="300" y="560" width="8" height="40" fill="#120d09"/><rect x="544" y="560" width="8" height="40" fill="#120d09"/>`);
  // Liseuse
  p.push(`<rect x="196" y="230" width="3" height="370" fill="#2a2018"/><path d="M198 230 Q 230 200 270 214" stroke="#2a2018" stroke-width="3" fill="none"/>`);
  p.push(`<path d="M252 208 L292 214 L284 244 L250 236Z" fill="url(#abat-jour)"/>`, halo(272, 236, 260, 220, 0.8));
  p.push(`<polygon points="258,236 290,244 420,600 170,600" fill="url(#cone)"/>`);
  // Guéridon, tasse
  p.push(`<ellipse cx="640" cy="500" rx="56" ry="10" fill="#2b2016"/><rect x="636" y="500" width="8" height="100" fill="#1a130d"/><rect x="624" y="482" width="20" height="18" rx="3" fill="#d9cdb8" opacity="0.8"/>`);
  p.push(`<rect y="600" width="${SW}" height="${SH - 600}" fill="url(#sol)"/>`, halo(330, 606, 300, 34, 0.45));
  p.push(halo(1170, 360, 140, 320, 0.22, true));
  return scene(p.join(""));
}

/** Bureau : lampe d'architecte, livres, carnet. Derrière la comparaison fiscale. */
function bureau() {
  const p = [`<rect width="${SW}" height="${SH}" fill="url(#mur)"/>`];
  p.push(halo(560, 380, 600, 330, 0.44));
  // Étagère haute
  p.push(`<rect x="560" y="150" width="520" height="8" fill="#2a2018"/>`);
  const r = prng(90);
  let x = 580;
  while (x < 1060) {
    const w = 12 + r() * 14, h = 44 + r() * 30;
    p.push(`<rect x="${f(x)}" y="${f(150 - h)}" width="${f(w)}" height="${f(h)}" fill="${r() < 0.5 ? "#2a3240" : "#3a2b20"}" opacity="0.85"/>`);
    x += w + 3;
  }
  // Plateau du bureau en perspective
  p.push(`<polygon points="120,470 1200,452 1200,700 0,700 0,560" fill="#1d150f"/>`);
  p.push(`<polygon points="120,470 1200,452 1200,462 120,480" fill="#3b2a1c"/>`);
  for (let i = 0; i < 14; i++) p.push(`<path d="M${f(80 + r() * 200)} ${f(500 + i * 14)} L1200 ${f(470 + i * 16)}" stroke="#2a1d14" stroke-width="1" opacity="0.5"/>`);
  // Lampe d'architecte
  p.push(`<ellipse cx="300" cy="500" rx="40" ry="9" fill="#151515"/><path d="M300 496 L250 360 L340 280" stroke="#2c2c2e" stroke-width="5" fill="none" stroke-linecap="round"/>`);
  p.push(`<path d="M322 268 L386 296 L372 326 L310 300Z" fill="#2f2f33"/><ellipse cx="368" cy="314" rx="22" ry="7" fill="#ffefcf" transform="rotate(24 368 314)"/>`);
  p.push(halo(420, 470, 380, 120, 0.9), halo(380, 320, 160, 120, 0.55));
  // Pile de livres et carnet
  p.push(`<rect x="470" y="452" width="150" height="18" fill="#4a3424"/><rect x="480" y="436" width="132" height="16" fill="#26313f"/><rect x="474" y="420" width="140" height="16" fill="#5b4330"/>`);
  p.push(`<polygon points="640,486 790,478 806,506 652,516" fill="#e9e1d2" opacity="0.85"/><path d="M660 496 L790 489 M664 504 L780 497" stroke="#9a8f80" stroke-width="1.2"/>`);
  p.push(`<rect x="820" y="470" width="110" height="5" rx="2" fill="#c9a46a" transform="rotate(-8 820 470)"/>`);
  // Tasse
  p.push(`<path d="M960 438 L1004 438 L998 478 L966 478Z" fill="#d6cdbd" opacity="0.75"/><path d="M1004 446 Q 1022 452 1002 468" stroke="#d6cdbd" stroke-width="4" fill="none" opacity="0.75"/>`);
  p.push(plante(1140, 440, 1, 33));
  return scene(p.join(""));
}

/** Baie vitrée sur la côte : derrière les biens comparés. */
function baie() {
  const p = [`<rect width="${SW}" height="${SH}" fill="#070b12"/>`];
  p.push(vueNuit(40, 30, 1120, 560, 57, { meneaux: 3, cadre: 14 }));
  // Lune et reflet
  p.push(`<circle cx="860" cy="120" r="16" fill="#e8eef7" opacity="0.85"/>`, halo(860, 120, 120, 120, 0.35, true));
  for (let i = 0; i < 30; i++) p.push(`<rect x="${f(830 + (Math.sin(i * 1.7) * 30))}" y="${f(420 + i * 5.5)}" width="${f(16 + (i % 5) * 9)}" height="1.4" fill="#dfe8f5" opacity="${f(0.06 + 0.2 * (1 - i / 30))}"/>`);
  // Garde-corps du balcon
  p.push(`<rect x="0" y="470" width="${SW}" height="4" fill="#1b2533"/>`);
  for (let x = 20; x < SW; x += 44) p.push(`<rect x="${x}" y="474" width="2" height="116" fill="#141c27"/>`);
  p.push(`<rect y="590" width="${SW}" height="${SH - 590}" fill="url(#sol)"/>`, halo(600, 600, 560, 40, 0.18, true));
  p.push(plante(110, 540, 1.5, 19, "#04080a"), plante(1100, 548, 1.2, 23, "#04080a"));
  return scene(p.join(""));
}

/** Table sous une suspension : le rapport posé. */
function table() {
  const r = prng(77);
  const p = [`<rect width="${SW}" height="${SH}" fill="#06090e"/>`];
  // Plateau vu de haut
  p.push(`<rect x="0" y="120" width="${SW}" height="${SH - 120}" fill="#1a130d"/>`);
  for (let i = 0; i < 26; i++) p.push(`<path d="M0 ${f(140 + i * 22 + r() * 6)} C 400 ${f(130 + i * 22)}, 800 ${f(150 + i * 22)}, 1200 ${f(136 + i * 22)}" stroke="#2a1e14" stroke-width="${f(0.8 + r())}" fill="none" opacity="0.55"/>`);
  p.push(halo(600, 420, 520, 300, 0.75));
  // Suspension
  p.push(`<rect x="598" y="0" width="3" height="40" fill="#2a2a2c"/><path d="M540 40 L660 40 L640 70 L560 70Z" fill="#2a2a2c"/><ellipse cx="600" cy="70" rx="40" ry="6" fill="#ffefcf"/>`, halo(600, 72, 200, 80, 0.6));
  // Stylo, lunettes
  p.push(`<rect x="860" y="520" width="150" height="7" rx="3" fill="#0f1114" transform="rotate(-18 860 520)"/>`);
  p.push(`<circle cx="250" cy="520" r="26" fill="none" stroke="#0c0d10" stroke-width="5"/><circle cx="312" cy="524" r="26" fill="none" stroke="#0c0d10" stroke-width="5"/><path d="M276 520 Q 281 512 286 522" stroke="#0c0d10" stroke-width="4" fill="none"/>`);
  p.push(`<rect width="${SW}" height="${SH}" fill="url(#nuit-vue)" opacity="0.1"/>`);
  return scene(p.join(""));
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
  "scene-salon.svg": salon(),
  "scene-buffet.svg": buffet(),
  "scene-fauteuil.svg": fauteuil(),
  "scene-bureau.svg": bureau(),
  "scene-baie.svg": baie(),
  "scene-table.svg": table(),
  "vignette-cote.svg": vignette("cote", 3),
  "vignette-ville.svg": vignette("ville", 11),
  "vignette-maison.svg": vignette("maison", 5),
  "vignette-bourg.svg": vignette("bourg", 21),
};
for (const [nom, contenu] of Object.entries(fichiers)) {
  writeFileSync(join(sortie, nom), contenu);
  console.log(nom, Math.round(contenu.length / 1024), "Ko");
}
// Fenêtre visée par la plongée (fractions de la largeur et de la hauteur de tour-nuit.svg),
// à reporter dans accueil.css (--ox, --oy) si la graine de la tour change.
console.log("cible plongée", JSON.stringify(dernierCible));
