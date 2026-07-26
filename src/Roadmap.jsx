import { T, Chip } from "./ui.jsx";

const Label = ({ children, color = T.mid }) => (
  <div style={{ fontSize: 10, letterSpacing: 4, color, marginBottom: 10, textTransform: "uppercase", fontWeight: 700 }}>
    {children}
  </div>
);

// Renders a generated roadmap object. Every field is optional -- a partial
// roadmap degrades to fewer sections rather than crashing.
export default function Roadmap({ data, compact }) {
  if (!data) {
    return (
      <div style={{ color: T.soft, fontSize: 14, fontStyle: "italic", padding: "20px 0" }}>
        No roadmap on file for this person yet.
      </div>
    );
  }

  return (
    <div>
      {data.name_greeting && !compact && (
        <p style={{ fontSize: 16, lineHeight: 1.85, color: "#2C2C2C", marginBottom: 24 }}>
          {data.name_greeting}
        </p>
      )}

      {data.core_identity && (
        <div style={{
          background: "linear-gradient(135deg, #EEF6F3, #FDF8EE)", border: `2px solid ${T.gold}`,
          borderRadius: 14, padding: "24px 26px", marginBottom: 18
        }}>
          <Label color={T.gold}>Core Identity</Label>
          <h3 style={{ fontSize: 21, fontWeight: 700, color: T.green, margin: "0 0 10px", fontStyle: "italic" }}>
            "{data.core_identity.title}"
          </h3>
          <p style={{ fontSize: 14.5, color: T.mid, lineHeight: 1.7, margin: 0 }}>
            {data.core_identity.description}
          </p>
        </div>
      )}

      {data.hidden_strength && (
        <div style={{ background: "#F0F5FF", border: "1px solid #6B9ED4", borderRadius: 10, padding: "18px 22px", marginBottom: 18 }}>
          <Label color="#4A80B8">Hidden Strength</Label>
          <p style={{ fontSize: 14.5, color: "#2C2C2C", lineHeight: 1.7, margin: 0 }}>{data.hidden_strength}</p>
        </div>
      )}

      {Array.isArray(data.top_interests) && data.top_interests.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <Label>Core Interests</Label>
          <div>{data.top_interests.map(i => <Chip key={i} tone="gold">{i}</Chip>)}</div>
        </div>
      )}

      {data.primary_path && (
        <div style={{ background: "#FFFFFF", border: `2px solid ${T.green}`, borderRadius: 12, padding: "22px 26px", marginBottom: 14 }}>
          <Label color={T.green}>Recommended Path</Label>
          <h4 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 10px" }}>{data.primary_path.title}</h4>
          <p style={{ fontSize: 14.5, color: "#2C2C2C", lineHeight: 1.75, margin: "0 0 12px" }}>{data.primary_path.why}</p>
          {data.primary_path.income_timeline && (
            <div style={{ fontSize: 12.5, color: T.green, fontWeight: 700, background: T.greenSoft, padding: "7px 12px", borderRadius: 6, display: "inline-block" }}>
              First income estimate: {data.primary_path.income_timeline}
            </div>
          )}
        </div>
      )}

      {data.alternative_path && (
        <div style={{ background: "#FAFAFA", border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "18px 24px", marginBottom: 22 }}>
          <Label>Alternative Path</Label>
          <h5 style={{ fontSize: 15.5, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>{data.alternative_path.title}</h5>
          <p style={{ fontSize: 13.5, color: "#3C3C3C", lineHeight: 1.7, margin: 0 }}>{data.alternative_path.why}</p>
        </div>
      )}

      {Array.isArray(data["90_day_plan"]) && data["90_day_plan"].length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Label>90-Day Action Plan</Label>
          {data["90_day_plan"].map((step, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "110px 1fr", gap: 14, background: "#FFFFFF",
              border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 9, alignItems: "start"
            }}>
              <div>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, marginBottom: 3 }}>{step.week}</div>
                <div style={{ fontSize: 10.5, color: T.mid, textTransform: "uppercase", letterSpacing: 1 }}>{step.focus}</div>
              </div>
              <div>
                <p style={{ fontSize: 13.5, color: T.text, lineHeight: 1.7, margin: "0 0 6px" }}>{step.action}</p>
                {step.resource && (
                  <div style={{ fontSize: 11.5, color: T.green, fontWeight: 700 }}>→ {step.resource}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(data.skill_gaps) && data.skill_gaps.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <Label>Skills to Develop</Label>
          <div>{data.skill_gaps.map(g => (
            <span key={g} style={{
              background: "#FEF0EE", border: "1.5px solid #D4796B", color: "#9B3A2C",
              borderRadius: 50, padding: "5px 14px", fontSize: 12, fontWeight: 600,
              display: "inline-block", marginRight: 6, marginBottom: 6
            }}>{g}</span>
          ))}</div>
        </div>
      )}

      {data.immediate_win && (
        <div style={{ background: "linear-gradient(135deg, #1B5E4B, #1E7055)", borderRadius: 12, padding: "20px 26px", marginBottom: 18 }}>
          <Label color="#A8D5C2">Do This This Week</Label>
          <p style={{ fontSize: 15, color: "#FFFFFF", lineHeight: 1.75, margin: 0, fontWeight: 600 }}>{data.immediate_win}</p>
        </div>
      )}

      {data.bahai_connection && !compact && (
        <div style={{ background: "#F5F0FF", border: "1.5px solid #A08FD4", borderRadius: 12, padding: "20px 24px", marginBottom: 18 }}>
          <Label color="#6A50B8">Spiritual Compass</Label>
          <p style={{ fontSize: 14.5, color: "#2C2C2C", lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>{data.bahai_connection}</p>
        </div>
      )}

      {data.affirmation && !compact && (
        <p style={{
          fontSize: 17, color: T.green, lineHeight: 1.8, fontStyle: "italic",
          textAlign: "center", padding: "26px 0", borderTop: `2px solid ${T.border}`, margin: 0
        }}>
          "{data.affirmation}"
        </p>
      )}
    </div>
  );
}
