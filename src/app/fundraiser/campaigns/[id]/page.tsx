"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  getFundraisingActivityById,
  getMyFundraisingActivities,
} from "@/lib/fundraiser-api";
import type { FundraisingActivity } from "@/lib/fundraiser-types";

export default function CampaignViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user, isLoading: isAuthLoading } = useAuth();

  const [campaign, setCampaign] = useState<FundraisingActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const organiserName = useMemo(() => {
    return user?.fullName || user?.username || "Fundraiser";
  }, [user]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadCampaign() {
      setIsLoading(true);
      setError(null);

      try {
        let data: FundraisingActivity | null = null;
        try {
          data = await getFundraisingActivityById(token, params.id);
        } catch {
          try {
            const allRows = await getMyFundraisingActivities(token, "all");
            data =
              allRows.find(
                (activity) => String(activity.id) === String(params.id),
              ) ?? null;
          } catch {
            data = null;
          }
        }

        if (cancelled) return;

        if (!data) {
          setCampaign(null);
          setError("Campaign not found.");
          return;
        }

        setCampaign(data);
      } catch {
        if (cancelled) return;

        setCampaign(null);
        setError("Failed to load campaign.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCampaign();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, params.id, router, token]);

  if (isAuthLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="min-h-screen bg-[#f3f3f3] px-5 py-8 text-[#0f172a]">
        <section className="mx-auto max-w-5xl rounded-[2rem] bg-white px-8 py-10 shadow-sm">
          <button
            type="button"
            onClick={() => router.push("/fundraiser")}
            className="text-sm font-medium text-[#2F7A55] hover:text-[#2F7A55]"
          >
            ← Back
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

  return (
    <main className="min-h-screen bg-[#f3f3f3] px-5 py-8 text-[#0f172a]">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl rounded-[2rem] bg-white px-6 py-8 shadow-sm md:px-10 lg:px-14">
        <button
          type="button"
          onClick={() => router.push("/fundraiser")}
          className="text-sm font-medium text-[#64748b] transition hover:text-[#2F7A55]"
        >
          ← Back to dashboard
        </button>

        <div className="mt-8">
          <p className="text-sm font-medium text-[#64748b]">Campaign Detail</p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-black">
            {campaign.title || "Untitled Campaign"}
          </h1>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#f8faf9]">
              {campaign.imageUrl ? (
                <img
                  src={campaign.imageUrl}
                  alt={campaign.title || "Campaign image"}
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
              <h2 className="text-2xl font-extrabold text-black">
                Description
              </h2>

              <p className="mt-5 whitespace-pre-line text-base leading-8 text-[#202938]">
                {campaign.description || "No description has been provided."}
              </p>
            </section>
          </div>

          <aside className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#f2f4f7]">
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

              <div>
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