"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCompte, type Profil } from "@/lib/useCompte";
import { OFFRE } from "@/lib/config";
import { lienPaiement } from "@/lib/paiement";
import { euros } from "@/lib/format";

const VIDE: Profil = { nom: "", societe: "", telephone: "", email_contact: "", site_web: "" };

export function Compte() {
  const compte = useCompte();
  const router = useRouter();
  const [profil, setProfil] = useState<Profil>(VIDE);
  const [msgProfil, setMsgProfil] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);
  const [msgPlan, setMsgPlan] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);

  useEffect(() => {
    if (compte.pret && !compte.session) router.replace("/connexion?suite=/compte");
    if (compte.profil) setProfil({ ...VIDE, ...compte.profil });
  }, [compte.pret, compte.session, compte.profil, router]);

  async function enregistrerProfil(ev: React.FormEvent) {
    ev.preventDefault();
    if (!compte.session) return;
    const nettoye = Object.fromEntries(Object.entries(profil).map(([k, v]) => [k, (v ?? "").toString().trim() || null]));
    const { error } = await supabase()
      .from("profils")
      .upsert({ user_id: compte.session.user.id, ...nettoye, updated_at: new Date().toISOString() });
    setMsgProfil(error ? { type: "erreur", texte: error.message } : { type: "ok", texte: "Coordonnées enregistrées. Elles apparaissent sur vos rapports et liens de partage." });
    if (!error) compte.recharger();
  }

  async function demarrerEssai() {
    setMsgPlan(null);
    const { error } = await supabase().rpc("demarrer_essai_pro");
    if (error) {
      setMsgPlan({
        type: "erreur",
        texte: error.message.includes("ESSAI_DEJA_UTILISE") ? "L'essai gratuit a déjà été utilisé sur ce compte." : error.message,
      });
      return;
    }
    setMsgPlan({ type: "ok", texte: `Essai Pro activé pour ${OFFRE.essaiJours} jours. Renseignez vos coordonnées ci-dessous pour les voir sur vos rapports.` });
    compte.recharger();
  }

  if (!compte.pret || !compte.session) return <p className="petit">Chargement…</p>;

  const id = compte.session.user.id;
  const email = compte.session.user.email;
  const liens = {
    fondateur: lienPaiement("fondateur", id, email),
    mensuel: lienPaiement("proMensuel", id, email),
    annuel: lienPaiement("proAnnuel", id, email),
  };
  const statut = compte.abonnement;
  const champ = (k: keyof Profil, label: string, type = "text", aide?: string) => (
    <div className="champ">
      <label htmlFor={k}>{label}</label>
      <input id={k} type={type} value={profil[k] ?? ""} maxLength={k === "nom" ? 120 : 160} onChange={(e) => setProfil({ ...profil, [k]: e.target.value })} />
      {aide ? <span className="aide">{aide}</span> : null}
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <div className="page-titre" style={{ marginBottom: 0 }}>
        <h1 className="titre-l">Compte et offre</h1>
        <p className="petit" style={{ margin: 0 }}>{email}</p>
      </div>

      <div className="grille-2">
        <section className="verre" style={{ padding: 24, display: "grid", gap: 14, alignContent: "start" }}>
          <h2 className="titre-m">Votre offre</h2>
          {compte.pro ? (
            <p style={{ margin: 0 }}>
              <span className="badge lueur">{statut?.status === "trialing" ? "Essai Pro" : "Pro"}</span>{" "}
              {statut?.current_period_end ? `jusqu'au ${new Date(statut.current_period_end).toLocaleDateString("fr-FR")}` : ""}
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              <span className="badge">Gratuit</span> {OFFRE.gratuitSauvegardes} simulations enregistrées, rapport au nom de Rentimo.
            </p>
          )}

          {!compte.pro || statut?.status === "trialing" ? (
            <>
              <p className="petit" style={{ margin: 0 }}>
                Pro : simulations illimitées, rapports et liens de partage à votre nom. {OFFRE.proMensuel} € par mois sans engagement, ou{" "}
                {OFFRE.proAnnuel} € par an. Offre fondateur : {OFFRE.fondateurMensuel} € par mois à vie pour les {OFFRE.fondateurPlaces} premiers comptes.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {!compte.pro ? (
                  <button type="button" className="btn btn-clair" onClick={demarrerEssai}>
                    Essayer Pro {OFFRE.essaiJours} jours
                  </button>
                ) : null}
                {liens.fondateur ? (
                  <a className="btn btn-contour" href={liens.fondateur}>Offre fondateur · {euros(OFFRE.fondateurMensuel)}/mois</a>
                ) : null}
                {liens.mensuel ? <a className="btn btn-contour" href={liens.mensuel}>Payer {euros(OFFRE.proMensuel)}/mois</a> : null}
                {liens.annuel ? <a className="btn btn-contour" href={liens.annuel}>Payer {euros(OFFRE.proAnnuel)}/an</a> : null}
                {!liens.fondateur && !liens.mensuel ? (
                  <Link className="btn btn-contour" href="/pro#contact">Demander l'offre fondateur</Link>
                ) : null}
              </div>
              {msgPlan ? <p className={`message ${msgPlan.type}`} style={{ margin: 0 }}>{msgPlan.texte}</p> : null}
            </>
          ) : (
            <p className="petit" style={{ margin: 0 }}>Pour modifier ou résilier votre abonnement, utilisez le lien reçu dans l'e-mail de paiement Stripe, ou écrivez-nous.</p>
          )}
        </section>

        <form className="verre" style={{ padding: 24, display: "grid", gap: 14 }} onSubmit={enregistrerProfil}>
          <h2 className="titre-m">Vos coordonnées sur les rapports</h2>
          <p className="petit" style={{ margin: 0 }}>
            {compte.pro
              ? "Elles remplacent la marque Rentimo en tête de vos rapports et sur vos liens de partage."
              : "Réservé à l'offre Pro : vous pouvez les préparer dès maintenant."}
          </p>
          {champ("nom", "Nom et prénom")}
          {champ("societe", "Agence ou société", "text", "Affichée en tête du rapport")}
          {champ("telephone", "Téléphone", "tel")}
          {champ("email_contact", "E-mail de contact", "email")}
          {champ("site_web", "Site web", "url")}
          <button type="submit" className="btn btn-clair" style={{ justifySelf: "start" }}>Enregistrer</button>
          {msgProfil ? <p className={`message ${msgProfil.type}`} style={{ margin: 0 }}>{msgProfil.texte}</p> : null}
        </form>
      </div>

      {compte.admin ? <Admin /> : null}
    </div>
  );
}

