import type { AuthResponse, AuthTokens, PublicUser } from "@evolith/shared";
import {
  createContext,
  type ReactNode,
  useContext,
  useSyncExternalStore,
} from "react";

import { getErrorLogDetails, logErrorEvent } from "./logging";

/**
 * Serializable browser session state derived from a successful auth response.
 */
export interface StoredSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  tokenType: AuthTokens["tokenType"];
}

interface SessionContextValue {
  session: StoredSession | null;
  isAuthenticated: boolean;
  setSession: (session: StoredSession) => void;
  clearSession: () => void;
}

type SessionListener = () => void;

/**
 * localStorage key used to persist the authenticated browser session.
 */
export const SESSION_STORAGE_KEY = "evolith.session";

const SessionContext = createContext<SessionContextValue | null>(null);
const listeners = new Set<SessionListener>();

function getStorage(): Storage | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }

  return window.localStorage;
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<StoredSession>;
  const user = candidate.user;

  if (typeof user !== "object" || user === null) {
    return false;
  }

  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.displayName === "string" &&
    typeof user.createdAt === "string" &&
    typeof user.updatedAt === "string" &&
    typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    candidate.tokenType === "Bearer"
  );
}

/**
 * Restores the persisted session when it matches the expected serialized shape.
 */
export function readStoredSession(): StoredSession | null {
  const storage = getStorage();

  if (storage === null) {
    return null;
  }

  const serializedSession = storage.getItem(SESSION_STORAGE_KEY);

  if (serializedSession === null) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(serializedSession) as unknown;

    if (!isStoredSession(parsedSession)) {
      logErrorEvent("session.readStoredSession_invalid_payload", {
        domain: "session",
        action: "readStoredSession",
        state: "invalid_payload",
      });
      storage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return parsedSession;
  } catch (error) {
    logErrorEvent("session.readStoredSession_parse_error", {
      domain: "session",
      action: "readStoredSession",
      state: "json_parse_failed",
      ...getErrorLogDetails(error),
    });
    storage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

/**
 * Persists the current authenticated session for later reloads.
 */
export function writeStoredSession(session: StoredSession): void {
  const storage = getStorage();

  if (storage === null) {
    return;
  }

  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Removes any persisted browser session from storage.
 */
export function clearStoredSession(): void {
  const storage = getStorage();

  if (storage === null) {
    return;
  }

  storage.removeItem(SESSION_STORAGE_KEY);
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

let currentSession: StoredSession | null = readStoredSession();

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== SESSION_STORAGE_KEY) {
      return;
    }

    currentSession = readStoredSession();
    notifyListeners();
  });
}

/**
 * In-memory session store that keeps React state synchronized with localStorage.
 */
export const sessionStore = {
  subscribe(listener: SessionListener): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  getSession(): StoredSession | null {
    return currentSession;
  },
  setSession(session: StoredSession): void {
    currentSession = session;
    writeStoredSession(session);
    notifyListeners();
  },
  clearSession(): void {
    currentSession = null;
    clearStoredSession();
    notifyListeners();
  },
};

/**
 * Converts an auth response into the browser session shape used across the app.
 */
export function createStoredSession(
  response: Pick<AuthResponse, "user" | "tokens">,
): StoredSession {
  return {
    user: response.user,
    accessToken: response.tokens.accessToken,
    refreshToken: response.tokens.refreshToken,
    tokenType: response.tokens.tokenType,
  };
}

/**
 * Provides session state and mutation helpers to the routed React tree.
 */
export function SessionProvider(props: { children: ReactNode }): ReactNode {
  const session = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSession,
    () => null,
  );

  return (
    <SessionContext.Provider
      value={{
        session,
        isAuthenticated: session !== null,
        setSession: sessionStore.setSession,
        clearSession: sessionStore.clearSession,
      }}
    >
      {props.children}
    </SessionContext.Provider>
  );
}

/**
 * Returns the active session context for authenticated routing and mutations.
 */
export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);

  if (value === null) {
    throw new Error("useSession must be used within a SessionProvider.");
  }

  return value;
}
