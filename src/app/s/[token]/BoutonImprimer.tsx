"use client";

export function BoutonImprimer() {
  return (
    <button type="button" className="btn btn-clair" onClick={() => window.print()}>
      Imprimer ou enregistrer en PDF
    </button>
  );
}
