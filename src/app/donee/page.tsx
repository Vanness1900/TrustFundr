// src/app/donee/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { listFundraisingActivities, saveFavourite } from "@/lib/donee-api";
import { DUMMY_CAMPAIGNS } from "@/lib/donee-dummy";
import type { FundraisingActivity } from "@/lib/donee-types";

export default function DoneePage() {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [activities, setActivities] = useState<FundraisingActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setIsLoading(true);

    listFundraisingActivities(token)
      .then((data) => {
        if (cancelled) return;
        setActivities(data.length === 0 ? DUMMY_CAMPAIGNS : data);
      })
      .catch(() => {
        if (!cancelled) setActivities(DUMMY_CAMPAIGNS);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

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

  const filtered = activities.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      (a.ownerName?.toLowerCase() ?? "").includes(q) ||
      (a.category?.toLowerCase() ?? "").includes(q) ||
      (a.location?.toLowerCase() ?? "").includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Top nav */}
      <DoneeNav pathname={pathname} />

      {/* Search bar */}
      <div className="mt-6 relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Start searching"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#2f7a55] focus:ring-2 focus:ring-[#2f7a55]/20"
        />
      </div>

      {/* Filter pills */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterPill label="Filter" />
        <FilterPill label="Location" hasDropdown />
        <FilterPill label="Category" hasDropdown />
        <FilterPill label="All time" hasDropdown />
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f7a55] border-t-transparent" />
        </div>
      ) : null}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 ? (
        <div className="mt-12 text-center text-sm text-gray-500">
          {searchQuery
            ? `No results found for "${searchQuery}".`
            : "No fundraising activities available right now."}
        </div>
      ) : null}

      {/* Horizontal list */}
      {!isLoading && filtered.length > 0 ? (
        <div className="mt-6 space-y-3">
          {filtered.map((activity) => (
            <CampaignListCard
              key={activity.id}
              activity={activity}
              isFavourite={favouriteIds.has(activity.id)}
              onToggleFavourite={() => handleToggleFavourite(activity.id)}
              onClick={() => router.push(`/donee/campaigns/${activity.id}`)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ============================================================
// SHARED NAV — used by all 3 donee pages
// ============================================================

export function DoneeNav({ pathname }: { pathname: string }) {
  const router = useRouter();
  const tabs = [
    { label: "My Campaign", href: "/donee" },
    { label: "Favourite", href: "/donee/favourites" },
    { label: "Donation History", href: "/donee/donations" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <button
            key={tab.href}
            type="button"
            onClick={() => router.push(tab.href)}
            className={[
              "inline-flex rounded-full border px-4 py-1.5 text-sm font-medium transition",
              isActive
                ? "border-[#2f7a55] bg-[#2f7a55] text-white"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function FilterPill({ label, hasDropdown }: { label: string; hasDropdown?: boolean }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      {label}
      {hasDropdown ? <ChevronIcon /> : null}
    </button>
  );
}

function CampaignListCard({
  activity,
  isFavourite,
  onToggleFavourite,
  onClick,
}: {
  activity: FundraisingActivity;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onClick: () => void;
}) {
  const goal = activity.goalAmount ?? 0;
  const current = activity.currentAmount ?? 0;
  const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <div className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Image */}
      <div
        onClick={onClick}
        className="h-20 w-[120px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-200"
      >
        {activity.imageUrl ? (
          <img
            src={activity.imageUrl}
            alt={activity.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <ImagePlaceholderIcon />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1" onClick={onClick}>
        <h3 className="truncate text-sm font-bold text-gray-900">{activity.title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{activity.ownerName}</p>
        {goal > 0 ? (
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#2f7a55] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              ${current.toLocaleString()} raised of ${goal.toLocaleString()}
            </p>
          </div>
        ) : null}
      </div>

      {/* Heart */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavourite();
        }}
        className="flex-shrink-0 rounded-full p-2 transition hover:bg-gray-100"
        aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
      >
        <HeartIcon filled={isFavourite} />
      </button>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2f7a55" className="size-5">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-5 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-gray-500">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="size-8 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}
