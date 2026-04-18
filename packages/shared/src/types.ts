export const cognitiveDimensions = [
  "creativity",
  "imagination",
  "promptPrecision",
  "systemDecomposition",
  "aiOrchestration",
] as const;

export type CognitiveDimension = (typeof cognitiveDimensions)[number];

export const skillDifficulties = [1, 2, 3, 4, 5] as const;

export type SkillDifficulty = (typeof skillDifficulties)[number];

export const userProgressStatuses = [
  "locked",
  "available",
  "inProgress",
  "completed",
] as const;

export type UserProgressStatus = (typeof userProgressStatuses)[number];

export const diagnosisSessionStates = ["inProgress", "completed"] as const;

export type DiagnosisSessionState = (typeof diagnosisSessionStates)[number];

export const authTokenTypes = ["access", "refresh"] as const;

export type AuthTokenType = (typeof authTokenTypes)[number];

export type EntityId = string;
export type IsoTimestampString = string;

export interface CognitiveDimensionScores {
  creativity: number;
  imagination: number;
  promptPrecision: number;
  systemDecomposition: number;
  aiOrchestration: number;
}

export interface PublicUser {
  id: EntityId;
  email: string;
  displayName: string;
  createdAt: IsoTimestampString;
  updatedAt: IsoTimestampString;
}

export interface CognitiveProfile extends CognitiveDimensionScores {
  id: EntityId;
  userId: EntityId;
  lastDiagnosedAt: IsoTimestampString | null;
  createdAt: IsoTimestampString;
  updatedAt: IsoTimestampString;
}

export interface SkillNode {
  id: EntityId;
  name: string;
  description: string;
  dimension: CognitiveDimension;
  difficulty: SkillDifficulty;
  prerequisiteIds: EntityId[];
  completionCriteria: string;
  createdAt: IsoTimestampString;
  updatedAt: IsoTimestampString;
}

export interface UserProgress {
  id: EntityId;
  userId: EntityId;
  skillNodeId: EntityId;
  status: UserProgressStatus;
  startedAt: IsoTimestampString | null;
  completedAt: IsoTimestampString | null;
  score: number | null;
}

export interface DiagnosisQuestionChoice {
  id: string;
  label: string;
  value: number;
}

export interface DiagnosisQuestion {
  id: EntityId;
  prompt: string;
  dimensionIds: CognitiveDimension[];
  choices: DiagnosisQuestionChoice[];
}

export type DiagnosisAnswerValue = number | string | string[];

export interface DiagnosisAnswer {
  questionId: EntityId;
  value: DiagnosisAnswerValue;
  answeredAt: IsoTimestampString;
}

export interface DiagnosisSession {
  id: EntityId;
  userId: EntityId;
  state: DiagnosisSessionState;
  questions: DiagnosisQuestion[];
  answers: DiagnosisAnswer[];
  profileSnapshot: CognitiveDimensionScores | null;
  completedAt: IsoTimestampString | null;
  createdAt: IsoTimestampString;
  updatedAt: IsoTimestampString;
}

export interface ApiSuccessResponse<TData> {
  data: TData;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
}

interface BaseAuthTokenPayload {
  sub: EntityId;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AccessTokenPayload extends BaseAuthTokenPayload {
  type: "access";
}

export interface RefreshTokenPayload extends BaseAuthTokenPayload {
  type: "refresh";
}

export type AuthTokenPayload = AccessTokenPayload | RefreshTokenPayload;

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}
