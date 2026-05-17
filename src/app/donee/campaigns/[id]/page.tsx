"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  getFundraisingActivityDetail,
  listFavouriteActivityIds,
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
      const aid = String(params.id);
      try {
        const data = await getFundraisingActivityDetail(token, params.id);
        if (cancelled) return;
        setCampaign(data);
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

      listFavouriteActivityIds(token)
        .then((ids) => {
          if (!cancelled) setIsFavourite(ids.includes(aid));
        })
        .catch(() => {
          if (!cancelled) setIsFavourite(false);
        });
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
      await saveFavourite(token, String(campaign.id));
    } catch {
      setIsFavourite(false);
    }
  }, [campaign, isFavourite, token]);

  if (isAuthLoading || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f3f3f3] px-5 py-8 text-[#0f172a]">
        <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl rounded-[2rem] bg-white px-6 py-8 shadow-sm md:px-10 lg:px-14">
          <DoneeNav pathname={pathname} />
          <div className="mt-16 flex justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
          </div>
        </section>
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="min-h-screen bg-[#f3f3f3] px-5 py-8 text-[#0f172a]">
        <section className="mx-auto max-w-7xl rounded-[2rem] bg-white px-8 py-10 shadow-sm">
          <DoneeNav pathname={pathname} />
          <button
            type="button"
            onClick={() => router.push("/donee")}
            className="mt-6 text-sm font-medium text-[#2F7A55] hover:text-[#2F7A55]"
          >
            ← Back to campaigns
          </button>
          <h1 className="mt-8 text-2xl font-extrabold text-black">
            {error ?? "Campaign not found."}
          </h1>
        </section>
      </main>
    );
  }

  const currentAmount = campaign.currentAmount ?? 0;
  const goalAmount = campaign.goalAmount ?? 0;
  const progress =
    goalAmount > 0 ? Math.min((currentAmount / goalAmount) * 100, 100) : 0;
  const organiserName = campaign.ownerName?.trim() || "Organiser";
  const titleA11y = shortTitleForAria(campaign.title);

  return (
    <main className="min-h-screen bg-[#f3f3f3] px-5 py-8 text-[#0f172a]">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl rounded-[2rem] bg-white px-6 py-8 shadow-sm md:px-10 lg:px-14">
        <DoneeNav pathname={pathname} />

        <button
          type="button"
          onClick={() => router.push("/donee")}
          className="mt-6 text-sm font-medium text-[#64748b] transition hover:text-[#2F7A55]"
        >
          ← Back to campaigns
        </button>

        <div className="mt-8">
          <p className="text-sm font-medium text-[#64748b]">Campaign Detail</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-black">
            {campaign.title?.trim() || "Untitled Campaign"}
          </h1>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#f8faf9]">
              {campaign.imageUrl ? (
                <img
                  src={campaign.imageUrl}
                  alt={campaign.title?.trim() || "Campaign image"}
                  className="h-[28rem] w-full object-cover"
                />
              ) : (
                <div className="flex h-[28rem] items-center justify-center text-sm text-[#64748b]">
                  No image available
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4 border-b border-[#e5e7eb] pb-5">
              <div>
                <p className="text-lg font-bold text-black">{organiserName}</p>
                <p className="text-sm text-[#64748b]">Campaign organiser</p>
              </div>
              <div className="flex gap-6 text-sm text-[#64748b]">
                <span>{campaign.viewCount ?? 0} views</span>
                <span>{campaign.favouriteCount ?? 0} saved to favourites</span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <InfoCard
                label="Category"
                value={campaign.category || "No category"}
              />
              <InfoCard
                label="Location"
                value={campaign.location || "No location"}
              />
              <InfoCard
                label="Target Amount"
                value={`$${goalAmount.toLocaleString()}`}
              />
            </div>

            <section className="mt-8">
              <h2 className="text-2xl font-extrabold text-black">Description</h2>
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-[#202938]">
                {campaign.description?.trim() ||
                  "No description has been provided."}
              </p>
            </section>
          </div>

          <aside className="relative rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={() => void toggleFavourite()}
              disabled={isFavourite}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-default disabled:opacity-90"
              aria-label={
                isFavourite
                  ? `${titleA11y} is in your favourites`
                  : `Save ${titleA11y} to favourites`
              }
            >
              <HeartIcon filled={isFavourite} />
            </button>

            <div className="flex items-center gap-4 pr-10">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7]">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#2F7A55 ${progress}%, #e5e7eb ${progress}% 100%)`,
                  }}
                />
                <div className="absolute inset-[12px] rounded-full bg-white" />
                <span className="relative z-10 text-xl font-extrabold text-black">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-3xl font-extrabold text-black">
                  ${currentAmount.toLocaleString()} raised
                </p>
                <p className="mt-1 text-base text-[#64748b]">
                  of ${goalAmount.toLocaleString()} SGD
                </p>
                <p className="mt-1 text-sm text-[#64748b]">
                  {campaign.status || "Published"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#fff6f6] px-4 py-4">
              <div className="flex items-center gap-2 text-base font-bold text-[#ff3b30]">
                <span>♥</span>
                <span>{campaign.favouriteCount ?? 0} saves</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[#7f5f5f]">
                This shows how many donees saved this campaign to their
                favourite list.
              </p>
            </div>

            <div className="mt-6 border-t border-[#e5e7eb] pt-6">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Views" value={campaign.viewCount ?? 0} />
                <StatCard label="Saved" value={campaign.favouriteCount ?? 0} />
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

            <div className="mt-6 flex flex-col gap-3 border-t border-[#e5e7eb] pt-6">
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
                onClick={() =>
                  setActionMessage("Share button is unavailable.")
                }
                className="w-full rounded-full bg-[#1e293b] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f172a]"
              >
                Share the cause
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f8faf9] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-black">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-[#eef6f1] px-4 py-5 text-center">
      <p className="text-2xl font-extrabold text-[#2F7A55]">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs font-medium text-[#5f6b66]">{label}</p>
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
