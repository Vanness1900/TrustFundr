// src/lib/donee-api.ts

/**
 * Donee-facing API helpers. Mirrors the fetch + error pattern used on the admin
 * page and in auth-context (shared headers / parseOrThrow).
 */

import type {
  FundraisingActivity,
  FundraisingActivityDetail,
  FavouriteActivity,
  DonationHistory,
  ApiError,
  PagedFundraisingActivities,
} from "./donee-types";

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function parseOrThrow<T>(
  res: Response,
  fallbackMessage: string,
): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  const error: ApiError = await res.json().catch(() => ({
    message: fallbackMessage,
  }));
  throw new Error(error.message || fallbackMessage);
}

// --- Fundraising activities (browse & detail) ---

function mapActivityRow(raw: unknown): FundraisingActivity {
  const r = raw as Record<string, unknown>;
  const goal = r.goalAmount;
  const current = r.currentAmount;
  return {
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    viewCount: typeof r.viewCount === "number" ? r.viewCount : 0,
    favouriteCount: typeof r.favouriteCount === "number" ? r.favouriteCount : 0,
    ownerName: String(r.ownerName ?? "Organiser"),
    ownerUsername:
      typeof r.ownerUsername === "string" ? r.ownerUsername : undefined,
    createdAt: String(r.createdAt ?? ""),
    goalAmount:
      typeof goal === "number"
        ? goal
        : typeof goal === "string"
          ? Number.parseFloat(goal)
          : undefined,
    currentAmount:
      typeof current === "number"
        ? current
        : typeof current === "string"
          ? Number.parseFloat(current)
          : undefined,
    status: typeof r.status === "string" ? r.status : undefined,
    imageUrl: typeof r.imageUrl === "string" ? r.imageUrl : null,
    category: typeof r.category === "string" ? r.category : undefined,
    location: typeof r.location === "string" ? r.location : undefined,
  };
}

function mapPagedActivities(raw: unknown): PagedFundraisingActivities {
  const o = raw as Record<string, unknown>;
  const content = Array.isArray(o.content)
    ? (o.content as unknown[]).map(mapActivityRow)
    : [];
  return {
    content,
    totalElements: Number(o.totalElements ?? 0),
    totalPages: Number(o.totalPages ?? 0),
    number: Number(o.number ?? 0),
    size: Number(o.size ?? 0),
  };
}

/** Backend wraps each row as { id, createdAt, fundraisingActivity: { ... } }. */
function mapFavouriteApiRow(raw: unknown): FundraisingActivity {
  const r = raw as Record<string, unknown>;
  const nested = r.fundraisingActivity;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return mapActivityRow(nested);
  }
  return mapActivityRow(raw);
}

export async function listFundraisingActivities(
  token: string | null,
  page = 0,
  size = 12,
): Promise<PagedFundraisingActivities> {
  const url = new URL(
    `${DEFAULT_BASE_URL}/api/donee/fundraising-activities/view-fundraising-activities`,
  );
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(token),
  });
  const json = await parseOrThrow<unknown>(
    res,
    "Failed to load fundraising activities.",
  );
  return mapPagedActivities(json);
}

export async function searchFundraisingActivities(
  token: string | null,
  query: string,
  page = 0,
  size = 12,
): Promise<PagedFundraisingActivities> {
  const url = new URL(
    `${DEFAULT_BASE_URL}/api/donee/fundraising-activities/search-fundraising-activities`,
  );
  url.searchParams.set("q", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(token),
  });
  const json = await parseOrThrow<unknown>(
    res,
    "Failed to search fundraising activities.",
  );
  return mapPagedActivities(json);
}

/** Detail endpoint returns `ownerFullName`; list rows use `ownerName` — normalise for one UI type. */
function mapActivityDetail(raw: unknown): FundraisingActivityDetail {
  const r = raw as Record<string, unknown>;
  return mapActivityRow({
    ...r,
    ownerName: r.ownerName ?? r.ownerFullName ?? "Organiser",
  });
}

