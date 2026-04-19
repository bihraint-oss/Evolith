import type { CognitiveDimension, DiagnosisRadarData } from "@evolith/shared";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
} from "recharts";

/**
 * Supplies the saved radar values rendered on the dashboard.
 */
export interface RadarChartProps {
  data: DiagnosisRadarData;
}

const dimensionLabels: Record<CognitiveDimension, string> = {
  creativity: "Creativity",
  imagination: "Imagination",
  promptPrecision: "Prompt Precision",
  systemDecomposition: "System Decomposition",
  aiOrchestration: "AI Orchestration",
};

function formatDimensionLabel(dimension: CognitiveDimension): string {
  return dimensionLabels[dimension];
}

/**
 * Renders the diagnosis radar chart alongside the raw dimension scores.
 */
export function RadarChart(props: RadarChartProps): React.JSX.Element {
  return (
    <section className="rounded-[2rem] border border-clay-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
          Capability Radar
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-ink-950">
          Your latest diagnosis signal
        </h2>
        <p className="text-sm text-ink-700">
          The chart uses the saved backend radar data directly, without client-side reshaping.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="h-80 rounded-[1.75rem] border border-clay-100 bg-sand-50 p-4">
          <ResponsiveContainer height="100%" width="100%">
            <RechartsRadarChart data={props.data} outerRadius="70%">
              <PolarGrid stroke="#e6c4a4" />
              <PolarAngleAxis
                dataKey="dimension"
                stroke="#26415d"
                tickFormatter={(value: string) =>
                  formatDimensionLabel(value as CognitiveDimension)}
              />
              <Radar
                dataKey="value"
                fill="#c97b57"
                fillOpacity={0.35}
                name="Score"
                stroke="#132238"
                strokeWidth={2}
              />
            </RechartsRadarChart>
          </ResponsiveContainer>
        </div>

        <ol className="space-y-3" aria-label="Radar dimension scores">
          {props.data.map((datum) => (
            <li
              className="flex items-center justify-between rounded-[1.5rem] border border-clay-100 bg-sand-50 px-4 py-3"
              key={datum.dimension}
            >
              <span className="text-sm font-medium text-ink-700">
                {formatDimensionLabel(datum.dimension)}
              </span>
              <span className="text-lg font-semibold text-ink-950">
                {datum.value}
                <span className="text-sm font-medium text-ink-700">/100</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default RadarChart;
