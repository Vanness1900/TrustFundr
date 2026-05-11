"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  getFundraisingActivityDetail,
  listMyFavourites,
  saveFavourite,
} from "@/lib/donee-api";
import { useAuth } from "@/context/auth-context";
import type { FundraisingActivityDetail } from "@/lib/donee-types";
import { DoneeNav } from "@/app/donee/page";
import { shortTitleForAria } from "@/lib/a11y";

export default function DoneeCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { token, isLoading: isAuthLoading } = useAuth();

  const [campaign, setCampaign] = useState<FundraisingActivityDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      router.replace("/login");
    }
  }, [isAuthLoading, token, router]);

  useEffect(() => {
    if (isAuthLoading || !token) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [data, favs] = await Promise.all([
          getFundraisingActivityDetail(token, params.id),
          listMyFavourites(token),
        ]);
        if (cancelled) return;
        setCampaign(data);
        setIsFavourite(favs.some((f) => f.id === params.id));
      } catch (e: unknown) {
        if (!cancelled) {
          setCampaign(null);
          setError(
            e instanceof Error
              ? e.message
              : "Failed to load fundraising activity.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, params.id, token]);

  const toggleFavourite = useCallback(async () => {
    if (!token || !campaign || isFavourite) return;
    setIsFavourite(true);
    try {
      await saveFavourite(token, campaign.id);
    } catch {
      setIsFavourite(false);
    }
  }, [campaign, isFavourite, token]);

  const goal = campaign?.goalAmount ?? 0;
  const current = campaign?.currentAmount ?? 0;
  const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  const handleShare = useCallback(async () => {
    if (!campaign) return;
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    setActionMessage(null);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: campaign.title,
          text: campaign.description?.slice(0, 140) || campaign.title,
          url,
        });
        return;
      }
    } catch {
      /* dismissed share sheet */
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setActionMessage("Campaign link copied to clipboard.");
        return;
      }
    } catch {
      /* ignore */
    }
    setActionMessage("Copy the address from your browser to share.");
  }, [campaign]);

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-[#F3F3F3] px-4 py-6 sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl rounded-[2rem] bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8 md:px-10 md:py-10">
        {children}
      </section>
    </main>
  );

  if (isAuthLoading || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F3F3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
      </main>
    );
  }

  if (isLoading) {
    return shell(
      <>
        <DoneeNav pathname={pathname} />
        <div className="mt-16 flex justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
        </div>
      </>,
    );
  }

  if (error || !campaign) {
    return shell(
      <>
        <DoneeNav pathname={pathname} />
        <p className="mt-8 text-sm font-medium text-red-600" role="alert">
          {error ?? "Not found."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/donee")}
          className="mt-4 text-sm font-semibold text-[#2F7A55] hover:underline"
        >
          ← Back to campaigns
        </button>
      </>,
    );
  }

  const ownerInitial =
    campaign.ownerName?.trim()?.charAt(0)?.toUpperCase() || "?";
  const titleA11y = shortTitleForAria(campaign.title);

  return shell(
    <>
      <DoneeNav pathname={pathname} />

      <button
        type="button"
        onClick={() => router.push("/donee")}
        className="mt-5 text-sm font-semibold text-[#64748b] transition hover:text-[#2F7A55]"
      >
        ← Back
      </button>

      <h1 className="mt-3 max-w-4xl text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl md:text-[2rem] md:leading-tight">
        {campaign.title?.trim() || "Campaign"}
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-[#E1E5EA] bg-[#eef1f0] shadow-sm">
            <div className="aspect-[16/10] w-full min-h-[200px] sm:min-h-[280px]">
              {campaign.imageUrl ? (
                <img
                  src={campaign.imageUrl}
                  alt=""
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center text-sm font-medium text-[#64748b]">
                  No campaign image
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 border-b border-[#E1E5EA] pb-6">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e2e8f0] text-base font-bold text-[#475569]"
              aria-hidden="true"
            >
              {ownerInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0f172a]">
                {campaign.ownerName?.trim() || "Organiser"}
              </p>
              <p className="text-xs text-[#64748b]">Campaign organiser</p>
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[#E1E5EA] bg-[#fafafa] px-3 py-1.5 text-xs font-semibold text-[#334155] sm:inline-flex">
              <ShieldCheckIcon className="size-4 text-[#2F7A55]" />
              Donation protected
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#E1E5EA] bg-[#fafafa] px-3 py-1.5 text-xs font-semibold text-[#334155] sm:hidden">
            <ShieldCheckIcon className="size-4 text-[#2F7A55]" />
            Donation protected
          </div>

          <section className="pt-6">
            <h2 className="text-lg font-extrabold text-[#0f172a]">Story</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#475569]">
              {campaign.description?.trim() ? (
                <p className="whitespace-pre-line">{campaign.description}</p>
              ) : (
                <p className="text-[#94a3b8]">No description provided.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-6">
            <div className="relative overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
              <button
                type="button"
                onClick={() => void toggleFavourite()}
                disabled={isFavourite}
                className="absolute right-4 top-4 rounded-full p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-default disabled:opacity-90"
                aria-label={
                  isFavourite
                    ? `${titleA11y} is in your favourites`
                    : `Save ${titleA11y} to favourites`
                }
              >
                <HeartIcon filled={isFavourite} />
              </button>

              <div className="flex items-center gap-5 pr-10">
                <DonutProgress percent={Math.round(progress)} />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-extrabold text-[#0f172a]">
                    ${current.toLocaleString()}{" "}
                    <span className="font-bold">raised</span>
                  </p>
                  {goal > 0 ? (
                    <p className="mt-1 text-sm text-[#64748b]">
                      of ${goal.toLocaleString()}
                      {campaign.location
                        ? ` · ${campaign.location}`
                        : " goal"}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-[#64748b]">Goal not set</p>
                  )}
                  <p className="mt-2 text-xs text-[#94a3b8]">
                    {campaign.favouriteCount ?? 0} saves ·{" "}
                    {campaign.viewCount ?? 0} views
                  </p>
                </div>
              </div>

              {actionMessage ? (
                <p
                  className="mt-4 rounded-xl bg-[#eaf5ef] px-3 py-2 text-center text-xs font-medium text-[#1e462e]"
                  role="status"
                >
                  {actionMessage}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setActionMessage(
                      "Donation checkout is not available in this build. Please follow your course or organisation process for giving.",
                    )
                  }
                  className="w-full rounded-full bg-[#2F7A55] py-3.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                >
                  Donate now
                </button>
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="w-full rounded-full bg-[#1e293b] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f172a]"
                >
                  Share the cause
                </button>
              </div>
            </div>

            {(campaign.category || campaign.location) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {campaign.category ? (
                  <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-semibold text-[#475569]">
                    {campaign.category}
                  </span>
                ) : null}
                {campaign.location ? (
                  <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-semibold text-[#475569]">
                    {campaign.location}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>,
  );
}

function DonutProgress({ percent }: { percent: number }) {
  const r = 40;
  const stroke = 8;
  const normalized = Math.min(100, Math.max(0, percent));
  const c = 2 * Math.PI * r;
  const offset = c - (normalized / 100) * c;

  return (
    <div className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center">
      <svg
        width="104"
        height="104"
        viewBox="0 0 104 104"
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="52"
          cy="52"
          r={r}
          fill="none"
          stroke="#e8eceb"
          strokeWidth={stroke}
        />
        <circle
          cx="52"
          cy="52"
          r={r}
          fill="none"
          stroke="#2F7A55"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-center text-xl font-extrabold text-[#0f172a]">
        {normalized}
        <span className="text-sm font-bold">%</span>
      </span>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="size-6"
        fill="currentColor"
        aria-hidden="true"
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
      strokeWidth={1.85}
      stroke="currentColor"
      className="size-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    </svg>
  );
}
