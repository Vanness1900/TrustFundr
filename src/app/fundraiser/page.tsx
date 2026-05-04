"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getMyFundraisingActivities } from "@/lib/fundraiser-api";
import type { FundraisingActivity } from "@/lib/fundraiser-types";
import {
  mergeFundraiserLocalExtras,
  saveFundraiserLocalExtra,
} from "@/lib/fundraiser-local-extra";
import { dummyFundraisingActivities } from "@/lib/fundraiser-demo-campaigns";

type StatusFilter = "All" | "Published" | "Draft" | "Suspended" | "Completed";

const statusFilters: StatusFilter[] = [
  "All",
  "Published",
  "Draft",
  "Suspended",
  "Completed",
];

function normalizeStatus(status?: string | null) {
  return (status || "Published").trim().toLowerCase().replaceAll("_", " ");
}

function matchesStatusFilter(
  activityStatus: string | undefined,
  selected: StatusFilter,
) {
  if (selected === "All") return true;

  const normalized = normalizeStatus(activityStatus);
  const selectedNormalized = normalizeStatus(selected);

  if (selectedNormalized === "published") {
    return normalized === "published" || normalized === "active";
  }

  return normalized === selectedNormalized;
}

function getProgress(activity: FundraisingActivity) {
  const goal = activity.goalAmount ?? 0;
  const current = activity.currentAmount ?? 0;

  if (goal <= 0) return 0;

  return Math.min((current / goal) * 100, 100);
}

export default function FundraiserDashboardPage() {
  const router = useRouter();
  const { token, isLoading: isAuthLoading } = useAuth();

  const [activities, setActivities] = useState<FundraisingActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadActivities() {
    setIsLoading(true);
    setError(null);

    const data = await getMyFundraisingActivities(token);

    if (!data) {
      setActivities(mergeFundraiserLocalExtras(dummyFundraisingActivities));
      setError("Backend campaigns failed to load. Showing sample campaigns.");
      setIsLoading(false);
      return;
    }

    const backendActivities = mergeFundraiserLocalExtras(data);
    const sampleActivities = mergeFundraiserLocalExtras(dummyFundraisingActivities);

    setActivities([...backendActivities, ...sampleActivities]);
    setIsLoading(false);
  }

  useEffect(() => {
    if (isAuthLoading) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    void loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, token]);

  const filteredActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesSearch =
        !query ||
        (activity.title || "").toLowerCase().includes(query) ||
        (activity.category || "").toLowerCase().includes(query) ||
        (activity.location || "").toLowerCase().includes(query) ||
        (activity.status || "").toLowerCase().includes(query);

      const matchesStatus = matchesStatusFilter(activity.status, activeStatus);

      return matchesSearch && matchesStatus;
    });
  }, [activities, searchQuery, activeStatus]);

  const totalActivities = activities.length;

  const completedActivities = activities.filter((activity) =>
    matchesStatusFilter(activity.status, "Completed"),
  ).length;

  const totalViews = activities.reduce(
    (sum, activity) => sum + (activity.viewCount ?? 0),
    0,
  );

  const totalFavourites = activities.reduce(
    (sum, activity) => sum + (activity.favouriteCount ?? 0),
    0,
  );

  if (isAuthLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F3F3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#18543E] border-t-transparent" />
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

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#40516E]">
              Search, view, manage, and suspend your fundraising activities.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/fundraiser/create")}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#18543E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#123F30] sm:w-auto"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            Create Campaign
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total Campaigns" value={totalActivities} />
          <SummaryCard label="Completed" value={completedActivities} />
          <SummaryCard label="Total Views" value={totalViews} />
          <SummaryCard label="Saved by Donees" value={totalFavourites} />
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-[#E1E5EA] bg-[#F7FAF8] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <SearchIcon />

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search campaigns by title, category, location, or status"
                className="w-full rounded-full border border-[#D7DCE2] bg-white py-3 pl-11 pr-4 text-sm text-[#08111F] outline-none transition focus:border-[#18543E] focus:ring-2 focus:ring-[#18543E]/20"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => {
                const isActive = activeStatus === status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setActiveStatus(status)}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      isActive
                        ? "border-[#18543E] bg-[#18543E] text-white"
                        : "border-[#D7DCE2] bg-white text-[#334155] hover:border-[#18543E] hover:text-[#18543E]",
                    ].join(" ")}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[#FDA29B] bg-[#FFF4F2] px-5 py-4 text-sm text-[#B42318]">
            {error}
          </div>
        ) : null}

        <div className="mt-8">
          {filteredActivities.length > 0 ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {filteredActivities.map((activity) => (
                <CampaignCard
                  key={activity.id}
                  activity={activity}
                  onView={() =>
                    router.push(`/fundraiser/campaigns/${activity.id}`)
                  }
                  onManage={() =>
                    router.push(`/fundraiser/campaigns/${activity.id}/manage`)
                  }
                  onEditDraft={() =>
                    router.push(`/fundraiser/create?id=${activity.id}`)
                  }
                  onSuspend={() => {
                    const confirmed = window.confirm(
                      `Suspend "${activity.title}"? This will move it to Suspended locally.`,
                    );

                    if (!confirmed) return;

                    saveFundraiserLocalExtra(activity.id, {
                      status: "Suspended",
                    });

                    setActivities((currentActivities) =>
                      currentActivities.map((item) =>
                        item.id === activity.id
                          ? { ...item, status: "Suspended" }
                          : item,
                      ),
                    );

                    setError(null);
                  }}
                />
              ))}
            </div>
          ) : (
            <section className="rounded-[1.5rem] border border-dashed border-[#D7DCE2] bg-white px-6 py-16 text-center">
              <h2 className="text-lg font-extrabold text-black">
                No fundraising activities found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#40516E]">
                Try changing your search keyword or selected status filter.
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
  onView,
  onManage,
  onEditDraft,
  onSuspend,
}: {
  activity: FundraisingActivity;
  onView: () => void;
  onManage: () => void;
  onEditDraft: () => void;
  onSuspend: () => void;
}) {
  const progress = getProgress(activity);
  const normalizedStatus = normalizeStatus(activity.status);
  const isDraft = normalizedStatus === "draft";
  const canSuspend =
    normalizedStatus !== "suspended" && normalizedStatus !== "completed";

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[#E1E5EA] bg-white shadow-sm transition hover:border-[#18543E]/40 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
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

          <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#18543E] shadow-sm">
            ${(activity.currentAmount ?? 0).toLocaleString()} raised
          </div>
        </div>

        <div className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-[#EAF3EE] px-3 py-1 text-xs font-bold text-[#18543E]">
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
                className="h-2 rounded-full bg-[#18543E]"
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
                className="rounded-full bg-[#18543E] px-7 py-2 text-sm font-semibold text-white transition hover:bg-[#123F30]"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onManage}
                  className="rounded-full bg-[#18543E] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#123F30]"
                >
                  Manage
                </button>

                <button
                  type="button"
                  onClick={onView}
                  className="rounded-full border border-[#D7DCE2] bg-white px-6 py-2 text-sm font-semibold text-[#08111F] transition hover:border-[#18543E] hover:text-[#18543E]"
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
      <p className="text-2xl font-extrabold text-[#18543E]">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs font-medium text-[#40516E]">{label}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#F7FAF8] px-4 py-3">
      <p className="text-lg font-extrabold text-[#18543E]">
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