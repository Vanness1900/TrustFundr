"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "Platform Management") {
      const redirectPath =
        user.role === "Admin"
          ? "/admin"
          : user.role === "Donee"
            ? "/donee"
            : user.role === "Fund Raiser"
              ? "/fundraiser"
              : "/login";
      router.replace(redirectPath);
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "Platform Management") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2D6A4F] border-t-transparent" />
      </main>
    );
  }

  // At this point the role guard guarantees Platform Management.
  const avatarLetter = "P";

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-extrabold tracking-tight text-[#2f7a55]">
            TrustFundr
          </span>
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f7a55] text-sm font-extrabold text-white"
              aria-label={`${user.fullName} avatar`}
              title={user.fullName}
            >
              {avatarLetter}
            </div>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
