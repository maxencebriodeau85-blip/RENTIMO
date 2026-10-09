import type { Metadata } from "next";
import { Suspense } from "react";
import { Connexion } from "./Connexion";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false },
};

export default function PageConnexion() {
  return (
    <div className="page conteneur" style={{ maxWidth: 520 }}>
      <Suspense>
        <Connexion />
      </Suspense>
    </div>
  );
}
