// Shared design tokens and small UI primitives.
// Kept in one place so the youth form, portals and admin all look like one product.

export const T = {
  bg: "#F7F5F2",
  card: "#FFFFFF",
  border: "#E2DDD8",
  green: "#1B5E4B",
  greenSoft: "#EEF6F3",
  greenLine: "#A8D5C2",
  gold: "#C9943A",
  goldSoft: "#FFFBF4",
  text: "#1A1A1A",
  mid: "#5A5450",
  soft: "#9A9490",
  danger: "#C0503D",
  dangerSoft: "#FDF1EF",
  font: "'Georgia', serif"
};

// 9-pointed Bahá'í star -- hollow stroke, sharp mitred tips, no effects.
export const BahaiStar = ({ size = 40, variant = "gold" }) => {
  const cx = 60, cy = 60, outerR = 42, innerR = 20;
  const pts = [];
  for (let i = 0; i < 18; i++) {
    const a = (i * 20 - 90) * Math.PI / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(3)},${y.toFixed(3)}`).join(" ") + " Z";
  const gid = `sg_${variant}_${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: "block", flexShrink: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          {variant === "gold" ? <>
            <stop offset="0%" stopColor="#F7D030" />
            <stop offset="35%" stopColor="#D4A020" />
            <stop offset="70%" stopColor="#F0C030" />
            <stop offset="100%" stopColor="#A87010" />
          </> : <>
            <stop offset="0%" stopColor="#2A7A5A" />
            <stop offset="100%" stopColor="#1B5E4B" />
          </>}
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${gid})`}
        strokeWidth={variant === "gold" ? "8" : "6"}
        strokeLinejoin="miter" strokeMiterlimit="50" strokeLinecap="butt" />
    </svg>
  );
};

export const Field = ({ label, hint, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: T.soft, fontWeight: 700, marginBottom: 6 }}>
      {label}
    </label>
    <input
      {...props}
      style={{
        width: "100%", background: "#FFFFFF", border: `2px solid ${T.border}`, borderRadius: 8,
        padding: "13px 15px", fontSize: 15, color: T.text, outline: "none", boxSizing: "border-box",
        fontFamily: T.font, ...(props.style || {})
      }}
      onFocus={e => { e.target.style.borderColor = T.green; props.onFocus?.(e); }}
      onBlur={e => { e.target.style.borderColor = T.border; props.onBlur?.(e); }}
    />
    {hint && <div style={{ fontSize: 11, color: T.soft, marginTop: 5, fontStyle: "italic" }}>{hint}</div>}
  </div>
);

export const TextArea = ({ label, hint, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: T.soft, fontWeight: 700, marginBottom: 6 }}>
      {label}
    </label>
    <textarea
      {...props}
      style={{
        width: "100%", background: "#FFFFFF", border: `2px solid ${T.border}`, borderRadius: 8,
        padding: "13px 15px", fontSize: 15, color: T.text, outline: "none", boxSizing: "border-box",
        fontFamily: T.font, lineHeight: 1.7, resize: "vertical", ...(props.style || {})
      }}
      onFocus={e => { e.target.style.borderColor = T.green; }}
      onBlur={e => { e.target.style.borderColor = T.border; }}
    />
    {hint && <div style={{ fontSize: 11, color: T.soft, marginTop: 5, fontStyle: "italic" }}>{hint}</div>}
  </div>
);

export const Button = ({ variant = "primary", disabled, children, ...props }) => {
  const styles = {
    primary: { background: disabled ? "#C8D8D2" : T.green, color: "#FFFFFF", border: "none" },
    gold: { background: disabled ? "#E8DCC4" : T.gold, color: "#FFFFFF", border: "none" },
    ghost: { background: "none", color: T.mid, border: `2px solid ${T.border}` },
    danger: { background: "none", color: T.danger, border: `2px solid ${T.danger}` }
  }[variant];

  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        borderRadius: 8, padding: "13px 26px", fontSize: 14, fontWeight: 700, letterSpacing: 0.5,
        cursor: disabled ? "not-allowed" : "pointer", fontFamily: T.font, transition: "all 0.2s",
        ...styles, ...(props.style || {})
      }}
    >
      {children}
    </button>
  );
};

export const Banner = ({ kind = "info", children }) => {
  const map = {
    info: { bg: T.greenSoft, border: T.greenLine, color: T.green },
    warn: { bg: T.goldSoft, border: T.gold, color: "#8B5E1A" },
    error: { bg: T.dangerSoft, border: "#E8B0A5", color: T.danger }
  }[kind];

  if (!children) return null;
  return (
    <div style={{
      background: map.bg, border: `1px solid ${map.border}`, color: map.color,
      borderRadius: 8, padding: "12px 16px", fontSize: 13.5, lineHeight: 1.6, marginBottom: 18
    }}>
      {children}
    </div>
  );
};

export const Card = ({ children, style }) => (
  <div style={{
    background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 12,
    padding: "22px 24px", marginBottom: 14, ...(style || {})
  }}>
    {children}
  </div>
);

export const Chip = ({ children, tone = "gold" }) => {
  const map = {
    gold: { bg: "#FEF3E8", border: T.gold, color: "#8B5E1A" },
    green: { bg: T.greenSoft, border: T.green, color: T.green },
    grey: { bg: "#F2F0EE", border: T.border, color: T.mid }
  }[tone];
  return (
    <span style={{
      background: map.bg, border: `1.5px solid ${map.border}`, color: map.color,
      borderRadius: 50, padding: "5px 14px", fontSize: 12, fontWeight: 700,
      display: "inline-block", marginRight: 6, marginBottom: 6
    }}>{children}</span>
  );
};

export const Shell = ({ title, subtitle, right, children, wide }) => (
  <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.text }}>
    <div style={{ background: T.green, padding: "18px 24px" }}>
      <div style={{ maxWidth: wide ? 1100 : 760, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
        <BahaiStar size={32} variant="gold" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, letterSpacing: 3, color: "#A8D5C2", textTransform: "uppercase", fontWeight: 700 }}>
            Bahá'í Youth Empowerment Program
          </div>
          <div style={{ fontSize: 17, color: "#FFFFFF", fontWeight: 700, marginTop: 2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "#A8D5C2", marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
    <div style={{ maxWidth: wide ? 1100 : 760, margin: "0 auto", padding: "28px 24px 80px" }}>
      {children}
    </div>
  </div>
);

export const Spinner = ({ label = "Loading" }) => (
  <div style={{ textAlign: "center", padding: "60px 0", color: T.soft }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{
      width: 34, height: 34, borderRadius: "50%", border: `3px solid ${T.border}`,
      borderTop: `3px solid ${T.green}`, animation: "spin 1.1s linear infinite", margin: "0 auto 14px"
    }} />
    <div style={{ fontSize: 13 }}>{label}…</div>
  </div>
);

export function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
