import type {
  CognitiveDimension,
  SkillNodeView,
  UserProgressStatus,
} from "@evolith/shared";

export interface SkillMapProps {
  skills: SkillNodeView[];
}

const dimensionLabels: Record<CognitiveDimension, string> = {
  creativity: "Creativity",
  imagination: "Imagination",
  promptPrecision: "Prompt Precision",
  systemDecomposition: "System Decomposition",
  aiOrchestration: "AI Orchestration",
};

const statusLabels: Record<UserProgressStatus, string> = {
  available: "Available",
  completed: "Completed",
  inProgress: "In Progress",
  locked: "Locked",
};

const statusClasses: Record<UserProgressStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-900",
  completed: "border-ink-200 bg-ink-950 text-white",
  inProgress: "border-amber-200 bg-amber-50 text-amber-900",
  locked: "border-clay-200 bg-sand-50 text-ink-700",
};

function formatDimensionLabel(dimension: CognitiveDimension): string {
  return dimensionLabels[dimension];
}

function getStatusSummary(
  skill: SkillNodeView,
  prerequisiteNames: string[],
): string {
  if (skill.status === "completed") {
    return "Completed and ready to support downstream skills.";
  }

  if (skill.status === "inProgress") {
    return "Currently active in your skill path.";
  }

  if (skill.status === "available") {
    return "Ready to start based on your current profile and prerequisites.";
  }

  if (prerequisiteNames.length > 0) {
    return `Requires ${prerequisiteNames.join(", ")}.`;
  }

  return "Still locked until an earlier requirement is satisfied.";
}

export function SkillMap(props: SkillMapProps): React.JSX.Element {
  const skillNameById = new Map(
    props.skills.map((skill) => [skill.id, skill.name] as const),
  );

  return (
    <section className="rounded-[2rem] border border-clay-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
          Skill Map
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-ink-950">
          Ordered by the authored API sequence
        </h2>
        <p className="text-sm text-ink-700">
          Status and prerequisite explanations come directly from the current skills contract.
        </p>
      </div>

      <ol className="mt-6 space-y-4" aria-label="Skill roadmap">
        {props.skills.map((skill, index) => {
          const prerequisiteNames = skill.prerequisiteIds
            .map((prerequisiteId) => skillNameById.get(prerequisiteId))
            .filter((name): name is string => name !== undefined);

          return (
            <li key={skill.id}>
              <article className="rounded-[1.75rem] border border-clay-100 bg-sand-50 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-clay-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-clay-500">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="rounded-full border border-clay-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">
                        {formatDimensionLabel(skill.dimension)}
                      </span>
                      <span className="rounded-full border border-clay-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">
                        Difficulty {skill.difficulty}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold tracking-tight text-ink-950">
                        {skill.name}
                      </h3>
                      <p className="text-sm text-ink-700">{skill.description}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${statusClasses[skill.status]}`}
                  >
                    {statusLabels[skill.status]}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[1.5rem] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay-500">
                      Status
                    </p>
                    <p className="mt-2 text-sm text-ink-700">
                      {getStatusSummary(skill, prerequisiteNames)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay-500">
                      Completion Criteria
                    </p>
                    <p className="mt-2 text-sm text-ink-700">
                      {skill.completionCriteria}
                    </p>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default SkillMap;
