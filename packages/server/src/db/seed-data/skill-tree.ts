import type { CognitiveDimension, EntityId, SkillDifficulty } from "@evolith/shared";

export interface SeedSkillNodeDefinition {
  id: EntityId;
  name: string;
  description: string;
  dimension: CognitiveDimension;
  difficulty: SkillDifficulty;
  prerequisiteIds: EntityId[];
  completionCriteria: string;
}

const FIXED_UUID_PREFIX = "00000000-0000-4000-8000-";

const createFixedSkillNodeId = (suffix: string): EntityId =>
  `${FIXED_UUID_PREFIX}${suffix}`;

export const aiDeveloperSkillTree = [
  {
    id: createFixedSkillNodeId("000000000001"),
    name: "Prompt Remixing Foundations",
    description:
      "Turn a rough task into several distinct prompt directions without losing the core user intent.",
    dimension: "creativity",
    difficulty: 1,
    prerequisiteIds: [],
    completionCriteria:
      "Produce three materially different prompt approaches for the same product task and explain the tradeoff of each.",
  },
  {
    id: createFixedSkillNodeId("000000000002"),
    name: "Capability Imagination Mapping",
    description:
      "Identify where AI can expand a developer workflow beyond straightforward code generation.",
    dimension: "imagination",
    difficulty: 1,
    prerequisiteIds: [],
    completionCriteria:
      "Map one product workflow into ideation, analysis, implementation, and review opportunities for AI assistance.",
  },
  {
    id: createFixedSkillNodeId("000000000003"),
    name: "Intent-to-Prompt Translation",
    description:
      "Convert ambiguous user requests into precise, executable prompt instructions with clear deliverables.",
    dimension: "promptPrecision",
    difficulty: 1,
    prerequisiteIds: [],
    completionCriteria:
      "Rewrite three vague requests into prompts with explicit inputs, outputs, and constraints.",
  },
  {
    id: createFixedSkillNodeId("000000000004"),
    name: "Problem Framing Decomposition",
    description:
      "Break a feature request into coherent backend, data, validation, and delivery concerns.",
    dimension: "systemDecomposition",
    difficulty: 1,
    prerequisiteIds: [],
    completionCriteria:
      "Document a feature as a small set of independent implementation slices with stated dependencies.",
  },
  {
    id: createFixedSkillNodeId("000000000005"),
    name: "AI Toolchain Setup",
    description:
      "Establish a repeatable local workflow for invoking AI tools alongside tests, migrations, and git checkpoints.",
    dimension: "aiOrchestration",
    difficulty: 1,
    prerequisiteIds: [],
    completionCriteria:
      "Set up a command-line loop that can inspect code, make a bounded change, validate it, and save the result safely.",
  },
  {
    id: createFixedSkillNodeId("000000000006"),
    name: "Divergent Prompt Variations",
    description:
      "Generate alternative implementation angles that stay aligned with the same user outcome.",
    dimension: "creativity",
    difficulty: 2,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000001"),
      createFixedSkillNodeId("000000000003"),
    ],
    completionCriteria:
      "For one backend task, produce exploration, implementation, and verification prompt variants that remain consistent with the request.",
  },
  {
    id: createFixedSkillNodeId("000000000007"),
    name: "Alternative Solution Storyboarding",
    description:
      "Imagine multiple end-to-end user journeys for how an AI-assisted development flow could work.",
    dimension: "imagination",
    difficulty: 2,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000002"),
      createFixedSkillNodeId("000000000004"),
    ],
    completionCriteria:
      "Storyboard at least two workflow variants for the same problem and justify when each variant is preferable.",
  },
  {
    id: createFixedSkillNodeId("000000000008"),
    name: "Output Specification Writing",
    description:
      "Define response shapes, status handling, and validation expectations in language a model can reliably follow.",
    dimension: "promptPrecision",
    difficulty: 2,
    prerequisiteIds: [createFixedSkillNodeId("000000000003")],
    completionCriteria:
      "Write a prompt spec that locks down response envelopes, error codes, and validation expectations for an API task.",
  },
  {
    id: createFixedSkillNodeId("000000000009"),
    name: "Workflow Step Decomposition",
    description:
      "Split an implementation loop into inspect, change, validate, and commit steps with narrow ownership.",
    dimension: "systemDecomposition",
    difficulty: 2,
    prerequisiteIds: [createFixedSkillNodeId("000000000004")],
    completionCriteria:
      "Break one engineering task into a sequence of independently verifiable steps and assign validation to each step.",
  },
  {
    id: createFixedSkillNodeId("000000000010"),
    name: "Multi-Tool Invocation Basics",
    description:
      "Coordinate shell commands, file edits, and environment checks without losing control of the task boundary.",
    dimension: "aiOrchestration",
    difficulty: 2,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000004"),
      createFixedSkillNodeId("000000000005"),
    ],
    completionCriteria:
      "Execute a small change that uses inspection, editing, and validation commands in a controlled sequence.",
  },
  {
    id: createFixedSkillNodeId("000000000011"),
    name: "Constraint-Driven Concept Design",
    description:
      "Create solution options that stay inventive while respecting an existing stack, roadmap, and migration path.",
    dimension: "creativity",
    difficulty: 3,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000006"),
      createFixedSkillNodeId("000000000008"),
    ],
    completionCriteria:
      "Design two implementation options inside fixed technical constraints and explain why one is the better MVP choice.",
  },
  {
    id: createFixedSkillNodeId("000000000012"),
    name: "Future-State Product Visioning",
    description:
      "Project how a current technical choice supports later capabilities without overbuilding the present phase.",
    dimension: "imagination",
    difficulty: 3,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000001"),
      createFixedSkillNodeId("000000000007"),
    ],
    completionCriteria:
      "Describe how a current backend decision enables at least two later product phases without changing the public contract.",
  },
  {
    id: createFixedSkillNodeId("000000000013"),
    name: "Prompt Test Case Design",
    description:
      "Translate product requirements into concrete prompt-based verification cases and failure modes.",
    dimension: "promptPrecision",
    difficulty: 3,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000008"),
      createFixedSkillNodeId("000000000009"),
    ],
    completionCriteria:
      "Define a compact test matrix that covers success cases, malformed input, and expected error handling.",
  },
  {
    id: createFixedSkillNodeId("000000000014"),
    name: "System Boundary Mapping",
    description:
      "Draw clean seams between transport, database, and orchestration logic so later changes stay localized.",
    dimension: "systemDecomposition",
    difficulty: 3,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000009"),
      createFixedSkillNodeId("000000000010"),
    ],
    completionCriteria:
      "Map the boundaries between app composition, transport DTOs, database code, and middleware for one service.",
  },
  {
    id: createFixedSkillNodeId("000000000015"),
    name: "Agentic Workflow Handoffs",
    description:
      "Define how one AI-assisted step passes context, outputs, and constraints to the next without ambiguity.",
    dimension: "aiOrchestration",
    difficulty: 3,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000008"),
      createFixedSkillNodeId("000000000010"),
    ],
    completionCriteria:
      "Write a handoff contract between planning, implementation, and validation phases that prevents silent scope drift.",
  },
  {
    id: createFixedSkillNodeId("000000000016"),
    name: "UX Narrative Prototyping",
    description:
      "Invent developer-facing workflows that feel coherent from first request through final verification.",
    dimension: "creativity",
    difficulty: 4,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000011"),
      createFixedSkillNodeId("000000000012"),
    ],
    completionCriteria:
      "Prototype a workflow narrative that connects setup, implementation, validation, and user-visible outcomes.",
  },
  {
    id: createFixedSkillNodeId("000000000017"),
    name: "Scenario Simulation Planning",
    description:
      "Model realistic edge scenarios that a future product phase will need to support before those endpoints exist.",
    dimension: "imagination",
    difficulty: 4,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000012"),
      createFixedSkillNodeId("000000000014"),
    ],
    completionCriteria:
      "Simulate at least three future scenarios and identify which current abstractions must remain stable to support them.",
  },
  {
    id: createFixedSkillNodeId("000000000018"),
    name: "Evaluation Rubric Prompting",
    description:
      "Write prompts and checks that consistently grade implementation quality against explicit technical standards.",
    dimension: "promptPrecision",
    difficulty: 4,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000013"),
      createFixedSkillNodeId("000000000015"),
    ],
    completionCriteria:
      "Define a reusable rubric that checks correctness, boundary discipline, and validation completeness for one coding task.",
  },
  {
    id: createFixedSkillNodeId("000000000019"),
    name: "Architecture Tradeoff Design",
    description:
      "Compare implementation choices through the lens of extensibility, migration cost, and operational simplicity.",
    dimension: "systemDecomposition",
    difficulty: 4,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000013"),
      createFixedSkillNodeId("000000000014"),
    ],
    completionCriteria:
      "Produce a tradeoff note that defends one architecture choice against at least one credible alternative.",
  },
  {
    id: createFixedSkillNodeId("000000000020"),
    name: "Async Automation Composition",
    description:
      "Coordinate multiple AI-assisted steps so progress can continue while validation or sidecar work runs in parallel.",
    dimension: "aiOrchestration",
    difficulty: 4,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000014"),
      createFixedSkillNodeId("000000000015"),
    ],
    completionCriteria:
      "Demonstrate a workflow that overlaps independent workstreams without duplicating effort or losing ownership.",
  },
  {
    id: createFixedSkillNodeId("000000000021"),
    name: "Novel Feature Incubation",
    description:
      "Create original, technically grounded feature ideas that build on existing backend primitives.",
    dimension: "creativity",
    difficulty: 5,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000016"),
      createFixedSkillNodeId("000000000017"),
    ],
    completionCriteria:
      "Pitch one new capability that extends the current architecture, then justify why it fits the roadmap and constraints.",
  },
  {
    id: createFixedSkillNodeId("000000000022"),
    name: "Opportunity Landscape Modeling",
    description:
      "Imagine adjacent use cases and second-order effects of current platform decisions before they become urgent.",
    dimension: "imagination",
    difficulty: 5,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000017"),
      createFixedSkillNodeId("000000000019"),
    ],
    completionCriteria:
      "Model a future capability map that shows where the current backend foundation can expand or fail under new demands.",
  },
  {
    id: createFixedSkillNodeId("000000000023"),
    name: "Safety and Edge-Case Prompting",
    description:
      "Design instructions that reduce ambiguous model behavior around security, auth, and invalid input handling.",
    dimension: "promptPrecision",
    difficulty: 5,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000018"),
      createFixedSkillNodeId("000000000020"),
    ],
    completionCriteria:
      "Write a prompt spec that handles malicious, malformed, and boundary-case inputs without changing the required API contract.",
  },
  {
    id: createFixedSkillNodeId("000000000024"),
    name: "Cross-System Delivery Planning",
    description:
      "Plan how backend, frontend, and future automation layers will connect while keeping today’s implementation narrow.",
    dimension: "systemDecomposition",
    difficulty: 5,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000019"),
      createFixedSkillNodeId("000000000020"),
    ],
    completionCriteria:
      "Define a delivery plan that preserves stable interfaces across backend, future frontend, and future workflow automation.",
  },
  {
    id: createFixedSkillNodeId("000000000025"),
    name: "Autonomous Product Iteration Loop",
    description:
      "Run a full AI-assisted build loop from request intake to validated change while preserving architectural discipline.",
    dimension: "aiOrchestration",
    difficulty: 5,
    prerequisiteIds: [
      createFixedSkillNodeId("000000000020"),
      createFixedSkillNodeId("000000000021"),
      createFixedSkillNodeId("000000000023"),
      createFixedSkillNodeId("000000000024"),
    ],
    completionCriteria:
      "Complete an end-to-end product iteration loop that includes planning, execution, validation, and constrained follow-up.",
  },
] as const satisfies ReadonlyArray<SeedSkillNodeDefinition>;

