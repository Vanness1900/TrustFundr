// src/app/fundraiser/campaigns/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  getFundraisingActivityById,
  updateFundraisingActivity,
} from "@/lib/fundraiser-api";
import { DUMMY_CAMPAIGNS } from "@/lib/fundraiser-dummy";
import type { FundraisingActivity } from "@/lib/fundraiser-types";

type Tab = "donate" | "updates" | "settings" | "connect";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [campaign, setCampaign] = useState<FundraisingActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("donate");

  // Settings form state
  const [settingsTitle, setSettingsTitle] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [settingsGoal, setSettingsGoal] = useState("");
  const [settingsLocation, setSettingsLocation] = useState("");
  const [settingsCategory, setSettingsCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Updates tab state
  const [updateText, setUpdateText] = useState("");
  const [updates, setUpdates] = useState<string[]>([]);

  useEffect(() => {
    if (!token || !id) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getFundraisingActivityById(token, id).then((data) => {
      if (cancelled) return;
      const resolved = data ?? DUMMY_CAMPAIGNS.find((c) => c.id === id) ?? null;
      if (!resolved) {
        setError("Campaign not found.");
      } else {
        setCampaign(resolved);
        setSettingsTitle(resolved.title);
        setSettingsDescription(resolved.description);
        setSettingsGoal(String(resolved.goalAmount));
        setSettingsLocation(resolved.location);
        setSettingsCategory(resolved.category);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [token, id]);

  async function handleSaveSettings() {
    if (!token || !id) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const updated = await updateFundraisingActivity(token, id, {
      title: settingsTitle,
      description: settingsDescription,
      goalAmount: parseFloat(settingsGoal),
      location: settingsLocation,
      category: settingsCategory,
    });

    setIsSaving(false);
    if (!updated) {
      setSaveError("Failed to save changes. Please try again.");
    } else {
      setCampaign(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }

  function handlePostUpdate() {
    const text = updateText.trim();
    if (!text) return;
    setUpdates((prev) => [text, ...prev]);
    setUpdateText("");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#16a34a] border-t-transparent" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Campaign not found."}
        </div>
        <button
          type="button"
          onClick={() => router.push("/fundraiser")}
          className="mt-4 text-sm text-[#16a34a] underline"
        >
          ← Back to dashboard
        </button>
      </div>
    );
  }

  const progress =
    campaign.goalAmount > 0
      ? Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)
      : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push("/fundraiser")}
        className="mb-6 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to dashboard
      </button>

      {/* Campaign header */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Image */}
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-gray-200">
          {campaign.imageUrl ? (
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.2}
                stroke="currentColor"
                className="size-16 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Title + stats bar */}
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{campaign.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {campaign.category} · {campaign.location}
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <StatBox label="All Views" value={campaign.viewCount} />
            <StatBox label="Favourites" value={campaign.favouriteCount} />
            <StatBox label="Status" value={campaign.status} />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mt-6 flex gap-1 rounded-full border border-gray-200 bg-gray-50 p-1 w-fit">
        {(["donate", "updates", "settings", "connect"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
              activeTab === tab
                ? "bg-[#16a34a] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            ].join(" ")}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="mt-6">
        {/* Donate tab */}
        {activeTab === "donate" ? (
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-gray-200 bg-white p-8">
            {/* Progress circle */}
            <div className="relative flex h-40 w-40 items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                  strokeDasharray={`${progress} ${100 - progress}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-2xl font-bold text-gray-900">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                ${campaign.currentAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                raised of ${campaign.goalAmount.toLocaleString()} goal
              </p>
            </div>

            <button
              type="button"
              className="rounded-full bg-[#16a34a] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d]"
            >
              Donate Now
            </button>
          </div>
        ) : null}

        {/* Updates tab */}
        {activeTab === "updates" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Post an Update</h2>
            <textarea
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="Share progress with your donors..."
              rows={4}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
            />
            <button
              type="button"
              onClick={handlePostUpdate}
              disabled={!updateText.trim()}
              className="mt-3 rounded-full bg-[#16a34a] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-50"
            >
              Post Update
            </button>

            {updates.length > 0 ? (
              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Past Updates
                </h3>
                {updates.map((u, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-800"
                  >
                    {u}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-gray-400">No updates posted yet.</p>
            )}
          </div>
        ) : null}

        {/* Settings tab */}
        {activeTab === "settings" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-sm font-semibold text-gray-900">Campaign Settings</h2>

            {saveError ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            ) : null}

            {saveSuccess ? (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Changes saved successfully!
              </div>
            ) : null}

            <div className="space-y-4">
              <FormField label="Title">
                <input
                  type="text"
                  value={settingsTitle}
                  onChange={(e) => setSettingsTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  value={settingsDescription}
                  onChange={(e) => setSettingsDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                />
              </FormField>

              <FormField label="Goal Amount ($)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settingsGoal}
                  onChange={(e) => setSettingsGoal(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                />
              </FormField>

              <FormField label="Location">
                <input
                  type="text"
                  value={settingsLocation}
                  onChange={(e) => setSettingsLocation(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                />
              </FormField>

              <FormField label="Category">
                <select
                  value={settingsCategory}
                  onChange={(e) => setSettingsCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
                >
                  <option value="">Select category</option>
                  <option value="Education">Education</option>
                  <option value="Medical">Medical</option>
                  <option value="Legal">Legal</option>
                  <option value="Community">Community</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="mt-6 rounded-full bg-[#16a34a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        ) : null}

        {/* Connect tab */}
        {activeTab === "connect" ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
            <p className="text-sm text-gray-400">Coming soon</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}
