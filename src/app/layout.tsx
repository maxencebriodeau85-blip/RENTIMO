import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import "./rapport.css";
import { Entete } from "@/components/Entete";
import { Pied } from "@/components/Pied";
import { URL_SITE } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: {
    default: "Rentimo — L’immobilier, à sa juste valeur",
    template: "%s · Rentimo",
  },
  description:
    "Simulez un investissement locatif en 2 minutes : rendement net-net, cash-flow, LMNP ou location nue, TRI avec revente — comparé aux ventes réelles DVF de votre secteur.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Rentimo",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f5f3ee",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={GeistSans.variable}>
      <body>
        <a href="#contenu" className="sr-only">
          Aller au contenu
        </a>
        <Entete />
        <main id="contenu">{children}</main>
        <Pied />
      </body>
    </html>
  );
}
