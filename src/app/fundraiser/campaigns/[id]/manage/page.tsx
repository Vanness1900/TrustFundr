"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  getFundraisingActivityById,
  getMyFundraisingActivities,
  listFundraiserFundraisingCategories,
  suspendFundraisingActivity,
  updateFundraisingActivity,
} from "@/lib/fundraiser-api";
import type {
  FundraiserCategoryOption,
  FundraisingActivity,
} from "@/lib/fundraiser-types";

export default function CampaignManagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, isLoading: isAuthLoading, user } = useAuth();

  const [campaign, setCampaign] = useState<FundraisingActivity | null>(null);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [categories, setCategories] = useState<FundraiserCategoryOption[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  /** Initial load when campaign is missing or request fails. */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    category?: string;
    location?: string;
    goalAmount?: string;
    description?: string;
    image?: string;
  }>({});
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const organiserName = useMemo(() => {
    return user?.fullName || user?.username || "Fundraiser";
  }, [user]);

  const categoryOptions = useMemo(() => {
    const list = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    if (
      categoryId &&
      !list.some((c) => c.id === categoryId) &&
      (campaign?.category ?? "").trim()
    ) {
      list.push({
        id: categoryId,
        name: campaign!.category!.trim(),
        description: null,
      });
    }
    return list;
  }, [categories, categoryId, campaign?.category]);

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
    if (isAuthLoading) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadCampaign() {
      setIsLoading(true);
      setLoadError(null);

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
          setLoadError("Campaign not found.");
          return;
        }

        setCampaign(data);
        setTitle(data.title ?? "");
        const resolvedCategoryId =
          (data.categoryId?.trim() ?? "") ||
          categories.find((c) => c.name === (data.category ?? "").trim())
            ?.id ||
          "";
        setCategoryId(resolvedCategoryId);
        setLocation(data.location ?? "");
        setGoalAmount(String(data.goalAmount ?? ""));
        setImageUrl(data.imageUrl ?? "");
        setDescription(data.description ?? "");
      } catch {
        if (cancelled) return;

        setCampaign(null);
        setLoadError("Failed to load campaign.");
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
  }, [isAuthLoading, params.id, router, token, categories]);

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

    if (!campaign) return;

    setSuccessMessage(null);
    setFormSubmitError(null);

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
      return;
    }

    setFieldErrors({});
    setIsSaving(true);

    try {
      const updated = await updateFundraisingActivity(token, campaign.id, {
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId.trim(),
        location: location.trim(),
        goalAmount: numericGoalAmount,
        currentAmount: campaign.currentAmount,
        imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      });

      setCampaign(updated);
      setTitle(updated.title ?? "");
      const nextCatId =
        (updated.categoryId?.trim() ?? "") ||
        categories.find((c) => c.name === (updated.category ?? "").trim())
          ?.id ||
        "";
      setCategoryId(nextCatId);
      setLocation(updated.location ?? "");
      setGoalAmount(String(updated.goalAmount ?? ""));
      setImageUrl(updated.imageUrl ?? "");
      setDescription(updated.description ?? "");
      setSuccessMessage("Campaign updated successfully.");
    } catch (e: unknown) {
      setFormSubmitError(
        e instanceof Error ? e.message : "Failed to update campaign.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSuspendCampaign() {
    if (!campaign || !token) return;

    setSuspendError(null);

    try {
      await suspendFundraisingActivity(token, campaign.id);
      setSuspendError(null);
      setSuccessMessage("Campaign suspended.");
      router.push("/fundraiser");
    } catch (e: unknown) {
      setSuspendError(
        e instanceof Error ? e.message : "Failed to suspend campaign.",
      );
    }
  }

  const currentAmount = campaign?.currentAmount ?? 0;
  const numericGoal = Number(goalAmount) || 0;
  const progress =
    numericGoal > 0 ? Math.min((currentAmount / numericGoal) * 100, 100) : 0;

  if (isAuthLoading || isLoading || !categoriesReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
      </main>
    );
  }

  if (loadError && !campaign) {
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

          <h1 className="mt-8 text-2xl font-extrabold text-black">{loadError}</h1>
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
          className="text-sm font-medium text-[#64748b] transition hover:text-[#2F7A55]"
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
            className="rounded-full border border-[#d7d7d7] bg-white px-6 py-2 text-sm font-semibold text-[#0f172a] transition hover:border-[#2F7A55] hover:text-[#2F7A55]"
          >
            View Page
          </button>
        </div>

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-[#b8dfc9] bg-[#eaf5ef] px-5 py-4 text-sm text-[#2F7A55]">
            {successMessage}
          </div>
        ) : null}

        {categoriesError ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {categoriesError}
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

              <Field label="Campaign Image" className="md:col-span-2" error={fieldErrors.image}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageChange}
                  className="w-full rounded-2xl border border-[#d7d7d7] bg-white px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#2F7A55] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:brightness-95"
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
                    {categoryOptions.find((c) => c.id === categoryId)?.name ||
                      campaign?.category ||
                      "No category"}
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

            <Field label="Description" className="mt-5" error={fieldErrors.description}>
              <textarea
                value={description}
                onChange={(event) => {
                  setFieldErrors((e) => ({ ...e, description: undefined }));
                  setDescription(event.target.value);
                }}
                placeholder="Write the campaign story and explain why support is needed."
                rows={10}
                className="w-full resize-none rounded-2xl border border-[#d7d7d7] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20"
              />
            </Field>

            {formSubmitError ? (
              <div
                className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {formSubmitError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/fundraiser")}
                className="rounded-full border border-[#d7d7d7] bg-white px-7 py-3 text-sm font-semibold text-[#0f172a] transition hover:border-[#2F7A55] hover:text-[#2F7A55]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-[#2F7A55] px-7 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
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
              <h2 className="text-lg font-extrabold text-[#2F7A55]">
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
                The campaign will no longer appear in public lists.
              </p>

              {suspendError ? (
                <p className="mt-3 text-sm text-red-600" role="alert">
                  {suspendError}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void handleSuspendCampaign()}
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

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-[#f6f7f6] px-4 py-4">
      <p className="text-xl font-extrabold text-[#2F7A55]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#647067]">{label}</p>
    </div>
  );
}