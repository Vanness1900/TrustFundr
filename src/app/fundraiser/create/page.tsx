"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  createFundraisingActivity,
  getFundraisingActivityById,
  getMyFundraisingActivities,
  updateFundraisingActivity,
} from "@/lib/fundraiser-api";
import {
  getFundraiserLocalExtra,
  saveFundraiserLocalExtra,
} from "@/lib/fundraiser-local-extra";

export default function CreateCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const isEditMode = Boolean(editingId);

  const { token, isLoading: isAuthLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isPageLoading, setIsPageLoading] = useState(Boolean(editingId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId || isAuthLoading) return;

    let cancelled = false;

    async function loadCampaignForEdit() {
      setIsPageLoading(true);
      setError(null);

      let campaign = await getFundraisingActivityById(token, editingId);

      if (!campaign) {
        const allActivities = await getMyFundraisingActivities(token);
        campaign =
          allActivities?.find((item) => String(item.id) === String(editingId)) ??
          null;
      }

      if (cancelled) return;

      if (!campaign) {
        setError("Campaign not found.");
        setIsPageLoading(false);
        return;
      }

      const extra = getFundraiserLocalExtra(campaign.id);

      setTitle(campaign.title ?? "");
      setCategory(extra.category ?? campaign.category ?? "");
      setLocation(extra.location ?? campaign.location ?? "");
      setGoalAmount(String(extra.goalAmount ?? campaign.goalAmount ?? ""));
      setImageUrl(extra.imageUrl ?? campaign.imageUrl ?? "");
      setDescription(campaign.description ?? "");
      setIsPageLoading(false);
    }

    void loadCampaignForEdit();

    return () => {
      cancelled = true;
    };
  }, [editingId, isAuthLoading, token]);

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

    setError(null);

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

    setIsSubmitting(true);

    const savedCampaign =
      isEditMode && editingId
        ? await updateFundraisingActivity(token, editingId, {
            title: title.trim(),
            description: description.trim(),
          })
        : await createFundraisingActivity(token, {
            title: title.trim(),
            description: description.trim(),
          });

    setIsSubmitting(false);

    if (!savedCampaign) {
      setError(
        isEditMode
          ? "Failed to update campaign."
          : "Failed to create campaign.",
      );
      return;
    }

    saveFundraiserLocalExtra(savedCampaign.id, {
      category: category.trim(),
      location: location.trim(),
      goalAmount: numericGoalAmount,
      imageUrl: imageUrl.trim() || undefined,
    });

    router.push("/fundraiser");
    router.refresh();
  }

  if (isAuthLoading || isPageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2f865b] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] px-5 py-8 text-[#0f172a]">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl rounded-[2rem] bg-white px-6 py-8 shadow-sm md:px-10 lg:px-14">
        <button
          type="button"
          onClick={() => router.push("/fundraiser")}
          className="text-sm font-medium text-[#64748b] transition hover:text-[#2f865b]"
        >
          ← Back to dashboard
        </button>

        <div className="mt-8">
          <p className="text-sm font-medium text-[#64748b]">
            Fundraiser Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-black">
            {isEditMode ? "Edit Campaign" : "Create Campaign"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
            {isEditMode
              ? "Update the campaign details before publishing or managing it."
              : "Create a new fundraising activity so donors can view and support your cause."}
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <section className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
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

              <Field label="Campaign Image">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageChange}
                  className="w-full rounded-2xl border border-[#d7d7d7] bg-white px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#2f865b] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#26704c]"
                />
              </Field>
            </div>

            {imageUrl.trim() ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#f8faf9]">
                <img
                  src={imageUrl.trim()}
                  alt="Campaign preview"
                  className="h-64 w-full object-cover"
                />
              </div>
            ) : null}

            <Field label="Description" className="mt-5">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Write the campaign story and explain why support is needed."
                rows={8}
                className="w-full resize-none rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#2f865b] focus:ring-2 focus:ring-[#2f865b]/20"
              />
            </Field>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/fundraiser")}
              className="rounded-full border border-[#d7d7d7] bg-white px-7 py-3 text-sm font-semibold text-[#0f172a] transition hover:border-[#2f865b] hover:text-[#2f865b]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#2f865b] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#26704c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Publish Campaign"}
            </button>
          </div>
        </form>
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