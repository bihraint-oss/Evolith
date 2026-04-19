import type { AuthResponse, PublicUser } from "@evolith/shared";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SESSION_STORAGE_KEY,
  SessionProvider,
  clearStoredSession,
  createStoredSession,
  readStoredSession,
  sessionStore,
  useSession,
  writeStoredSession,
} from "./session";

const user: PublicUser = {
  id: "user-1",
  email: "ada@example.com",
  displayName: "Ada Lovelace",
  createdAt: "2026-04-19T00:00:00.000Z",
  updatedAt: "2026-04-19T00:00:00.000Z",
};

const authResponse: AuthResponse = {
  user,
  tokens: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    tokenType: "Bearer",
  },
};

function SessionConsumer(): React.JSX.Element {
  const { isAuthenticated, session } = useSession();

  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="email">{session?.user.email ?? "none"}</span>
    </div>
  );
}

describe("session utilities", () => {
  beforeEach(() => {
    sessionStore.clearSession();
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns null when storage is empty", () => {
    expect(readStoredSession()).toBeNull();
  });

  it("returns null and removes corrupted stored JSON", () => {
    localStorage.setItem(SESSION_STORAGE_KEY, "not-valid-json{");

    expect(readStoredSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("returns null and removes invalid stored sessions", () => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        user,
        accessToken: "access-token",
        refreshToken: "refresh-token",
        tokenType: "Basic",
      }),
    );

    expect(readStoredSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("writes and clears the stored session", () => {
    const storedSession = createStoredSession(authResponse);

    writeStoredSession(storedSession);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBe(
      JSON.stringify(storedSession),
    );

    clearStoredSession();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("maps auth responses into the stored session shape", () => {
    expect(createStoredSession(authResponse)).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      user,
    });
  });

  it("keeps session consumers in sync with the session store", () => {
    const storedSession = createStoredSession(authResponse);

    render(
      <SessionProvider>
        <SessionConsumer />
      </SessionProvider>,
    );

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("email")).toHaveTextContent("none");

    act(() => {
      sessionStore.setSession(storedSession);
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("email")).toHaveTextContent("ada@example.com");

    act(() => {
      sessionStore.clearSession();
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("email")).toHaveTextContent("none");
  });

  it("throws when useSession is called outside the provider", () => {
    function UnscopedConsumer(): React.JSX.Element {
      useSession();
      return <div />;
    }

    expect(() => render(<UnscopedConsumer />)).toThrow(
      "useSession must be used within a SessionProvider.",
    );
  });
});
