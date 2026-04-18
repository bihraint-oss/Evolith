import { describe, expect, test } from "bun:test";

import {
  resolveLandingPath,
  resolveRouteRedirect,
} from "./routing";

describe("routing helpers", () => {
  test("resolves the landing route from auth and diagnosis state", () => {
    expect(
      resolveLandingPath({
        authStatus: "loading",
        hasCompletedDiagnosis: null,
      }),
    ).toBeNull();

    expect(
      resolveLandingPath({
        authStatus: "anonymous",
        hasCompletedDiagnosis: null,
      }),
    ).toBe("/auth");

    expect(
      resolveLandingPath({
        authStatus: "authenticated",
        hasCompletedDiagnosis: false,
      }),
    ).toBe("/diagnosis");

    expect(
      resolveLandingPath({
        authStatus: "authenticated",
        hasCompletedDiagnosis: true,
      }),
    ).toBe("/dashboard");
  });

  test("redirects anonymous users away from protected routes", () => {
    const anonymousState = {
      authStatus: "anonymous" as const,
      hasCompletedDiagnosis: null,
    };

    expect(resolveRouteRedirect("/auth", anonymousState)).toBeNull();
    expect(resolveRouteRedirect("/diagnosis", anonymousState)).toBe("/auth");
    expect(resolveRouteRedirect("/dashboard", anonymousState)).toBe("/auth");
  });

  test("keeps authenticated users without a completed diagnosis inside the diagnosis flow", () => {
    const incompleteState = {
      authStatus: "authenticated" as const,
      hasCompletedDiagnosis: false,
    };

    expect(resolveRouteRedirect("/auth", incompleteState)).toBe("/diagnosis");
    expect(resolveRouteRedirect("/diagnosis", incompleteState)).toBeNull();
    expect(resolveRouteRedirect("/dashboard", incompleteState)).toBe(
      "/diagnosis",
    );
  });

  test("routes fully completed users to the dashboard", () => {
    const completedState = {
      authStatus: "authenticated" as const,
      hasCompletedDiagnosis: true,
    };

    expect(resolveRouteRedirect("/auth", completedState)).toBe("/dashboard");
    expect(resolveRouteRedirect("/diagnosis", completedState)).toBe(
      "/dashboard",
    );
    expect(resolveRouteRedirect("/dashboard", completedState)).toBeNull();
  });
});
