"use client";

import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#1a4a3a] text-white">
            T
          </div>
          <p className="text-lg font-semibold text-[#1a4a3a]">TrustFundr</p>
          <h1 className="mt-5 text-3xl font-bold text-gray-900">Welcome Back</h1>
        </div>

        <form className="space-y-5">
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
              placeholder="Enter your username"
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/20"
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
                placeholder="Enter your password"
                className="w-full rounded-md border border-gray-200 px-3 py-2.5 pr-20 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#1a4a3a] focus:ring-2 focus:ring-[#1a4a3a]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-[#1a4a3a]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-[#1a4a3a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#153d30]"
          >
            Sign In →
          </button>
        </form>
      </section>
    </main>
  );
}