export async function getFundraisingActivityDetail(
  token: string | null,
  id: string,
): Promise<FundraisingActivityDetail> {
  const res = await fetch(
    `${DEFAULT_BASE_URL}/api/donee/fundraising-activities/view-fundraising-activity/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: getHeaders(token),
    },
  );
  const json = await parseOrThrow<unknown>(
    res,
    "Failed to load fundraising activity detail.",
  );
  return mapActivityDetail(json);
}

// --- Favourites ---

export async function listMyFavourites(
  token: string | null,
): Promise<FavouriteActivity[]> {
  const res = await fetch(
    `${DEFAULT_BASE_URL}/api/donee/fundraising-activity-favourites/view-my-favourites`,
    {
      method: "GET",
      headers: getHeaders(token),
    },
  );
  const json = await parseOrThrow<unknown>(
    res,
    "Failed to load favourites.",
  );
  if (!Array.isArray(json)) return [];
  return json.map((item) => mapFavouriteApiRow(item) as FavouriteActivity);
}

export async function searchMyFavourites(
  token: string | null,
  query: string,
): Promise<FavouriteActivity[]> {
  const url = new URL(
    `${DEFAULT_BASE_URL}/api/donee/fundraising-activity-favourites/search-my-favourites`,
  );
  url.searchParams.set("q", query);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(token),
  });
  const json = await parseOrThrow<unknown>(
    res,
    "Failed to search favourites.",
  );
  if (!Array.isArray(json)) return [];
  return json.map((item) => mapFavouriteApiRow(item) as FavouriteActivity);
}

export async function saveFavourite(
  token: string | null,
  activityId: string,
): Promise<void> {
  const res = await fetch(
    `${DEFAULT_BASE_URL}/api/donee/fundraising-activity-favourites/save-favourite/${encodeURIComponent(activityId)}`,
    {
      method: "POST",
      headers: getHeaders(token),
    },
  );
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      message: "Failed to save favourite.",
    }));
    throw new Error(error.message || "Failed to save favourite.");
  }
}

// --- Donation history ---

/** Backend returns nested `fundraisingActivity` and `createdAt` on the donation row. */
function mapDonationHistoryRow(raw: unknown): DonationHistory {
  const r = raw as Record<string, unknown>;
  const nested =
    r.fundraisingActivity && typeof r.fundraisingActivity === "object"
      ? (r.fundraisingActivity as Record<string, unknown>)
      : undefined;

  const donatedRaw = r.donatedAt ?? r.createdAt;
  let donatedAt = "";
  if (typeof donatedRaw === "string") donatedAt = donatedRaw;
  else if (typeof donatedRaw === "number" && Number.isFinite(donatedRaw))
    donatedAt = new Date(donatedRaw).toISOString();

  const amountRaw = r.amount;
  const amount =
    typeof amountRaw === "number"
      ? String(amountRaw)
      : typeof amountRaw === "string"
        ? amountRaw
        : "";

  const title =
    (nested && typeof nested.title === "string" && nested.title) ||
    (typeof r.fundraisingActivityTitle === "string" && r.fundraisingActivityTitle) ||
    "Campaign";

  const fundId =
    (nested && nested.id != null && String(nested.id)) ||
    (typeof r.fundraisingActivityId === "string" && r.fundraisingActivityId) ||
    "";

  const img =
    nested && typeof nested.imageUrl === "string" && nested.imageUrl.trim()
      ? nested.imageUrl.trim()
      : typeof r.imageUrl === "string" && r.imageUrl.trim()
        ? r.imageUrl.trim()
        : null;

  return {
    id: String(r.id ?? ""),
    amount,
    memo: typeof r.memo === "string" ? r.memo : null,
    fundraisingActivityId: fundId,
    fundraisingActivityTitle: title,
    donatedAt,
    fundraisingActivityImageUrl: img,
  };
}

export async function listMyDonations(
  token: string | null,
): Promise<DonationHistory[]> {
  const res = await fetch(
    `${DEFAULT_BASE_URL}/api/donee/donations/view-my-donations`,
    {
      method: "GET",
      headers: getHeaders(token),
    },
  );
  const json = await parseOrThrow<unknown>(res, "Failed to load donations.");
  if (!Array.isArray(json)) return [];
  return json
    .map((row) => mapDonationHistoryRow(row))
    .filter((row) => row.id);
}

export async function searchMyDonations(
  token: string | null,
  query: string,
): Promise<DonationHistory[]> {
  const url = new URL(
    `${DEFAULT_BASE_URL}/api/donee/donations/search-my-donations`,
  );
  url.searchParams.set("q", query);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(token),
  });
  const json = await parseOrThrow<unknown>(res, "Failed to search donations.");
  if (!Array.isArray(json)) return [];
  return json
    .map((row) => mapDonationHistoryRow(row))
    .filter((row) => row.id);
}