interface Stats {
  utilisateurs: number;
  utilisateurs_7j: number;
  simulations: number;
  leads: number;
  achats: number;
  ca_cents: number;
  pros_actifs: number;
}

interface Utilisateur {
  email: string;
  inscrit_le: string;
  plan: string;
  statut: string;
  fin: string | null;
  nb_simulations: number;
}

interface Lead {
  id: string;
  created_at: string;
  type: string;
  email: string;
  nom: string | null;
  societe: string | null;
  telephone: string | null;
  message: string | null;
  source: string | null;
}

function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cible, setCible] = useState("");
  const [mois, setMois] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  async function charger() {
    const sb = supabase();
    const [s, u, l] = await Promise.all([
      sb.rpc("admin_stats"),
      sb.rpc("admin_utilisateurs"),
      sb.from("leads").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (s.data) setStats(s.data as Stats);
    if (u.data) setUtilisateurs(u.data as Utilisateur[]);
    if (l.data) setLeads(l.data as Lead[]);
  }

  useEffect(() => {
    charger();
  }, []);

  async function definir(plan: "pro" | "free") {
    setMsg(null);
    const { error } = await supabase().rpc("admin_definir_plan", { email_cible: cible, nouveau_plan: plan, mois });
    setMsg(error ? error.message : `${cible} : offre ${plan === "pro" ? `Pro pour ${mois} mois` : "gratuite"}.`);
    if (!error) charger();
  }

  return (
    <section style={{ display: "grid", gap: 20 }}>
      <h2 className="titre-l">Administration</h2>
      {stats ? (
        <div className="sim-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {[
            ["Comptes", stats.utilisateurs],
            ["Nouveaux (7 j)", stats.utilisateurs_7j],
            ["Simulations", stats.simulations],
            ["Demandes reçues", stats.leads],
            ["Pros actifs", stats.pros_actifs],
          ].map(([l, v]) => (
            <div key={l as string} className="tuile">
              <div className="tuile-label">{l}</div>
              <div className="tuile-valeur">{v}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="verre" style={{ padding: 20, display: "grid", gap: 12 }}>
        <h3 className="titre-m">Activer une offre après paiement</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div className="champ" style={{ minWidth: 260 }}>
            <label htmlFor="cible">E-mail du compte</label>
            <input id="cible" type="email" value={cible} onChange={(e) => setCible(e.target.value)} />
          </div>
          <div className="champ" style={{ width: 120 }}>
            <label htmlFor="mois">Durée (mois)</label>
            <input id="mois" type="number" min={1} max={36} value={mois} onChange={(e) => setMois(Number(e.target.value) || 1)} />
          </div>
          <button type="button" className="btn btn-clair" onClick={() => definir("pro")} disabled={!cible}>Passer en Pro</button>
          <button type="button" className="btn btn-contour" onClick={() => definir("free")} disabled={!cible}>Repasser en gratuit</button>
        </div>
        {msg ? <p className="message">{msg}</p> : null}
      </div>

      <div className="verre defile-x" style={{ padding: 12 }}>
        <h3 className="titre-m" style={{ padding: "8px 8px 12px" }}>Demandes ({leads.length})</h3>
        <table className="tableau">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Contact</th><th>Société</th><th>Message</th><th>Source</th></tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.created_at).toLocaleDateString("fr-FR")}</td>
                <td><span className="badge">{l.type}</span></td>
                <td>
                  <a href={`mailto:${l.email}`}>{l.email}</a>
                  <div className="aide">{[l.nom, l.telephone].filter(Boolean).join(" · ")}</div>
                </td>
                <td>{l.societe}</td>
                <td style={{ maxWidth: 320 }}>{l.message}</td>
                <td className="aide">{l.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="verre defile-x" style={{ padding: 12 }}>
        <h3 className="titre-m" style={{ padding: "8px 8px 12px" }}>Comptes ({utilisateurs.length})</h3>
        <table className="tableau">
          <thead>
            <tr><th>E-mail</th><th>Inscription</th><th>Offre</th><th>Fin</th><th className="num">Simulations</th></tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.email}>
                <td>{u.email}</td>
                <td>{new Date(u.inscrit_le).toLocaleDateString("fr-FR")}</td>
                <td>{u.plan} · {u.statut}</td>
                <td>{u.fin ? new Date(u.fin).toLocaleDateString("fr-FR") : "—"}</td>
                <td className="num">{u.nb_simulations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
