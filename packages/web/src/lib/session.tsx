import type { AuthResponse, AuthTokens, PublicUser } from "@evolith/shared";
import {
  createContext,
  type ReactNode,
  useContext,
  useSyncExternalStore,
} from "react";

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

const SESSION_STORAGE_KEY = "evolith.session";

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
      storage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return parsedSession;
  } catch {
    storage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function writeStoredSession(session: StoredSession): void {
  const storage = getStorage();

  if (storage === null) {
    return;
  }

  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

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

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);

  if (value === null) {
    throw new Error("useSession must be used within a SessionProvider.");
  }

  return value;
}

export { SESSION_STORAGE_KEY };
