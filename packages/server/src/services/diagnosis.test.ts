import { describe, expect, test } from "bun:test";

import {
  cognitiveDimensions,
  type DiagnosisAnswer,
  type DiagnosisQuestionSnapshot,
} from "@evolith/shared";

import {
  buildDiagnosisRadarData,
  calculateDiagnosisScores,
  clampDiagnosisScore,
  createDiagnosisAnswer,
  createDiagnosisQuestionSnapshots,
  getCurrentDiagnosisQuestion,
  getDiagnosisProgress,
  sanitizeDiagnosisQuestions,
} from "./diagnosis";

const answeredAt = "2026-04-18T00:00:00.000Z";

const createAnswers = (
  questions: readonly DiagnosisQuestionSnapshot[],
  choiceIds: readonly string[],
) => {
  const answers: DiagnosisAnswer[] = [];

  for (const choiceId of choiceIds) {
    const result = createDiagnosisAnswer(questions, answers, choiceId, answeredAt);

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error(`Expected valid diagnosis answer for choice "${choiceId}"`);
    }

    answers.push(result.answer);
  }

  return answers;
};

describe("diagnosis service", () => {
  test("sanitizes diagnosis prompts for API output without exposing scoring metadata", () => {
    const questionSnapshots = createDiagnosisQuestionSnapshots();
    const sanitizedQuestions = sanitizeDiagnosisQuestions(questionSnapshots);
    const firstSnapshot = questionSnapshots[0];
    const firstSanitizedQuestion = sanitizedQuestions[0];

    expect(firstSnapshot).toBeDefined();
    expect(firstSanitizedQuestion).toBeDefined();

    expect(sanitizedQuestions).toHaveLength(questionSnapshots.length);
    expect(firstSanitizedQuestion).toEqual({
      id: firstSnapshot!.id,
      prompt: firstSnapshot!.prompt,
      choices: firstSnapshot!.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
      })),
    });
    expect("scores" in firstSanitizedQuestion!.choices[0]!).toBe(false);
  });

  test("derives the next question and progress from answer count", () => {
    const questionSnapshots = createDiagnosisQuestionSnapshots();
    const answers = createAnswers(questionSnapshots, ["sequenced", "contrast-explore"]);
    const currentQuestion = getCurrentDiagnosisQuestion(questionSnapshots, answers);
    const progress = getDiagnosisProgress(questionSnapshots, answers);

    expect(currentQuestion?.id).toBe("diagnosis-q3");
    expect(currentQuestion?.choices.map((choice) => choice.id)).toEqual([
      "single-call",
      "partial-split",
      "staged-flow",
      "orchestrated-loop",
    ]);
    expect(progress).toEqual({
      totalQuestions: 6,
      answeredQuestions: 2,
      remainingQuestions: 4,
      completionPercentage: 33,
    });
  });

  test("returns cloned diagnosis question snapshots on every call", () => {
    const firstSnapshots = createDiagnosisQuestionSnapshots();
    const secondSnapshots = createDiagnosisQuestionSnapshots();

    firstSnapshots[0]!.prompt = "Mutated prompt";
    firstSnapshots[0]!.dimensionIds.push("creativity");
    firstSnapshots[0]!.choices[0]!.label = "Mutated label";
    firstSnapshots[0]!.choices[0]!.scores.promptPrecision = 0;

    expect(secondSnapshots[0]).toEqual({
      id: "diagnosis-q1",
      prompt:
        "When a request is ambiguous, what is your default first move before asking AI to solve it?",
      dimensionIds: ["promptPrecision", "systemDecomposition"],
      choices: [
        {
          id: "one-shot",
          label: "Ask for a full answer immediately and refine later.",
          scores: {
            promptPrecision: 20,
            systemDecomposition: 10,
          },
        },
        {
          id: "brief",
          label: "Write a short prompt with one broad success criterion.",
          scores: {
            promptPrecision: 45,
            systemDecomposition: 35,
          },
        },
        {
          id: "structured",
          label: "Define inputs, outputs, and constraints before prompting.",
          scores: {
            promptPrecision: 80,
            systemDecomposition: 70,
          },
        },
        {
          id: "sequenced",
          label: "Break the task into steps with explicit acceptance criteria.",
          scores: {
            promptPrecision: 100,
            systemDecomposition: 95,
          },
        },
      ],
    });
  });

  test("calculates deterministic scores from valid sequential choice ids", () => {
    const questionSnapshots = createDiagnosisQuestionSnapshots();
    const answers = createAnswers(questionSnapshots, [
      "sequenced",
      "contrast-explore",
      "staged-flow",
      "tighten-and-debug",
      "concept-then-milestones",
      "standardized-flow",
    ]);

    expect(calculateDiagnosisScores(questionSnapshots, answers)).toEqual({
      creativity: 80,
      imagination: 83,
      promptPrecision: 90,
      systemDecomposition: 85,
      aiOrchestration: 78,
    });
  });

  test("clamps diagnosis scores to the 0..100 range", () => {
    const customQuestions: DiagnosisQuestionSnapshot[] = [
      {
        id: "custom-q1",
        prompt: "Custom prompt",
        dimensionIds: [...cognitiveDimensions],
        choices: [
          {
            id: "clamped-choice",
            label: "Clamp values",
            scores: {
              creativity: -25,
              imagination: 150,
              promptPrecision: 99.6,
              systemDecomposition: 0.2,
              aiOrchestration: 101,
            },
          },
        ],
      },
    ];
    const answers = createAnswers(customQuestions, ["clamped-choice"]);

    expect(clampDiagnosisScore(-5)).toBe(0);
    expect(clampDiagnosisScore(101)).toBe(100);
    expect(calculateDiagnosisScores(customQuestions, answers)).toEqual({
      creativity: 0,
      imagination: 100,
      promptPrecision: 100,
      systemDecomposition: 0,
      aiOrchestration: 100,
    });
  });

  test("builds radar data in shared cognitive dimension order", () => {
    const radar = buildDiagnosisRadarData({
      aiOrchestration: 44,
      creativity: 11,
      imagination: 22,
      promptPrecision: 33,
      systemDecomposition: 55,
    });

    expect(radar.map((datum) => datum.dimension)).toEqual([...cognitiveDimensions]);
    expect(radar.map((datum) => datum.value)).toEqual([11, 22, 33, 55, 44]);
  });
});
