"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getAppRoleFromJwt } from "@/lib/jwt-role";

type ApiError = { message: string };

export interface LoginRequest {
  username: string;
  password: string;
}

/** Matches TrustFundr-be LoginController.LoginResponse (no role in JSON). */
interface LoginResponse {
  id: string;
  fullName: string;
  username: string;
  token: string;
}

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function parseOrThrow<T>(
  res: Response,
  fallbackMessage: string,
): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  const error: ApiError = await res.json().catch(() => ({
    message: fallbackMessage,
  }));
  throw new Error(error.message || fallbackMessage);
}

async function apiLogin(credentials: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${DEFAULT_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  });
  return parseOrThrow<LoginResponse>(res, "Login failed. Please try again.");
}

async function apiLogout(token?: string | null): Promise<void> {
  await fetch(`${DEFAULT_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: getHeaders(token),
  });
}

interface User {
  id: string;
  fullName: string;
  username: string;
  role: string;
}

/** Persisted snapshot; role is always derived from the JWT when hydrating. */
interface StoredUserSnapshot {
  id: string;
  fullName: string;
  username: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "trustfundr_token";
const USER_KEY = "trustfundr_user";

function parseStoredUserSnapshot(raw: string): StoredUserSnapshot | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const id = o.id;
    const fullName = o.fullName;
    const username = o.username;
    if (
      typeof id === "string" &&
      typeof fullName === "string" &&
      typeof username === "string"
    ) {
      return { id, fullName, username };
    }
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    queueMicrotask(() => {
      if (storedToken && storedUser) {
        const snapshot = parseStoredUserSnapshot(storedUser);
        const role = getAppRoleFromJwt(storedToken);
        if (snapshot && role) {
          setToken(storedToken);
          setUser({ ...snapshot, role });
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response: LoginResponse = await apiLogin(credentials);
    const role = getAppRoleFromJwt(response.token);
    if (!role) {
      throw new Error(
        "Signed in but the session token did not contain a recognized role.",
      );
    }
    const userData: User = {
      id: response.id,
      fullName: response.fullName,
      username: response.username,
      role,
    };
    const snapshot: StoredUserSnapshot = {
      id: userData.id,
      fullName: userData.fullName,
      username: userData.username,
    };
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(snapshot));
    setToken(response.token);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout(token);
    } catch {
      // Server-side logout is best-effort for stateless JWT
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
