// src/app/platform-manager/categories/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

type Category = {
  id: number;
  name: string;
  status: "Active" | "Suspended";
  campaignCount: number;
};

const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: "Medical", status: "Active", campaignCount: 12 },
  { id: 2, name: "Education", status: "Active", campaignCount: 8 },
  { id: 3, name: "Community", status: "Active", campaignCount: 15 },
  { id: 4, name: "Environment", status: "Active", campaignCount: 5 },
  { id: 5, name: "Animal Welfare", status: "Suspended", campaignCount: 3 },
  { id: 6, name: "Disaster Relief", status: "Active", campaignCount: 9 },
  { id: 7, name: "Sports", status: "Suspended", campaignCount: 2 },
  { id: 8, name: "Arts & Culture", status: "Active", campaignCount: 6 },
];

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; category: Category };

export default function CategoriesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [modalName, setModalName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nextId, setNextId] = useState(INITIAL_CATEGORIES.length + 1);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setModalName("");
    setNameError("");
    setModal({ type: "create" });
  }

  function openEdit(category: Category) {
    setModalName(category.name);
    setNameError("");
    setModal({ type: "edit", category });
  }

  function closeModal() {
    setModal({ type: "closed" });
  }

  function handleSubmit() {
    const snapshot = modal;
    if (snapshot.type === "closed") return;

    const trimmed = modalName.trim();
    if (!trimmed) {
      setNameError("Category name is required.");
      return;
    }

    const editId = snapshot.type === "edit" ? snapshot.category.id : null;
    const duplicate = categories.some(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        (editId === null || c.id !== editId),
    );
    if (duplicate) {
      setNameError("A category with this name already exists.");
      return;
    }

    if (snapshot.type === "create") {
      setCategories((prev) => [
        ...prev,
        { id: nextId, name: trimmed, status: "Active", campaignCount: 0 },
      ]);
      setNextId((n) => n + 1);
    } else {
      const targetId = snapshot.category.id;
      setCategories((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, name: trimmed } : c)),
      );
    }
    closeModal();
  }

  function toggleStatus(id: number) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "Active" ? "Suspended" : "Active" }
          : c,
      ),
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Page heading */}
      <p className="text-sm text-gray-500">Welcome, Platform Manager!</p>
      <h1 className="mt-0.5 text-2xl font-bold text-gray-900">
        Currently Managing
      </h1>

      {/* Tab pills */}
      <div className="mt-6 flex gap-2">
        <button className="rounded-full bg-[#18543E] px-5 py-2 text-sm font-semibold text-white">
          Fundraising Categories
        </button>
        <button
          onClick={() => router.push("/platform-manager/analytics")}
          className="rounded-full border border-[#18543E] px-5 py-2 text-sm font-semibold text-[#18543E] hover:bg-green-50"
        >
          Analytics
        </button>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Start searching Categories"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#16a34a] focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
        />
        <button
          onClick={openCreate}
          className="whitespace-nowrap rounded-lg bg-[#18543E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16a34a]"
        >
          + Create Category
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">No. of Campaigns</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-gray-400"
                >
                  No categories found.
                </td>
              </tr>
            ) : (
              filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                        cat.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {cat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {cat.campaignCount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-sm font-medium text-[#18543E] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleStatus(cat.id)}
                        className={`text-sm font-medium hover:underline ${
                          cat.status === "Active"
                            ? "text-red-600"
                            : "text-green-700"
                        }`}
                      >
                        {cat.status === "Active" ? "Suspend" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal.type !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {modal.type === "create" ? "Create Category" : "Edit Category"}
            </h2>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={modalName}
                onChange={(e) => {
                  setModalName(e.target.value);
                  setNameError("");
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#16a34a] focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
                placeholder="e.g. Healthcare"
                autoFocus
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-500">{nameError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-[#18543E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16a34a]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
