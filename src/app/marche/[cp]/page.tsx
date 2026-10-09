import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MARCHE, SEUIL_FIABILITE, evolution, loyerMarche, parSlug, rendementSecteur } from "@/lib/marche";
import { exempleSecteur } from "@/lib/exemples";
import { euros, eurosSigne, loyerM2, m2, nombre, pct } from "@/lib/format";
import "../marche.css";

export function generateStaticParams() {
  return MARCHE.codes_postaux.map((c) => ({ cp: c.cp }));
}

export const dynamicParams = false;

function nomCourt(commune: string) {
  return commune.replace(/\s*\(.*\)$/, "");
}

export function generateMetadata({ params }: { params: { cp: string } }): Metadata {
  const c = parSlug(params.cp);
  if (!c) return {};
  return {
    title: `Prix immobilier et rentabilité locative à ${nomCourt(c.commune)} (${c.cp})`,
    description: `Prix médian ${m2(c.med)} sur ${nombre(c.n)} ventes DVF 2024-2025, loyers de marché et exemple de rentabilité à ${nomCourt(c.commune)}.`,
  };
}

export default function PageCommune({ params }: { params: { cp: string } }) {
  const c = parSlug(params.cp);
  if (!c) notFound();
  const commune = nomCourt(c.commune);
  const typeEx = c.A && c.A.n >= SEUIL_FIABILITE && c.loyerA ? "Appartement" : "Maison";
  const surfaceEx = typeEx === "Appartement" ? 42 : 85;
  const ex = exempleSecteur(c.cp, typeEx, surfaceEx);
  const evo = evolution(c);
  const rendA = c.A && c.A.n >= SEUIL_FIABILITE ? rendementSecteur(c, "Appartement") : null;
  const rendM = c.M && c.M.n >= SEUIL_FIABILITE ? rendementSecteur(c, "Maison") : null;
  const loyer = loyerMarche(c, typeEx);

  return (
    <div className="page conteneur">
      <p className="petit" style={{ margin: "0 0 12px" }}>
        <Link href="/marche">Prix du marché</Link> / {c.cp}
      </p>
      <div className="page-titre">
        <h1 className="titre-l">
          Prix immobilier et rentabilité locative à {commune}
        </h1>
        <p className="chapo">
          Code postal {c.cp}. {nombre(c.n)} ventes de logements enregistrées entre janvier 2024 et décembre 2025.
        </p>
      </div>

      <div className="commune-kpi">
        <div className="tuile">
          <div className="tuile-label">Prix médian, tous logements</div>
          <div className="tuile-valeur">{m2(c.med)}</div>
        </div>
        <div className="tuile">
          <div className="tuile-label">Évolution 2024 → 2025</div>
          <div className={`tuile-valeur ${evo === null ? "" : evo >= 0 ? "positif" : "negatif"}`}>
            {evo === null ? "—" : `${evo >= 0.05 ? "+" : ""}${pct(evo)}`}
          </div>
        </div>
        <div className="tuile">
          <div className="tuile-label">Rendement brut, appartement</div>
          <div className="tuile-valeur">{pct(rendA)}</div>
        </div>
        <div className="tuile">
          <div className="tuile-label">Rendement brut, maison</div>
          <div className="tuile-valeur">{pct(rendM)}</div>
        </div>
      </div>

      <div className="commune-grille">
        <section className="verre">
          <h2>Les prix de vente</h2>
          <table className="tableau">
            <thead>
              <tr><th>Type</th><th className="num">Ventes</th><th className="num">Médiane</th><th className="num">Moitié des ventes entre</th></tr>
            </thead>
            <tbody>
              {(
                [
                  ["Appartements", c.A],
                  ["Maisons", c.M],
                ] as const
              ).map(([l, s]) => (
                <tr key={l}>
                  <td>{l}</td>
                  <td className="num">{s ? nombre(s.n) : 0}</td>
                  <td className="num">{s && s.n >= SEUIL_FIABILITE ? m2(s.med) : <span className="discret">trop peu de ventes</span>}</td>
                  <td className="num">{s && s.n >= SEUIL_FIABILITE ? `${m2(s.p25)} – ${m2(s.p75)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="aide">Source : DVF (DGFiP). Les médianes ne sont affichées qu'à partir de {SEUIL_FIABILITE} ventes.</p>
        </section>

        <section className="verre">
          <h2>Les loyers de marché</h2>
          <table className="tableau">
            <tbody>
              <tr><td>Appartement</td><td className="num">{c.loyerA ? `${loyerM2(c.loyerA)} charges comprises` : "—"}</td></tr>
              <tr><td>Maison</td><td className="num">{c.loyerM ? `${loyerM2(c.loyerM)} charges comprises` : "—"}</td></tr>
            </tbody>
          </table>
          {loyer ? (
            <p className="petit" style={{ margin: 0 }}>
              Pour {surfaceEx} m², le loyer de marché ressort à environ {euros(loyer * surfaceEx)} par mois, charges comprises.
            </p>
          ) : null}
          <p className="aide">Source : carte des loyers 2025, ministère du Logement. Loyers d'annonce de logements non meublés.</p>
        </section>
      </div>

      {ex ? (
        <section className="verre" style={{ marginTop: 20, padding: 24, display: "grid", gap: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 500 }}>
            Exemple : {typeEx === "Appartement" ? "un T2 de 42 m²" : "une maison de 85 m²"} acheté au prix médian
          </h2>
          <p className="petit" style={{ margin: 0 }}>
            Prix {euros(ex.prix)}, loué meublé {euros(ex.loyer)} par mois, crédit sur 20 ans à 3,3 % avec 10 % d'apport, régime LMNP réel, TMI 30 %.
          </p>
          <div className="commune-kpi">
            <div className="tuile"><div className="tuile-label">Score Rentimo</div><div className="tuile-valeur">{ex.score.total}/100</div></div>
            <div className="tuile"><div className="tuile-label">Rendement net</div><div className="tuile-valeur">{pct(ex.r.rendement_net_pct)}</div></div>
            <div className="tuile"><div className="tuile-label">Cash-flow mensuel</div><div className={`tuile-valeur ${ex.r.cashflow_mensuel >= 0 ? "positif" : "negatif"}`}>{eurosSigne(ex.r.cashflow_mensuel)}</div></div>
            <div className="tuile"><div className="tuile-label">TRI sur 20 ans</div><div className="tuile-valeur">{pct(ex.r.tri_pct)}</div></div>
          </div>
          <Link
            href={`/simulateur?cp=${c.cp}&type=${typeEx}&surface=${surfaceEx}&prix=${ex.prix}&loyer=${ex.loyer}`}
            className="btn btn-clair"
            style={{ justifySelf: "start" }}
          >
            Simuler un bien à {commune} <span className="fleche" aria-hidden="true">→</span>
          </Link>
        </section>
      ) : null}
    </div>
  );
}
