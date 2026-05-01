"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const path =
      user.role === "Admin"
        ? "/admin"
        : user.role === "Donee"
          ? "/donee"
          : user.role === "Fund Raiser"
            ? "/fundraiser"
            : user.role === "Platform Management"
              ? "/platform"
              : "/login";
    router.replace(path);
  }, [user, isLoading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a4a3a] border-t-transparent" />
    </main>
  );
}
