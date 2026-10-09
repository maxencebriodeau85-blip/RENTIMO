"use client";

import Link from "next/link";
import { useCompte } from "@/lib/useCompte";
import { lienPaiement } from "@/lib/paiement";
import { OFFRE } from "@/lib/config";

export function BoutonsPro() {
  const compte = useCompte();
  const id = compte.session?.user.id;
  const email = compte.session?.user.email;
  const mensuel = lienPaiement("proMensuel", id, email);
  const annuel = lienPaiement("proAnnuel", id, email);

  if (compte.pro && compte.abonnement?.status === "active") {
    return <Link href="/compte" className="btn btn-contour">Votre offre Pro est active</Link>;
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {compte.session ? (
        <Link href="/compte" className="btn btn-clair">
          {compte.pro ? "Gérer mon essai" : `Essayer ${OFFRE.essaiJours} jours gratuitement`}
        </Link>
      ) : (
        <Link href="/connexion?mode=inscription&suite=/compte" className="btn btn-clair">
          Essayer {OFFRE.essaiJours} jours gratuitement
        </Link>
      )}
      {compte.session && mensuel ? <a className="btn btn-contour" href={mensuel}>Payer {OFFRE.proMensuel} €/mois</a> : null}
      {compte.session && annuel ? <a className="btn btn-contour" href={annuel}>Payer {OFFRE.proAnnuel} €/an</a> : null}
    </div>
  );
}
