import type { CSSProperties } from "react";
import type { DiagnosisSessionView } from "@evolith/shared";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/auth-context";
import {
  answerDiagnosis,
  getDiagnosisSession,
  isApiClientError,
  startDiagnosis,
} from "../lib/api-client";

interface PageErrorState {
  message: string;
  retryLabel: string;
  retryAction: "start" | "reloadSession" | "syncProfile";
}

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "0.9rem",
  marginTop: "1.4rem",
};

const statCardStyle: CSSProperties = {
  padding: "1.1rem 1.2rem",
  borderRadius: "20px",
  border: "1px solid rgba(34, 40, 49, 0.1)",
  background: "rgba(255, 255, 255, 0.58)",
  boxShadow: "0 14px 32px rgba(38, 38, 32, 0.08)",
};

const progressRailStyle: CSSProperties = {
  width: "100%",
  height: "0.9rem",
  borderRadius: "999px",
  background: "rgba(29, 36, 41, 0.08)",
  overflow: "hidden",
  marginTop: "1.4rem",
};

const questionSectionStyle: CSSProperties = {
  marginTop: "1.2rem",
  padding: "clamp(1.5rem, 4vw, 2.5rem)",
};

const choiceGridStyle: CSSProperties = {
  display: "grid",
  gap: "0.9rem",
  marginTop: "1.5rem",
};

const choiceButtonStyle: CSSProperties = {
  width: "100%",
  borderRadius: "24px",
  border: "1px solid rgba(29, 140, 131, 0.18)",
  background:
    "linear-gradient(180deg, rgba(255, 251, 245, 0.96), rgba(255, 248, 239, 0.88))",
  color: "var(--ink)",
  cursor: "pointer",
  display: "grid",
  gap: "0.55rem",
  padding: "1.2rem 1.25rem",
  textAlign: "left",
  boxShadow: "0 18px 36px rgba(38, 38, 32, 0.08)",
};

