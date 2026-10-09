"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCompte } from "@/lib/useCompte";
import { euros, eurosSigne, pct } from "@/lib/format";
import { LIBELLES_REGIME, type Regime } from "@/lib/calculs";
import { OFFRE } from "@/lib/config";

interface Ligne {
  id: string;
  nom: string;
  ville: string | null;
  code_postal: string | null;
  created_at: string;
  prix_achat: number;
  loyer_mensuel: number;
  regime_fiscal: Regime;
  share_token: string | null;
  resultats_json: {
    rendement_brut_pct?: number;
    rendement_net_pct?: number;
    rendement_net_net_pct?: number;
    cashflow_mensuel?: number;
    tri_pct?: number | null;
    score?: number;
    prix_m2?: number;
    enrichissement_total?: number;
  };
}

export function TableauDeBord() {
  const compte = useCompte();
  const router = useRouter();
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [choix, setChoix] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!compte.pret) return;
    if (!compte.session) {
      router.replace("/connexion?suite=/dashboard");
      return;
    }
    supabase()
      .from("simulations")
      .select("id,nom,ville,code_postal,created_at,prix_achat,loyer_mensuel,regime_fiscal,share_token,resultats_json")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErreur(error.message);
        setLignes((data as Ligne[]) ?? []);
      });
  }, [compte.pret, compte.session, router]);

  async function supprimer(id: string) {
    if (!window.confirm("Supprimer cette simulation ?")) return;
    const { error } = await supabase().from("simulations").delete().eq("id", id);
    if (error) setErreur(error.message);
    else {
      setLignes((l) => (l ?? []).filter((x) => x.id !== id));
      setChoix((c) => c.filter((x) => x !== id));
    }
  }

  async function deconnexion() {
    await supabase().auth.signOut();
    router.push("/");
  }

  const comparees = (lignes ?? []).filter((l) => choix.includes(l.id));
  const plan = compte.pro ? (compte.abonnement?.status === "trialing" ? "Pro (essai)" : "Pro") : "Gratuit";

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <div className="page-titre" style={{ marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <h1 className="titre-l">Mon espace</h1>
          <p className="petit" style={{ margin: 0 }}>
            {compte.session?.user.email} · offre <b>{plan}</b>
            {compte.pro && compte.abonnement?.current_period_end
              ? ` jusqu'au ${new Date(compte.abonnement.current_period_end).toLocaleDateString("fr-FR")}`
              : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/simulateur" className="btn btn-clair" onClick={() => { try { localStorage.removeItem("rentimo:brouillon"); } catch { /* */ } }}>
            Nouvelle simulation
          </Link>
          <Link href="/compte" className="btn btn-contour">Compte et offre</Link>
          <button type="button" className="btn-texte" onClick={deconnexion}>Se déconnecter</button>
        </div>
      </div>

      {!compte.pro && lignes ? (
        <p className="message">
          Compte gratuit : {lignes.length} / {OFFRE.gratuitSauvegardes} simulations enregistrées.{" "}
          <Link href="/tarifs">Passer en Pro</Link> pour des simulations illimitées et des rapports à votre nom.
        </p>
      ) : null}
      {erreur ? <p className="message erreur">{erreur}</p> : null}

      {lignes === null ? (
        <p className="petit">Chargement…</p>
      ) : lignes.length === 0 ? (
        <div className="verre" style={{ padding: 32, display: "grid", gap: 14, justifyItems: "start" }}>
          <h2 className="titre-m">Aucune simulation enregistrée</h2>
          <p className="petit" style={{ margin: 0 }}>Lancez une simulation puis cliquez sur « Enregistrer » pour la retrouver ici.</p>
          <Link href="/simulateur" className="btn btn-clair">Lancer une simulation</Link>
        </div>
      ) : (
        <div className="verre defile-x" style={{ padding: 8 }}>
          <table className="tableau">
            <thead>
              <tr>
                <th><span className="sr-only">Comparer</span></th>
                <th>Simulation</th>
                <th className="num">Prix</th>
                <th className="num">Rendement net</th>
                <th className="num">Cash-flow</th>
                <th className="num">TRI</th>
                <th className="num">Score</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => {
                const r = l.resultats_json ?? {};
                return (
                  <tr key={l.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Comparer ${l.nom}`}
                        checked={choix.includes(l.id)}
                        disabled={!choix.includes(l.id) && choix.length >= 4}
                        onChange={(e) => setChoix((c) => (e.target.checked ? [...c, l.id] : c.filter((x) => x !== l.id)))}
                      />
                    </td>
                    <td>
                      <Link href={`/simulateur?id=${l.id}`}>{l.nom}</Link>
                      <div className="aide">
                        {[l.ville, l.code_postal].filter(Boolean).join(" ")} · {new Date(l.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="num">{euros(l.prix_achat)}</td>
                    <td className="num">{pct(r.rendement_net_pct)}</td>
                    <td className={`num ${(r.cashflow_mensuel ?? 0) >= 0 ? "positif" : "negatif"}`}>{eurosSigne(r.cashflow_mensuel ?? 0)}</td>
                    <td className="num">{pct(r.tri_pct ?? null)}</td>
                    <td className="num">{r.score ?? "—"}</td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      {l.share_token ? (
                        <a href={`/s/${l.share_token}`} className="btn-texte" style={{ marginRight: 12 }}>Lien</a>
                      ) : null}
                      <button type="button" className="btn-texte" onClick={() => supprimer(l.id)}>Supprimer</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {comparees.length >= 2 ? (
        <section className="verre defile-x" style={{ padding: 20 }} aria-label="Comparaison">
          <h2 className="titre-m" style={{ marginBottom: 14 }}>Comparaison</h2>
          <table className="tableau">
            <thead>
              <tr>
                <th>Critère</th>
                {comparees.map((c) => <th key={c.id} className="num">{c.nom}</th>)}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Prix d'achat", (c: Ligne) => euros(c.prix_achat)],
                  ["Prix au m²", (c: Ligne) => (c.resultats_json.prix_m2 ? euros(c.resultats_json.prix_m2) : "—")],
                  ["Loyer mensuel", (c: Ligne) => euros(c.loyer_mensuel)],
                  ["Rendement brut", (c: Ligne) => pct(c.resultats_json.rendement_brut_pct)],
                  ["Rendement net", (c: Ligne) => pct(c.resultats_json.rendement_net_pct)],
                  ["Net-net après impôt", (c: Ligne) => pct(c.resultats_json.rendement_net_net_pct)],
                  ["Cash-flow mensuel", (c: Ligne) => eurosSigne(c.resultats_json.cashflow_mensuel ?? 0)],
                  ["TRI avec revente", (c: Ligne) => pct(c.resultats_json.tri_pct ?? null)],
                  ["Enrichissement net", (c: Ligne) => euros(c.resultats_json.enrichissement_total ?? 0)],
                  ["Régime fiscal", (c: Ligne) => LIBELLES_REGIME[c.regime_fiscal] ?? c.regime_fiscal],
                  ["Score", (c: Ligne) => String(c.resultats_json.score ?? "—")],
                ] as [string, (c: Ligne) => string][]
              ).map(([label, f]) => {
                return (
                  <tr key={label}>
                    <td>{label}</td>
                    {comparees.map((c) => <td key={c.id} className="num">{f(c)}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="aide" style={{ marginTop: 10 }}>Le meilleur score l'emporte, critère par critère : rendement, cash-flow, prix face au marché et TRI.</p>
        </section>
      ) : lignes && lignes.length >= 2 ? (
        <p className="aide">Cochez deux à quatre simulations pour les comparer côte à côte.</p>
      ) : null}
    </div>
  );
}
