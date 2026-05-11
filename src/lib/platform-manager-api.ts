const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";

const CATEGORIES_PREFIX =
  `${API_BASE_URL}/api/platform-management/fundraising-categories`;
const REPORTS_PREFIX = `${API_BASE_URL}/api/platform-management/reports`;

function headers(token?: string | null): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return h;
}

async function parseOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: fallback }));
    throw new Error((err as { message?: string }).message || fallback);
  }
  return (await res.json()) as T;
}

export type PlatformCategoryDto = {
  id: string;
  name: string;
  description?: string | null;
};

export async function listFundraisingCategories(
  token: string | null | undefined,
): Promise<PlatformCategoryDto[]> {
  const res = await fetch(
    `${CATEGORIES_PREFIX}/view-fundraising-categories`,
    {
      headers: headers(token),
    },
  );
  return parseOrThrow<PlatformCategoryDto[]>(
    res,
    "Failed to load fundraising categories.",
  );
}

export async function searchFundraisingCategories(
  token: string | null | undefined,
  q: string,
): Promise<PlatformCategoryDto[]> {
  const url = new URL(`${CATEGORIES_PREFIX}/search-fundraising-categories`);
  url.searchParams.set("q", q);
  const res = await fetch(url.toString(), { headers: headers(token) });
  return parseOrThrow<PlatformCategoryDto[]>(
    res,
    "Failed to search fundraising categories.",
  );
}

export async function createFundraisingCategory(
  token: string | null | undefined,
  body: { name: string; description?: string | null },
): Promise<PlatformCategoryDto> {
  const res = await fetch(`${CATEGORIES_PREFIX}/create-fundraising-category`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      name: body.name.trim(),
      description: body.description ?? "",
    }),
  });
  return parseOrThrow<PlatformCategoryDto>(
    res,
    "Failed to create category.",
  );
}

export async function updateFundraisingCategory(
  token: string | null | undefined,
  id: string,
  body: { name: string; description?: string | null },
): Promise<PlatformCategoryDto> {
  const res = await fetch(
    `${CATEGORIES_PREFIX}/update-fundraising-category/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        name: body.name.trim(),
        description: body.description ?? "",
      }),
    },
  );
  return parseOrThrow<PlatformCategoryDto>(
    res,
    "Failed to update category.",
  );
}

export async function suspendFundraisingCategory(
  token: string | null | undefined,
  id: string,
): Promise<void> {
  const res = await fetch(
    `${CATEGORIES_PREFIX}/suspend-fundraising-category/${encodeURIComponent(id)}`,
    { method: "POST", headers: headers(token) },
  );
  await parseOrThrow<unknown>(
    res,
    "Failed to suspend category.",
  );
}

/** Row for platform report detail table (largest donations in the window). */
export type PlatformReportDonationRow = {
  fundraisingActivityTitle: string;
  amount: number | string;
  donatedAt: string;
};

/** Platform report payloads from TrustFundr-be controllers */
export type PlatformReportDto = {
  startAt?: string;
  endAt?: string;
  newFundraisingActivities?: number;
  completedFundraisingActivities?: number;
  totalDonations?: number;
  totalDonationAmount?: number | string;
  totalViews?: number;
  totalFavourites?: number;
  topDonations?: PlatformReportDonationRow[];
};

export async function generateDailyReport(
  token: string | null | undefined,
  instantIso: string,
): Promise<PlatformReportDto> {
  const url = new URL(`${REPORTS_PREFIX}/generate-daily-report`);
  url.searchParams.set("date", instantIso);
  const res = await fetch(url.toString(), { headers: headers(token) });
  return parseOrThrow<PlatformReportDto>(res, "Failed to generate daily report.");
}

export async function generateWeeklyReport(
  token: string | null | undefined,
  startInstantIso: string,
  endInstantIso: string,
): Promise<PlatformReportDto> {
  const url = new URL(`${REPORTS_PREFIX}/generate-weekly-report`);
  url.searchParams.set("startDate", startInstantIso);
  url.searchParams.set("endDate", endInstantIso);
  const res = await fetch(url.toString(), { headers: headers(token) });
  return parseOrThrow<PlatformReportDto>(res, "Failed to generate weekly report.");
}

export async function generateMonthlyReport(
  token: string | null | undefined,
  yearMonth: string,
): Promise<PlatformReportDto> {
  const url = new URL(`${REPORTS_PREFIX}/generate-monthly-report`);
  url.searchParams.set("month", yearMonth.trim());
  const res = await fetch(url.toString(), { headers: headers(token) });
  return parseOrThrow<PlatformReportDto>(
    res,
    "Failed to generate monthly report.",
  );
}
