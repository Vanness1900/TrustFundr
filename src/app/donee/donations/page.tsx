// src/app/donee/donations/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { listMyDonations, searchMyDonations } from "@/lib/donee-api";
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/use-debounce";
import { DoneeNav } from "@/app/donee/page";
import type { DonationHistory } from "@/lib/donee-types";

const DONATIONS_PAGE_SIZE = 10;

function daysAgo(dateStr: string): string {
  if (!dateStr?.trim()) return "—";
  const t = new Date(dateStr).getTime();
  if (!Number.isFinite(t)) return "—";
  const days = Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
  if (!Number.isFinite(days)) return "—";
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function DonationsPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [donations, setDonations] = useState<DonationHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [donationsPage, setDonationsPage] = useState(0);

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
            ? await searchMyDonations(token, q)
            : await listMyDonations(token);
        if (cancelled) return;
        setDonations(data);
        setDonationsPage(0);
      } catch {
        if (!cancelled) {
          setDonations([]);
          setDonationsPage(0);
        }
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

  const donationsTotalPages = Math.max(
    1,
    Math.ceil(donations.length / DONATIONS_PAGE_SIZE),
  );

  return (
    <main className="min-h-screen bg-[#F3F3F3] px-4 py-8 text-[#08111F] sm:px-5">
      <section className="mx-auto max-w-7xl rounded-[2rem] bg-white px-5 py-8 shadow-sm sm:px-8 md:px-10 lg:px-12">
        <div className="border-b border-[#E1E5EA] pb-6">
          <p className="text-sm font-medium text-[#40516E]">Donee</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-black">
            Donation history
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
            A record of your past contributions.
          </p>
        </div>

        <div className="mt-6">
          <DoneeNav pathname={pathname} />
        </div>

        <div className="mt-6 w-full min-w-0">
          <div className="relative w-full min-w-0">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
              <SearchIcon />
            </span>
            <input
              type="search"
              placeholder="Search donations"
              value={searchQuery}
              onChange={(e) => {
                setDonationsPage(0);
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

        {!isLoading && donations.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-[#D7DCE2] bg-[#fafafa] px-6 py-14 text-center">
            <p className="text-base font-semibold text-[#334155]">
              {searchQuery.trim()
                ? `No donations match “${searchQuery.trim()}”.`
                : "No donations yet."}
            </p>
          </div>
        ) : null}

        {!isLoading && donations.length > 0 ? (
          <>
            <div className="mt-8 space-y-3">
              {donations
                .slice(
                  donationsPage * DONATIONS_PAGE_SIZE,
                  donationsPage * DONATIONS_PAGE_SIZE + DONATIONS_PAGE_SIZE,
                )
                .map((donation) => (
                  <DonationListCard key={donation.id} donation={donation} />
                ))}
            </div>
            {donations.length > DONATIONS_PAGE_SIZE ? (
              <nav
                className="mt-10 flex flex-col gap-3 border-t border-[#E1E5EA] pt-8 sm:flex-row sm:items-center sm:justify-between"
                aria-label="Donation history pagination"
              >
                <p className="text-sm text-[#40516E]">
                  Page {donationsPage + 1} of {donationsTotalPages} ·{" "}
                  {donations.length} donations
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={donationsPage <= 0}
                    onClick={() => setDonationsPage((p) => Math.max(0, p - 1))}
                    className="rounded-full border border-[#D7DCE2] bg-white px-4 py-2 text-sm font-medium text-[#08111F] hover:border-[#2F7A55] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={donationsPage >= donationsTotalPages - 1}
                    onClick={() => setDonationsPage((p) => p + 1)}
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

function DonationListCard({ donation }: { donation: DonationHistory }) {
  const amountNum = Number.parseFloat(donation.amount);
  const amountDisplay = Number.isFinite(amountNum)
    ? amountNum.toLocaleString()
    : donation.amount;
  const thumb = donation.fundraisingActivityImageUrl?.trim();
  const campaignId = (donation.fundraisingActivityId ?? "").trim();
  const title = donation.fundraisingActivityTitle || "Campaign";
  const href =
    campaignId.length > 0
      ? `/donee/campaigns/${encodeURIComponent(campaignId)}`
      : null;

  const rowClass =
    "flex items-center gap-4 rounded-[1.25rem] border border-[#E1E5EA] bg-white p-4 shadow-sm transition hover:border-[#2F7A55]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F7A55]";

  const body = (
    <>
      <div className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#eaf5ef] ring-1 ring-[#E1E5EA]/80">
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-lg font-extrabold text-[#2F7A55]"
            aria-hidden="true"
          >
            $
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-extrabold text-[#0f172a]">{title}</h3>
        <p className="mt-0.5 text-xs font-medium text-[#64748b]">
          {daysAgo(donation.donatedAt)}
        </p>
        {donation.memo ? (
          <p className="mt-0.5 truncate text-xs text-[#94a3b8]">{donation.memo}</p>
        ) : null}
      </div>

      <span className="shrink-0 text-base font-extrabold text-[#0f172a]">
        ${amountDisplay}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${rowClass} cursor-pointer no-underline`}
        aria-label={`View campaign: ${title}`}
      >
        {body}
      </Link>
    );
  }

  return <div className={rowClass}>{body}</div>;
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
