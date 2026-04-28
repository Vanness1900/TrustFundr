// src/app/fundraiser/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getMyFundraisingActivities } from "@/lib/fundraiser-api";
import { DUMMY_CAMPAIGNS } from "@/lib/fundraiser-dummy";
import type { FundraisingActivity } from "@/lib/fundraiser-types";

type Tab = "campaigns" | "donations";

export default function FundraiserPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("campaigns");
  const [activities, setActivities] = useState<FundraisingActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setIsLoading(true);

    getMyFundraisingActivities(token).then((acts) => {
      if (cancelled) return;
      setActivities(acts === null || acts.length === 0 ? DUMMY_CAMPAIGNS : acts);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredActivities = activities.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q)
    );
  });

  const ownerName = user?.fullName ?? user?.username ?? "";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Tab switcher */}
      <div className="flex items-center gap-3">
        <TabPill active={activeTab === "campaigns"} onClick={() => setActiveTab("campaigns")}>
          My Campaign
        </TabPill>
        <TabPill active={activeTab === "donations"} onClick={() => setActiveTab("donations")}>
          Donation History
        </TabPill>
      </div>

      {/* Loading spinner */}
      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#16a34a] border-t-transparent" />
        </div>
      ) : null}

      {/* My Campaign tab */}
      {!isLoading && activeTab === "campaigns" ? (
        <>
          {/* Search + Create button row */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </span>
              <input
                type="search"
                placeholder="Search by title, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
              />
            </div>
            <button
              type="button"
              onClick={() => router.push("/fundraiser/campaigns/create")}
              className="flex-shrink-0 rounded-full bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
            >
              + Create Campaign
            </button>
          </div>

          {/* Filter pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FilterPill label="Filter" />
            <FilterPill label="Location" hasDropdown />
            <FilterPill label="Category" hasDropdown />
            <FilterPill label="All time" hasDropdown />
          </div>

          {/* Empty state (only when search yields nothing) */}
          {filteredActivities.length === 0 ? (
            <div className="mt-12 text-center text-sm text-gray-500">
              No campaigns matching &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : null}

          {/* Campaign grid — 1 col mobile, 3 col desktop */}
          {filteredActivities.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredActivities.map((activity) => (
                <CampaignCard
                  key={activity.id}
                  activity={activity}
                  ownerName={ownerName}
                  onManage={() => router.push(`/fundraiser/campaigns/${activity.id}`)}
                  onView={() => router.push(`/fundraiser/campaigns/${activity.id}`)}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {/* Donation History tab */}
      {!isLoading && activeTab === "donations" ? (
        <div className="mt-12 flex items-center justify-center">
          <p className="text-sm text-gray-400">Coming soon</p>
        </div>
      ) : null}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function TabPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex rounded-full border px-4 py-1.5 text-sm font-medium transition",
        active
          ? "border-[#16a34a] bg-[#16a34a] text-white"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function FilterPill({ label, hasDropdown }: { label: string; hasDropdown?: boolean }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      {label}
      {hasDropdown ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4 text-gray-500"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      ) : null}
    </button>
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
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

function CampaignCard({
  activity,
  ownerName,
  onManage,
  onView,
}: {
  activity: FundraisingActivity;
  ownerName: string;
  onManage: () => void;
  onView: () => void;
}) {
  const progress =
    activity.goalAmount > 0
      ? Math.min((activity.currentAmount / activity.goalAmount) * 100, 100)
      : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Image with amount-raised overlay */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-200">
        {activity.imageUrl ? (
          <img
            src={activity.imageUrl}
            alt={activity.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="currentColor"
              className="size-12 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          </div>
        )}
        {/* Amount raised badge */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          ${activity.currentAmount.toLocaleString()} raised
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{activity.title}</h3>
        {ownerName ? (
          <p className="mt-0.5 text-xs text-gray-500">by {ownerName}</p>
        ) : null}

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#16a34a] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            ${activity.currentAmount.toLocaleString()} of $
            {activity.goalAmount.toLocaleString()}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          <span>👁 {activity.viewCount}</span>
          <span>♥ {activity.favouriteCount}</span>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onManage}
            className="flex-1 rounded-full bg-[#16a34a] py-1.5 text-xs font-semibold text-white transition hover:bg-[#15803d]"
          >
            Manage
          </button>
          <button
            type="button"
            onClick={onView}
            className="flex-1 rounded-full border border-[#16a34a] py-1.5 text-xs font-semibold text-[#16a34a] transition hover:bg-[#16a34a]/5"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
