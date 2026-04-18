import type { CSSProperties } from "react";
import type { SkillNodeView } from "@evolith/shared";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "../auth/auth-context";
import RadarChartCard from "../components/RadarChartCard";
import SkillGroupSection from "../components/SkillGroupSection";
import {
  getSkills,
  isApiClientError,
} from "../lib/api-client";
import { groupSkillsByDimension } from "../lib/skills";

const heroGridStyle: CSSProperties = {
  display: "grid",
  gap: "1.2rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
};

const summaryCardStyle: CSSProperties = {
  padding: "clamp(1.4rem, 4vw, 2rem)",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gap: "0.95rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  marginTop: "1.2rem",
};

const summaryItemStyle: CSSProperties = {
  border: "1px solid rgba(34, 40, 49, 0.1)",
  borderRadius: "20px",
  padding: "1rem",
  background: "rgba(255, 255, 255, 0.48)",
};

const statusGridStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  marginTop: "1.2rem",
};

const statusCardStyle: CSSProperties = {
  border: "1px solid rgba(34, 40, 49, 0.08)",
  borderRadius: "20px",
  padding: "1rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 247, 238, 0.44))",
};

const feedbackCardStyle: CSSProperties = {
  marginTop: "1.2rem",
  padding: "clamp(1.5rem, 4vw, 2.2rem)",
};

const errorCardStyle: CSSProperties = {
  border: "1px solid rgba(153, 46, 46, 0.14)",
  borderRadius: "20px",
  background: "rgba(153, 46, 46, 0.08)",
  color: "#7c1f1f",
  padding: "0.95rem 1rem",
};

const buttonStyle: CSSProperties = {
  border: "none",
  cursor: "pointer",
};

