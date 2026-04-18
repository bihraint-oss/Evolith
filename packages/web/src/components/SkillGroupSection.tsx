import type { CSSProperties } from "react";

import type { SkillDimensionGroup } from "../lib/skills";
import StatusBadge from "./StatusBadge";

export interface SkillGroupSectionProps {
  group: SkillDimensionGroup;
}

const sectionStyle: CSSProperties = {
  marginTop: "1.2rem",
  padding: "clamp(1.4rem, 4vw, 2rem)",
};

const groupHeaderStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.85rem",
  justifyContent: "space-between",
};

const countPillStyle: CSSProperties = {
  border: "1px solid rgba(201, 111, 45, 0.18)",
  borderRadius: "999px",
  color: "var(--orange)",
  display: "inline-flex",
  fontSize: "0.82rem",
  fontWeight: 700,
  minHeight: "2.1rem",
  padding: "0.45rem 0.85rem",
};

const skillGridStyle: CSSProperties = {
  display: "grid",
  gap: "0.95rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  marginTop: "1.25rem",
};

const skillCardStyle: CSSProperties = {
  border: "1px solid rgba(34, 40, 49, 0.08)",
  borderRadius: "22px",
  boxShadow: "0 18px 36px rgba(38, 38, 32, 0.08)",
  display: "grid",
  gap: "0.95rem",
  padding: "1.1rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 247, 238, 0.46))",
};

const skillMetaRowStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  justifyContent: "space-between",
};

const difficultyStyle: CSSProperties = {
  color: "var(--ink-soft)",
  fontSize: "0.88rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export default function SkillGroupSection({
  group,
}: SkillGroupSectionProps) {
  return (
    <section className="card" style={sectionStyle}>
      <div style={groupHeaderStyle}>
        <div>
          <p className="panel-eyebrow">{group.label}</p>
          <h2 style={{ margin: 0, fontSize: "clamp(1.85rem, 4vw, 2.5rem)" }}>
            {group.label} skills
          </h2>
          <p style={{ color: "var(--ink-soft)", margin: "0.75rem 0 0" }}>
            API order is preserved inside each dimension group so the seeded DAG
            remains readable on the dashboard.
          </p>
        </div>
        <span style={countPillStyle}>{group.skills.length} skills</span>
      </div>

      <div style={skillGridStyle}>
        {group.skills.map((skill) => (
          <article key={skill.id} style={skillCardStyle}>
            <div style={skillMetaRowStyle}>
              <StatusBadge status={skill.status} />
              <span style={difficultyStyle}>Difficulty {skill.difficulty}/5</span>
            </div>

            <div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: "\"Iowan Old Style\", \"Palatino Linotype\", serif",
                  fontSize: "1.45rem",
                  lineHeight: 1.08,
                }}
              >
                {skill.name}
              </h3>
              <p style={{ color: "var(--ink-soft)", margin: "0.75rem 0 0" }}>
                {skill.description}
              </p>
            </div>

            <div>
              <p className="panel-eyebrow" style={{ marginBottom: "0.45rem" }}>
                Completion criteria
              </p>
              <p style={{ color: "var(--ink-soft)", margin: 0 }}>
                {skill.completionCriteria}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
