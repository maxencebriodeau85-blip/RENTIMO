import Link from "next/link";

export default function Introuvable() {
  return (
    <div className="page conteneur" style={{ minHeight: "50vh", display: "grid", alignContent: "center", gap: 20, justifyItems: "start" }}>
      <h1 className="titre-l">Cette page n'existe pas.</h1>
      <p className="chapo">Le lien est peut-être ancien, ou le partage a été retiré par son auteur.</p>
      <Link href="/" className="btn btn-clair">Retour à l'accueil</Link>
    </div>
  );
}
