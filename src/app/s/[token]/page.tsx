import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { calculer, normaliser, scorer, type Entree } from "@/lib/calculs";
import { loyerMarche, parCodePostal, statPrix } from "@/lib/marche";
import { supabaseServeur } from "@/lib/supabase";
import { Rapport } from "@/components/Rapport";
import { BoutonImprimer } from "./BoutonImprimer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Étude de rentabilité partagée",
  robots: { index: false, follow: false },
};

interface Partage {
  nom: string;
  ville: string | null;
  code_postal: string | null;
  input_json: Partial<Entree>;
  created_at: string;
  pro: boolean | null;
  conseiller_nom: string | null;
  conseiller_societe: string | null;
  conseiller_telephone: string | null;
  conseiller_email: string | null;
  conseiller_site: string | null;
}

export default async function PagePartage({ params }: { params: { token: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.token)) notFound();
  const { data, error } = await supabaseServeur().rpc("partage_simulation", { jeton: params.token });
  const ligne = (Array.isArray(data) ? data[0] : data) as Partage | undefined;
  if (error || !ligne) notFound();

  const e = normaliser(ligne.input_json);
  const r = calculer(e);
  const c = parCodePostal(e.code_postal);
  const stat = c ? statPrix(c, e.type_local) : null;
  const score = scorer(r, stat);
  const conseiller = ligne.pro
    ? {
        nom: ligne.conseiller_nom,
        societe: ligne.conseiller_societe,
        telephone: ligne.conseiller_telephone,
        email_contact: ligne.conseiller_email,
        site_web: ligne.conseiller_site,
      }
    : null;
  const date = new Date(ligne.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="page conteneur" style={{ display: "grid", gap: 24 }}>
      <div className="pas-imprime" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <p className="petit" style={{ margin: 0 }}>
          {conseiller?.nom || conseiller?.societe
            ? `Étude partagée par ${[conseiller.nom, conseiller.societe].filter(Boolean).join(", ")}.`
            : "Étude partagée en lecture seule."}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {conseiller?.telephone ? <a className="btn btn-contour" href={`tel:${conseiller.telephone.replace(/\s/g, "")}`}>Appeler</a> : null}
          {conseiller?.email_contact ? <a className="btn btn-contour" href={`mailto:${conseiller.email_contact}?subject=${encodeURIComponent(`Étude : ${e.nom}`)}`}>Écrire</a> : null}
          <BoutonImprimer />
        </div>
      </div>
      <div className="rapport-impression" style={{ display: "block" }}>
        <Rapport
          e={e}
          r={r}
          score={score}
          date={date}
          conseiller={conseiller}
          marche={c && stat ? { commune: c.commune, n: stat.n, med: stat.med, p25: stat.p25, p75: stat.p75, repli: stat.repli, loyerM2: loyerMarche(c, e.type_local) } : null}
        />
      </div>
      <p className="aide pas-imprime" style={{ textAlign: "center" }}>
        Faites vos propres calculs sur <Link href="/simulateur">le simulateur Rentimo</Link>, gratuit.
      </p>
    </div>
  );
}
