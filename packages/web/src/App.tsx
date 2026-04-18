import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/auth-context";
import DashboardPage from "./routes/DashboardPage";
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
            <DashboardPage />
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
