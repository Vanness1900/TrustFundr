// src/app/donee/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

/**
 * Layout shared untuk semua halaman Donee.
 *
 * Tanggung jawab:
 * 1. Auth guard: kalau user belum login, redirect ke /login
 * 2. Role guard: kalau user bukan Donee, redirect ke halaman yang sesuai role-nya
 * 3. Loading state: tampilkan spinner sementara cek auth/role
 * 4. Header: TrustFundr branding + avatar user + sign out button
 *
 * Layout ini otomatis di-apply ke SEMUA halaman /donee/* oleh Next.js App Router.
 */
export default function DoneeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  // Auth guard + Role guard
  useEffect(() => {
    if (isLoading) return; // tunggu auth context selesai loading

    // Belum login → redirect ke login
    if (!user) {
      router.replace("/login");
      return;
    }

    // Sudah login tapi bukan Donee → redirect ke halaman yang sesuai role
    if (user.role !== "Donee") {
      // Map role string ke path tujuan
      const redirectPath =
        user.role === "Admin"
          ? "/admin"
          : user.role === "Fund Raiser"
            ? "/fundraiser"
            : user.role === "Platform Management"
              ? "/platform"
              : "/login"; // role tidak dikenali → tendang ke login
      router.replace(redirectPath);
    }
  }, [user, isLoading, router]);

  // Loading spinner sementara cek auth
  if (isLoading || !user || user.role !== "Donee") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f7a55] border-t-transparent" />
      </main>
    );
  }

  // Ambil inisial nama user untuk avatar (huruf depan dari fullName)
  const initial = user.fullName.charAt(0).toUpperCase();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header: branding TrustFundr + sign out + avatar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold tracking-tight text-[#2f7a55]">
              TrustFundr
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f7a55] text-sm font-extrabold text-white"
              aria-label={`${user.fullName} avatar`}
              title={user.fullName}
            >
              {initial}
            </div>
          </div>
        </div>
      </header>

      {/* Children = halaman donee yang di-render di sini */}
      {children}
    </main>
  );
}