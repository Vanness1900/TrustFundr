"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  createFundraisingCategory,
  currentMonthYm,
  generateDailyReport,
  generateMonthlyReport,
  generateWeeklyReport,
  listFundraisingCategories,
  searchFundraisingCategories,
  suspendFundraisingCategory,
  updateFundraisingCategory,
  utcDayInstantIso,
  utcMondayOfWeek,
  utcSundaySameWeek,
  type FundraisingCategoryRow,
  type PlatformReportRow,
} from "@/lib/platform-api";

const accent = "#2f7a55";

type Tab = "categories" | "analytics";

type ReportGranularity = "daily" | "weekly" | "monthly";

function PencilButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="size-4"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182L8.61 18.103a4.5 4.5 0 0 1-1.897 1.13l-2.62.874.874-2.62a4.5 4.5 0 0 1 1.13-1.897L16.862 3.487Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 4.5 19.5 8.25" />
      </svg>
    </button>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function TabPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-[#2f7a55] bg-[#2f7a55] text-white"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n));
}

function formatInstant(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function PlatformPage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("categories");

  /* —— Categories —— */
  const [categories, setCategories] = useState<FundraisingCategoryRow[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      320,
    );
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!token || tab !== "categories") return;
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (!alive) return;
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const rows =
          debouncedSearch.length > 0
            ? await searchFundraisingCategories(token, debouncedSearch)
            : await listFundraisingCategories(token);
        if (alive) setCategories(rows);
      } catch (e: unknown) {
        if (alive) {
          setCategoriesError(
            e instanceof Error ? e.message : "Request failed.",
          );
          setCategories([]);
        }
      } finally {
        if (alive) setCategoriesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, tab, debouncedSearch]);

  function openCreate() {
    setModalMode("create");
    setEditingId(null);
    setDraftName("");
    setDraftDescription("");
    setModalError(null);
    setModalOpen(true);
  }

  function openEdit(row: FundraisingCategoryRow) {
    setModalMode("edit");
    setEditingId(row.id);
    setDraftName(row.name);
    setDraftDescription(row.description ?? "");
    setModalError(null);
    setModalOpen(true);
  }

  async function submitModal(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const name = draftName.trim();
    if (!name) {
      setModalError("Name is required.");
      return;
    }
    setModalSaving(true);
    setModalError(null);
    try {
      if (modalMode === "create") {
        await createFundraisingCategory(token, {
          name,
          description: draftDescription.trim() || undefined,
        });
      } else if (editingId) {
        await updateFundraisingCategory(token, editingId, {
          name,
          description: draftDescription.trim() || undefined,
        });
      }
      setModalOpen(false);
      setSearchInput("");
      const rows =
        debouncedSearch.length > 0
          ? await searchFundraisingCategories(token, debouncedSearch)
          : await listFundraisingCategories(token);
      setCategories(rows);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setModalSaving(false);
    }
  }

  async function handleSuspend(row: FundraisingCategoryRow) {
    if (!token) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Suspend category "${row.name}"? It will no longer be available for new campaigns.`,
      )
    ) {
      return;
    }
    try {
      await suspendFundraisingCategory(token, row.id);
      const rows =
        debouncedSearch.length > 0
          ? await searchFundraisingCategories(token, debouncedSearch)
          : await listFundraisingCategories(token);
      setCategories(rows);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Could not suspend this category.";
      if (typeof window !== "undefined") window.alert(msg);
    }
  }

  /* —— Analytics —— */
  const [granularity, setGranularity] =
    useState<ReportGranularity>("daily");
  const [dailyDate, setDailyDate] = useState(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  });
  const [monthValue, setMonthValue] = useState(currentMonthYm);
  const [report, setReport] = useState<PlatformReportRow | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const reportRows = useMemo(() => {
    if (!report) return [];
    return [
      { metric: "Period start", value: formatInstant(report.startAt) },
      { metric: "Period end", value: formatInstant(report.endAt) },
      {
        metric: "New fundraising activities",
        value: String(report.newFundraisingActivities),
      },
      {
        metric: "Completed fundraising activities",
        value: String(report.completedFundraisingActivities),
      },
      { metric: "Total donations", value: String(report.totalDonations) },
      {
        metric: "Total donation amount",
        value: formatMoney(Number(report.totalDonationAmount ?? 0)),
      },
      { metric: "Total views", value: String(report.totalViews) },
      {
        metric: "Total favourites",
        value: String(report.totalFavourites),
      },
    ];
  }, [report]);

  async function handleGenerateReport() {
    if (!token) return;
    setReportError(null);
    setReportLoading(true);
    try {
      let data: PlatformReportRow;
      if (granularity === "daily") {
        const parts = dailyDate.split("-").map(Number);
        const day = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        data = await generateDailyReport(token, utcDayInstantIso(day));
      } else if (granularity === "weekly") {
        const today = new Date();
        const mon = utcMondayOfWeek(today);
        const sun = utcSundaySameWeek(mon);
        data = await generateWeeklyReport(
          token,
          utcDayInstantIso(mon),
          utcDayInstantIso(sun),
        );
      } else {
        data = await generateMonthlyReport(token, monthValue);
      }
      setReport(data);
    } catch (e: unknown) {
      setReport(null);
      setReportError(e instanceof Error ? e.message : "Report failed.");
    } finally {
      setReportLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="text-sm text-gray-600">Welcome, Platform Manager!</p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900">Currently Managing</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <TabPill
          active={tab === "categories"}
          onClick={() => setTab("categories")}
        >
          Fundraising Categories
        </TabPill>
        <TabPill active={tab === "analytics"} onClick={() => setTab("analytics")}>
          Analytics
        </TabPill>

        <div className="ml-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </div>

      {tab === "categories" ? (
        <>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Start searching Categories"
                className="w-full rounded-full border border-gray-300 bg-white py-2 pl-8 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2f7a55] focus:ring-2 focus:ring-[#2f7a55]/20"
              />
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#2f7a55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286a4a]"
            >
              + Create Category
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
            {categoriesError ? (
              <div className="bg-white px-4 py-3 text-sm text-red-700">
                {categoriesError}
              </div>
            ) : null}
            {categoriesLoading ? (
              <div className="flex justify-center py-16 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f7a55] border-t-transparent" />
              </div>
            ) : (
              <div className="max-h-[300px] overflow-auto bg-gray-100">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr>
                      <th className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Name
                      </th>
                      <th className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Description
                      </th>
                      <th className="border-b border-gray-200 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td
                          className="bg-white px-4 py-10 text-center text-gray-500"
                          colSpan={3}
                        >
                          No categories found.
                        </td>
                      </tr>
                    ) : (
                      categories.map((row) => (
                        <tr
                          key={row.id}
                          className="bg-white last:border-0"
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-2">
                              <PencilButton
                                label={`Edit ${row.name}`}
                                onClick={() => openEdit(row)}
                              />
                              <span className="font-medium text-gray-900">{row.name}</span>
                            </div>
                          </td>
                          <td className="max-w-md px-4 py-3 text-gray-700">
                            {row.description ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleSuspend(row)}
                              className="text-sm font-semibold text-red-700 hover:underline"
                            >
                              Suspend
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
            {reportError ? (
              <div className="bg-white px-4 py-3 text-sm text-red-700">
                {reportError}
              </div>
            ) : null}
            {reportLoading ? (
              <div className="flex justify-center py-20 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f7a55] border-t-transparent" />
              </div>
            ) : report ? (
              <div className="max-h-[300px] overflow-auto bg-gray-100">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr>
                      <th className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Metric
                      </th>
                      <th className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((r) => (
                      <tr
                        key={r.metric}
                        className="bg-white last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                          {r.metric}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="bg-white py-16 text-center text-sm text-gray-500">
                Select a reporting period below and tap &quot;Generate
                Report&quot; to load statistics for this dashboard.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-end">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              {granularity === "daily" ? (
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="shrink-0">Date</span>
                  <input
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className="rounded-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2D6A4F]"
                  />
                </label>
              ) : null}
              {granularity === "monthly" ? (
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="shrink-0">Month</span>
                  <input
                    type="month"
                    value={monthValue}
                    onChange={(e) => setMonthValue(e.target.value)}
                    className="rounded-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2D6A4F]"
                  />
                </label>
              ) : null}
              <label className="sr-only" htmlFor="report-granularity">
                Report granularity
              </label>
              <select
                id="report-granularity"
                value={granularity}
                onChange={(e) =>
                  setGranularity(e.target.value as ReportGranularity)
                }
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 outline-none focus:border-[#2f7a55]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={reportLoading || !token}
              className="rounded-full bg-[#2f7a55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286a4a] disabled:opacity-50"
            >
              + Generate Report
            </button>
          </div>
        </>
      )}

      {/* Create / Edit modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-gray-900">
              {modalMode === "create"
                ? "Create category"
                : "Edit category"}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={submitModal}>
              {modalError ? (
                <p className="text-sm text-red-600">{modalError}</p>
              ) : null}
              <div>
                <label
                  htmlFor="cat-name"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                  Name
                </label>
                <input
                  id="cat-name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2D6A4F]"
                  maxLength={255}
                  disabled={modalSaving}
                />
              </div>
              <div>
                <label
                  htmlFor="cat-desc"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                  Description
                </label>
                <textarea
                  id="cat-desc"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2D6A4F]"
                  disabled={modalSaving}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={modalSaving}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  {modalSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
