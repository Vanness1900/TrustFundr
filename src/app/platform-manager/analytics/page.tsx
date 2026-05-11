// src/app/platform-manager/analytics/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  generateDailyReport,
  generateMonthlyReport,
  generateWeeklyReport,
  type PlatformReportDto,
  type PlatformReportDonationRow,
} from "@/lib/platform-manager-api";

type PeriodKind = "Daily" | "Weekly" | "Monthly";

function utcYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addUtcDays(ymd: string, deltaDays: number): string {
  const [y, mo, da] = ymd.split("-").map(Number);
  const t = Date.UTC(y, mo - 1, da) + deltaDays * 86400000;
  return utcYmd(new Date(t));
}

/** Inclusive UTC calendar days in the weekly report; backend window is [start, end] inclusive. */
const WEEKLY_INCLUSIVE_DAY_SPAN = 6;

function utcMonthString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function donationAmount(reported: unknown): number {
  if (reported == null) return 0;
  if (typeof reported === "number") return reported;
  if (typeof reported === "string") {
    const n = Number.parseFloat(reported);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatRangeLabel(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return "—";
  const start = new Date(startIso);
  const endExclusive = new Date(endIso);
  const endInclusive = new Date(endExclusive.getTime() - 1);
  const opts: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeZone: "UTC",
  };
  return `${start.toLocaleDateString("en-US", opts)} → ${endInclusive.toLocaleDateString("en-US", opts)} (UTC)`;
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function rowAmount(row: PlatformReportDonationRow): number {
  return donationAmount(row.amount);
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { token } = useAuth();

  const today = utcYmd(new Date());
  const [periodKind, setPeriodKind] = useState<PeriodKind>("Daily");
  const [dailyDate, setDailyDate] = useState(today);
  const [weeklyStart, setWeeklyStart] = useState(() => addUtcDays(today, -6));
  const [weeklyEnd, setWeeklyEnd] = useState(today);
  const [monthYear, setMonthYear] = useState(() => utcMonthString(new Date()));

  const [report, setReport] = useState<PlatformReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!token) return;
    setRangeError(null);
    setFetchError(null);

    setLoading(true);
    try {
      let r: PlatformReportDto;
      if (periodKind === "Daily") {
        const iso = `${dailyDate}T00:00:00.000Z`;
        r = await generateDailyReport(token, iso);
      } else if (periodKind === "Weekly") {
        const startIso = `${weeklyStart}T00:00:00.000Z`;
        const endIso = `${weeklyEnd}T00:00:00.000Z`;
        r = await generateWeeklyReport(token, startIso, endIso);
      } else {
        r = await generateMonthlyReport(token, monthYear);
      }
      setReport(r);
    } catch (e: unknown) {
      setReport(null);
      setFetchError(e instanceof Error ? e.message : "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [
    token,
    periodKind,
    dailyDate,
    weeklyStart,
    weeklyEnd,
    monthYear,
  ]);

  const loadReportRef = useRef(loadReport);
  loadReportRef.current = loadReport;

  useEffect(() => {
    if (!token) return;
    void loadReportRef.current();
  }, [token]);

  const totalDonations = report?.totalDonations ?? 0;
  const totalAmount = donationAmount(report?.totalDonationAmount);
  const newActs = report?.newFundraisingActivities ?? 0;
  const completedActs = report?.completedFundraisingActivities ?? 0;
  const views = report?.totalViews ?? 0;
  const favs = report?.totalFavourites ?? 0;
  const topRows = report?.topDonations ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="text-sm text-gray-600">Welcome, Platform Manager!</p>
      <h1 className="mt-0.5 text-2xl font-bold text-gray-900">
        Currently Managing
      </h1>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/platform-manager/categories")}
          className="rounded-full border border-[#2F7A55] px-5 py-2 text-sm font-semibold text-[#2F7A55] hover:bg-green-50"
        >
          Fundraising Categories
        </button>
        <button
          type="button"
          className="rounded-full bg-[#2F7A55] px-5 py-2 text-sm font-semibold text-white"
        >
          Analytics
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900">
            Platform reports — <span className="text-[#2F7A55]">{periodKind}</span>
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Pick the period and dates (UTC), then load the report.
          </p>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
              Report type
              <select
                value={periodKind}
                onChange={(e) => {
                  const next = e.target.value as PeriodKind;
                  setPeriodKind(next);
                  const t = utcYmd(new Date());
                  if (next === "Daily") setDailyDate(t);
                  if (next === "Weekly") {
                    setWeeklyStart(addUtcDays(t, -6));
                    setWeeklyEnd(t);
                  }
                  if (next === "Monthly") setMonthYear(utcMonthString(new Date()));
                }}
                className="min-w-[8rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#2F7A55] focus:outline-none focus:ring-1 focus:ring-[#2F7A55]"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </label>

            {periodKind === "Daily" ? (
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Calendar day (UTC)
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#2F7A55] focus:outline-none focus:ring-1 focus:ring-[#2F7A55]"
                />
              </label>
            ) : null}

            {periodKind === "Weekly" ? (
              <>
                <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                  Range start (UTC)
                  <input
                    type="date"
                    value={weeklyStart}
                    onChange={(e) => {
                      const start = e.target.value;
                      setWeeklyStart(start);
                      setWeeklyEnd(addUtcDays(start, WEEKLY_INCLUSIVE_DAY_SPAN));
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#2F7A55] focus:outline-none focus:ring-1 focus:ring-[#2F7A55]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                  Range end (UTC)
                  <input
                    type="date"
                    value={weeklyEnd}
                    onChange={(e) => {
                      const end = e.target.value;
                      setWeeklyEnd(end);
                      setWeeklyStart(addUtcDays(end, -WEEKLY_INCLUSIVE_DAY_SPAN));
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#2F7A55] focus:outline-none focus:ring-1 focus:ring-[#2F7A55]"
                  />
                </label>
              </>
            ) : null}

            {periodKind === "Monthly" ? (
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Month (UTC)
                <input
                  type="month"
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#2F7A55] focus:outline-none focus:ring-1 focus:ring-[#2F7A55]"
                />
              </label>
            ) : null}

            <div className="flex flex-wrap gap-2 pb-0.5">
              <button
                type="button"
                onClick={() => void loadReport()}
                disabled={loading || !token}
                className="rounded-lg bg-[#2F7A55] px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load report"}
              </button>
            </div>
          </div>

          {rangeError ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {rangeError}
            </p>
          ) : null}
        </div>

        <div className="px-6 py-5">
          {fetchError ? (
            <p className="text-center text-sm text-red-600">{fetchError}</p>
          ) : loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
            </div>
          ) : !report ? (
            <p className="text-center text-sm text-gray-600">Sign in as platform manager to view reports.</p>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Reporting window:</span>{" "}
                {formatRangeLabel(report.startAt, report.endAt)}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard label="Donation count" value={String(totalDonations)} />
                <KpiCard label="Donation total" value={formatMoney(totalAmount)} />
                <KpiCard label="New campaigns (created in window)" value={String(newActs)} />
                <KpiCard label="Completed campaigns (completed in window)" value={String(completedActs)} />
                <KpiCard label="Views (on campaigns created in window)" value={String(views)} />
                <KpiCard label="Favourites (on campaigns created in window)" value={String(favs)} />
              </div>

              <h3 className="mt-8 text-sm font-semibold text-gray-900">
                Largest donations in this period
              </h3>

              <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Campaign</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Donated (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {topRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          No donations in this period.
                        </td>
                      </tr>
                    ) : (
                      topRows.map((row, idx) => (
                        <tr key={`${row.donatedAt}-${idx}`} className="hover:bg-gray-50/80">
                          <td className="max-w-xs truncate px-4 py-3 font-medium text-gray-900">
                            {row.fundraisingActivityTitle}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                            {formatMoney(rowAmount(row))}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                            {new Date(row.donatedAt).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: "UTC",
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