const choiceMetaStyle: CSSProperties = {
  color: "var(--teal-deep)",
  fontSize: "0.78rem",
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

const errorCardStyle: CSSProperties = {
  marginTop: "1rem",
  border: "1px solid rgba(153, 46, 46, 0.14)",
  borderRadius: "20px",
  background: "rgba(153, 46, 46, 0.08)",
  color: "#7c1f1f",
  padding: "0.95rem 1rem",
};

const completionCardStyle: CSSProperties = {
  marginTop: "1.2rem",
  padding: "clamp(1.5rem, 4vw, 2.4rem)",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.85rem",
  marginTop: "1rem",
};

function getRequestErrorMessage(error: unknown): string {
  if (isApiClientError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Something went wrong while synchronizing the diagnosis session.";
}

export default function DiagnosisPage() {
  const navigate = useNavigate();
  const { authStatus, profile, refreshProfile } = useAuth();
  const [session, setSession] = useState<DiagnosisSessionView | null>(null);
  const [errorState, setErrorState] = useState<PageErrorState | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isAnswerPending, setIsAnswerPending] = useState(false);
  const [isSyncPending, setIsSyncPending] = useState(false);
  const isMountedRef = useRef(false);
  const startedUserIdRef = useRef<string | null>(null);

  const activeUserId = profile?.profile.userId ?? null;
  const canRunDiagnosisFlow =
    authStatus === "authenticated" &&
    profile !== null &&
    profile.hasCompletedDiagnosis === false;
  const isBusy = isBootstrapping || isAnswerPending || isSyncPending;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setSession(null);
    setErrorState(null);
    startedUserIdRef.current = null;
  }, [activeUserId]);

  async function syncCompletedProfile() {
    setIsSyncPending(true);
    setErrorState(null);

    try {
      const nextProfile = await refreshProfile();

      if (!nextProfile.hasCompletedDiagnosis) {
        throw new Error(
          "Diagnosis completed, but the refreshed profile still reports an incomplete state.",
        );
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (isMountedRef.current) {
        setErrorState({
          message: getRequestErrorMessage(error),
          retryAction: "syncProfile",
          retryLabel: "Retry dashboard sync",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSyncPending(false);
      }
    }
  }

  async function loadDiagnosisSession() {
    setIsBootstrapping(true);
    setErrorState(null);

    try {
      const response = await startDiagnosis();

      if (isMountedRef.current) {
        setSession(response.session);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setErrorState({
          message: getRequestErrorMessage(error),
          retryAction: "start",
          retryLabel: "Retry diagnosis sync",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsBootstrapping(false);
      }
    }
  }

  async function reloadDiagnosisSession() {
    if (session === null) {
      await loadDiagnosisSession();
      return;
    }

    setIsBootstrapping(true);
    setErrorState(null);

    try {
      const response = await getDiagnosisSession(session.id);

      if (isMountedRef.current) {
        setSession(response.session);
      }

      if (response.session.state === "completed") {
        await syncCompletedProfile();
      }
    } catch (error) {
      if (isMountedRef.current) {
        setErrorState({
          message: getRequestErrorMessage(error),
          retryAction: "reloadSession",
          retryLabel: "Reload current question",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsBootstrapping(false);
      }
    }
  }

  useEffect(() => {
    if (!canRunDiagnosisFlow || activeUserId === null) {
      return;
    }

    if (session !== null || startedUserIdRef.current === activeUserId) {
      return;
    }

    startedUserIdRef.current = activeUserId;
    void loadDiagnosisSession();
  }, [activeUserId, canRunDiagnosisFlow, session]);

  async function handleChoiceSubmit(choiceId: string) {
    if (session === null || session.state !== "inProgress" || isBusy) {
      return;
    }

    setIsAnswerPending(true);
    setErrorState(null);

    try {
      const response = await answerDiagnosis(session.id, choiceId);

      if (isMountedRef.current) {
        setSession(response.session);
      }

      if (response.session.state === "completed") {
        await syncCompletedProfile();
      }
    } catch (error) {
      if (isMountedRef.current) {
        setErrorState({
          message: getRequestErrorMessage(error),
          retryAction: "reloadSession",
          retryLabel: "Reload current question",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsAnswerPending(false);
      }
    }
  }

  function handleRetry() {
    if (errorState === null || isBusy) {
      return;
    }

    if (errorState.retryAction === "start") {
      void loadDiagnosisSession();
      return;
    }

    if (errorState.retryAction === "reloadSession") {
      void reloadDiagnosisSession();
      return;
    }

    void syncCompletedProfile();
  }

  if (!canRunDiagnosisFlow) {
    return null;
  }

  const sessionProgress = session?.progress ?? null;
  const completionPercentage = sessionProgress?.completionPercentage ?? 0;
  const sessionStatusLabel =
    session?.state === "completed" ? "Diagnosis complete" : "Diagnosis in progress";

  return (
    <main className="app-shell">
      <section className="hero card">
        <p className="hero-kicker">Route /diagnosis</p>
        <h1>Map how you think before the skill tree unlocks.</h1>
        <p className="hero-copy">
          This route stays fully server-driven. It starts or resumes the
          existing diagnosis session, submits one `choiceId` at a time, and
          only leaves for `/dashboard` after `/api/profile` confirms the
          completed state.
        </p>

        {sessionProgress === null ? (
          <div className="hero-actions">
            <span className="pill">
              {isBootstrapping ? "Loading current session" : "Preparing session"}
            </span>
            <span className="pill">Guarded by /api/profile</span>
          </div>
        ) : (
          <>
            <div className="hero-actions">
              <span className="pill">
                {sessionStatusLabel}
              </span>
              <span className="pill">
                {sessionProgress.answeredQuestions}/{sessionProgress.totalQuestions} answered
              </span>
              <span className="pill">{sessionProgress.remainingQuestions} remaining</span>
            </div>
            <div style={progressRailStyle}>
              <div
                style={{
                  width: `${completionPercentage}%`,
                  height: "100%",
                  borderRadius: "inherit",
                  background:
                    "linear-gradient(90deg, var(--orange), var(--teal), var(--teal-deep))",
                  transition: "width 180ms ease",
                }}
              />
            </div>
          </>
        )}

        {errorState === null ? null : (
          <div
            aria-live="polite"
            role="alert"
            style={errorCardStyle}
          >
            <strong style={{ display: "block" }}>Session sync failed</strong>
            <span>{errorState.message}</span>
            <div style={actionRowStyle}>
              <button
                className="button-primary"
                disabled={isBusy}
                onClick={handleRetry}
                style={{
                  border: "none",
                  cursor: isBusy ? "wait" : "pointer",
                  opacity: isBusy ? 0.72 : 1,
                }}
                type="button"
              >
                {errorState.retryLabel}
              </button>
            </div>
          </div>
        )}
      </section>

      <section style={statsGridStyle}>
        <article className="card" style={statCardStyle}>
          <p className="panel-eyebrow">Session mode</p>
          <h2 style={{ margin: 0, fontSize: "2rem" }}>
            {session === null
              ? "Bootstrapping"
              : session.state === "completed"
                ? "Complete"
                : "Active"}
          </h2>
          <p className="panel-card" style={{ minHeight: "unset", padding: 0 }}>
            <span style={{ color: "var(--ink-soft)" }}>
              The page never hardcodes question order or scoring. It renders
              whatever the session payload currently says.
            </span>
          </p>
        </article>
        <article className="card" style={statCardStyle}>
          <p className="panel-eyebrow">Question cadence</p>
          <h2 style={{ margin: 0, fontSize: "2rem" }}>
            {sessionProgress === null ? "..." : `${sessionProgress.totalQuestions} steps`}
          </h2>
          <p style={{ color: "var(--ink-soft)", margin: "0.9rem 0 0" }}>
            Each submission advances one question at a time using the server’s
            sequential answer rules.
          </p>
        </article>
        <article className="card" style={statCardStyle}>
          <p className="panel-eyebrow">Completion gate</p>
          <h2 style={{ margin: 0, fontSize: "2rem" }}>
            {isSyncPending ? "Refreshing" : "Profile-first"}
          </h2>
          <p style={{ color: "var(--ink-soft)", margin: "0.9rem 0 0" }}>
            `/dashboard` only opens once the shared auth context has refreshed
            `/api/profile` and confirmed `hasCompletedDiagnosis`.
          </p>
        </article>
      </section>

      {session === null ? (
        <section className="card" style={questionSectionStyle}>
          <p className="panel-eyebrow">Diagnosis session</p>
          <h2 style={{ margin: 0, fontSize: "2.5rem" }}>
            {isBootstrapping ? "Resuming your question flow..." : "Waiting for session data"}
          </h2>
          <p style={{ color: "var(--ink-soft)", margin: "1rem 0 0" }}>
            The route asks the server for the active session before rendering a
            question so refreshes and resumes stay consistent.
          </p>
        </section>
      ) : session.state === "completed" ? (
        <section className="card" style={completionCardStyle}>
          <p className="panel-eyebrow">Diagnosis completed</p>
          <h2 style={{ margin: 0, fontSize: "clamp(2.3rem, 6vw, 4rem)" }}>
            Final answers saved. Routing to your dashboard now.
          </h2>
          <p style={{ color: "var(--ink-soft)", margin: "1rem 0 0" }}>
            The server has already produced the diagnosis result. This page is
            waiting for the shared auth context to refresh `/api/profile` so
            the dashboard guard can trust the same source of truth.
          </p>
          <div style={actionRowStyle}>
            <span className="pill">
              {isSyncPending ? "Refreshing profile..." : "Profile sync complete"}
            </span>
          </div>
        </section>
      ) : (
        <section className="card" style={questionSectionStyle}>
          <p className="panel-eyebrow">Current question</p>
          <h2 style={{ margin: 0, fontSize: "clamp(2.1rem, 5vw, 3.5rem)" }}>
            {session.currentQuestion.prompt}
          </h2>
          <p style={{ color: "var(--ink-soft)", margin: "1rem 0 0" }}>
            Choose the response that best matches how you naturally approach AI
            work. The backend owns scoring, ordering, and completion logic.
          </p>

          <div style={choiceGridStyle}>
            {session.currentQuestion.choices.map((choice, index) => (
              <button
                disabled={isBusy}
                key={choice.id}
                onClick={() => {
                  void handleChoiceSubmit(choice.id);
                }}
                style={{
                  ...choiceButtonStyle,
                  opacity: isBusy ? 0.76 : 1,
                }}
                type="button"
              >
                <span style={choiceMetaStyle}>Choice {index + 1}</span>
                <strong style={{ fontSize: "1.1rem", lineHeight: 1.4 }}>
                  {choice.label}
                </strong>
                <span style={{ color: "var(--ink-soft)" }}>
                  {isAnswerPending
                    ? "Submitting answer to the active session..."
                    : "Submit this answer and load the next server-provided state."}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
