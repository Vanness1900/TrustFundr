import type {
  FundraisingActivity,
  FundraisingActivityCreateRequest,
  FundraisingActivityUpdateRequest,
  FundraiserCategoryOption,
} from "./fundraiser-types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";

type ApiError = { message?: string };

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseOrThrow<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  if (response.ok) return (await response.json()) as T;
  const error: ApiError = await response.json().catch(() => ({
    message: fallbackMessage,
  }));
  throw new Error(error.message || fallbackMessage);
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function getFirstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }
  }

  return 0;
}

function getStatus(raw: Record<string, unknown>) {
  if (raw?.completedAt) return "Completed";
  return getFirstString(raw?.status) || "Published";
}

function normalizeActivity(raw: Record<string, unknown>): FundraisingActivity {
  return {
    id: getFirstString(raw?.id, raw?.fundraisingActivityId, raw?.activityId),
    title: getFirstString(raw?.title, raw?.name),
    description: getFirstString(raw?.description),
    goalAmount: getFirstNumber(raw?.goalAmount, raw?.targetAmount),
    currentAmount: getFirstNumber(raw?.currentAmount, raw?.raisedAmount),
    categoryId: getFirstString(raw?.categoryId),
    category: getFirstString(raw?.category),
    location: getFirstString(raw?.location),
    status: getStatus(raw),
    imageUrl: getFirstString(raw?.imageUrl, raw?.image, raw?.thumbnailUrl),
    viewCount: getFirstNumber(raw?.viewCount, raw?.views),
    favouriteCount: getFirstNumber(
      raw?.favouriteCount,
      raw?.favoriteCount,
      raw?.savedCount,
      raw?.favourites,
    ),
    createdAt: getFirstString(raw?.createdAt, raw?.createdDate),
    updatedAt: getFirstString(raw?.updatedAt, raw?.updatedDate),
  };
}

function normalizeActivityList(raw: unknown): FundraisingActivity[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { content?: unknown })?.content)
      ? (raw as { content: unknown[] }).content
      : Array.isArray((raw as { data?: unknown })?.data)
        ? (raw as { data: unknown[] }).data
        : Array.isArray((raw as { items?: unknown })?.items)
          ? (raw as { items: unknown[] }).items
          : [];

  return list
    .map((item) => normalizeActivity(item as Record<string, unknown>))
    .filter((activity: FundraisingActivity) => activity.id);
}

/** List/search scope: all (default), active only, or completed only. */
export type FundraiserMyActivitiesStatus = "all" | "active" | "completed";

/**
 * Lists the authenticated fundraiser's activities.
 * Default `status` is `"all"` (active first, then completed). Use `"active"` or `"completed"` to filter.
 */
export async function getMyFundraisingActivities(
  token?: string | null,
  status: FundraiserMyActivitiesStatus = "all",
): Promise<FundraisingActivity[]> {
  const url = new URL(
    `${API_BASE_URL}/api/fundraiser/fundraising-activities/view-my-fundraising-activities`,
  );
  url.searchParams.set("status", status);
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(token),
  });
  const raw = await parseOrThrow<unknown>(
    response,
    "Failed to load your fundraising activities.",
  );
  return normalizeActivityList(raw);
}

export async function getCompletedFundraisingActivities(
  token?: string | null,
): Promise<FundraisingActivity[]> {
  return getMyFundraisingActivities(token, "completed");
}

function mapCategoryRow(raw: Record<string, unknown>): FundraiserCategoryOption {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "").trim(),
    description:
      typeof raw.description === "string" ? raw.description : null,
  };
}

