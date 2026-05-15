"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  createFundraisingActivity,
  getFundraisingActivityById,
  getMyFundraisingActivities,
  listFundraiserFundraisingCategories,
  updateFundraisingActivity,
} from "@/lib/fundraiser-api";
import type { FundraiserCategoryOption } from "@/lib/fundraiser-types";

export default function CreateCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const isEditMode = Boolean(editingId);

  const { token, isLoading: isAuthLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isPageLoading, setIsPageLoading] = useState(Boolean(editingId));
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [categories, setCategories] = useState<FundraiserCategoryOption[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Edit-mode initial load only (e.g. campaign not found). */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    category?: string;
    location?: string;
    goalAmount?: string;
    description?: string;
    image?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Raised amount when editing (included on update). */
  const [editCurrentAmount, setEditCurrentAmount] = useState(0);

  useEffect(() => {
    if (isAuthLoading || !token) return;
    let cancelled = false;
    void (async () => {
      setCategoriesError(null);
      try {
        const rows = await listFundraiserFundraisingCategories(token);
        if (!cancelled) setCategories(rows);
      } catch (e: unknown) {
        if (!cancelled) {
          setCategories([]);
          setCategoriesError(
            e instanceof Error
              ? e.message
              : "Could not load categories.",
          );
        }
      } finally {
        if (!cancelled) setCategoriesReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, token]);

  useEffect(() => {
    if (!editingId || isAuthLoading || !token) return;

    const id = editingId;
    let cancelled = false;

    async function loadCampaignForEdit() {
      setIsPageLoading(true);
      setLoadError(null);

      let campaign = null as Awaited<
        ReturnType<typeof getFundraisingActivityById>
      > | null;

      try {
        campaign = await getFundraisingActivityById(token, id);
      } catch {
        try {
          const allRows = await getMyFundraisingActivities(token, "all");
          campaign =
            allRows.find((item) => String(item.id) === String(id)) ?? null;
        } catch {
          campaign = null;
        }
      }

      if (cancelled) return;

      if (!campaign) {
        setLoadError("Campaign not found.");
        setIsPageLoading(false);
        return;
      }

      setTitle(campaign.title ?? "");
      const resolvedCategoryId =
        (campaign.categoryId?.trim() ?? "") ||
        categories.find(
          (c) => c.name === (campaign.category ?? "").trim(),
        )?.id ||
        "";
      setCategoryId(resolvedCategoryId);
      setLocation(campaign.location ?? "");
      setGoalAmount(String(campaign.goalAmount ?? ""));
      setImageUrl(campaign.imageUrl ?? "");
      setDescription(campaign.description ?? "");
      setEditCurrentAmount(
        typeof campaign.currentAmount === "number" ? campaign.currentAmount : 0,
      );
      setIsPageLoading(false);
    }

    void loadCampaignForEdit();

    return () => {
      cancelled = true;
    };
  }, [editingId, isAuthLoading, token, categories]);

  const categoryOptions = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  function handleLocalImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFieldErrors((e) => ({
        ...e,
        image: "Please select a valid image file.",
      }));
      return;
    }

    setFieldErrors((e) => ({ ...e, image: undefined }));

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

    const numericGoalAmount = Number(goalAmount);

    const next: typeof fieldErrors = {};
    if (!title.trim()) next.title = "Campaign title is required.";
    if (!categoryId.trim()) next.category = "Please select a category.";
    if (!location.trim()) next.location = "Location is required.";
    if (!numericGoalAmount || numericGoalAmount <= 0) {
      next.goalAmount = "Target amount must be greater than 0.";
    }
    if (!description.trim()) next.description = "Description is required.";
    if (Object.keys(next).length > 0) {
      setFieldErrors(next);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      categoryId: categoryId.trim(),
      location: location.trim(),
      goalAmount: numericGoalAmount,
      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
    };

    try {
      if (isEditMode && editingId) {
        await updateFundraisingActivity(token, editingId, {
          ...payload,
          currentAmount: editCurrentAmount,
        });
      } else {
        await createFundraisingActivity(token, payload);
      }
      router.push("/fundraiser");
      router.refresh();
    } catch (e: unknown) {
      setSubmitError(
        e instanceof Error
          ? e.message
          : isEditMode
            ? "Failed to update campaign."
            : "Failed to create campaign.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading || isPageLoading || !categoriesReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] px-5 py-8 text-[#0f172a]">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl rounded-[2rem] bg-white px-6 py-8 shadow-sm md:px-10 lg:px-14">
        <button
          type="button"
          onClick={() => router.push("/fundraiser")}
          className="text-sm font-medium text-[#64748b] transition hover:text-[#2F7A55]"
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

        {categoriesError ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {categoriesError}
          </div>
        ) : null}

        {loadError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <section className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-black">
              Campaign Details
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Campaign Title" error={fieldErrors.title}>
                <input
                  value={title}
                  onChange={(event) => {
                    setFieldErrors((e) => ({ ...e, title: undefined }));
                    setTitle(event.target.value);
                  }}
                  placeholder="Enter campaign title"
                  className="w-full rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm outline-none transition focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20"
                />
              </Field>

              <Field label="Category" error={fieldErrors.category}>
                <select
                  value={categoryId}
                  onChange={(event) => {
                    setFieldErrors((e) => ({ ...e, category: undefined }));
                    setCategoryId(event.target.value);
                  }}
                  disabled={categoryOptions.length === 0}
                  className="w-full rounded-2xl border border-[#d7d7d7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20 disabled:cursor-not-allowed disabled:bg-[#f1f5f9] disabled:text-[#94a3b8]"
                >
                  <option value="">
                    {categoryOptions.length === 0
                      ? "No categories available"
                      : "Select a category"}
                  </option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Location" error={fieldErrors.location}>
                <input
                  value={location}
                  onChange={(event) => {
                    setFieldErrors((e) => ({ ...e, location: undefined }));
                    setLocation(event.target.value);
                  }}
                  placeholder="Example: Singapore"
                  className="w-full rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm outline-none transition focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20"
                />
              </Field>

              <Field label="Target Amount" error={fieldErrors.goalAmount}>
                <input
                  type="number"
                  min="1"
                  value={goalAmount}
                  onChange={(event) => {
                    setFieldErrors((e) => ({ ...e, goalAmount: undefined }));
                    setGoalAmount(event.target.value);
                  }}
                  placeholder="Enter target amount"
                  className="w-full rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm outline-none transition focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20"
                />
              </Field>

              <Field label="Campaign Image" error={fieldErrors.image}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageChange}
                  className="w-full rounded-2xl border border-[#d7d7d7] bg-white px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#2F7A55] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:brightness-95"
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

            <Field label="Description" className="mt-5" error={fieldErrors.description}>
              <textarea
                value={description}
                onChange={(event) => {
                  setFieldErrors((e) => ({ ...e, description: undefined }));
                  setDescription(event.target.value);
                }}
                placeholder="Write the campaign story and explain why support is needed."
                rows={8}
                className="w-full resize-none rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20"
              />
            </Field>
          </section>

          {submitError ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
              role="alert"
            >
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/fundraiser")}
              className="rounded-full border border-[#d7d7d7] bg-white px-7 py-3 text-sm font-semibold text-[#0f172a] transition hover:border-[#2F7A55] hover:text-[#2F7A55]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#2F7A55] px-7 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
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
  error,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-[#334155]">
        {label}
      </span>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}