function getRequestErrorMessage(error: unknown): string {
  if (isApiClientError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Something went wrong while loading the skill graph.";
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [skills, setSkills] = useState<SkillNodeView[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const requestSequenceRef = useRef(0);

  const radar = profile?.radar ?? null;
  const activeUserId = profile?.profile.userId ?? null;
  const hasCompletedDiagnosis = profile?.hasCompletedDiagnosis ?? false;

  async function loadSkills() {
    if (!hasCompletedDiagnosis || activeUserId === null) {
      return;
    }

    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;
    setIsLoadingSkills(true);
    setErrorMessage(null);

    try {
      const response = await getSkills();

      if (requestSequenceRef.current === requestSequence) {
        setSkills(response.skills);
      }
    } catch (error) {
      if (requestSequenceRef.current === requestSequence) {
        setErrorMessage(getRequestErrorMessage(error));
      }
    } finally {
      if (requestSequenceRef.current === requestSequence) {
        setIsLoadingSkills(false);
      }
    }
  }

  useEffect(() => {
    requestSequenceRef.current += 1;
    setSkills(null);
    setErrorMessage(null);
    setIsLoadingSkills(false);

    if (!hasCompletedDiagnosis || activeUserId === null) {
      return;
    }

    void loadSkills();
  }, [activeUserId, hasCompletedDiagnosis]);

  if (profile === null || radar === null) {
    return null;
  }

  const groupedSkills = skills === null ? [] : groupSkillsByDimension(skills);
  const completedSkillsCount =
    skills?.filter((skill) => skill.status === "completed").length ?? 0;
  const inProgressSkillsCount =
    skills?.filter((skill) => skill.status === "inProgress").length ?? 0;
  const availableSkillsCount =
    skills?.filter((skill) => skill.status === "available").length ?? 0;
  const lockedSkillsCount =
    skills?.filter((skill) => skill.status === "locked").length ?? 0;
  const skillCountLabel = skills === null ? "..." : skills.length;
  const groupCountLabel = skills === null ? "..." : groupedSkills.length;
  const completedCountLabel = skills === null ? "..." : completedSkillsCount;
  const inProgressCountLabel = skills === null ? "..." : inProgressSkillsCount;
  const availableCountLabel = skills === null ? "..." : availableSkillsCount;
  const lockedCountLabel = skills === null ? "..." : lockedSkillsCount;

  return (
    <main className="app-shell">
      <section style={heroGridStyle}>
        <section className="hero card">
          <p className="hero-kicker">Route /dashboard</p>
          <h1>See your diagnosis and the full skill graph together.</h1>
          <p className="hero-copy">
            The dashboard renders `profile.radar` from the shared auth context
            and overlays the authenticated `/api/skills` response without
            recomputing unlock logic on the client.
          </p>
          <div className="hero-actions">
            <span className="pill">Diagnosis complete</span>
            <span className="pill">
              {skills === null ? "Loading skills" : `${skills.length} seeded skills`}
            </span>
            <span className="pill">User {profile.profile.userId}</span>
          </div>
        </section>

        <RadarChartCard
          lastDiagnosedAt={profile.lastDiagnosedAt}
          radar={radar}
        />
      </section>

      <section className="card" style={summaryCardStyle}>
        <p className="panel-eyebrow">Skill status overview</p>
        <h2 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          All seeded nodes, grouped by dimension
        </h2>
        <p style={{ color: "var(--ink-soft)", margin: "0.85rem 0 0" }}>
          Status badges come directly from the API response: `locked`,
          `available`, `inProgress`, and `completed`.
        </p>

        <div style={summaryGridStyle}>
          <article style={summaryItemStyle}>
            <p className="panel-eyebrow" style={{ marginBottom: "0.55rem" }}>
              Radar dimensions
            </p>
            <strong style={{ fontSize: "1.7rem" }}>{radar.length}</strong>
          </article>
          <article style={summaryItemStyle}>
            <p className="panel-eyebrow" style={{ marginBottom: "0.55rem" }}>
              Skills returned
            </p>
            <strong style={{ fontSize: "1.7rem" }}>
              {skillCountLabel}
            </strong>
          </article>
          <article style={summaryItemStyle}>
            <p className="panel-eyebrow" style={{ marginBottom: "0.55rem" }}>
              Dimension groups
            </p>
            <strong style={{ fontSize: "1.7rem" }}>
              {groupCountLabel}
            </strong>
          </article>
        </div>

        <div style={statusGridStyle}>
          <article style={statusCardStyle}>
            <p className="panel-eyebrow" style={{ marginBottom: "0.45rem" }}>
              Completed
            </p>
            <strong style={{ fontSize: "2rem", color: "var(--teal-deep)" }}>
              {completedCountLabel}
            </strong>
          </article>
          <article style={statusCardStyle}>
            <p className="panel-eyebrow" style={{ marginBottom: "0.45rem" }}>
              In progress
            </p>
            <strong style={{ fontSize: "2rem", color: "var(--teal)" }}>
              {inProgressCountLabel}
            </strong>
          </article>
          <article style={statusCardStyle}>
            <p className="panel-eyebrow" style={{ marginBottom: "0.45rem" }}>
              Available
            </p>
            <strong style={{ fontSize: "2rem", color: "var(--orange)" }}>
              {availableCountLabel}
            </strong>
          </article>
          <article style={statusCardStyle}>
            <p className="panel-eyebrow" style={{ marginBottom: "0.45rem" }}>
              Locked
            </p>
            <strong style={{ fontSize: "2rem", color: "var(--ink)" }}>
              {lockedCountLabel}
            </strong>
          </article>
        </div>
      </section>

      {errorMessage === null ? null : (
        <section className="card" style={feedbackCardStyle}>
          <div
            aria-live="polite"
            role="alert"
            style={errorCardStyle}
          >
            <strong style={{ display: "block" }}>Skill graph load failed</strong>
            <span>{errorMessage}</span>
          </div>
          <div className="hero-actions" style={{ marginTop: "1rem" }}>
            <button
              className="button-primary"
              disabled={isLoadingSkills}
              onClick={() => {
                void loadSkills();
              }}
              style={{
                ...buttonStyle,
                opacity: isLoadingSkills ? 0.72 : 1,
              }}
              type="button"
            >
              {isLoadingSkills ? "Retrying..." : "Retry skill sync"}
            </button>
          </div>
        </section>
      )}

      {skills === null && errorMessage === null ? (
        <section className="card" style={feedbackCardStyle}>
          <p className="panel-eyebrow">Skill graph</p>
          <h2 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Loading the 25 seeded skill nodes
          </h2>
          <p style={{ color: "var(--ink-soft)", margin: "0.85rem 0 0" }}>
            The dashboard waits for the authenticated `/api/skills` response so
            badges and group counts stay aligned with the backend.
          </p>
        </section>
      ) : null}

      {groupedSkills.map((group) => (
        <SkillGroupSection
          group={group}
          key={group.dimension}
        />
      ))}
    </main>
  );
}
