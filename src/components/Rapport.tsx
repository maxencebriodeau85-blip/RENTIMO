import { LIBELLES_REGIME, type Entree, type Resultats, type Score } from "@/lib/calculs";
import { euros, eurosSigne, m2, nombre, pct, loyerM2 } from "@/lib/format";
import { GraphiqueProjection } from "./Courbe";
import type { Profil } from "@/lib/useCompte";

export interface MarcheRapport {
  commune: string;
  n: number;
  med: number;
  p25: number;
  p75: number;
  repli: boolean;
  loyerM2: number | null;
}

export function Rapport({
  e,
  r,
  score,
  marche,
  conseiller,
  date,
}: {
  e: Entree;
  r: Resultats;
  score: Score;
  marche?: MarcheRapport | null;
  conseiller?: Profil | null;
  date: string;
}) {
  const marque = conseiller?.societe || conseiller?.nom;
  const H = r.projection.length;
  return (
    <article className="rapport">
      <header className="rapport-tete">
        <div>
          <div className="rapport-marque">{marque || "Rentimo"}</div>
          {conseiller ? (
            <div className="rapport-contact">
              {[conseiller.nom && conseiller.societe ? conseiller.nom : null, conseiller.telephone, conseiller.email_contact, conseiller.site_web]
                .filter(Boolean)
                .join("  ·  ")}
            </div>
          ) : null}
        </div>
        <div className="rapport-date">
          Étude de rentabilité locative
          <br />
          {date}
        </div>
      </header>

      <section className="rapport-titre">
        <h1>{e.nom || "Simulation"}</h1>
        <p>
          {e.type_local} {e.type_bien === "neuf" ? "neuf" : "ancien"}
          {e.surface ? ` · ${nombre(e.surface)} m²` : ""}
          {e.ville || e.code_postal ? ` · ${[e.ville, e.code_postal].filter(Boolean).join(" ")}` : ""}
          {` · ${LIBELLES_REGIME[e.regime_fiscal]}`}
        </p>
      </section>

      <section className="rapport-synthese">
        <div className="rapport-score">
          <b>{score.total}</b>
          <span>/100</span>
          <em>{score.libelle}</em>
        </div>
        <dl className="rapport-kpi">
          <div><dt>Rendement brut</dt><dd>{pct(r.rendement_brut_pct)}</dd></div>
          <div><dt>Rendement net</dt><dd>{pct(r.rendement_net_pct)}</dd></div>
          <div><dt>Net-net après impôt</dt><dd>{pct(r.rendement_net_net_pct)}</dd></div>
          <div><dt>Cash-flow mensuel</dt><dd className={r.cashflow_mensuel >= 0 ? "pos" : "neg"}>{eurosSigne(r.cashflow_mensuel)}</dd></div>
          <div><dt>TRI sur {H} ans</dt><dd>{pct(r.tri_pct)}</dd></div>
          <div><dt>Enrichissement net</dt><dd>{euros(r.enrichissement_total)}</dd></div>
        </dl>
      </section>

      <div className="rapport-colonnes">
        <section>
          <h2>Acquisition et financement</h2>
          <table>
            <tbody>
              <tr><td>Prix d'achat</td><td>{euros(e.prix_achat)}</td></tr>
              <tr><td>Frais de notaire{e.frais_notaire > 0 ? "" : " (estimés)"}</td><td>{euros(r.frais_notaire_retenus)}</td></tr>
              {e.travaux > 0 && <tr><td>Travaux</td><td>{euros(e.travaux)}</td></tr>}
              {e.mobilier > 0 && <tr><td>Mobilier</td><td>{euros(e.mobilier)}</td></tr>}
              {e.frais_bancaires > 0 && <tr><td>Frais bancaires et garantie</td><td>{euros(e.frais_bancaires)}</td></tr>}
              <tr className="total"><td>Coût total</td><td>{euros(r.cout_total)}</td></tr>
              <tr><td>Apport</td><td>{euros(Math.min(e.apport, r.cout_total))}</td></tr>
              <tr><td>Emprunt</td><td>{euros(r.capital_emprunte)}</td></tr>
              {r.capital_emprunte > 0 && (
                <tr><td>Crédit {nombre(e.duree_credit)} ans à {pct(e.taux_credit, 2)}</td><td>{euros(r.mensualite + r.mensualite_assurance)}/mois</td></tr>
              )}
              {e.surface > 0 && <tr><td>Prix au m²</td><td>{m2(r.prix_m2)}</td></tr>}
            </tbody>
          </table>
        </section>
        <section>
          <h2>Revenus et charges, année 1</h2>
          <table>
            <tbody>
              <tr><td>Loyer mensuel hors charges</td><td>{euros(e.loyer_mensuel)}</td></tr>
              <tr><td>Loyers encaissés (vacance {pct(e.vacance_pct)})</td><td>{euros(r.loyer_annuel_effectif)}</td></tr>
              <tr><td>Charges d'exploitation</td><td>−{euros(r.charges_annuelles)}</td></tr>
              <tr><td>Intérêts et assurance</td><td>−{euros(r.projection[0].interets + r.projection[0].assurance_emprunteur)}</td></tr>
              <tr><td>Capital remboursé</td><td>−{euros(r.projection[0].capital_rembourse)}</td></tr>
              <tr><td>Impôt ({LIBELLES_REGIME[e.regime_fiscal]}, TMI {e.tmi_utilisateur} %)</td><td>{r.impot_annee1 > 0 ? "−" : ""}{euros(Math.abs(r.impot_annee1))}</td></tr>
              <tr className="total"><td>Cash-flow annuel</td><td>{eurosSigne(r.projection[0].cashflow)}</td></tr>
            </tbody>
          </table>
        </section>
      </div>

      {marche ? (
        <section className="rapport-marche">
          <h2>Marché local · {marche.commune}</h2>
          <p>
            Prix médian {m2(marche.med)} (moitié des ventes entre {m2(marche.p25)} et {m2(marche.p75)}), sur {nombre(marche.n)} ventes
            DVF 2024-2025{marche.repli ? ", tous types de biens confondus" : ""}. Prix de ce bien : <b>{m2(r.prix_m2)}</b>, soit{" "}
            <b>{pct(((r.prix_m2 - marche.med) / marche.med) * 100)}</b> par rapport à la médiane.
            {marche.loyerM2 ? (
              <>
                {" "}Loyer de marché : {loyerM2(marche.loyerM2)} charges comprises, soit environ {euros(marche.loyerM2 * e.surface)} par mois pour {nombre(e.surface)} m².
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      <section>
        <h2>Fiscalité comparée</h2>
        <table className="rapport-fisc">
          <thead>
            <tr><th>Régime</th><th>Impôt année 1</th><th>Impôt moyen 10 ans</th><th>Cash-flow mensuel an 1</th><th>TRI</th></tr>
          </thead>
          <tbody>
            {r.regimes.map((g) => (
              <tr key={g.regime} className={g.regime === e.regime_fiscal ? "choisi" : ""}>
                <td>
                  {LIBELLES_REGIME[g.regime]}
                  {g.regime === r.meilleur_regime ? " ★" : ""}
                </td>
                {g.eligible ? (
                  <>
                    <td>{euros(g.impot_annee1)}</td>
                    <td>{euros(g.impot_moyen_10ans)}</td>
                    <td>{eurosSigne(g.cashflow_mensuel_annee1)}</td>
                    <td>{pct(g.tri_pct)}</td>
                  </>
                ) : (
                  <td colSpan={4}>Non accessible : {g.raison}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rapport-note">★ régime le moins imposé en moyenne sur dix ans. Ligne surlignée : régime retenu pour l'étude.</p>
      </section>

      <section className="rapport-projection">
        <h2>Projection sur {H} ans</h2>
        <GraphiqueProjection
          etiquettes={r.projection.map((p) => `An ${p.annee}`)}
          format={(v) => `${Math.round(v / 1000)} k€`}
          series={[
            { nom: "Patrimoine net (valeur − capital restant dû)", valeurs: r.projection.map((p) => p.patrimoine_net), couleur: "#2f7d5f" },
            { nom: "Cash-flow cumulé", valeurs: r.projection.map((p) => p.cashflow_cumule), couleur: "#8a94a3", tirets: true },
          ]}
        />
        <p className="rapport-legende">
          <span className="trait plein" /> Patrimoine net <span className="trait tirets" /> Cash-flow cumulé
        </p>
        <table className="rapport-annees">
          <thead>
            <tr><th>Année</th><th>Loyers</th><th>Charges</th><th>Intérêts</th><th>Impôt</th><th>Cash-flow</th><th>Capital restant</th><th>Valeur du bien</th></tr>
          </thead>
          <tbody>
            {r.projection.map((p) => (
              <tr key={p.annee}>
                <td>{p.annee}</td>
                <td>{nombre(p.loyers)}</td>
                <td>{nombre(p.charges)}</td>
                <td>{nombre(p.interets)}</td>
                <td>{nombre(p.impot)}</td>
                <td className={p.cashflow >= 0 ? "pos" : "neg"}>{nombre(p.cashflow)}</td>
                <td>{nombre(p.capital_restant)}</td>
                <td>{nombre(p.valeur_bien)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rapport-note">
          Revente après {H} ans au prix revalorisé de {pct(e.revalo_bien_pct)} par an, frais de vente de {pct(e.frais_revente_pct)} :
          impôt sur la plus-value estimé à {euros(r.impot_plus_value)}. Loyers revalorisés de {pct(e.revalo_loyer_pct)} par an, charges de 2 %.
        </p>
      </section>

      <footer className="rapport-pied">
        Estimation fondée sur les hypothèses ci-dessus et sur les règles fiscales applicables aux revenus 2025-2026 ; elle ne
        constitue ni un conseil en investissement, ni un conseil fiscal. Prix : DVF (DGFiP). Loyers : carte des loyers 2025.
        {marque ? " Étude réalisée avec Rentimo." : " rentimo · simulateur de rentabilité locative."}
      </footer>
    </article>
  );
}
