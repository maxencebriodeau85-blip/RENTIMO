import type { Metadata } from "next";
import { Compte } from "./Compte";

export const metadata: Metadata = {
  title: "Compte et offre",
  robots: { index: false },
};

export default function PageCompte() {
  return (
    <div className="page conteneur">
      <Compte />
    </div>
  );
}
