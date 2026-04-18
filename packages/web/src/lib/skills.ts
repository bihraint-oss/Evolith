import type {
  CognitiveDimension,
  SkillNodeView,
  UserProgressStatus,
} from "@evolith/shared";
import { cognitiveDimensions } from "@evolith/shared";

export interface SkillDimensionGroup {
  dimension: CognitiveDimension;
  label: string;
  skills: SkillNodeView[];
}

const dimensionLabels = {
  creativity: "Creativity",
  imagination: "Imagination",
  promptPrecision: "Prompt Precision",
  systemDecomposition: "System Decomposition",
  aiOrchestration: "AI Orchestration",
} satisfies Record<CognitiveDimension, string>;

const statusLabels = {
  locked: "Locked",
  available: "Available",
  inProgress: "In Progress",
  completed: "Completed",
} satisfies Record<UserProgressStatus, string>;

export function getDimensionLabel(dimension: CognitiveDimension): string {
  return dimensionLabels[dimension];
}

export function getStatusLabel(status: UserProgressStatus): string {
  return statusLabels[status];
}

export function groupSkillsByDimension(
  skills: SkillNodeView[],
): SkillDimensionGroup[] {
  const skillsByDimension = new Map<
    CognitiveDimension,
    SkillNodeView[]
  >(
    cognitiveDimensions.map((dimension) => [dimension, []]),
  );

  for (const skill of skills) {
    const groupSkills = skillsByDimension.get(skill.dimension);

    if (groupSkills !== undefined) {
      groupSkills.push(skill);
    }
  }

  return cognitiveDimensions
    .map((dimension) => ({
      dimension,
      label: getDimensionLabel(dimension),
      skills: skillsByDimension.get(dimension) ?? [],
    }))
    .filter((group) => group.skills.length > 0);
}
