const eur0 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const num0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const num2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Intl insère des espaces fines insécables : on les garde (bonne typographie française).
export const euros = (v: number) => eur0.format(Math.round(v || 0));
export const eurosSigne = (v: number) => (v > 0.5 ? "+" : "") + eur0.format(Math.round(v || 0));
export const nombre = (v: number) => num0.format(Math.round(v || 0));
export const pct = (v: number | null | undefined, d: 1 | 2 = 1) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? "—"
    : `${(d === 1 ? num1 : num2).format(Math.abs(v) < (d === 1 ? 0.05 : 0.005) ? 0 : v)} %`;
export const m2 = (v: number) => `${num0.format(Math.round(v || 0))} €/m²`;
export const loyerM2 = (v: number) => `${num2.format(v || 0)} €/m²`;

export function slugCommune(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
