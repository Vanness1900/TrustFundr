import type {
  FundraisingActivity,
  FundraisingActivityCreateRequest,
  FundraisingActivityUpdateRequest,
} from "./fundraiser-types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
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

function getStatus(raw: any) {
  if (raw?.completedAt) return "Completed";
  return getFirstString(raw?.status) || "Published";
}

function normalizeActivity(raw: any): FundraisingActivity {
  return {
    id: getFirstString(raw?.id, raw?.fundraisingActivityId, raw?.activityId),
    title: getFirstString(raw?.title, raw?.name),
    description: getFirstString(raw?.description),
    goalAmount: getFirstNumber(raw?.goalAmount, raw?.targetAmount),
    currentAmount: getFirstNumber(raw?.currentAmount, raw?.raisedAmount),
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

function normalizeActivityList(raw: any): FundraisingActivity[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.content)
      ? raw.content
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.items)
          ? raw.items
          : [];

  return list.map(normalizeActivity).filter((activity) => activity.id);
}

export async function getMyFundraisingActivities(
  token?: string | null,
): Promise<FundraisingActivity[] | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/fundraiser/fundraising-activities/view-my-fundraising-activities`,
      {
        method: "GET",
        headers: getHeaders(token),
      },
    );

    const raw = await parseJson<any>(response);
    if (!raw) return null;

    return normalizeActivityList(raw);
  } catch {
    return null;
  }
}

export async function getFundraisingActivityById(
  token: string | null | undefined,
  id: string,
): Promise<FundraisingActivity | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/fundraiser/fundraising-activities/view-fundraising-activity/${id}`,
      {
        method: "GET",
        headers: getHeaders(token),
      },
    );

    const raw = await parseJson<any>(response);
    if (!raw) return null;

    return normalizeActivity(raw);
  } catch {
    return null;
  }
}

export async function createFundraisingActivity(
  token: string | null | undefined,
  data: FundraisingActivityCreateRequest,
): Promise<FundraisingActivity | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/fundraiser/fundraising-activities/create-fundraising-activity`,
      {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify({
          title: data.title,
          description: data.description,
        }),
      },
    );

    const raw = await parseJson<any>(response);
    if (!raw) return null;

    return normalizeActivity(raw);
  } catch {
    return null;
  }
}

export async function updateFundraisingActivity(
  token: string | null | undefined,
  id: string,
  data: FundraisingActivityUpdateRequest,
): Promise<FundraisingActivity | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/fundraiser/fundraising-activities/update-fundraising-activity/${id}`,
      {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify({
          title: data.title,
          description: data.description,
        }),
      },
    );

    const raw = await parseJson<any>(response);
    if (!raw) return null;

    return normalizeActivity(raw);
  } catch {
    return null;
  }
}