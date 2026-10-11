// Prépare les photos du site à partir des originaux (2560 px) de la branche sources-photos.
// Usage : node scripts/optimiser-photos.mjs [dossier des originaux]   (défaut : sources/photos)
// Sortie : public/photos/<nom>-<largeur>.avif|.webp et src/data/photos.json (dimensions, aperçu flou, crédits).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const source = process.argv[2] || "sources/photos";
const liste = JSON.parse(await readFile(new URL("./photos.json", import.meta.url), "utf8"));

// Largeurs par usage : la plongée zoome jusqu'à x3, d'où des fichiers plus grands.
const LARGEURS = {
  plongee: [960, 1600, 2560],
  bande: [960, 1600, 2400],
  carte: [480, 800],
};
const ROLE = {
  "sables-nuit": "plongee",
  "facade-nuit": "plongee",
  "salon-nuit": "plongee",
  "carte-sables": "carte",
  "carte-ville": "carte",
  "carte-bourg": "carte",
};

await mkdir("public/photos", { recursive: true });
const meta = {};
let total = 0;

for (const p of liste) {
  const fichier = path.join(source, `${p.nom}.jpg`);
  const image = sharp(fichier).rotate();
  const { width, height } = await image.metadata();
  const role = ROLE[p.nom] || "bande";
  const largeurs = LARGEURS[role].filter((w) => w <= width);

  for (const w of largeurs) {
    const base = sharp(fichier).rotate().resize({ width: w, withoutEnlargement: true });
    const avif = await base.clone().avif({ quality: role === "carte" ? 52 : 48, effort: 6, chromaSubsampling: "4:2:0" }).toBuffer();
    const webp = await base.clone().webp({ quality: role === "carte" ? 76 : 72, effort: 6 }).toBuffer();
    await writeFile(`public/photos/${p.nom}-${w}.avif`, avif);
    await writeFile(`public/photos/${p.nom}-${w}.webp`, webp);
    total += avif.length + webp.length;
    console.log(`${p.nom}-${w}  avif ${(avif.length / 1024).toFixed(0)} Ko  webp ${(webp.length / 1024).toFixed(0)} Ko`);
  }

  // Aperçu de 24 px, affiché flou le temps que la vraie photo arrive.
  const apercu = await sharp(fichier).rotate().resize({ width: 24 }).webp({ quality: 50 }).toBuffer();
  meta[p.nom] = {
    largeur: width,
    hauteur: height,
    largeurs,
    apercu: `data:image/webp;base64,${apercu.toString("base64")}`,
    auteur: p.auteur,
    profil: `https://unsplash.com/@${p.profil}`,
    page: `https://unsplash.com/photos/${p.id}`,
    ...(p.lieu ? { lieu: p.lieu } : {}),
  };
}

await writeFile("src/data/photos.json", JSON.stringify(meta, null, 2) + "\n");
console.log(`Total ${(total / 1024 / 1024).toFixed(1)} Mo`);
