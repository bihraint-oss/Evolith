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

export interface SkillNodeView extends SkillNode {
  status: UserProgressStatus;
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

export type DiagnosisQuestionChoiceScores = Partial<CognitiveDimensionScores>;

export interface DiagnosisQuestionChoice {
  id: string;
  label: string;
}

export interface DiagnosisQuestion {
  id: EntityId;
  prompt: string;
  choices: DiagnosisQuestionChoice[];
}

export interface DiagnosisQuestionSnapshotChoice extends DiagnosisQuestionChoice {
  scores: DiagnosisQuestionChoiceScores;
}

export interface DiagnosisQuestionSnapshot {
  id: EntityId;
  prompt: string;
  dimensionIds: CognitiveDimension[];
  choices: DiagnosisQuestionSnapshotChoice[];
}

export interface DiagnosisAnswer {
  questionId: EntityId;
  choiceId: string;
  answeredAt: IsoTimestampString;
}

export interface DiagnosisSession {
  id: EntityId;
  userId: EntityId;
  state: DiagnosisSessionState;
  questions: DiagnosisQuestionSnapshot[];
  answers: DiagnosisAnswer[];
  profileSnapshot: CognitiveDimensionScores | null;
  completedAt: IsoTimestampString | null;
  createdAt: IsoTimestampString;
  updatedAt: IsoTimestampString;
}

export interface DiagnosisProgress {
  totalQuestions: number;
  answeredQuestions: number;
  remainingQuestions: number;
  completionPercentage: number;
}

export interface DiagnosisRadarDatum {
  dimension: CognitiveDimension;
  value: number;
}

export type DiagnosisRadarData = DiagnosisRadarDatum[];

export interface DiagnosisResult {
  scores: CognitiveDimensionScores;
  radar: DiagnosisRadarData;
}

export interface DiagnosisSessionViewBase {
  id: EntityId;
  state: DiagnosisSessionState;
  progress: DiagnosisProgress;
  createdAt: IsoTimestampString;
  updatedAt: IsoTimestampString;
}

export interface InProgressDiagnosisSessionView extends DiagnosisSessionViewBase {
  state: "inProgress";
  currentQuestion: DiagnosisQuestion;
  result: null;
  completedAt: null;
}

export interface CompletedDiagnosisSessionView extends DiagnosisSessionViewBase {
  state: "completed";
  currentQuestion: null;
  result: DiagnosisResult;
  completedAt: IsoTimestampString;
}

export type DiagnosisSessionView =
  | InProgressDiagnosisSessionView
  | CompletedDiagnosisSessionView;

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

export type GetProfileRequest = Record<string, never>;

export interface GetProfileResponse {
  profile: CognitiveProfile;
  hasCompletedDiagnosis: boolean;
  lastDiagnosedAt: IsoTimestampString | null;
  radar: DiagnosisRadarData | null;
}

export type GetSkillsRequest = Record<string, never>;

export interface GetSkillsResponse {
  skills: SkillNodeView[];
}

export interface GetSkillRequest {
  id: EntityId;
}

export interface GetSkillResponse {
  skill: SkillNodeView;
}

export type StartDiagnosisRequest = Record<string, never>;

export interface StartDiagnosisResponse {
  session: InProgressDiagnosisSessionView;
}

export interface GetDiagnosisSessionRequest {
  id: EntityId;
}

export interface GetDiagnosisSessionResponse {
  session: DiagnosisSessionView;
}

export interface AnswerDiagnosisRequest {
  id: EntityId;
  choiceId: string;
}

export interface AnswerDiagnosisResponse {
  session: DiagnosisSessionView;
}
