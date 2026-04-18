import type {
  CognitiveDimension,
  CognitiveDimensionScores,
  DiagnosisAnswer,
  DiagnosisProgress,
  DiagnosisQuestion,
  DiagnosisQuestionChoiceScores,
  DiagnosisQuestionSnapshot,
  DiagnosisQuestionSnapshotChoice,
  DiagnosisRadarData,
  DiagnosisResult,
  IsoTimestampString,
} from "@evolith/shared";
import { cognitiveDimensions } from "@evolith/shared";

export const diagnosisQuestionBank: readonly DiagnosisQuestionSnapshot[] = [
  {
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
  },
  {
    id: "diagnosis-q2",
    prompt:
      "You need fresh product directions for a crowded market. How do you generate options?",
    dimensionIds: ["creativity", "imagination"],
    choices: [
      {
        id: "safe-repeat",
        label: "Reuse a familiar concept that already looks proven.",
        scores: {
          creativity: 25,
          imagination: 20,
        },
      },
      {
        id: "incremental-mix",
        label: "Blend one new angle into an existing template.",
        scores: {
          creativity: 55,
          imagination: 50,
        },
      },
      {
        id: "contrast-explore",
        label: "Explore several contrasting directions before choosing.",
        scores: {
          creativity: 80,
          imagination: 85,
        },
      },
      {
        id: "extreme-reframe",
        label:
          "Reframe the problem from an unexpected perspective and prototype the extremes.",
        scores: {
          creativity: 100,
          imagination: 100,
        },
      },
    ],
  },
  {
    id: "diagnosis-q3",
    prompt:
      "How do you approach an AI workflow that spans research, drafting, and verification?",
    dimensionIds: ["systemDecomposition", "aiOrchestration"],
    choices: [
      {
        id: "single-call",
        label: "Use one model call and hope it handles the full workflow.",
        scores: {
          systemDecomposition: 15,
          aiOrchestration: 20,
        },
      },
      {
        id: "partial-split",
        label: "Separate one handoff but keep most of the flow implicit.",
        scores: {
          systemDecomposition: 45,
          aiOrchestration: 50,
        },
      },
      {
        id: "staged-flow",
        label: "Define stages, tool roles, and checkpoints for each handoff.",
        scores: {
          systemDecomposition: 80,
          aiOrchestration: 80,
        },
      },
      {
        id: "orchestrated-loop",
        label:
          "Design a full orchestration loop with specialists, verification, and retries.",
        scores: {
          systemDecomposition: 100,
          aiOrchestration: 100,
        },
      },
    ],
  },
  {
    id: "diagnosis-q4",
    prompt:
      "A model keeps producing weak output. What is your most effective adjustment?",
    dimensionIds: ["promptPrecision", "aiOrchestration"],
    choices: [
      {
        id: "rerun",
        label: "Rerun the same prompt a few more times.",
        scores: {
          promptPrecision: 10,
          aiOrchestration: 15,
        },
      },
      {
        id: "more-context",
        label: "Add some context and try again without changing the flow.",
        scores: {
          promptPrecision: 45,
          aiOrchestration: 40,
        },
      },
      {
        id: "tighten-and-debug",
        label:
          "Tighten instructions, add examples, and inspect likely failure points.",
        scores: {
          promptPrecision: 80,
          aiOrchestration: 75,
        },
      },
      {
        id: "instrumented-fallbacks",
        label:
          "Use structured prompts, evaluators, and fallback strategies across the workflow.",
        scores: {
          promptPrecision: 100,
          aiOrchestration: 95,
        },
      },
    ],
  },
  {
    id: "diagnosis-q5",
    prompt:
      "How do you turn a fuzzy idea into a build plan that other people can execute?",
    dimensionIds: ["creativity", "systemDecomposition"],
    choices: [
      {
        id: "build-now",
        label: "Start building immediately and figure it out as you go.",
        scores: {
          creativity: 20,
          systemDecomposition: 10,
        },
      },
      {
        id: "loose-outline",
        label: "Write a loose outline and improvise the remaining details.",
        scores: {
          creativity: 50,
          systemDecomposition: 40,
        },
      },
      {
        id: "concept-then-milestones",
        label:
          "Sketch multiple concepts, choose one, then break it into milestones.",
        scores: {
          creativity: 80,
          systemDecomposition: 80,
        },
      },
      {
        id: "diverge-then-reduce",
        label:
          "Generate divergent concepts, test assumptions, then reduce the winner into execution slices.",
        scores: {
          creativity: 100,
          systemDecomposition: 95,
        },
      },
    ],
  },
  {
    id: "diagnosis-q6",
    prompt:
      "You are standardizing daily AI usage across a team. What does strong practice look like?",
    dimensionIds: ["imagination", "aiOrchestration"],
    choices: [
      {
        id: "ad-hoc-sharing",
        label: "Share prompts casually and let each person improvise.",
        scores: {
          imagination: 20,
          aiOrchestration: 15,
        },
      },
      {
        id: "template-pack",
        label: "Provide a few templates but keep most work manual.",
        scores: {
          imagination: 50,
          aiOrchestration: 45,
        },
      },
      {
        id: "standardized-flow",
        label: "Standardize prompts, ownership, and handoffs across the team.",
        scores: {
          imagination: 80,
          aiOrchestration: 80,
        },
      },
      {
        id: "playbook-system",
        label:
          "Create reusable agents, review loops, and playbooks for recurring scenarios.",
        scores: {
          imagination: 100,
          aiOrchestration: 100,
        },
      },
    ],
  },
];

