"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  getMyFundraisingActivities,
  searchMyFundraisingActivities,
  suspendFundraisingActivity,
} from "@/lib/fundraiser-api";
import type { FundraisingActivity } from "@/lib/fundraiser-types";
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/use-debounce";

type ScopeFilter = "All" | "Active" | "Completed";

const scopeFilters: ScopeFilter[] = ["All", "Active", "Completed"];

const DASH_PAGE_SIZE = 8;

function getProgress(activity: FundraisingActivity) {
  const goal = activity.goalAmount ?? 0;
  const current = activity.currentAmount ?? 0;
  if (goal <= 0) return 0;
  return Math.min((current / goal) * 100, 100);
}

function normalizeStatus(activity: FundraisingActivity) {
  const s = activity.status ?? "";
  return s.trim().toLowerCase().replaceAll("_", " ");
}

export default function FundraiserDashboardPage() {
  const router = useRouter();
  const { token, isLoading: isAuthLoading } = useAuth();

  const [activities, setActivities] = useState<FundraisingActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const [scope, setScope] = useState<ScopeFilter>("All");
  const [dashPage, setDashPage] = useState(0);
  /** List/stats fetch only — keeps shell + KPIs visible (same idea as admin / donee browse). */
  const [isListLoading, setIsListLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Inline error on the card whose Suspend action failed. */
  const [suspendRowError, setSuspendRowError] = useState<{
    activityId: string;
    message: string;
  } | null>(null);

  /** Full lists for KPI cards (independent of current search/filter). */
  const [statsActive, setStatsActive] = useState<FundraisingActivity[]>([]);
  const [statsCompleted, setStatsCompleted] = useState<FundraisingActivity[]>(
    [],
  );

  const refreshActivities = useCallback(async () => {
    if (!token) return;

    setIsListLoading(true);
    setLoadError(null);
    setSuspendRowError(null);

    const q = debouncedSearch.trim();

    try {
      const allSnap = await getMyFundraisingActivities(token, "all");
      const statsActive = allSnap.filter((a) => a.status !== "Completed");
      const statsCompleted = allSnap.filter((a) => a.status === "Completed");

      setStatsActive(statsActive);
      setStatsCompleted(statsCompleted);

      let rows: FundraisingActivity[] = [];

      const hasSearch = q.length > 0;

      if (scope === "Completed") {
        if (hasSearch) {
          rows = await searchMyFundraisingActivities(token, q, "completed");
        } else {
          rows = statsCompleted;
        }
      } else if (scope === "Active") {
        if (hasSearch) {
          rows = await searchMyFundraisingActivities(token, q, "active");
        } else {
          rows = statsActive;
        }
      } else {
        if (hasSearch) {
          rows = await searchMyFundraisingActivities(token, q, "all");
        } else {
          rows = allSnap;
        }
      }

      setActivities(rows);
    } catch {
      setLoadError("Could not load campaigns.");
      setActivities([]);
      setStatsActive([]);
      setStatsCompleted([]);
    } finally {
      setIsListLoading(false);
    }
  }, [token, debouncedSearch, scope]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    void refreshActivities();
  }, [isAuthLoading, token, router, refreshActivities]);

  useEffect(() => {
    setDashPage(0);
  }, [debouncedSearch, scope]);

  const totalActivities = statsActive.length + statsCompleted.length;
  const completedCount = statsCompleted.length;
  const totalViews = [...statsActive, ...statsCompleted].reduce(
    (sum, activity) => sum + (activity.viewCount ?? 0),
    0,
  );
  const totalFavourites = [...statsActive, ...statsCompleted].reduce(
    (sum, activity) => sum + (activity.favouriteCount ?? 0),
    0,
  );

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
          const tb = normalizeStatus(a) === "completed" ? 1 : 0;
          const ta = normalizeStatus(b) === "completed" ? 1 : 0;
          return ta - tb;
        });
      }, [activities]);

  const dashTotalPages = Math.max(
    1,
    Math.ceil(sortedActivities.length / DASH_PAGE_SIZE),
  );
  const pagedDashActivities = useMemo(() => {
    const start = dashPage * DASH_PAGE_SIZE;
    return sortedActivities.slice(start, start + DASH_PAGE_SIZE);
  }, [sortedActivities, dashPage]);

  async function handleSuspend(activity: FundraisingActivity) {
    if (!token) return;
    setSuspendRowError(null);

    const activityId = String(activity.id);
    try {
      await suspendFundraisingActivity(token, activity.id);
      await refreshActivities();
    } catch (e: unknown) {
      setSuspendRowError({
        activityId,
        message:
          e instanceof Error
            ? e.message
            : "Failed to suspend this campaign.",
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
    <main className="min-h-screen bg-[#F3F3F3] px-5 py-8 text-[#08111F]">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl rounded-[2rem] bg-white px-6 py-8 shadow-sm md:px-10 lg:px-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#40516E]">
              Fundraiser Dashboard
            </p>

            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-black">
              My Fundraising Activities
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/fundraiser/create")}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#2F7A55] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 sm:w-auto"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            Create Campaign
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total Campaigns" value={totalActivities} />
          <SummaryCard label="Completed" value={completedCount} />
          <SummaryCard label="Total Views" value={totalViews} />
          <SummaryCard label="Saved by Donees" value={totalFavourites} />
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-[#E1E5EA] bg-[#F7FAF8] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <SearchIcon />

              <input
                value={searchQuery}
                onChange={(event) => {
                  setDashPage(0);
                  setSearchQuery(event.target.value);
                }}
                placeholder="Search campaigns"
                className="w-full rounded-full border border-[#D7DCE2] bg-white py-3 pl-11 pr-4 text-sm text-[#08111F] outline-none transition focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {scopeFilters.map((label) => {
                const active = scope === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setDashPage(0);
                      setScope(label);
                    }}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      active
                        ? "border-[#2F7A55] bg-[#2F7A55] text-white"
                        : "border-[#D7DCE2] bg-white text-[#334155] hover:border-[#2F7A55] hover:text-[#2F7A55]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loadError ? (
          <div
            className="mt-6 rounded-2xl border border-[#FDA29B] bg-[#FFF4F2] px-5 py-4 text-sm text-[#B42318]"
            role="alert"
          >
            {loadError}
          </div>
        ) : null}

        <div className="mt-8" aria-busy={isListLoading}>
          {isListLoading ? (
            <div className="flex min-h-[240px] justify-center py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
            </div>
          ) : sortedActivities.length > 0 ? (
            <>
              <div className="grid gap-5 xl:grid-cols-2">
                {pagedDashActivities.map((activity) => (
                  <CampaignCard
                    key={activity.id}
                    activity={activity}
                    suspendError={
                      suspendRowError?.activityId === String(activity.id)
                        ? suspendRowError.message
                        : null
                    }
                    onView={() =>
                      router.push(`/fundraiser/campaigns/${activity.id}`)
                    }
                    onManage={() =>
                      router.push(`/fundraiser/campaigns/${activity.id}/manage`)
                    }
                    onEditDraft={() =>
                      router.push(`/fundraiser/create?id=${activity.id}`)
                    }
                    onSuspend={() => void handleSuspend(activity)}
                  />
                ))}
              </div>
              {sortedActivities.length > DASH_PAGE_SIZE ? (
                <nav
                  className="mt-8 flex flex-col gap-3 border-t border-[#E1E5EA] pt-6 sm:flex-row sm:items-center sm:justify-between"
                  aria-label="Campaign list pagination"
                >
                  <p className="text-sm text-[#40516E]">
                    Page {dashPage + 1} of {dashTotalPages} ·{" "}
                    {sortedActivities.length} campaigns
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={dashPage <= 0}
                      onClick={() => setDashPage((p) => Math.max(0, p - 1))}
                      className="rounded-full border border-[#D7DCE2] bg-white px-4 py-2 text-sm font-medium text-[#08111F] hover:border-[#2F7A55] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={dashPage >= dashTotalPages - 1}
                      onClick={() => setDashPage((p) => p + 1)}
                      className="rounded-full border border-[#D7DCE2] bg-white px-4 py-2 text-sm font-medium text-[#08111F] hover:border-[#2F7A55] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </nav>
              ) : null}
            </>
          ) : (
            <section className="rounded-[1.5rem] border border-dashed border-[#D7DCE2] bg-white px-6 py-16 text-center">
              <h2 className="text-lg font-extrabold text-black">
                No fundraising activities found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#40516E]">
                Try another search phrase or filter.
              </p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function CampaignCard({
  activity,
  suspendError,
  onView,
  onManage,
  onEditDraft,
  onSuspend,
}: {
  activity: FundraisingActivity;
  suspendError?: string | null;
  onView: () => void;
  onManage: () => void;
  onEditDraft: () => void;
  onSuspend: () => void;
}) {
  const progress = getProgress(activity);
  const normalizedStatus = normalizeStatus(activity);
  const isDraft = normalizedStatus === "draft";
  const completed = normalizedStatus === "completed";
  const canSuspend = !completed && normalizedStatus !== "suspended";

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[#E1E5EA] bg-white shadow-sm transition hover:border-[#2F7A55]/40 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="grid gap-0 md:grid-cols-[14rem_1fr]">
        <div className="relative min-h-72 overflow-hidden bg-[#F3F3F3] md:min-h-full">
          {activity.imageUrl ? (
            <img
              src={activity.imageUrl}
              alt={activity.title || "Campaign image"}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center text-sm text-[#40516E] md:min-h-full">
              No image
            </div>
          )}

          <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#2F7A55] shadow-sm">
            ${(activity.currentAmount ?? 0).toLocaleString()} raised
          </div>
        </div>

        <div className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-[#EAF3EE] px-3 py-1 text-xs font-bold text-[#2F7A55]">
                {activity.status || "Published"}
              </span>

              <h2 className="mt-3 line-clamp-2 text-xl font-extrabold text-black">
                {activity.title || "Untitled Campaign"}
              </h2>

              <p className="mt-1 text-xs text-[#40516E]">
                {activity.category || "No category"} ·{" "}
                {activity.location || "No location"}
              </p>
            </div>

            {canSuspend ? (
              <button
                type="button"
                onClick={onSuspend}
                className="shrink-0 rounded-full border border-[#FDA29B] bg-[#FFF4F2] px-3 py-1.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FFE7E2]"
              >
                Suspend
              </button>
            ) : null}
          </div>

          {suspendError ? (
            <p className="mt-3 text-sm text-[#B42318]" role="alert">
              {suspendError}
            </p>
          ) : null}

          <div className="mt-5">
            <div className="flex justify-between text-xs font-medium text-[#40516E]">
              <span>
                ${(activity.currentAmount ?? 0).toLocaleString()} of $
                {(activity.goalAmount ?? 0).toLocaleString()}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-[#E1E5EA]">
              <div
                className="h-2 rounded-full bg-[#2F7A55]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniStat label="Views" value={activity.viewCount ?? 0} />
            <MiniStat label="Saved" value={activity.favouriteCount ?? 0} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {isDraft ? (
              <button
                type="button"
                onClick={onEditDraft}
                className="rounded-full bg-[#2F7A55] px-7 py-2 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onManage}
                  className="rounded-full bg-[#2F7A55] px-6 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  Manage
                </button>

                <button
                  type="button"
                  onClick={onView}
                  className="rounded-full border border-[#D7DCE2] bg-white px-6 py-2 text-sm font-semibold text-[#08111F] transition hover:border-[#2F7A55] hover:text-[#2F7A55]"
                >
                  View
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-[#E1E5EA] bg-white px-5 py-4 shadow-sm">
      <p className="text-2xl font-extrabold text-[#2F7A55]">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs font-medium text-[#40516E]">{label}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#F7FAF8] px-4 py-3">
      <p className="text-lg font-extrabold text-[#2F7A55]">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-[#40516E]">{label}</p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
