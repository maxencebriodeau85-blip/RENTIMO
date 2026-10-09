import type { Metadata } from "next";
import { Suspense } from "react";
import "./simulateur.css";
import { Simulateur } from "@/components/sim/Simulateur";

export const metadata: Metadata = {
  title: "Simulateur de rentabilité locative",
  description:
    "Rendement brut, net et net-net, cash-flow, LMNP micro ou réel, location nue, TRI avec revente : simulez gratuitement votre investissement locatif.",
};

export default function PageSimulateur() {
  return (
    <div className="page">
      <Suspense fallback={<div className="conteneur" style={{ minHeight: "60vh" }} />}>
        <Simulateur />
      </Suspense>
    </div>
  );
}
