const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";

type ApiError = { message?: string };

function authHeaders(token: string, json = false): HeadersInit {
  const h: HeadersInit = { Authorization: `Bearer ${token}` };
  if (json) {
    (h as Record<string, string>)["Content-Type"] = "application/json";
  }
  return h;
}

async function parseOrThrow<T>(
  res: Response,
  fallbackMessage: string,
): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  const err: ApiError = await res.json().catch(() => ({}));
  throw new Error(err.message || fallbackMessage);
}

const CAT_BASE = `${DEFAULT_BASE_URL}/api/platform-management/fundraising-categories`;
const REP_BASE = `${DEFAULT_BASE_URL}/api/platform-management/reports`;

export type FundraisingCategoryRow = {
  id: string;
  name: string;
  description?: string | null;
};

export type PlatformReportRow = {
  startAt: string;
  endAt: string;
  newFundraisingActivities: number;
  completedFundraisingActivities: number;
  totalDonations: number;
  totalDonationAmount: number;
  totalViews: number;
  totalFavourites: number;
};

export async function listFundraisingCategories(
  token: string,
): Promise<FundraisingCategoryRow[]> {
  const res = await fetch(
    `${CAT_BASE}/view-fundraising-categories`,
    { headers: authHeaders(token) },
  );
  return parseOrThrow(res, "Failed to load categories.");
}

export async function searchFundraisingCategories(
  token: string,
  q: string,
): Promise<FundraisingCategoryRow[]> {
  const params = new URLSearchParams({ q: q.trim() });
  const res = await fetch(
    `${CAT_BASE}/search-fundraising-categories?${params}`,
    { headers: authHeaders(token) },
  );
  return parseOrThrow(res, "Search failed.");
}

export async function createFundraisingCategory(
  token: string,
  body: { name: string; description?: string | null },
): Promise<FundraisingCategoryRow> {
  const res = await fetch(`${CAT_BASE}/create-fundraising-category`, {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(body),
  });
  return parseOrThrow(res, "Failed to create category.");
}

export async function updateFundraisingCategory(
  token: string,
  id: string,
  body: { name: string; description?: string | null },
): Promise<FundraisingCategoryRow> {
  const res = await fetch(
    `${CAT_BASE}/update-fundraising-category/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: authHeaders(token, true),
      body: JSON.stringify(body),
    },
  );
  return parseOrThrow(res, "Failed to update category.");
}

export async function suspendFundraisingCategory(
  token: string,
  id: string,
): Promise<FundraisingCategoryRow> {
  const res = await fetch(
    `${CAT_BASE}/suspend-fundraising-category/${encodeURIComponent(id)}`,
    { method: "POST", headers: authHeaders(token) },
  );
  return parseOrThrow(res, "Failed to suspend category.");
}

export async function generateDailyReport(
  token: string,
  dateIso: string,
): Promise<PlatformReportRow> {
  const params = new URLSearchParams({ date: dateIso });
  const res = await fetch(
    `${REP_BASE}/generate-daily-report?${params}`,
    { headers: authHeaders(token) },
  );
  return parseOrThrow(res, "Failed to generate daily report.");
}

export async function generateWeeklyReport(
  token: string,
  startDateIso: string,
  endDateIso: string,
): Promise<PlatformReportRow> {
  const params = new URLSearchParams({
    startDate: startDateIso,
    endDate: endDateIso,
  });
  const res = await fetch(
    `${REP_BASE}/generate-weekly-report?${params}`,
    { headers: authHeaders(token) },
  );
  return parseOrThrow(res, "Failed to generate weekly report.");
}

export async function generateMonthlyReport(
  token: string,
  month: string,
): Promise<PlatformReportRow> {
  const params = new URLSearchParams({ month });
  const res = await fetch(
    `${REP_BASE}/generate-monthly-report?${params}`,
    { headers: authHeaders(token) },
  );
  return parseOrThrow(res, "Failed to generate monthly report.");
}

/** UTC calendar day start as ISO-8601 Instant string */
export function utcDayInstantIso(d: Date): string {
  const t = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    0,
    0,
    0,
    0,
  );
  return new Date(t).toISOString();
}

/** Monday (UTC) of the week containing `d`, as date at UTC midnight */
export function utcMondayOfWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const t = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + diff,
    0,
    0,
    0,
    0,
  );
  return new Date(t);
}

/** Sunday (UTC) of the same week as `mondayUtc` (pass Monday from utcMondayOfWeek) */
export function utcSundaySameWeek(mondayUtc: Date): Date {
  const t = Date.UTC(
    mondayUtc.getUTCFullYear(),
    mondayUtc.getUTCMonth(),
    mondayUtc.getUTCDate() + 6,
    0,
    0,
    0,
    0,
  );
  return new Date(t);
}

export function currentMonthYm(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
