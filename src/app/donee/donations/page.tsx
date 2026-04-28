// src/app/donee/donations/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { listMyDonations } from "@/lib/donee-api";
import { DUMMY_DONATIONS } from "@/lib/donee-dummy";
import { DoneeNav } from "@/app/donee/page";
import type { DonationDisplayItem } from "@/lib/donee-dummy";
import type { DonationHistory } from "@/lib/donee-types";

function toDonationDisplayItem(d: DonationHistory): DonationDisplayItem {
  return {
    id: d.id,
    title: d.fundraisingActivityTitle,
    donatedAt: d.donatedAt,
    amount: parseFloat(d.amount),
    imageUrl: null,
    campaignId: d.fundraisingActivityId,
  };
}

function daysAgo(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function DonationsPage() {
  const { token } = useAuth();
  const pathname = usePathname();

  const [donations, setDonations] = useState<DonationDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setIsLoading(true);

    listMyDonations(token)
      .then((data) => {
        if (cancelled) return;
        if (data.length === 0) {
          setDonations(DUMMY_DONATIONS);
        } else {
          setDonations(data.map(toDonationDisplayItem));
        }
      })
      .catch(() => {
        if (!cancelled) setDonations(DUMMY_DONATIONS);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <DoneeNav pathname={pathname} />

      <h1 className="mt-6 text-lg font-bold text-gray-900">Donation History</h1>

      {/* Filter pills */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterPill label="Filter" />
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
      {!isLoading && donations.length === 0 ? (
        <div className="mt-12 text-center text-sm text-gray-500">No donations yet.</div>
      ) : null}

      {/* Donation list */}
      {!isLoading && donations.length > 0 ? (
        <div className="mt-6 space-y-3">
          {donations.map((donation) => (
            <DonationListCard key={donation.id} donation={donation} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DonationListCard({ donation }: { donation: DonationDisplayItem }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Image */}
      <div className="h-20 w-[120px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-200">
        {donation.imageUrl ? (
          <img
            src={donation.imageUrl}
            alt={donation.title}
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
        <h3 className="truncate text-sm font-bold text-gray-900">{donation.title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">Donated {daysAgo(donation.donatedAt)}</p>
      </div>

      {/* Amount */}
      <span className="flex-shrink-0 text-sm font-bold text-gray-900">
        ${donation.amount.toLocaleString()}
      </span>
    </div>
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-gray-500">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
        </svg>
      ) : null}
    </button>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="size-8 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}
