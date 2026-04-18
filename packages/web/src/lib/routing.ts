export type AuthStatus = "loading" | "anonymous" | "authenticated";

export type AppRoutePath = "/" | "/auth" | "/diagnosis" | "/dashboard";

export type GuardedRoutePath = "/auth" | "/diagnosis" | "/dashboard";

export interface RouteDecisionState {
  authStatus: AuthStatus;
  hasCompletedDiagnosis: boolean | null;
}

export function resolveAuthenticatedPath(
  hasCompletedDiagnosis: boolean,
): "/diagnosis" | "/dashboard" {
  return hasCompletedDiagnosis ? "/dashboard" : "/diagnosis";
}

export function resolveLandingPath(
  state: RouteDecisionState,
): GuardedRoutePath | null {
  if (state.authStatus === "loading") {
    return null;
  }

  if (state.authStatus === "anonymous") {
    return "/auth";
  }

  if (state.hasCompletedDiagnosis === null) {
    return null;
  }

  return resolveAuthenticatedPath(state.hasCompletedDiagnosis);
}

export function resolveRouteRedirect(
  routePath: AppRoutePath,
  state: RouteDecisionState,
): GuardedRoutePath | null {
  if (routePath === "/") {
    return resolveLandingPath(state);
  }

  if (state.authStatus === "loading") {
    return null;
  }

  if (state.authStatus === "anonymous") {
    return routePath === "/auth" ? null : "/auth";
  }

  if (state.hasCompletedDiagnosis === null) {
    return null;
  }

  const authenticatedPath = resolveAuthenticatedPath(
    state.hasCompletedDiagnosis,
  );

  if (routePath === "/auth") {
    return authenticatedPath;
  }

  if (routePath === "/diagnosis") {
    return state.hasCompletedDiagnosis ? "/dashboard" : null;
  }

  if (routePath === "/dashboard") {
    return state.hasCompletedDiagnosis ? null : "/diagnosis";
  }

  return null;
}
