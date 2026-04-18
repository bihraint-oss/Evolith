import type { AuthTokens } from "@evolith/shared";

export const AUTH_TOKENS_STORAGE_KEY = "evolith.auth.tokens";

export type AuthStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function resolveStorage(storage?: AuthStorage | null): AuthStorage | null {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }

  return globalThis.localStorage;
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AuthTokens>;

  return (
    typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    candidate.tokenType === "Bearer"
  );
}

export function loadAuthTokens(storage?: AuthStorage | null): AuthTokens | null {
  const authStorage = resolveStorage(storage);

  if (authStorage === null) {
    return null;
  }

  try {
    const rawValue = authStorage.getItem(AUTH_TOKENS_STORAGE_KEY);

    if (rawValue === null) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (isAuthTokens(parsedValue)) {
      return parsedValue;
    }
  } catch {
    // Invalid or corrupted storage should be treated as no active session.
  }

  try {
    authStorage.removeItem(AUTH_TOKENS_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures and fall back to an anonymous session.
  }

  return null;
}

export function saveAuthTokens(
  tokens: AuthTokens,
  storage?: AuthStorage | null,
): void {
  const authStorage = resolveStorage(storage);

  if (authStorage === null) {
    return;
  }

  try {
    authStorage.setItem(AUTH_TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Treat storage write failures as non-fatal so the app can keep running.
  }
}

export function clearAuthTokens(storage?: AuthStorage | null): void {
  const authStorage = resolveStorage(storage);

  if (authStorage === null) {
    return;
  }

  try {
    authStorage.removeItem(AUTH_TOKENS_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures because the caller already treats auth as cleared.
  }
}
