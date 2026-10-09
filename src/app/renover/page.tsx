import type { Metadata } from "next";
import { Suspense } from "react";
import "../simulateur/simulateur.css";
import "./renover.css";
import { Renover } from "./Renover";

export const metadata: Metadata = {
  title: "Analyser un bien à rénover : travaux DPE, prix maximum, rentabilité",
  description:
    "Passoire énergétique F ou G : estimez les travaux pour atteindre D, la valeur une fois rénové, le prix d'achat à ne pas dépasser, le déficit foncier et la rentabilité après travaux.",
};

export default function PageRenover() {
  return (
    <div className="page">
      <Suspense fallback={<div className="conteneur" style={{ minHeight: "60vh" }} />}>
        <Renover />
      </Suspense>
    </div>
  );
}
