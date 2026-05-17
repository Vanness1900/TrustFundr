// src/app/platform-manager/categories/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/use-debounce";
import { Pencil, Trash2 } from "lucide-react";
import {
  createFundraisingCategory,
  listFundraisingCategories,
  searchFundraisingCategories,
  suspendFundraisingCategory,
  updateFundraisingCategory,
  type PlatformCategoryDto,
} from "@/lib/platform-manager-api";

const CATEGORY_TABLE_PAGE_SIZE = 20;

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; category: PlatformCategoryDto };

export default function CategoriesPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [categories, setCategories] = useState<PlatformCategoryDto[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [modalName, setModalName] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [modalBusy, setModalBusy] = useState(false);
  const [categoryPage, setCategoryPage] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setSuspendError(null);

    const q = debouncedSearch.trim();
    const promise =
      q.length > 0
        ? searchFundraisingCategories(token, q)
        : listFundraisingCategories(token);

    promise
      .then((rows) => {
        if (!cancelled) {
          setCategories(rows);
          setCategoryPage(0);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setCategories([]);
          setCategoryPage(0);
          setLoadError(e instanceof Error ? e.message : "Failed to load categories.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, debouncedSearch]);

  const pagedCategories = useMemo(() => {
    const start = categoryPage * CATEGORY_TABLE_PAGE_SIZE;
    return categories.slice(start, start + CATEGORY_TABLE_PAGE_SIZE);
  }, [categories, categoryPage]);

  const categoryTotalPages = Math.max(
    1,
    Math.ceil(categories.length / CATEGORY_TABLE_PAGE_SIZE),
  );

  function openCreate() {
    setModalName("");
    setModalDescription("");
    setNameError("");
    setModal({ type: "create" });
  }

  function openEdit(category: PlatformCategoryDto) {
    setModalName(category.name);
    setModalDescription(category.description ?? "");
    setNameError("");
    setModal({ type: "edit", category });
  }

  function closeModal() {
    setModal({ type: "closed" });
  }

  async function refreshList() {
    if (!token) return;
    const q = debouncedSearch.trim();
    const rows =
      q.length > 0
        ? await searchFundraisingCategories(token, q)
        : await listFundraisingCategories(token);
    setCategories(rows);
  }

  async function handleSubmit() {
    if (!token || modal.type === "closed") return;

    const trimmed = modalName.trim();
    if (!trimmed) {
      setNameError("Category name is required.");
      return;
    }

    setModalBusy(true);
    setNameError("");
    try {
      if (modal.type === "create") {
        await createFundraisingCategory(token, {
          name: trimmed,
          description: modalDescription.trim() || null,
        });
      } else {
        await updateFundraisingCategory(token, modal.category.id, {
          name: trimmed,
          description: modalDescription.trim() || null,
        });
      }
      await refreshList();
      closeModal();
    } catch (e: unknown) {
      setNameError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setModalBusy(false);
    }
  }

  async function handleSuspend(id: string) {
    if (!token) return;
    setSuspendError(null);
    try {
      await suspendFundraisingCategory(token, id);
      await refreshList();
    } catch (e: unknown) {
      setSuspendError(
        e instanceof Error ? e.message : "Failed to suspend category.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="text-sm text-gray-600">Welcome, Platform Manager!</p>
      <h1 className="mt-0.5 text-2xl font-bold text-gray-900">
        Currently Managing
      </h1>

      <div className="mt-6 flex gap-2">
        <button type="button" className="rounded-full bg-[#2F7A55] px-5 py-2 text-sm font-semibold text-white">
          Fundraising Categories
        </button>
        <button
          type="button"
          onClick={() => router.push("/platform-manager/analytics")}
          className="rounded-full border border-[#2F7A55] px-5 py-2 text-sm font-semibold text-[#2F7A55] hover:bg-green-50"
        >
          Analytics
        </button>
      </div>

      <div className="mt-6 flex min-w-0 flex-1 items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setCategoryPage(0);
              setSearch(e.target.value);
            }}
            placeholder="Search categories"
            className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-500 focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20"
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="whitespace-nowrap rounded-lg bg-[#2F7A55] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
        >
          + Create Category
        </button>
      </div>

      {loadError ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      ) : null}

      {suspendError ? (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {suspendError}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                  No categories found.
                </td>
              </tr>
            ) : (
              pagedCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                  <td className="max-w-md truncate px-6 py-4 text-gray-600">
                    {cat.description ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="rounded-full p-2 text-[#2F7A55] transition hover:bg-green-50"
                        aria-label={`Edit category ${cat.name}`}
                        title="Edit"
                      >
                        <Pencil className="size-4" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSuspend(cat.id)}
                        className="rounded-full p-2 text-red-600 transition hover:bg-red-50"
                        aria-label={`Suspend category ${cat.name}`}
                        title="Suspend"
                      >
                        <Trash2 className="size-4" strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && categories.length > CATEGORY_TABLE_PAGE_SIZE ? (
        <nav
          className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Categories pagination"
        >
          <p className="text-sm text-gray-600">
            Page {categoryPage + 1} of {categoryTotalPages} ·{" "}
            {categories.length} categories
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={categoryPage <= 0}
              onClick={() => setCategoryPage((p) => Math.max(0, p - 1))}
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={categoryPage >= categoryTotalPages - 1}
              onClick={() => setCategoryPage((p) => p + 1)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}

      {modal.type !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {modal.type === "create" ? "Create Category" : "Edit Category"}
            </h2>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={modalName}
                onChange={(e) => {
                  setModalName(e.target.value);
                  setNameError("");
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#2F7A55] focus:outline-none focus:ring-1 focus:ring-[#2F7A55]"
                placeholder="e.g. Healthcare"
                autoFocus
              />
              <label className="mt-4 block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                value={modalDescription}
                onChange={(e) => setModalDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#2F7A55] focus:outline-none focus:ring-1 focus:ring-[#2F7A55]"
                placeholder="Short summary"
              />
              {nameError ? (
                <p className="mt-1 text-xs text-red-500">{nameError}</p>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={modalBusy}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={modalBusy}
                className="rounded-lg bg-[#2F7A55] px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
              >
                {modalBusy ? "Saving…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
