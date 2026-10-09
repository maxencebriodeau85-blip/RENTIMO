export function Marque({ taille = 22 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="2.5" width="14" height="19" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8" y="6" width="3" height="2.6" fill="currentColor" opacity="0.35" />
      <rect x="13" y="6" width="3" height="2.6" fill="currentColor" opacity="0.35" />
      <rect x="8" y="10.4" width="3" height="2.6" fill="currentColor" opacity="0.35" />
      <rect x="13" y="10.4" width="3" height="2.6" fill="#f0b467" />
      <rect x="8" y="14.8" width="3" height="2.6" fill="currentColor" opacity="0.35" />
      <rect x="13" y="14.8" width="3" height="2.6" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
