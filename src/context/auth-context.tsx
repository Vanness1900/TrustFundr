"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ApiError = { message: string };

export interface LoginRequest {
  username: string;
  password: string;
}

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
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "trustfundr_token";
const USER_KEY = "trustfundr_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response: LoginResponse = await apiLogin(credentials);

    const userData: User = {
      id: response.id,
      fullName: response.fullName,
      username: response.username,
    };

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    setToken(response.token);
    setUser(userData);
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
