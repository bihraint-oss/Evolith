import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/auth-context";
import {
  isApiClientError,
  login,
  register,
} from "../lib/api-client";
import { resolveAuthenticatedPath } from "../lib/routing";

type AuthMode = "login" | "register";

interface AuthFormState {
  email: string;
  password: string;
  displayName: string;
}

const formShellStyle: CSSProperties = {
  display: "grid",
  gap: "1.1rem",
  marginTop: "1.75rem",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "0.45rem",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "3.25rem",
  border: "1px solid rgba(34, 40, 49, 0.14)",
  borderRadius: "18px",
  padding: "0.9rem 1rem",
  background: "rgba(255, 255, 255, 0.72)",
  color: "var(--ink)",
};

const mutedTextStyle: CSSProperties = {
  color: "var(--ink-soft)",
  margin: 0,
};

const toggleRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.85rem",
  marginTop: "1.75rem",
};

const toggleButtonStyle: CSSProperties = {
  border: "none",
  cursor: "pointer",
};

const submitButtonStyle: CSSProperties = {
  border: "none",
  cursor: "pointer",
  width: "100%",
};

const errorCardStyle: CSSProperties = {
  border: "1px solid rgba(153, 46, 46, 0.14)",
  borderRadius: "20px",
  background: "rgba(153, 46, 46, 0.08)",
  color: "#7c1f1f",
  padding: "0.95rem 1rem",
};

const initialFormState: AuthFormState = {
  email: "",
  password: "",
  displayName: "",
};

function getRequestErrorMessage(error: unknown): string {
  if (isApiClientError(error)) {
    return error.message;
  }

  return "Something went wrong while contacting the server.";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { setAuthFromAuthResponse } = useAuth();
  const [mode, setMode] = useState<AuthMode>("register");
  const [formState, setFormState] = useState<AuthFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const email = formState.email.trim();
  const displayName = formState.displayName.trim();
  const isSubmitDisabled =
    isPending ||
    email.length === 0 ||
    formState.password.length === 0 ||
    (mode === "register" && displayName.length === 0);

  function updateField(field: keyof AuthFormState, value: string) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  }

  function updateMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    setErrorMessage(null);
    setIsPending(true);

    try {
      const authResponse =
        mode === "register"
          ? await register({
              email,
              password: formState.password,
              displayName,
            })
          : await login({
              email,
              password: formState.password,
            });
      const profile = await setAuthFromAuthResponse(authResponse);

      navigate(resolveAuthenticatedPath(profile.hasCompletedDiagnosis), {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero card">
        <p className="hero-kicker">Route /auth</p>
        <h1>{mode === "register" ? "Start your Evolith profile." : "Return to your Evolith session."}</h1>
        <p className="hero-copy">
          Register or sign in, let the shared auth context persist the issued
          tokens, then route into the diagnosis or dashboard flow using the
          backend profile state.
        </p>
        <div style={toggleRowStyle}>
          <button
            aria-pressed={mode === "register"}
            className={mode === "register" ? "button-primary" : "pill"}
            onClick={() => {
              updateMode("register");
            }}
            style={toggleButtonStyle}
            type="button"
          >
            Create account
          </button>
          <button
            aria-pressed={mode === "login"}
            className={mode === "login" ? "button-primary" : "pill"}
            onClick={() => {
              updateMode("login");
            }}
            style={toggleButtonStyle}
            type="button"
          >
            Log in
          </button>
        </div>
      </section>

      <section className="panel-grid">
        <article className="card panel-card">
          <p className="panel-eyebrow">Session flow</p>
          <h2>{mode === "register" ? "Issue tokens" : "Reuse access"}</h2>
          <p>
            Successful auth responses are handed to the shared provider, which
            persists `AuthResponse.tokens` and hydrates `/api/profile` before
            the route changes.
          </p>
        </article>
        <article className="card panel-card">
          <p className="panel-eyebrow">Source of truth</p>
          <h2>/api/profile</h2>
          <p>
            Diagnosis completion is not inferred locally. Redirect targets are
            decided from the authenticated profile response after bootstrap.
          </p>
        </article>
        <article className="card panel-card">
          <p className="panel-eyebrow">Form mode</p>
          <h2>{mode === "register" ? "New account" : "Existing account"}</h2>
          <p>
            Register requires `displayName`; login only sends `email` and
            `password`, matching the backend request contracts exactly.
          </p>
        </article>
      </section>

      <section
        className="card"
        style={{
          marginTop: "1.2rem",
          padding: "clamp(1.5rem, 4vw, 2.5rem)",
        }}
      >
        <form
          noValidate
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          style={formShellStyle}
        >
          {mode === "register" ? (
            <label style={fieldStyle}>
              <span>Display name</span>
              <input
                autoComplete="name"
                onChange={(event) => {
                  updateField("displayName", event.target.value);
                }}
                placeholder="Ada Lovelace"
                required
                style={inputStyle}
                type="text"
                value={formState.displayName}
              />
            </label>
          ) : null}

          <label style={fieldStyle}>
            <span>Email</span>
            <input
              autoComplete={mode === "register" ? "email" : "username"}
              onChange={(event) => {
                updateField("email", event.target.value);
              }}
              placeholder="you@example.com"
              required
              style={inputStyle}
              type="email"
              value={formState.email}
            />
          </label>

          <label style={fieldStyle}>
            <span>Password</span>
            <input
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={mode === "register" ? 8 : 1}
              onChange={(event) => {
                updateField("password", event.target.value);
              }}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              required
              style={inputStyle}
              type="password"
              value={formState.password}
            />
          </label>

          {errorMessage === null ? null : (
            <div
              aria-live="polite"
              role="alert"
              style={errorCardStyle}
            >
              {errorMessage}
            </div>
          )}

          <button
            className="button-primary"
            disabled={isSubmitDisabled}
            style={{
              ...submitButtonStyle,
              opacity: isSubmitDisabled ? 0.72 : 1,
            }}
            type="submit"
          >
            {isPending
              ? mode === "register"
                ? "Creating account..."
                : "Signing in..."
              : mode === "register"
                ? "Create account"
                : "Log in"}
          </button>

          <p style={mutedTextStyle}>
            {mode === "register"
              ? "Use a fresh identity to experience the diagnosis flow from the start."
              : "If your access token expired, the shared client will refresh it on the next protected request."}
          </p>
        </form>
      </section>
    </main>
  );
}
