"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function FormulaireContact({
  type,
  bouton = "Envoyer",
  succes = "Merci, demande reçue. Réponse sous 24 h ouvrées.",
  champsPro = true,
  placeholderMessage,
}: {
  type: "pro" | "contact" | "barometre";
  bouton?: string;
  succes?: string;
  champsPro?: boolean;
  placeholderMessage?: string;
}) {
  const [v, setV] = useState({ email: "", nom: "", societe: "", telephone: "", message: "", site: "" });
  const [etat, setEtat] = useState<"repos" | "envoi" | "ok" | "erreur">("repos");
  const [erreur, setErreur] = useState("");

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    if (v.site) return; // champ piège anti-robots
    setEtat("envoi");
    const chemin = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "";
    const source = (type === "barometre" ? `barometre ${chemin}` : chemin).slice(0, 200) || null;
    const { error } = await supabase()
      .from("leads")
      .insert({
        type: type === "barometre" ? "contact" : type,
        email: v.email.trim(),
        nom: v.nom.trim() || null,
        societe: v.societe.trim() || null,
        telephone: v.telephone.trim() || null,
        message: v.message.trim() || null,
        source,
      });
    if (error) {
      setEtat("erreur");
      setErreur(
        /TROP_DE_DEMANDES/.test(error.message)
          ? "Demande déjà reçue. Réponse en cours."
          : /email/i.test(error.message)
            ? "Vérifiez l'adresse e-mail."
            : "Envoi impossible pour le moment. Réessayez dans un instant.",
      );
      return;
    }
    setEtat("ok");
  }

  if (etat === "ok") return <p className="message ok">{succes}</p>;

  return (
    <form onSubmit={envoyer} style={{ display: "grid", gap: 14 }}>
      <div className="grille-2" style={{ gap: 14 }}>
        <div className="champ">
          <label htmlFor={`${type}-email`}>E-mail professionnel</label>
          <input id={`${type}-email`} type="email" required autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </div>
        <div className="champ">
          <label htmlFor={`${type}-nom`}>Nom</label>
          <input id={`${type}-nom`} autoComplete="name" maxLength={120} value={v.nom} onChange={(e) => setV({ ...v, nom: e.target.value })} />
        </div>
        {champsPro ? (
          <>
            <div className="champ">
              <label htmlFor={`${type}-societe`}>Agence ou réseau</label>
              <input id={`${type}-societe`} autoComplete="organization" maxLength={160} value={v.societe} onChange={(e) => setV({ ...v, societe: e.target.value })} />
            </div>
            <div className="champ">
              <label htmlFor={`${type}-tel`}>Téléphone</label>
              <input id={`${type}-tel`} type="tel" autoComplete="tel" maxLength={40} value={v.telephone} onChange={(e) => setV({ ...v, telephone: e.target.value })} />
            </div>
          </>
        ) : null}
      </div>
      <div className="champ">
        <label htmlFor={`${type}-message`}>Message</label>
        <textarea id={`${type}-message`} maxLength={2000} placeholder={placeholderMessage} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} />
      </div>
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor={`${type}-site`}>Site</label>
        <input id={`${type}-site`} tabIndex={-1} autoComplete="off" value={v.site} onChange={(e) => setV({ ...v, site: e.target.value })} />
      </div>
      <button type="submit" className="btn btn-clair" style={{ justifySelf: "start" }} disabled={etat === "envoi"}>
        {etat === "envoi" ? "Envoi…" : bouton}
      </button>
      {etat === "erreur" ? <p className="message erreur">{erreur}</p> : null}
      <p className="aide" style={{ margin: 0 }}>Vos coordonnées servent uniquement à vous répondre. Aucune revente, aucune newsletter imposée.</p>
    </form>
  );
}
