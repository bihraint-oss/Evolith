import type { DiagnosisRadarData, IsoTimestampString } from "@evolith/shared";
import type { CSSProperties } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { getDimensionLabel } from "../lib/skills";

export interface RadarChartCardProps {
  radar: DiagnosisRadarData;
  lastDiagnosedAt: IsoTimestampString | null;
}

interface RadarChartViewDatum {
  dimension: string;
  label: string;
  value: number;
  fullMark: number;
}

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "1.35rem",
  padding: "clamp(1.5rem, 4vw, 2.2rem)",
};

const chartFrameStyle: CSSProperties = {
  width: "100%",
  height: 320,
  borderRadius: "24px",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.46), rgba(255, 248, 239, 0.18))",
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
};

const metricStyle: CSSProperties = {
  border: "1px solid rgba(34, 40, 49, 0.1)",
  borderRadius: "18px",
  padding: "0.85rem 0.95rem",
  background: "rgba(255, 255, 255, 0.5)",
};

function formatDiagnosisDate(timestamp: IsoTimestampString | null): string {
  if (timestamp === null) {
    return "Not available";
  }

  const parsedTimestamp = new Date(timestamp);

  if (Number.isNaN(parsedTimestamp.valueOf())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedTimestamp);
}

export default function RadarChartCard({
  radar,
  lastDiagnosedAt,
}: RadarChartCardProps) {
  const chartData: RadarChartViewDatum[] = radar.map((datum) => ({
    dimension: datum.dimension,
    label: getDimensionLabel(datum.dimension),
    value: datum.value,
    fullMark: 100,
  }));
  const averageScore =
    radar.length === 0
      ? 0
      : radar.reduce((total, datum) => total + datum.value, 0) / radar.length;

  return (
    <section className="card" style={cardStyle}>
      <div>
        <p className="panel-eyebrow">Diagnosis radar</p>
        <h2 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          Your current cognitive profile
        </h2>
        <p style={{ color: "var(--ink-soft)", margin: "0.85rem 0 0" }}>
          This chart renders the backend-provided `profile.radar` directly. The
          client only adds labels and display framing.
        </p>
      </div>

      <div style={chartFrameStyle}>
        <ResponsiveContainer height="100%" width="100%">
          <RadarChart data={chartData} outerRadius="70%">
            <PolarGrid stroke="rgba(29, 36, 41, 0.14)" />
            <PolarAngleAxis dataKey="label" />
            <PolarRadiusAxis
              angle={18}
              axisLine={false}
              domain={[0, 100]}
              tick={false}
            />
            <Radar
              dataKey="value"
              fill="rgba(29, 140, 131, 0.24)"
              fillOpacity={1}
              name="Score"
              stroke="var(--teal-deep)"
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={metricGridStyle}>
        <article style={metricStyle}>
          <p className="panel-eyebrow" style={{ marginBottom: "0.55rem" }}>
            Average signal
          </p>
          <strong style={{ fontSize: "1.75rem" }}>
            {Math.round(averageScore)}
          </strong>
        </article>
        <article style={metricStyle}>
          <p className="panel-eyebrow" style={{ marginBottom: "0.55rem" }}>
            Dimensions scored
          </p>
          <strong style={{ fontSize: "1.75rem" }}>{radar.length}</strong>
        </article>
        <article style={metricStyle}>
          <p className="panel-eyebrow" style={{ marginBottom: "0.55rem" }}>
            Last diagnosed
          </p>
          <strong style={{ fontSize: "1rem", lineHeight: 1.4 }}>
            {formatDiagnosisDate(lastDiagnosedAt)}
          </strong>
        </article>
      </div>
    </section>
  );
}