export type DiagnosisAnswerValidationErrorCode =
  | "invalid_choice"
  | "no_remaining_question";

export type DiagnosisAnswerValidationResult =
  | {
      success: true;
      question: DiagnosisQuestionSnapshot;
      choice: DiagnosisQuestionSnapshotChoice;
    }
  | {
      success: false;
      code: DiagnosisAnswerValidationErrorCode;
    };

export type CreateDiagnosisAnswerResult =
  | (Extract<DiagnosisAnswerValidationResult, { success: true }> & {
      answer: DiagnosisAnswer;
    })
  | Extract<DiagnosisAnswerValidationResult, { success: false }>;

const createEmptyScores = (): CognitiveDimensionScores => ({
  creativity: 0,
  imagination: 0,
  promptPrecision: 0,
  systemDecomposition: 0,
  aiOrchestration: 0,
});

const createEmptyCounts = (): Record<CognitiveDimension, number> => ({
  creativity: 0,
  imagination: 0,
  promptPrecision: 0,
  systemDecomposition: 0,
  aiOrchestration: 0,
});

const cloneChoiceScores = (
  scores: DiagnosisQuestionChoiceScores,
): DiagnosisQuestionChoiceScores => {
  const clonedScores: DiagnosisQuestionChoiceScores = {};

  for (const dimension of cognitiveDimensions) {
    const score = scores[dimension];

    if (score !== undefined) {
      clonedScores[dimension] = score;
    }
  }

  return clonedScores;
};

const cloneQuestionSnapshot = (
  question: DiagnosisQuestionSnapshot,
): DiagnosisQuestionSnapshot => ({
  id: question.id,
  prompt: question.prompt,
  dimensionIds: [...question.dimensionIds],
  choices: question.choices.map((choice) => ({
    id: choice.id,
    label: choice.label,
    scores: cloneChoiceScores(choice.scores),
  })),
});

export const clampDiagnosisScore = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(value)));

export const createDiagnosisQuestionSnapshots = (): DiagnosisQuestionSnapshot[] =>
  diagnosisQuestionBank.map(cloneQuestionSnapshot);

export const sanitizeDiagnosisQuestion = (
  question: DiagnosisQuestionSnapshot,
): DiagnosisQuestion => ({
  id: question.id,
  prompt: question.prompt,
  choices: question.choices.map((choice) => ({
    id: choice.id,
    label: choice.label,
  })),
});

export const sanitizeDiagnosisQuestions = (
  questions: readonly DiagnosisQuestionSnapshot[],
): DiagnosisQuestion[] => questions.map(sanitizeDiagnosisQuestion);

