import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Rentimo — L’immobilier, à sa juste valeur.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#f5f3ee", color: "#213c32", position: "relative" }}>
      <div style={{ padding: "55px 64px", width: 780, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: 38, letterSpacing: -2, alignItems: "center", gap: 14 }}>
          <svg width="32" height="36" viewBox="0 0 32 32" fill="none"><path d="M4 28V12l12-8 12 8v16H4ZM12 28V17h8v11M10 13h12M16 4v9" stroke="#213c32" strokeWidth="1.7" /></svg>
          rentimo<span style={{ color: "#c46741" }}>.</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 23 }}>
          <div style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "#a74c2d" }}>L’immobilier, en perspective</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 1.03, letterSpacing: -4 }}><span>L’immobilier,</span><span>à sa juste valeur.</span></div>
          <div style={{ fontSize: 23, color: "#646d61", lineHeight: 1.5, maxWidth: 570 }}>Un lieu vous inspire. Nos chiffres vous éclairent.</div>
        </div>
        <div style={{ display: "flex", gap: 27, fontSize: 14, color: "#646d61", borderTop: "1px solid #d7dbd0", paddingTop: 21 }}><span>Simulation gratuite</span><span>Prix réels du marché</span><span>Né en Vendée</span></div>
      </div>
      <div style={{ width: 420, background: "#213c32", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <svg width="360" height="420" viewBox="0 0 360 420" fill="none"><path d="M40 360V140L180 55L320 140V360H40ZM140 360V215H220V360M110 168H250M180 55V168M15 390H345M65 25V390M295 25V390" stroke="#e1dfcd" strokeWidth="2" /><path d="M140 215H220V260H140Z" fill="#c46741" /><path d="M65 390H295M20 200H340M180 5V410" stroke="#e1dfcd" strokeWidth="1" strokeDasharray="4 8" opacity=".3" /></svg>
        <div style={{ position: "absolute", bottom: 40, left: 43, color: "#d7daca", fontSize: 11, letterSpacing: 2 }}>DES PROJETS D’AVENIR.</div>
      </div>
    </div>, size,
  );
}
