// src/app/fundraiser/campaigns/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { createFundraisingActivity } from "@/lib/fundraiser-api";

export default function CreateCampaignPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    const result = await createFundraisingActivity(token, {
      title: title.trim(),
      description: description.trim(),
      goalAmount: parseFloat(goalAmount),
      location: location.trim(),
      category,
    });

    setIsSubmitting(false);

    if (!result) {
      setError("Failed to create campaign. Please try again.");
      return;
    }

    router.push("/fundraiser");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-xl font-bold text-gray-900">Create Campaign</h1>
      <p className="mt-1 text-sm text-gray-500">
        Fill in the details to launch your fundraising campaign.
      </p>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Campaign title"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell your story..."
            rows={5}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">
            Goal Amount ($)
          </label>
          <input
            type="number"
            required
            min="1"
            step="0.01"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="5000"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Location</label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Category</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
          >
            <option value="">Select a category</option>
            <option value="Education">Education</option>
            <option value="Medical">Medical</option>
            <option value="Legal">Legal</option>
            <option value="Community">Community</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-full bg-[#16a34a] py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-50"
          >
            {isSubmitting ? "Creating…" : "Create Campaign"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