export const getDiagnosisProgress = (
  questions: readonly DiagnosisQuestionSnapshot[],
  answers: readonly DiagnosisAnswer[],
): DiagnosisProgress => {
  const totalQuestions = questions.length;
  const answeredQuestions = Math.min(Math.max(answers.length, 0), totalQuestions);
  const remainingQuestions = Math.max(totalQuestions - answeredQuestions, 0);
  const completionPercentage =
    totalQuestions === 0
      ? 0
      : clampDiagnosisScore((answeredQuestions / totalQuestions) * 100);

  return {
    totalQuestions,
    answeredQuestions,
    remainingQuestions,
    completionPercentage,
  };
};

export const getCurrentDiagnosisQuestionSnapshot = (
  questions: readonly DiagnosisQuestionSnapshot[],
  answers: readonly DiagnosisAnswer[],
): DiagnosisQuestionSnapshot | null => questions[answers.length] ?? null;

export const getCurrentDiagnosisQuestion = (
  questions: readonly DiagnosisQuestionSnapshot[],
  answers: readonly DiagnosisAnswer[],
): DiagnosisQuestion | null => {
  const currentQuestion = getCurrentDiagnosisQuestionSnapshot(questions, answers);

  return currentQuestion === null ? null : sanitizeDiagnosisQuestion(currentQuestion);
};

export const validateDiagnosisAnswerChoice = (
  questions: readonly DiagnosisQuestionSnapshot[],
  answers: readonly DiagnosisAnswer[],
  choiceId: string,
): DiagnosisAnswerValidationResult => {
  const currentQuestion = getCurrentDiagnosisQuestionSnapshot(questions, answers);

  if (currentQuestion === null) {
    return {
      success: false,
      code: "no_remaining_question",
    };
  }

  const choice = currentQuestion.choices.find((candidate) => candidate.id === choiceId);

  if (choice === undefined) {
    return {
      success: false,
      code: "invalid_choice",
    };
  }

  return {
    success: true,
    question: currentQuestion,
    choice,
  };
};

export const createDiagnosisAnswer = (
  questions: readonly DiagnosisQuestionSnapshot[],
  answers: readonly DiagnosisAnswer[],
  choiceId: string,
  answeredAt: IsoTimestampString,
): CreateDiagnosisAnswerResult => {
  const validationResult = validateDiagnosisAnswerChoice(questions, answers, choiceId);

  if (!validationResult.success) {
    return validationResult;
  }

  return {
    ...validationResult,
    answer: {
      questionId: validationResult.question.id,
      choiceId,
      answeredAt,
    },
  };
};

export const calculateDiagnosisScores = (
  questions: readonly DiagnosisQuestionSnapshot[],
  answers: readonly DiagnosisAnswer[],
): CognitiveDimensionScores => {
  const totals = createEmptyScores();
  const counts = createEmptyCounts();
  const answersByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer] as const),
  );

  for (const question of questions) {
    const answer = answersByQuestionId.get(question.id);

    if (answer === undefined) {
      continue;
    }

    const choice = question.choices.find(
      (candidate) => candidate.id === answer.choiceId,
    );

    if (choice === undefined) {
      continue;
    }

    for (const dimension of question.dimensionIds) {
      totals[dimension] += clampDiagnosisScore(choice.scores[dimension] ?? 0);
      counts[dimension] += 1;
    }
  }

  const scores = createEmptyScores();

  for (const dimension of cognitiveDimensions) {
    const count = counts[dimension];

    scores[dimension] =
      count === 0 ? 0 : clampDiagnosisScore(totals[dimension] / count);
  }

  return scores;
};

export const buildDiagnosisRadarData = (
  scores: CognitiveDimensionScores,
): DiagnosisRadarData =>
  cognitiveDimensions.map((dimension) => ({
    dimension,
    value: clampDiagnosisScore(scores[dimension]),
  }));

export const buildDiagnosisResult = (
  questions: readonly DiagnosisQuestionSnapshot[],
  answers: readonly DiagnosisAnswer[],
): DiagnosisResult => {
  const scores = calculateDiagnosisScores(questions, answers);

  return {
    scores,
    radar: buildDiagnosisRadarData(scores),
  };
};
