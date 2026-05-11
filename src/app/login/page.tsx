"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

/** Role label from login → home route for that role. */
function redirectPathByRole(role: string): string {
  switch (role) {
    case "Admin":
      return "/admin";
    case "Donee":
      return "/donee";
    case "Fund Raiser":
      return "/fundraiser";
    case "Platform Manager":
      return "/platform-manager";
    default:
      return "/login";
  }
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user, isLoading, logout } = useAuth();
  const router = useRouter();

  const loggedInRedirectPath =
    user && !isLoading ? redirectPathByRole(user.role) : null;
  const showRedirectSpinner =
    isLoading ||
    Boolean(
      user && loggedInRedirectPath && loggedInRedirectPath !== "/login",
    );

  // Already signed in → send user to their role home (e.g. reopening /login).
  useEffect(() => {
    if (!isLoading && user && loggedInRedirectPath && loggedInRedirectPath !== "/login") {
      router.replace(loggedInRedirectPath);
    }
  }, [user, isLoading, loggedInRedirectPath, router]);

  useEffect(() => {
    if (isLoading || !user) return;
    if (!loggedInRedirectPath || loggedInRedirectPath !== "/login") return;
    void logout();
  }, [isLoading, user, loggedInRedirectPath, logout]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedInUser = await login({
        username: username.trim(),
        password,
      });
      router.push(redirectPathByRole(loggedInUser.role));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (showRedirectSpinner) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#2F7A55] text-white">
            T
          </div>
          <p className="text-lg font-semibold text-[#2F7A55]">TrustFundr</p>
          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>
        </div>

        {error && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-200 px-3 py-2.5 pr-20 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-[#2F7A55]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#2F7A55] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign In →"}
          </button>
        </form>
      </section>
    </main>
  );
}