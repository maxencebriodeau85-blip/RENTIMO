"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Mode = "connexion" | "inscription" | "lien";

function traduire(message: string): string {
  if (/invalid login credentials/i.test(message)) return "E-mail ou mot de passe incorrect.";
  if (/email not confirmed/i.test(message)) return "Confirmez d'abord votre adresse : ouvrez le lien reçu par e-mail.";
  if (/already registered/i.test(message)) return "Un compte existe déjà avec cet e-mail. Connectez-vous.";
  if (/password should be at least/i.test(message)) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (/rate limit|too many/i.test(message)) return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (/fetch|network/i.test(message)) return "Connexion au service impossible. Vérifiez votre réseau et réessayez.";
  return message;
}

export function Connexion() {
  const params = useSearchParams();
  const router = useRouter();
  const suite = params.get("suite") && params.get("suite")!.startsWith("/") ? params.get("suite")! : "/dashboard";
  const [mode, setMode] = useState<Mode>(params.get("mode") === "inscription" ? "inscription" : "connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);

  async function valider(ev: React.FormEvent) {
    ev.preventDefault();
    setMessage(null);
    setOccupe(true);
    const sb = supabase();
    const retour = `${window.location.origin}${suite}`;
    try {
      if (mode === "connexion") {
        const { error } = await sb.auth.signInWithPassword({ email, password: motDePasse });
        if (error) throw error;
        router.push(suite);
        return;
      }
      if (mode === "inscription") {
        if (motDePasse.length < 8) throw new Error("Password should be at least 8 characters");
        const { data, error } = await sb.auth.signUp({ email, password: motDePasse, options: { emailRedirectTo: retour } });
        if (error) throw error;
        if (data.session) {
          router.push(suite);
          return;
        }
        setMessage({ type: "ok", texte: "Compte créé. Ouvrez l'e-mail de confirmation pour l'activer, puis revenez vous connecter." });
      } else {
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: retour } });
        if (error) throw error;
        setMessage({ type: "ok", texte: "Lien envoyé. Ouvrez l'e-mail sur cet appareil pour vous connecter." });
      }
    } catch (e) {
      setMessage({ type: "erreur", texte: traduire(e instanceof Error ? e.message : String(e)) });
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div className="page-titre" style={{ marginBottom: 0 }}>
        <h1 className="titre-l">{mode === "inscription" ? "Créer un compte" : "Connexion"}</h1>
        <p className="chapo">
          {mode === "inscription"
            ? "Gratuit. Enregistrez vos simulations, comparez-les et partagez-les par lien."
            : "Retrouvez vos simulations enregistrées."}
        </p>
      </div>

      <div className="pilules" role="tablist" aria-label="Mode de connexion">
        <button type="button" role="tab" className="pilule" aria-selected={mode === "connexion"} onClick={() => setMode("connexion")}>
          Se connecter
        </button>
        <button type="button" role="tab" className="pilule" aria-selected={mode === "inscription"} onClick={() => setMode("inscription")}>
          Créer un compte
        </button>
        <button type="button" role="tab" className="pilule" aria-selected={mode === "lien"} onClick={() => setMode("lien")}>
          Lien par e-mail
        </button>
      </div>

      <form className="verre" style={{ padding: 24, display: "grid", gap: 16 }} onSubmit={valider}>
        <div className="champ">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== "lien" ? (
          <div className="champ">
            <label htmlFor="mdp">Mot de passe</label>
            <input
              id="mdp"
              type="password"
              autoComplete={mode === "inscription" ? "new-password" : "current-password"}
              required
              minLength={mode === "inscription" ? 8 : undefined}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
            {mode === "inscription" ? <span className="aide">8 caractères minimum.</span> : null}
          </div>
        ) : (
          <p className="aide" style={{ margin: 0 }}>Vous recevrez un lien de connexion à usage unique, sans mot de passe.</p>
        )}
        <button className="btn btn-clair" type="submit" disabled={occupe}>
          {mode === "connexion" ? "Se connecter" : mode === "inscription" ? "Créer mon compte" : "Recevoir le lien"}
        </button>
        {message ? <p className={`message ${message.type}`} style={{ margin: 0 }}>{message.texte}</p> : null}
      </form>

      <p className="aide">
        En créant un compte, vous acceptez les <Link href="/cgv">conditions générales</Link> et la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </div>
  );
}
