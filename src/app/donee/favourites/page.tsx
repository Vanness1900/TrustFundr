// src/app/donee/favourites/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { listMyFavourites, searchMyFavourites } from "@/lib/donee-api";
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/use-debounce";
import { DoneeNav } from "@/app/donee/page";
import type { FundraisingActivity } from "@/lib/donee-types";
import { DoneeCampaignCard } from "@/components/donee-campaign-card";

const FAV_PAGE_SIZE = 9;

export default function FavouritesPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [favourites, setFavourites] = useState<FundraisingActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const [favPage, setFavPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      router.replace("/login");
    }
  }, [isAuthLoading, token, router]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIsLoading(true);

      const q = debouncedSearch.trim();
      try {
        const data =
          q.length > 0
            ? await searchMyFavourites(token, q)
            : await listMyFavourites(token);
        if (cancelled) return;
        setFavourites(data);
        setFavPage(0);
      } catch {
        if (!cancelled) setFavourites([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, debouncedSearch]);

  if (isAuthLoading || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F3F3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
      </main>
    );
  }

  const favTotalPages = Math.max(
    1,
    Math.ceil(favourites.length / FAV_PAGE_SIZE),
  );
  const pagedFavourites = favourites.slice(
    favPage * FAV_PAGE_SIZE,
    favPage * FAV_PAGE_SIZE + FAV_PAGE_SIZE,
  );

  return (
    <main className="min-h-screen bg-[#F3F3F3] px-4 py-8 text-[#08111F] sm:px-5">
      <section className="mx-auto max-w-7xl rounded-[2rem] bg-white px-5 py-8 shadow-sm sm:px-8 md:px-10 lg:px-12">
        <div className="border-b border-[#E1E5EA] pb-6">
          <p className="text-sm font-medium text-[#40516E]">Donee</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-black">
            Saved campaigns
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
            Campaigns you have saved for quick access.
          </p>
        </div>

        <div className="mt-6">
          <DoneeNav pathname={pathname} />
        </div>

        <div className="mt-6">
          <div className="relative max-w-xl">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
              <SearchIcon />
            </span>
            <input
              type="search"
              placeholder="Search saved campaigns"
              value={searchQuery}
              onChange={(e) => {
                setFavPage(0);
                setSearchQuery(e.target.value);
              }}
              className="w-full rounded-full border border-[#D7DCE2] bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2F7A55] focus:bg-white focus:ring-2 focus:ring-[#2F7A55]/20"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
          </div>
        ) : null}

        {!isLoading && favourites.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-[#D7DCE2] bg-[#fafafa] px-6 py-14 text-center">
            <p className="text-base font-semibold text-[#334155]">
              {searchQuery.trim()
                ? `No saved campaigns match “${searchQuery.trim()}”.`
                : "You have not saved any campaigns yet."}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#64748b]">
              Browse fundraisers and tap the heart on a card to save it here.
            </p>
            <button
              type="button"
              onClick={() => router.push("/donee")}
              className="mt-6 rounded-full bg-[#2F7A55] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Browse campaigns
            </button>
          </div>
        ) : null}

        {!isLoading && favourites.length > 0 ? (
          <>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {pagedFavourites.map((activity) => (
                <DoneeCampaignCard
                  key={activity.id}
                  activity={activity}
                  heartMode="saved"
                  onOpen={() =>
                    router.push(`/donee/campaigns/${activity.id}`)
                  }
                />
              ))}
            </div>

            {favourites.length > FAV_PAGE_SIZE ? (
              <nav
                className="mt-10 flex flex-col gap-3 border-t border-[#E1E5EA] pt-8 sm:flex-row sm:items-center sm:justify-between"
                aria-label="Favourites pagination"
              >
                <p className="text-sm text-[#40516E]">
                  Page {favPage + 1} of {favTotalPages} · {favourites.length}{" "}
                  saved
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={favPage <= 0}
                    onClick={() => setFavPage((p) => Math.max(0, p - 1))}
                    className="rounded-full border border-[#D7DCE2] bg-white px-4 py-2 text-sm font-medium text-[#08111F] hover:border-[#2F7A55] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={favPage >= favTotalPages - 1}
                    onClick={() => setFavPage((p) => p + 1)}
                    className="rounded-full border border-[#D7DCE2] bg-white px-4 py-2 text-sm font-medium text-[#08111F] hover:border-[#2F7A55] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </nav>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}
