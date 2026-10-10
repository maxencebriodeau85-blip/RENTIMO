// Télécharge les photos Unsplash listées dans scripts/photos.json (licence Unsplash : usage libre, y compris commercial).
// Lancé par .github/workflows/photos.yml sur la branche sources-photos. Les originaux réduits (2560 px) vont dans sources/photos/.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const liste = JSON.parse(await readFile(new URL("./photos.json", import.meta.url), "utf8"));
await mkdir("sources/photos", { recursive: true });

let erreurs = 0;
for (const p of liste) {
  const url = `https://images.unsplash.com/${p.chemin}?w=2560&q=88&fm=jpg&fit=max`;
  try {
    const r = await fetch(url, { headers: { "user-agent": "rentimo-photos/1.0" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    await writeFile(`sources/photos/${p.nom}.jpg`, buf);
    console.log(`ok   ${p.nom} ${(buf.length / 1024).toFixed(0)} Ko`);
  } catch (e) {
    erreurs++;
    console.error(`ÉCHEC ${p.nom} : ${e.message}`);
  }
}
if (erreurs) process.exit(1);