/** Active categories from the database (for campaign create/edit). */
export async function listFundraiserFundraisingCategories(
  token: string | null | undefined,
): Promise<FundraiserCategoryOption[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/fundraiser/fundraising-categories/view-fundraising-categories`,
    { method: "GET", headers: getHeaders(token) },
  );
  const raw = await parseOrThrow<unknown[]>(
    response,
    "Failed to load fundraising categories.",
  );
  return raw
    .map((row) => mapCategoryRow(row as Record<string, unknown>))
    .filter((c) => c.id && c.name);
}

/**
 * Search the authenticated fundraiser's campaigns. Requires non-empty `q`.
 * Default `status` is `"all"` (active matches first, then completed). Use `"active"` or `"completed"` to narrow.
 */
export async function searchMyFundraisingActivities(
  token: string | null | undefined,
  q: string,
  status: FundraiserMyActivitiesStatus = "all",
): Promise<FundraisingActivity[]> {
  const url = new URL(
    `${API_BASE_URL}/api/fundraiser/fundraising-activities/search-fundraising-activities`,
  );
  url.searchParams.set("q", q.trim());
  url.searchParams.set("status", status);
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(token),
  });
  const raw = await parseOrThrow<unknown>(
    response,
    "Failed to search fundraising activities.",
  );
  return normalizeActivityList(raw);
}

export async function searchCompletedFundraisingActivities(
  token: string | null | undefined,
  q: string,
): Promise<FundraisingActivity[]> {
  return searchMyFundraisingActivities(token, q, "completed");
}

export async function getFundraisingActivityById(
  token: string | null | undefined,
  id: string,
): Promise<FundraisingActivity> {
  const response = await fetch(
    `${API_BASE_URL}/api/fundraiser/fundraising-activities/view-fundraising-activity/${id}`,
    {
      method: "GET",
      headers: getHeaders(token),
    },
  );
  const raw = await parseOrThrow<Record<string, unknown>>(
    response,
    "Failed to load fundraising activity.",
  );
  return normalizeActivity(raw);
}

export async function createFundraisingActivity(
  token: string | null | undefined,
  data: FundraisingActivityCreateRequest,
): Promise<FundraisingActivity> {
  const response = await fetch(
    `${API_BASE_URL}/api/fundraiser/fundraising-activities/create-fundraising-activity`,
    {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        location: data.location ?? null,
        goalAmount:
          data.goalAmount != null && Number.isFinite(data.goalAmount)
            ? data.goalAmount
            : null,
        currentAmount:
          data.currentAmount != null && Number.isFinite(data.currentAmount)
            ? data.currentAmount
            : null,
        imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : null,
      }),
    },
  );
  const raw = await parseOrThrow<Record<string, unknown>>(
    response,
    "Failed to create fundraising activity.",
  );
  return normalizeActivity(raw);
}

export async function updateFundraisingActivity(
  token: string | null | undefined,
  id: string,
  data: FundraisingActivityUpdateRequest,
): Promise<FundraisingActivity> {
  const response = await fetch(
    `${API_BASE_URL}/api/fundraiser/fundraising-activities/update-fundraising-activity/${id}`,
    {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify({
        title: data.title,
        description: data.description ?? "",
        categoryId: data.categoryId,
        location: data.location ?? null,
        goalAmount:
          data.goalAmount != null && Number.isFinite(data.goalAmount)
            ? data.goalAmount
            : null,
        currentAmount:
          data.currentAmount != null && Number.isFinite(data.currentAmount)
            ? data.currentAmount
            : null,
        imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : null,
      }),
    },
  );
  const raw = await parseOrThrow<Record<string, unknown>>(
    response,
    "Failed to update fundraising activity.",
  );
  return normalizeActivity(raw);
}

export async function suspendFundraisingActivity(
  token: string | null | undefined,
  id: string,
): Promise<FundraisingActivity> {
  const response = await fetch(
    `${API_BASE_URL}/api/fundraiser/fundraising-activities/suspend-fundraising-activity/${encodeURIComponent(id)}`,
    { method: "POST", headers: getHeaders(token) },
  );
  const raw = await parseOrThrow<Record<string, unknown>>(
    response,
    "Failed to suspend fundraising activity.",
  );
  return normalizeActivity(raw);
}
