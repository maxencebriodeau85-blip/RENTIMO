"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Marque } from "./Logo";
import { supabase } from "@/lib/supabase";

const LIENS = [
  { href: "/simulateur", label: "Simulateur", cls: "" },
  { href: "/marche", label: "Prix du marché", cls: "lien-secondaire" },
  { href: "/renover", label: "Biens à rénover", cls: "lien-secondaire" },
  { href: "/pro", label: "Offre pro", cls: "lien-tertiaire" },
  { href: "/tarifs", label: "Tarifs", cls: "lien-secondaire" },
];

export function Entete() {
  const chemin = usePathname();
  const [connecte, setConnecte] = useState(false);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => setConnecte(Boolean(data.session))).catch(() => {});
    const { data } = sb.auth.onAuthStateChange((_e, s) => setConnecte(Boolean(s)));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="entete">
      <div className="conteneur entete-int">
        <Link href="/" className="logo" aria-label="Rentimo, accueil">
          <Marque />
          Rentimo
        </Link>
        <nav className="nav" aria-label="Navigation principale">
          {LIENS.map((l) => (
            <Link key={l.href} href={l.href} className={l.cls} aria-current={chemin?.startsWith(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          {connecte ? (
            <Link href="/dashboard" className="btn btn-contour">
              Mon espace
            </Link>
          ) : (
            <Link href="/connexion" className="btn btn-contour">
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
