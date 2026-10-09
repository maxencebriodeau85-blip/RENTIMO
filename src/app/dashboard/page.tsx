import type { Metadata } from "next";
import { TableauDeBord } from "./TableauDeBord";

export const metadata: Metadata = {
  title: "Mon espace",
  robots: { index: false },
};

export default function PageDashboard() {
  return (
    <div className="page conteneur">
      <TableauDeBord />
    </div>
  );
}
