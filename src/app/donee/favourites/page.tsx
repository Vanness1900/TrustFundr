// src/app/donee/favourites/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { listMyFavourites } from "@/lib/donee-api";
import { DUMMY_FAVOURITES } from "@/lib/donee-dummy";
import { DoneeNav } from "@/app/donee/page";
import type { FundraisingActivity } from "@/lib/donee-types";

export default function FavouritesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [favourites, setFavourites] = useState<FundraisingActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setIsLoading(true);

    listMyFavourites(token)
      .then((data) => {
        if (cancelled) return;
        setFavourites(data.length === 0 ? DUMMY_FAVOURITES : data);
      })
      .catch(() => {
        if (!cancelled) setFavourites(DUMMY_FAVOURITES);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const filtered = favourites.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      (a.ownerName?.toLowerCase() ?? "").includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <DoneeNav pathname={pathname} />

      <h1 className="mt-6 text-lg font-bold text-gray-900">Favourites</h1>

      {/* Search bar */}
      <div className="mt-4 relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Search favourites"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#2f7a55] focus:ring-2 focus:ring-[#2f7a55]/20"
        />
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
          {searchQuery ? `No results for "${searchQuery}".` : "No favourites yet."}
        </div>
      ) : null}

      {/* Horizontal list */}
      {!isLoading && filtered.length > 0 ? (
        <div className="mt-6 space-y-3">
          {filtered.map((activity) => (
            <FavouriteListCard
              key={activity.id}
              activity={activity}
              onClick={() => router.push(`/donee/campaigns/${activity.id}`)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FavouriteListCard({
  activity,
  onClick,
}: {
  activity: FundraisingActivity;
  onClick: () => void;
}) {
  const goal = activity.goalAmount ?? 0;
  const current = activity.currentAmount ?? 0;
  const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      {/* Image */}
      <div className="h-20 w-[120px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-200">
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
      <div className="min-w-0 flex-1">
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

      {/* Heart — always filled green */}
      <div className="flex-shrink-0 p-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2f7a55" className="size-5">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
        </svg>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
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
