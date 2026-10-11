export function Marque({ taille = 28 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M4 28V12l12-8 12 8v16H4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 28V17h8v11M10 13h12M16 4v9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M20 17h-8v4h8v-4Z" fill="currentColor" opacity=".15" />
    </svg>
  );
}
