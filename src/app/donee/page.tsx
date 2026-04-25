// src/app/donee/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  listFundraisingActivities,
  searchFundraisingActivities,
  saveFavourite,
} from "@/lib/donee-api";
import type { FundraisingActivity } from "@/lib/donee-types";

/**
 * Halaman utama dashboard Donee — browse semua fundraising activities.
 *
 * Fitur:
 * - Tab navigation: My Campaign / Favourite (favourite akan link ke /donee/favourites)
 * - Search bar
 * - Filter pills (Filter, Location, Category, All time) — UI dummy dulu, fungsi nanti
 * - Grid 3-column campaign cards
 * - Heart icon untuk save ke favourite
 * - Click card → ke halaman detail
 *
 * Layout (header + sign out + avatar) sudah disediakan oleh donee/layout.tsx,
 * jadi page ini cuma berisi konten utama.
 */
export default function DoneePage() {
  const { token } = useAuth();
  const router = useRouter();

  const [activities, setActivities] = useState<FundraisingActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

  // Debounce search: tunggu 400ms setelah user berhenti ngetik baru fetch
  // Ini supaya tidak spam API setiap kali user pencet keyboard
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch activities — pakai search kalau ada query, list kalau kosong
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const fetchPromise = debouncedQuery
      ? searchFundraisingActivities(token, debouncedQuery)
      : listFundraisingActivities(token);

    fetchPromise
      .then((data) => {
        if (cancelled) return;
        setActivities(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "Failed to load activities.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, debouncedQuery]);

  // Handler untuk klik heart icon — save ke favourite
  async function handleToggleFavourite(activityId: string) {
    if (!token) return;

    // Optimistic update: tandai favourite dulu di UI biar feel responsif,
    // baru kirim API call. Kalau gagal, revert.
    const wasAlreadyFavourite = favouriteIds.has(activityId);
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      next.add(activityId);
      return next;
    });

    if (wasAlreadyFavourite) {
      // Backend belum punya endpoint remove favourite,
      // jadi untuk sekarang heart cuma bisa di-toggle on, tidak off.
      // Kita akan tambah endpoint remove di Track B nanti.
      return;
    }

    try {
      await saveFavourite(token, activityId);
    } catch (e) {
      // Revert kalau gagal
      setFavouriteIds((prev) => {
        const next = new Set(prev);
        next.delete(activityId);
        return next;
      });
      setError(
        e instanceof Error ? e.message : "Failed to save favourite.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Tab navigation: My Campaign / Favourite */}
      <div className="flex flex-wrap items-center gap-3">
        <Pill active>My Campaign</Pill>
        <button
          type="button"
          onClick={() => router.push("/donee/favourites")}
          className="inline-flex rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
        >
          Favourite
        </button>
      </div>

      {/* Search bar + filter pills */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
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
      </div>

      {/* Filter pills row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterPill label="Filter" />
        <FilterPill label="Location" hasDropdown />
        <FilterPill label="Category" hasDropdown />
        <FilterPill label="All time" hasDropdown />
      </div>

      {/* Error banner */}
      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Loading state */}
      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f7a55] border-t-transparent" />
        </div>
      ) : null}

      {/* Empty state */}
      {!isLoading && activities.length === 0 && !error ? (
        <div className="mt-12 text-center text-sm text-gray-500">
          {debouncedQuery
            ? `No results found for "${debouncedQuery}".`
            : "No fundraising activities available right now."}
        </div>
      ) : null}

      {/* Grid 3-column campaign cards */}
      {!isLoading && activities.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <CampaignCard
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
// SUB-COMPONENTS
// ============================================================

/**
 * Pill button untuk tab navigation (My Campaign / Favourite).
 * Sama persis dengan Pill di admin/page.tsx — pattern konsisten.
 */
function Pill({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-4 py-1.5 text-sm font-medium transition",
        active
          ? "border-[#2f7a55] bg-[#2f7a55] text-white"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

/**
 * Filter pill dengan optional dropdown chevron.
 * Sesuai wireframe Figma: rounded full, border tipis, text gray.
 * Untuk sekarang cuma UI — handler dropdown akan ditambah di milestone berikutnya
 * setelah backend support filter (category, location, date range).
 */
function FilterPill({
  label,
  hasDropdown,
}: {
  label: string;
  hasDropdown?: boolean;
}) {
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

/**
 * Search icon untuk input field. Inline SVG biar tidak perlu library tambahan.
 */
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

/**
 * Heart icon untuk favourite button.
 * Filled (red) kalau sudah di-favourite, outline kalau belum.
 */
function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="#dc2626"
        className="size-5"
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="size-5 text-gray-700"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

/**
 * Card untuk satu fundraising activity di grid.
 * Match wireframe Figma: image placeholder atas, heart icon top-right,
 * title + meta di bawah image.
 */
function CampaignCard({
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
  return (
    <div className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Image area dengan heart icon overlay */}
      <div
        onClick={onClick}
        className="relative aspect-[4/3] w-full overflow-hidden bg-gray-200"
      >
        {/* Placeholder gambar — backend belum support imageUrl, nanti ditambah */}
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

        {/* Heart button overlay */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // jangan trigger card click
            onToggleFavourite();
          }}
          className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-md transition hover:scale-110"
          aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
        >
          <HeartIcon filled={isFavourite} />
        </button>

        {/* Funds raised badge — placeholder, backend belum support amount */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {activity.viewCount} views
        </div>
      </div>

      {/* Card body */}
      <div onClick={onClick} className="p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-[#2f7a55]">
          {activity.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500">by {activity.ownerName}</p>
      </div>
    </div>
  );
}