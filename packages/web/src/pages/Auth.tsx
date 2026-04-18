import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiClientError, getProfile, login, register } from "../lib/api";
import { createStoredSession, useSession } from "../lib/session";

type AuthMode = "register" | "login";

interface AuthFormState {
  displayName: string;
  email: string;
  password: string;
}

const initialFormState: AuthFormState = {
  displayName: "",
  email: "",
  password: "",
};

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

export function AuthPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { clearSession, session, setSession } = useSession();
  const initialSessionRef = useRef(session);
  const [mode, setMode] = useState<AuthMode>("register");
  const [formState, setFormState] = useState<AuthFormState>(initialFormState);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(
    initialSessionRef.current !== null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    const existingSession = initialSessionRef.current;

    if (existingSession === null) {
      return;
    }

    let isActive = true;

    async function redirectAuthenticatedUser(): Promise<void> {
      try {
        const profile = await getProfile();

        if (!isActive) {
          return;
        }

        navigate(
          profile.hasCompletedDiagnosis ? "/dashboard" : "/diagnosis",
          { replace: true },
        );
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.isAuthExpired) {
          clearSession();
        }

        setRedirectError(
          getErrorMessage(
            error,
            "We could not load your profile. Please try again.",
          ),
        );
      } finally {
        if (isActive) {
          setIsBootstrapping(false);
        }
      }
    }

    void redirectAuthenticatedUser();

    return () => {
      isActive = false;
    };
  }, [bootstrapAttempt, clearSession, navigate]);

  async function routeFromProfile(): Promise<void> {
    const profile = await getProfile();

    navigate(profile.hasCompletedDiagnosis ? "/dashboard" : "/diagnosis", {
      replace: true,
    });
  }

  function updateField(
    field: keyof AuthFormState,
    value: AuthFormState[keyof AuthFormState],
  ): void {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  }

  function handleModeChange(nextMode: AuthMode): void {
    setMode(nextMode);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setErrorMessage(null);
    setRedirectError(null);
    setIsSubmitting(true);

    try {
      const authResponse =
        mode === "register"
          ? await register({
              displayName: formState.displayName.trim(),
              email: formState.email.trim(),
              password: formState.password,
            })
          : await login({
              email: formState.email.trim(),
              password: formState.password,
            });

      setSession(createStoredSession(authResponse));
      await routeFromProfile();
    } catch (error) {
      if (error instanceof ApiClientError && error.isAuthExpired) {
        clearSession();
      }

      setErrorMessage(
        getErrorMessage(error, "We could not sign you in. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasStoredSession = initialSessionRef.current !== null && session !== null;

  if (isBootstrapping) {
    return (
      <main className="min-h-screen px-6 py-10 text-ink-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center rounded-4xl border border-white/70 bg-white/85 p-8 shadow-card backdrop-blur">
          <div className="max-w-md space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
              Evolith
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Checking your saved session
            </h1>
            <p className="text-base text-ink-700">
              Loading your profile to decide whether you should continue the diagnosis or return
              to your dashboard.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (hasStoredSession && redirectError !== null) {
    return (
      <main className="min-h-screen px-6 py-10 text-ink-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center rounded-4xl border border-white/70 bg-white/85 p-8 shadow-card backdrop-blur">
          <section className="max-w-lg space-y-5 rounded-[2rem] border border-clay-200 bg-sand-50 p-8 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
                Session Check Failed
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-ink-950">
                We could not route you automatically
              </h1>
              <p className="text-base text-ink-700">{redirectError}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900"
                onClick={() => {
                  setIsBootstrapping(true);
                  setRedirectError(null);
                  initialSessionRef.current = session;
                  setBootstrapAttempt((attempt) => attempt + 1);
                }}
                type="button"
              >
                Retry profile check
              </button>
              <button
                className="rounded-full border border-clay-300 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:border-clay-500 hover:bg-white"
                onClick={() => {
                  clearSession();
                  setRedirectError(null);
                }}
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

  return (
    <main className="min-h-screen px-6 py-10 text-ink-950">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 rounded-4xl border border-white/70 bg-white/85 p-6 shadow-card backdrop-blur lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(19,34,56,0.98),rgba(48,76,96,0.92))] p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sand-100/80">
            Evolith
          </p>
          <div className="mt-12 space-y-5">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Diagnose how you work with AI before the platform tells you what to learn next.
            </h1>
            <p className="max-w-lg text-base text-sand-100/80 sm:text-lg">
              One account gives you the full MVP loop: sign in, answer the six-question diagnosis,
              and land on a dashboard that reflects your current collaboration profile.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-semibold text-sand-50">Auth</p>
              <p className="mt-2 text-sm text-sand-100/80">
                Register or log in without leaving this page.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-semibold text-sand-50">Diagnosis</p>
              <p className="mt-2 text-sm text-sand-100/80">
                The next step is always chosen from live profile state.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-semibold text-sand-50">Dashboard</p>
              <p className="mt-2 text-sm text-sand-100/80">
                Returning users skip straight to their saved radar and skill graph.
              </p>
            </article>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-clay-200 bg-sand-50 p-6 shadow-sm sm:p-8">
            <div className="flex gap-2 rounded-full bg-white p-1 shadow-sm">
              <button
                className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  mode === "register"
                    ? "bg-ink-950 text-white"
                    : "text-ink-700 hover:bg-sand-100"
                }`}
                onClick={() => handleModeChange("register")}
                type="button"
              >
                Register
              </button>
              <button
                className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  mode === "login"
                    ? "bg-ink-950 text-white"
                    : "text-ink-700 hover:bg-sand-100"
                }`}
                onClick={() => handleModeChange("login")}
                type="button"
              >
                Log in
              </button>
            </div>

            <div className="mt-8 space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-ink-950">
                {mode === "register" ? "Create your profile" : "Welcome back"}
              </h2>
              <p className="text-sm text-ink-700">
                {mode === "register"
                  ? "We will send you into diagnosis unless your profile already shows a completed assessment."
                  : "We will check your profile after sign-in and route you to the right next step."}
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
              {mode === "register" ? (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-ink-900">
                    Display name
                  </span>
                  <input
                    autoComplete="name"
                    className="w-full rounded-2xl border border-clay-300 bg-white px-4 py-3 text-base text-ink-950 outline-none transition placeholder:text-clay-400 focus:border-ink-950 focus:ring-2 focus:ring-ink-950/10"
                    name="displayName"
                    onChange={(event) => updateField("displayName", event.target.value)}
                    placeholder="Ada Lovelace"
                    required
                    type="text"
                    value={formState.displayName}
                  />
                </label>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink-900">Email</span>
                <input
                  autoComplete="email"
                  className="w-full rounded-2xl border border-clay-300 bg-white px-4 py-3 text-base text-ink-950 outline-none transition placeholder:text-clay-400 focus:border-ink-950 focus:ring-2 focus:ring-ink-950/10"
                  name="email"
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={formState.email}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink-900">Password</span>
                <input
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  className="w-full rounded-2xl border border-clay-300 bg-white px-4 py-3 text-base text-ink-950 outline-none transition placeholder:text-clay-400 focus:border-ink-950 focus:ring-2 focus:ring-ink-950/10"
                  name="password"
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  type="password"
                  value={formState.password}
                />
              </label>

              <button
                className="w-full rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900 disabled:cursor-not-allowed disabled:bg-clay-400"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? mode === "register"
                    ? "Creating account..."
                    : "Signing in..."
                  : mode === "register"
                    ? "Create account"
                    : "Sign in"}
              </button>

              <p
                aria-live="polite"
                className="text-center text-sm text-ink-600"
              >
                {isSubmitting
                  ? "Saving your session and loading your profile."
                  : "Routing is based on the latest profile state from the API."}
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthPage;
