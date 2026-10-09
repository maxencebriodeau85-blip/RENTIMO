import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Rentimo — Investissement locatif, en toute clarté";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Fenêtres allumées (1) ou éteintes (0) : 9 étages × 4 baies
const FACADE = [
  [0, 0, 1, 0], [1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 1, 0], [1, 0, 0, 1],
  [1, 0, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0], [1, 0, 1, 1],
];

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(180deg, #070c14 0%, #0d1726 70%, #16243a 100%)", color: "#eceff3", padding: "64px 72px", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30 }}>
            <div style={{ width: 22, height: 32, border: "3px solid #eceff3", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: 3 }}>
              <div style={{ width: 6, height: 6, background: "#f0b467" }} />
            </div>
            Rentimo
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ fontSize: 62, lineHeight: 1.06, letterSpacing: -2, display: "flex", flexDirection: "column" }}>
              <span>Investissement locatif,</span>
              <span>en toute clarté.</span>
            </div>
            <div style={{ fontSize: 28, color: "#a3adb9", lineHeight: 1.35 }}>
              Rendement net-net, cash-flow, fiscalité et prix réels du secteur.
            </div>
          </div>
          <div style={{ fontSize: 22, color: "#a3adb9", display: "flex", gap: 28 }}>
            <span>27 219 ventes DVF en Vendée</span>
            <span>Gratuit</span>
          </div>
        </div>
        <div style={{ position: "absolute", right: 90, top: 70, bottom: 0, width: 330, display: "flex", flexDirection: "column", background: "#172131", padding: "18px 16px 0", gap: 12 }}>
          {FACADE.map((etage, i) => (
            <div key={i} style={{ display: "flex", gap: 12, borderBottom: "5px solid #26324a", paddingBottom: 8 }}>
              {etage.map((on, j) => (
                <div
                  key={j}
                  style={
                    on
                      ? { width: 64, height: 40, backgroundColor: "#f3b36a", backgroundImage: "linear-gradient(135deg, #ffe2b0, #e59a4c)", boxShadow: "0 0 24px rgba(243,179,106,0.55)" }
                      : { width: 64, height: 40, backgroundColor: "#121c2a" }
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