export const AI_DEVELOPER_SKILL_TREE_NODE_COUNT = 25;

export function validateAiDeveloperSkillTree(
  nodes: ReadonlyArray<SeedSkillNodeDefinition> = aiDeveloperSkillTree,
): void {
  if (nodes.length !== AI_DEVELOPER_SKILL_TREE_NODE_COUNT) {
    throw new Error(
      `Expected ${AI_DEVELOPER_SKILL_TREE_NODE_COUNT} skill nodes, received ${nodes.length}.`,
    );
  }

  const seenIds = new Set<EntityId>();

  nodes.forEach((node, index) => {
    if (seenIds.has(node.id)) {
      throw new Error(`Duplicate skill node id detected: ${node.id}`);
    }

    seenIds.add(node.id);

    node.prerequisiteIds.forEach((prerequisiteId) => {
      if (!seenIds.has(prerequisiteId)) {
        throw new Error(
          `Skill node ${node.id} references prerequisite ${prerequisiteId} before it is defined.`,
        );
      }

      if (prerequisiteId === node.id) {
        throw new Error(`Skill node ${node.id} cannot depend on itself.`);
      }
    });

    if (node.difficulty < 1 || node.difficulty > 5) {
      throw new Error(
        `Skill node ${node.id} has invalid difficulty ${node.difficulty} at index ${index}.`,
      );
    }
  });
}
