import type { InProgressDiagnosisSessionView } from "@evolith/shared";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ApiClientError,
  answerDiagnosis,
  getProfile,
  startDiagnosis,
} from "../lib/api";
import { useSession } from "../lib/session";

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function getQuestionNumber(session: InProgressDiagnosisSessionView): number {
  return session.progress.answeredQuestions + 1;
}

export function DiagnosisPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { clearSession, session } = useSession();
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [diagnosisSession, setDiagnosisSession] =
    useState<InProgressDiagnosisSessionView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(session !== null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState("");

  useEffect(() => {
    if (session === null) {
      navigate("/auth", { replace: true });
      return;
    }

    let isActive = true;

    setIsBootstrapping(true);
    setDiagnosisSession(null);
    setErrorMessage(null);
    setSelectedChoiceId("");

    async function bootstrapDiagnosis(): Promise<void> {
      try {
        const profile = await getProfile();

        if (!isActive) {
          return;
        }

        if (profile.hasCompletedDiagnosis) {
          navigate("/dashboard", { replace: true });
          return;
        }

        const response = await startDiagnosis();

        if (!isActive) {
          return;
        }

        setDiagnosisSession(response.session);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.isAuthExpired) {
          clearSession();
          navigate("/auth", { replace: true });
          return;
        }

        setErrorMessage(
          getErrorMessage(
            error,
            "We could not load your diagnosis. Please try again.",
          ),
        );
      } finally {
        if (isActive) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrapDiagnosis();

    return () => {
      isActive = false;
    };
  }, [bootstrapAttempt, clearSession, navigate, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (diagnosisSession === null) {
      return;
    }

    if (selectedChoiceId.length === 0) {
      setErrorMessage("Choose one response before continuing.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await answerDiagnosis({
        id: diagnosisSession.id,
        choiceId: selectedChoiceId,
      });

      if (response.session.state === "completed") {
        navigate("/dashboard", { replace: true });
        return;
      }

      setDiagnosisSession(response.session);
      setSelectedChoiceId("");
    } catch (error) {
      if (error instanceof ApiClientError && error.isAuthExpired) {
        clearSession();
        navigate("/auth", { replace: true });
        return;
      }

      setErrorMessage(
        getErrorMessage(
          error,
          "We could not save your answer. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRetry(): void {
    setBootstrapAttempt((currentAttempt) => currentAttempt + 1);
  }

  function handleSignOut(): void {
    clearSession();
    navigate("/auth", { replace: true });
  }

  if (session === null) {
    return (
      <main className="min-h-screen px-6 py-10 text-ink-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center rounded-4xl border border-white/70 bg-white/85 p-8 shadow-card backdrop-blur">
          <div className="max-w-md space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
              Evolith
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Redirecting to sign in
            </h1>
            <p className="text-base text-ink-700">
              This step requires an authenticated session.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (isBootstrapping) {
    return (
      <main className="min-h-screen px-6 py-10 text-ink-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center rounded-4xl border border-white/70 bg-white/85 p-8 shadow-card backdrop-blur">
          <div className="max-w-md space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
              Diagnosis
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Loading your active assessment
            </h1>
            <p className="text-base text-ink-700">
              We are checking your profile first so completed users return to the dashboard and
              everyone else resumes the right in-progress session.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (diagnosisSession === null) {
    return (
      <main className="min-h-screen px-6 py-10 text-ink-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center rounded-4xl border border-white/70 bg-white/85 p-8 shadow-card backdrop-blur">
          <section className="max-w-lg space-y-5 rounded-[2rem] border border-clay-200 bg-sand-50 p-8 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
                Diagnosis Unavailable
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-ink-950">
                We could not load your next question
              </h1>
              <p className="text-base text-ink-700">
                {errorMessage ?? "The diagnosis session could not be started."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900"
                onClick={handleRetry}
                type="button"
              >
                Retry diagnosis
              </button>
              <button
                className="rounded-full border border-clay-300 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:border-clay-500 hover:bg-white"
                onClick={handleSignOut}
                type="button"
              >
                Sign out
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const questionNumber = getQuestionNumber(diagnosisSession);

  return (
    <main className="min-h-screen px-6 py-10 text-ink-950">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 rounded-4xl border border-white/70 bg-white/85 p-6 shadow-card backdrop-blur lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(19,34,56,0.98),rgba(48,76,96,0.92))] p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sand-100/80">
            Diagnosis
          </p>
          <div className="mt-10 space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              One question at a time keeps the scoring sequence intact.
            </h1>
            <p className="max-w-lg text-base text-sand-100/80 sm:text-lg">
              Evolith saves each answer against the current in-progress session, then returns the
              next question or completes the profile when the sixth answer lands.
            </p>
          </div>

          <div className="mt-10 space-y-4 rounded-[1.75rem] border border-white/10 bg-white/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sand-100/75">
              Progress
            </p>
            <p className="text-3xl font-semibold">
              Question {questionNumber} of {diagnosisSession.progress.totalQuestions}
            </p>
            <div className="h-3 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-sand-200 transition-all"
                style={{
                  width: `${diagnosisSession.progress.completionPercentage}%`,
                }}
              />
            </div>
            <div className="grid gap-3 text-sm text-sand-100/80 sm:grid-cols-3">
              <div>
                <p className="font-semibold text-white">
                  {diagnosisSession.progress.answeredQuestions}
                </p>
                <p>Answered</p>
              </div>
              <div>
                <p className="font-semibold text-white">
                  {diagnosisSession.progress.remainingQuestions}
                </p>
                <p>Remaining</p>
              </div>
              <div>
                <p className="font-semibold text-white">
                  {diagnosisSession.progress.completionPercentage}%
                </p>
                <p>Complete</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-clay-200 bg-sand-50 p-6 shadow-sm sm:p-8">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
                Question {questionNumber}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-ink-950">
                {diagnosisSession.currentQuestion.prompt}
              </h2>
              <p className="text-sm text-ink-700">
                Choose the option that best matches how you currently approach AI-assisted work.
              </p>
            </div>

            {errorMessage !== null ? (
              <div
                className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
                role="alert"
              >
                {errorMessage}
              </div>
            ) : null}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <fieldset className="space-y-3" disabled={isSubmitting}>
                <legend className="sr-only">Diagnosis answer choices</legend>
                {diagnosisSession.currentQuestion.choices.map((choice) => {
                  const isSelected = selectedChoiceId === choice.id;

                  return (
                    <label
                      className={`block cursor-pointer rounded-[1.5rem] border px-5 py-4 transition ${
                        isSelected
                          ? "border-ink-950 bg-white shadow-sm"
                          : "border-clay-200 bg-white/70 hover:border-clay-400 hover:bg-white"
                      }`}
                      key={choice.id}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          checked={isSelected}
                          className="mt-1 h-4 w-4 border-clay-400 text-ink-950 focus:ring-ink-950"
                          name="diagnosis-choice"
                          onChange={() => {
                            setSelectedChoiceId(choice.id);
                            setErrorMessage(null);
                          }}
                          type="radio"
                          value={choice.id}
                        />
                        <span className="text-base text-ink-900">{choice.label}</span>
                      </div>
                    </label>
                  );
                })}
              </fieldset>

              <button
                className="w-full rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900 disabled:cursor-not-allowed disabled:bg-clay-400"
                disabled={isSubmitting || selectedChoiceId.length === 0}
                type="submit"
              >
                {isSubmitting ? "Saving answer..." : "Continue"}
              </button>

              <p
                aria-live="polite"
                className="text-center text-sm text-ink-600"
              >
                Each answer updates the current session in order. Completed users are sent straight
                to the dashboard.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default DiagnosisPage;
