"use client";
import { getDummyFundraisingActivityById } from "@/lib/fundraiser-demo-campaigns";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  getFundraisingActivityById,
  getMyFundraisingActivities,
  updateFundraisingActivity,
} from "@/lib/fundraiser-api";
import type { FundraisingActivity } from "@/lib/fundraiser-types";
import {
  getFundraiserLocalExtra,
  mergeFundraiserLocalExtra,
  saveFundraiserLocalExtra,
} from "@/lib/fundraiser-local-extra";

export default function CampaignManagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, isLoading: isAuthLoading, user } = useAuth();

  const [campaign, setCampaign] = useState<FundraisingActivity | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        let data = await getFundraisingActivityById(token, params.id);

        if (!data) {
            const allActivities = await getMyFundraisingActivities(token);
            data =
                allActivities?.find(
                    (activity) => String(activity.id) === String(params.id),
                ) ?? null;
        }

        if (!data) {
            data = getDummyFundraisingActivityById(params.id);
        }

        if (cancelled) return;

        if (!data) {
          setCampaign(null);
          setError("Campaign not found.");
          return;
        }

        const merged = mergeFundraiserLocalExtra(data);
        const extra = getFundraiserLocalExtra(data.id);

        setCampaign(merged);
        setTitle(merged.title ?? "");
        setCategory(extra.category ?? merged.category ?? "");
        setLocation(extra.location ?? merged.location ?? "");
        setGoalAmount(String(extra.goalAmount ?? merged.goalAmount ?? ""));
        setImageUrl(extra.imageUrl ?? merged.imageUrl ?? "");
        setDescription(merged.description ?? "");
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

  function handleLocalImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setImageUrl(result);
      }
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!campaign) return;

    setError(null);
    setSuccessMessage(null);

    const numericGoalAmount = Number(goalAmount);

    if (!title.trim()) {
      setError("Campaign title is required.");
      return;
    }

    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    if (!location.trim()) {
      setError("Location is required.");
      return;
    }

    if (!numericGoalAmount || numericGoalAmount <= 0) {
      setError("Target amount must be greater than 0.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    setIsSaving(true);

    const isDummyCampaign = campaign.id.startsWith("dummy-");

    const updated = isDummyCampaign
    ? {
        ...campaign,
        title: title.trim(),
        description: description.trim(),
        }
    : await updateFundraisingActivity(token, campaign.id, {
        title: title.trim(),
        description: description.trim(),
        });

    setIsSaving(false);

    if (!updated) {
      setError("Failed to update campaign.");
      return;
    }

    saveFundraiserLocalExtra(campaign.id, {
      category: category.trim(),
      location: location.trim(),
      goalAmount: numericGoalAmount,
      imageUrl: imageUrl.trim() || undefined,
    });

    const mergedUpdated = mergeFundraiserLocalExtra(updated);

    setCampaign(mergedUpdated);
    setTitle(updated.title ?? "");
    setDescription(updated.description ?? "");
    setSuccessMessage("Campaign updated successfully.");
  }

  function handleSuspendPlaceholder() {
    if (!campaign) return;

    const confirmed = window.confirm(
        `Suspend "${campaign.title}"? This will move it to Suspended locally.`,
    );

    if (!confirmed) return;

    saveFundraiserLocalExtra(campaign.id, {
        status: "Suspended",
        category: category.trim(),
        location: location.trim(),
        goalAmount: Number(goalAmount) || 0,
        imageUrl: imageUrl.trim() || undefined,
    });

    setCampaign((currentCampaign) =>
        currentCampaign
        ? {
            ...currentCampaign,
            status: "Suspended",
            }
        : currentCampaign,
    );

    setSuccessMessage("Campaign suspended locally.");
    setError(null);
    }

  const currentAmount = campaign?.currentAmount ?? 0;
  const numericGoal = Number(goalAmount) || 0;
  const progress =
    numericGoal > 0 ? Math.min((currentAmount / numericGoal) * 100, 100) : 0;

  if (isAuthLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2f865b] border-t-transparent" />
      </main>
    );
  }

  if (error && !campaign) {
    return (
      <main className="min-h-screen bg-[#f3f3f3] px-5 py-8 text-[#0f172a]">
        <section className="mx-auto max-w-5xl rounded-[2rem] bg-white px-8 py-10 shadow-sm">
          <button
            type="button"
            onClick={() => router.push("/fundraiser")}
            className="text-sm font-medium text-[#2f865b] hover:text-[#26704c]"
          >
            ← Back
          </button>

          <h1 className="mt-8 text-2xl font-extrabold text-black">{error}</h1>
        </section>
      </main>
    );
  }

  if (!campaign) return null;

  return (
    <main className="min-h-screen bg-[#f3f3f3] px-5 py-8 text-[#0f172a]">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl rounded-[2rem] bg-white px-6 py-8 shadow-sm md:px-10 lg:px-14">
        <button
          type="button"
          onClick={() => router.push("/fundraiser")}
          className="text-sm font-medium text-[#64748b] transition hover:text-[#2f865b]"
        >
          ← Back to dashboard
        </button>

        <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              Manage Campaign
            </p>

            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-black">
              {title || "Untitled Campaign"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
              Update the campaign details, including image, category, location,
              target amount, title, and description.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/fundraiser/campaigns/${campaign.id}`)}
            className="rounded-full border border-[#d7d7d7] bg-white px-6 py-2 text-sm font-semibold text-[#0f172a] transition hover:border-[#2f865b] hover:text-[#2f865b]"
          >
            View Page
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-[#b8dfc9] bg-[#eaf5ef] px-5 py-4 text-sm text-[#2f865b]">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-extrabold text-black">
              Campaign Details
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Campaign Title">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter campaign title"
                  className="w-full rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm outline-none transition focus:border-[#2f865b] focus:ring-2 focus:ring-[#2f865b]/20"
                />
              </Field>

              <Field label="Category">
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Example: Medical, Education, Community"
                  className="w-full rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm outline-none transition focus:border-[#2f865b] focus:ring-2 focus:ring-[#2f865b]/20"
                />
              </Field>

              <Field label="Location">
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Example: Singapore"
                  className="w-full rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm outline-none transition focus:border-[#2f865b] focus:ring-2 focus:ring-[#2f865b]/20"
                />
              </Field>

              <Field label="Target Amount">
                <input
                  type="number"
                  min="1"
                  value={goalAmount}
                  onChange={(event) => setGoalAmount(event.target.value)}
                  placeholder="Enter target amount"
                  className="w-full rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm outline-none transition focus:border-[#2f865b] focus:ring-2 focus:ring-[#2f865b]/20"
                />
              </Field>

              <Field label="Campaign Image" className="md:col-span-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageChange}
                  className="w-full rounded-2xl border border-[#d7d7d7] bg-white px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#2f865b] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#26704c]"
                />
              </Field>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#f8faf9]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Campaign preview"
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-sm text-[#64748b]">
                  No image selected
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4">
              <div className="grid gap-4 text-sm text-[#334155] sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    Organiser
                  </p>
                  <p className="mt-1 font-medium text-black">{organiserName}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    Category
                  </p>
                  <p className="mt-1 font-medium text-black">
                    {category || "No category"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    Location
                  </p>
                  <p className="mt-1 font-medium text-black">
                    {location || "No location"}
                  </p>
                </div>
              </div>
            </div>

            <Field label="Description" className="mt-5">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Write the campaign story and explain why support is needed."
                rows={10}
                className="w-full resize-none rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#2f865b] focus:ring-2 focus:ring-[#2f865b]/20"
              />
            </Field>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/fundraiser")}
                className="rounded-full border border-[#d7d7d7] bg-white px-7 py-3 text-sm font-semibold text-[#0f172a] transition hover:border-[#2f865b] hover:text-[#2f865b]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-[#2f865b] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#26704c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-black">Analytics</h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Views" value={campaign.viewCount ?? 0} />
                <Metric label="Saved" value={campaign.favouriteCount ?? 0} />
                <Metric label="Raised" value={`$${currentAmount.toLocaleString()}`} />
                <Metric label="Progress" value={`${Math.round(progress)}%`} />
              </div>
            </section>

            <section className="rounded-3xl border border-[#e5e7eb] bg-[#eaf5ef] p-6">
              <h2 className="text-lg font-extrabold text-[#2f865b]">
                Current Status
              </h2>

              <p className="mt-2 text-sm text-[#456457]">
                This campaign is currently marked as{" "}
                <span className="font-bold">{campaign.status || "Published"}</span>.
              </p>
            </section>

            <section className="rounded-3xl border border-[#fde2e2] bg-[#fff7f7] p-6">
              <h2 className="text-lg font-extrabold text-red-600">
                Suspend Campaign
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#7f5f5f]">
                This will mark the campaign as suspended locally.
              </p>

              <button
                type="button"
                onClick={handleSuspendPlaceholder}
                className="mt-5 w-full rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Suspend Campaign
              </button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-[#334155]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-[#f6f7f6] px-4 py-4">
      <p className="text-xl font-extrabold text-[#2f865b]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#647067]">{label}</p>
    </div>
  );
}