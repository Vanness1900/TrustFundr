// src/app/donee/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  listFundraisingActivities,
  searchFundraisingActivities,
  listFavouriteActivityIds,
  saveFavourite,
} from "@/lib/donee-api";
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/use-debounce";
import type { FundraisingActivity } from "@/lib/donee-types";
import { DoneeCampaignCard } from "@/components/donee-campaign-card";

const PAGE_SIZE = 12;

export default function DoneePage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [activities, setActivities] = useState<FundraisingActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

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
      const activitiesPromise =
        q.length > 0
          ? searchFundraisingActivities(token, q, page, PAGE_SIZE)
          : listFundraisingActivities(token, page, PAGE_SIZE);

      try {
        const paged = await activitiesPromise;
        if (cancelled) return;
        setActivities(paged.content);
        setTotalPages(Math.max(1, paged.totalPages));
        setTotalElements(paged.totalElements);
      } catch {
        if (!cancelled) {
          setActivities([]);
          setTotalPages(1);
          setTotalElements(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      listFavouriteActivityIds(token)
        .then((ids) => {
          if (!cancelled) setFavouriteIds(new Set(ids));
        })
        .catch(() => {
          if (!cancelled) setFavouriteIds(new Set());
        });
    })();

    return () => {
      cancelled = true;
    };
  }, [token, debouncedSearch, page]);

  async function handleToggleFavourite(activityId: string) {
    if (!token) return;
    const wasAlreadyFavourite = favouriteIds.has(activityId);
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      next.add(activityId);
      return next;
    });
    if (wasAlreadyFavourite) return;
    try {
      await saveFavourite(token, activityId);
    } catch {
      setFavouriteIds((prev) => {
        const next = new Set(prev);
        next.delete(activityId);
        return next;
      });
    }
  }

  if (isAuthLoading || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F3F3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F3F3] px-4 py-8 text-[#08111F] sm:px-5">
      <section className="mx-auto max-w-7xl rounded-[2rem] bg-white px-5 py-8 shadow-sm sm:px-8 md:px-10 lg:px-12">
        <div className="flex flex-col gap-4 border-b border-[#E1E5EA] pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#40516E]">Donee</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-black">
              Browse campaigns
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
              Discover fundraisers to support. Save campaigns you care about to
              your favourites.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <DoneeNav pathname={pathname} />
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
              <SearchIcon />
            </span>
            <input
              type="search"
              placeholder="Start searching"
              value={searchQuery}
              onChange={(e) => {
                setPage(0);
                setSearchQuery(e.target.value);
              }}
              className="w-full rounded-full border border-[#D7DCE2] bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2F7A55] focus:bg-white focus:ring-2 focus:ring-[#2F7A55]/20"
            />
          </div>
          <button
            type="button"
            onClick={() => router.push("/donee/favourites")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#2F7A55] bg-white px-5 py-3 text-sm font-semibold text-[#2F7A55] transition hover:bg-[#eaf5ef]"
          >
            <span className="text-red-500" aria-hidden="true">
              ♥
            </span>
            Saved campaigns
          </button>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
          </div>
        ) : null}

        {!isLoading && activities.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-[#D7DCE2] bg-[#fafafa] px-6 py-14 text-center">
            <p className="text-base font-semibold text-[#334155]">
              {searchQuery.trim()
                ? `No results for “${searchQuery.trim()}”.`
                : "No campaigns to show yet."}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#64748b]">
              Try another search, or check back later for new fundraisers.
            </p>
          </div>
        ) : null}

        {!isLoading && activities.length > 0 ? (
          <>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {activities.map((activity) => (
                <DoneeCampaignCard
                  key={activity.id}
                  activity={activity}
                  heartMode="toggle"
                  isFavourite={favouriteIds.has(activity.id)}
                  onToggleFavourite={() =>
                    void handleToggleFavourite(activity.id)
                  }
                  onOpen={() =>
                    router.push(`/donee/campaigns/${activity.id}`)
                  }
                />
              ))}
            </div>

            <nav
              className="mt-10 flex flex-col gap-3 border-t border-[#E1E5EA] pt-8 sm:flex-row sm:items-center sm:justify-between"
              aria-label="Campaign results pagination"
            >
              <p className="text-sm text-[#40516E]">
                Page {page + 1} of {totalPages}
                {totalElements > 0 ? ` · ${totalElements} campaigns` : null}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={page <= 0 || isLoading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-full border border-[#D7DCE2] bg-white px-4 py-2 text-sm font-medium text-[#08111F] transition hover:border-[#2F7A55] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages - 1 || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border border-[#D7DCE2] bg-white px-4 py-2 text-sm font-medium text-[#08111F] transition hover:border-[#2F7A55] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </nav>
          </>
        ) : null}
      </section>
    </main>
  );
}

// ============================================================
// SHARED NAV — used by all 3 donee pages
// ============================================================

export function DoneeNav({ pathname }: { pathname: string }) {
  const router = useRouter();
  const tabs = [
    { label: "Browse", href: "/donee" },
    { label: "Favourites", href: "/donee/favourites" },
    { label: "Donation history", href: "/donee/donations" },
  ];

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Donee sections"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <button
            key={tab.href}
            type="button"
            onClick={() => router.push(tab.href)}
            className={[
              "inline-flex rounded-full border px-5 py-2 text-sm font-semibold transition",
              isActive
                ? "border-[#2F7A55] bg-[#2F7A55] text-white shadow-sm"
                : "border-[#D7DCE2] bg-white text-[#334155] hover:border-[#2F7A55] hover:text-[#2F7A55]",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
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
