// src/app/fundraiser/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function FundraiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "Fund Raiser") {
      const redirectPath =
        user.role === "Admin"
          ? "/admin"
          : user.role === "Donee"
            ? "/donee"
            : user.role === "Platform Management"
              ? "/platform"
              : "/login";
      router.replace(redirectPath);
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "Fund Raiser") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#16a34a] border-t-transparent" />
      </main>
    );
  }

  const initial = user.fullName.charAt(0).toUpperCase();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-extrabold tracking-tight text-[#16a34a]">
            TrustFundr
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a] text-sm font-extrabold text-white"
              aria-label={`${user.fullName} avatar`}
              title={user.fullName}
            >
              {initial}
            </div>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
