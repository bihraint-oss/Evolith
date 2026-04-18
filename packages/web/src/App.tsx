import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/auth-context";
import AuthPage from "./routes/AuthPage";
import DiagnosisPage from "./routes/DiagnosisPage";
import {
  resolveRouteRedirect,
  type AppRoutePath,
} from "./lib/routing";

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<GuardedRoute routePath="/" />}
      />
      <Route
        path="/auth"
        element={
          <GuardedRoute routePath="/auth">
            <AuthPage />
          </GuardedRoute>
        }
      />
      <Route
        path="/diagnosis"
        element={
          <GuardedRoute routePath="/diagnosis">
            <DiagnosisPage />
          </GuardedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <GuardedRoute routePath="/dashboard">
            <RoutePreview
              description="Completed users will land here once the dashboard components exist. The app shell already redirects incomplete profiles back to diagnosis before first paint."
              eyebrow="Route /dashboard"
              title="Dashboard access is now gated by the profile bootstrap state."
            />
          </GuardedRoute>
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            replace
            to="/"
          />
        }
      />
    </Routes>
  );
}

interface GuardedRouteProps {
  routePath: AppRoutePath;
  children?: ReactNode;
}

function GuardedRoute({ routePath, children }: GuardedRouteProps) {
  const { authStatus, profile } = useAuth();
  const redirectPath = resolveRouteRedirect(routePath, {
    authStatus,
    hasCompletedDiagnosis: profile?.hasCompletedDiagnosis ?? null,
  });
  const isBootstrapPending =
    authStatus === "loading" ||
    (authStatus === "authenticated" && profile === null);

  if (redirectPath !== null && redirectPath !== routePath) {
    return (
      <Navigate
        replace
        to={redirectPath}
      />
    );
  }

  if (isBootstrapPending) {
    return (
      <FullscreenShell
        description="Loading stored credentials and profile state before the route guard commits to /auth, /diagnosis, or /dashboard."
        title="Syncing your Evolith session"
      />
    );
  }

  return children ?? null;
}

interface FullscreenShellProps {
  title: string;
  description: string;
}

function FullscreenShell({ title, description }: FullscreenShellProps) {
  return (
    <div
      style={{
        alignItems: "center",
        display: "grid",
        minHeight: "100vh",
      }}
    >
      <main
        className="app-shell"
        style={{
          paddingBottom: "2rem",
          paddingTop: "2rem",
        }}
      >
        <section className="hero card">
          <p className="hero-kicker">Bootstrap guard</p>
          <h1>{title}</h1>
          <p className="hero-copy">{description}</p>
          <div className="hero-actions">
            <span className="pill">Checking /api/profile</span>
            <span className="pill">Blocking redirect flash</span>
          </div>
        </section>
      </main>
    </div>
  );
}

interface RoutePreviewProps {
  title: string;
  description: string;
  eyebrow: string;
}

function RoutePreview({ title, description, eyebrow }: RoutePreviewProps) {
  const { authStatus, profile, tokens } = useAuth();
  const activeUser = profile === null ? "Anonymous" : profile.profile.userId;
  const diagnosisStatus =
    profile === null
      ? "Profile unavailable"
      : profile.hasCompletedDiagnosis
        ? "Diagnosis complete"
        : "Diagnosis pending";

  return (
    <main className="app-shell">
      <section className="hero card">
        <p className="hero-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-copy">{description}</p>
        <div className="hero-actions">
          <span className="pill">Auth: {authStatus}</span>
          <span className="pill">Session: {tokens === null ? "empty" : "stored"}</span>
          <span className="pill">Profile: {diagnosisStatus}</span>
        </div>
      </section>

      <section className="panel-grid">
        <article className="card panel-card">
          <p className="panel-eyebrow">Current user</p>
          <h2>{activeUser}</h2>
          <p>
            The authenticated profile payload only exposes cognitive-profile
            fields, so route guards depend on server truth instead of a second
            client-side user record.
          </p>
        </article>
        <article className="card panel-card">
          <p className="panel-eyebrow">Bootstrap source</p>
          <h2>/api/profile</h2>
          <p>
            Diagnosis completion comes from the authenticated profile response,
            not from local assumptions or duplicated client-side flags.
          </p>
        </article>
        <article className="card panel-card">
          <p className="panel-eyebrow">Next step</p>
          <h2>Feature UI</h2>
          <p>
            The upcoming route components can focus on forms and data rendering
            because auth persistence and redirect decisions now live above them.
          </p>
        </article>
      </section>
    </main>
  );
}
