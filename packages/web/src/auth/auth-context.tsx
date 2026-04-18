import type {
  AuthResponse,
  AuthTokens,
  GetProfileResponse,
} from "@evolith/shared";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  configureApiClientAuthSession,
  getProfile,
  resetApiClientAuthSession,
} from "../lib/api-client";
import {
  clearAuthTokens,
  loadAuthTokens,
  saveAuthTokens,
} from "../lib/auth-session";
import type { AuthStatus } from "../lib/routing";

export interface AuthContextValue {
  authStatus: AuthStatus;
  tokens: AuthTokens | null;
  profile: GetProfileResponse | null;
  setAuthFromAuthResponse: (
    authResponse: AuthResponse,
  ) => Promise<GetProfileResponse>;
  refreshProfile: () => Promise<GetProfileResponse>;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [profile, setProfile] = useState<GetProfileResponse | null>(null);
  const isMountedRef = useRef(true);
  const tokensRef = useRef<AuthTokens | null>(null);

  function applyTokens(nextTokens: AuthTokens, options?: { clearProfile?: boolean }) {
    saveAuthTokens(nextTokens);
    tokensRef.current = nextTokens;

    if (!isMountedRef.current) {
      return;
    }

    setTokens(nextTokens);
    setAuthStatus("authenticated");

    if (options?.clearProfile === true) {
      setProfile(null);
    }
  }

  function clearAuth() {
    clearAuthTokens();
    tokensRef.current = null;

    if (!isMountedRef.current) {
      return;
    }

    setTokens(null);
    setProfile(null);
    setAuthStatus("anonymous");
  }

  async function refreshProfile(): Promise<GetProfileResponse> {
    const nextProfile = await getProfile();

    if (isMountedRef.current) {
      setProfile(nextProfile);
      setAuthStatus("authenticated");
    }

    return nextProfile;
  }

  async function hydrateAuthenticatedSession(
    nextTokens: AuthTokens,
  ): Promise<GetProfileResponse> {
    applyTokens(nextTokens, { clearProfile: true });

    try {
      return await refreshProfile();
    } catch (error) {
      clearAuth();
      throw error;
    }
  }

  async function setAuthFromAuthResponse(
    authResponse: AuthResponse,
  ): Promise<GetProfileResponse> {
    return hydrateAuthenticatedSession(authResponse.tokens);
  }

  useEffect(() => {
    isMountedRef.current = true;

    configureApiClientAuthSession({
      getTokens: () => tokensRef.current,
      saveTokens: (nextTokens) => {
        applyTokens(nextTokens);
      },
      clearTokens: () => {
        clearAuth();
      },
    });

    const storedTokens = loadAuthTokens();

    if (storedTokens === null) {
      clearAuth();
    } else {
      void hydrateAuthenticatedSession(storedTokens).catch(() => {
        // Bootstrap failure already clears auth state above.
      });
    }

    return () => {
      isMountedRef.current = false;
      resetApiClientAuthSession();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        tokens,
        profile,
        setAuthFromAuthResponse,
        refreshProfile,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (value === null) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return value;
}
