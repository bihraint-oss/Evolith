import type { SkillNodeView } from "@evolith/shared";
import { cognitiveDimensions } from "@evolith/shared";
import { describe, expect, test } from "bun:test";

import {
  AI_DEVELOPER_SKILL_TREE_NODE_COUNT,
  aiDeveloperSkillTree,
} from "../../../server/src/db/seed-data/skill-tree";

import {
  getDimensionLabel,
  getStatusLabel,
  groupSkillsByDimension,
} from "./skills";

const statusCycle = [
  "locked",
  "available",
  "inProgress",
  "completed",
] as const;

function createSkillViews(): SkillNodeView[] {
  return aiDeveloperSkillTree.map((skill, index) => ({
    ...skill,
    status: statusCycle[index % statusCycle.length]!,
    createdAt: "2026-04-19T09:00:00.000Z",
    updatedAt: "2026-04-19T09:00:00.000Z",
  }));
}

describe("skill helpers", () => {
  test("groups all seeded skills by dimension in shared cognitive order", () => {
    const skills = createSkillViews();
    const groups = groupSkillsByDimension(skills);

    expect(skills).toHaveLength(AI_DEVELOPER_SKILL_TREE_NODE_COUNT);
    expect(groups.map((group) => group.dimension)).toEqual([
      ...cognitiveDimensions,
    ]);
    expect(groups.map((group) => group.label)).toEqual(
      cognitiveDimensions.map((dimension) => getDimensionLabel(dimension)),
    );
    expect(
      groups.reduce((count, group) => count + group.skills.length, 0),
    ).toBe(AI_DEVELOPER_SKILL_TREE_NODE_COUNT);
  });

  test("preserves backend-authored order within each dimension group", () => {
    const skills = createSkillViews();
    const groups = groupSkillsByDimension(skills);

    groups.forEach((group) => {
      expect(group.skills.map((skill) => skill.id)).toEqual(
        skills
          .filter((skill) => skill.dimension === group.dimension)
          .map((skill) => skill.id),
      );
    });
  });

  test("exposes stable human-readable dimension and status labels", () => {
    expect(
      Object.fromEntries(
        cognitiveDimensions.map((dimension) => [
          dimension,
          getDimensionLabel(dimension),
        ]),
      ),
    ).toEqual({
      creativity: "Creativity",
      imagination: "Imagination",
      promptPrecision: "Prompt Precision",
      systemDecomposition: "System Decomposition",
      aiOrchestration: "AI Orchestration",
    });

    expect(
      statusCycle.map((status) => getStatusLabel(status)),
    ).toEqual([
      "Locked",
      "Available",
      "In Progress",
      "Completed",
    ]);
  });
});
