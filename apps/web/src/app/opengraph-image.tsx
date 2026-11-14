import { ImageResponse } from "next/og";

// The banner link previews show (WhatsApp, X, LinkedIn, Slack…): the mark, the promise, and the
// island catching a fake bank SMS — the product in one picture.
export const alt = "Pause & Verify — pause before you pay. A free anti-scam assistant for India.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARK = "M19 20.5 V27.5 Q19 35 25.30 30.93 L29.70 28.07 Q36 24 29.70 19.93 L25.30 17.07 Q19 13 19 20.5 Z";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FBF8F6", padding: 64, fontFamily: "sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", right: -160, top: -160, width: 620, height: 620, borderRadius: 620, background: "#F6C4C8", opacity: 0.55, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", width: 600, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width="72" height="72" viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#E8505B" /><g fill="#fff" transform="translate(0.8 0)"><rect x="10.4" y="13" width="5.2" height="22" rx="2.6" /><path d={MARK} /></g></svg>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#1F1D1B", display: "flex" }}>pause<span style={{ color: "#E8505B" }}>&amp;</span>verify</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1.02, letterSpacing: -4, color: "#1F1D1B" }}>
              <div style={{ display: "flex" }}>Pause before</div>
              <div style={{ display: "flex" }}>you&nbsp;<span style={{ color: "#E8505B" }}>pay.</span></div>
            </div>
            <div style={{ fontSize: 28, color: "#5E5852", marginTop: 20, lineHeight: 1.35, display: "flex" }}>
              Spots scam warning signs where you read — and explains them in nine Indian languages.
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {["Free", "On-device", "অসমীয়া · बड़ो · Khasi · Mizo"].map((t) => (
              <div key={t} style={{ display: "flex", padding: "10px 20px", borderRadius: 999, background: "#fff", border: "1px solid #E7DFD9", fontSize: 22, color: "#1F1D1B" }}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: 40, flex: 1, gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: 28, padding: 26, boxShadow: "0 20px 50px rgba(31,29,27,0.14)", fontSize: 22, color: "#2C2926", lineHeight: 1.45 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, display: "flex" }}>VM-SBIBNK</div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              Your SBI account will be&nbsp;<span style={{ background: "#FBE3E5", color: "#B42331" }}>BLOCKED in 10 minutes.</span>&nbsp;Update KYC:&nbsp;<span style={{ color: "#B42331", textDecoration: "underline" }}>sbi-kyc-verify.xyz</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: 26, padding: "20px 24px", boxShadow: "0 20px 50px rgba(31,29,27,0.18)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#FBE3E5", display: "flex", alignItems: "center", justifyContent: "center", color: "#D1242F", fontSize: 32 }}>!</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1F1D1B" }}>Hold on. This looks like a scam.</div>
              <div style={{ fontSize: 20, color: "#6B645E", marginTop: 4 }}>4 warning signs · the link isn’t SBI’s</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
