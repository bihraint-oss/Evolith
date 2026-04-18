import type {
  CognitiveDimension,
  DiagnosisQuestion,
  SkillDifficulty,
} from "@evolith/shared";

export const aiProviderCapabilities = [
  "diagnosisGeneration",
  "skillContentGeneration",
] as const;

export type AiProviderCapability = (typeof aiProviderCapabilities)[number];

export interface AiProviderMetadata {
  name: string;
  model: string;
  capabilities: readonly AiProviderCapability[];
}

export interface DiagnosisQuestionGenerationRequest {
  userId: string;
  targetDimensions: readonly CognitiveDimension[];
  questionCount: number;
}

export interface DiagnosisQuestionGenerationResult {
  questions: DiagnosisQuestion[];
}

export interface SkillContentGenerationRequest {
  skillName: string;
  skillDescription: string;
  dimension: CognitiveDimension;
  difficulty: SkillDifficulty;
  completionCriteria: string;
}

export interface SkillContentGenerationResult {
  summary: string;
  practiceSteps: string[];
  evaluationCriteria: string[];
}

export interface AiProvider {
  metadata: AiProviderMetadata;
  generateDiagnosisQuestions?(
    request: DiagnosisQuestionGenerationRequest,
  ): Promise<DiagnosisQuestionGenerationResult>;
  generateSkillContent?(
    request: SkillContentGenerationRequest,
  ): Promise<SkillContentGenerationResult>;
}
