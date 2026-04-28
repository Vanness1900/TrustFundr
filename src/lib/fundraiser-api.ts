// src/lib/fundraiser-api.ts

import type {
  FundraisingActivity,
  FundraisingActivityCreateRequest,
  ApiError,
} from "./fundraiser-types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";

function getHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function parseOrThrow<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  const error: ApiError = await res.json().catch(() => ({ message: fallbackMessage }));
  throw new Error(error.message || fallbackMessage);
}

export async function getMyFundraisingActivities(
  token: string | null,
): Promise<FundraisingActivity[] | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/fundraiser/fundraising-activities/view-my-fundraising-activities`, {
      method: "GET",
      headers: getHeaders(token),
    });
    return await parseOrThrow<FundraisingActivity[]>(res, "Failed to load campaigns.");
  } catch {
    return null;
  }
}

export async function createFundraisingActivity(
  token: string | null,
  data: FundraisingActivityCreateRequest,
): Promise<FundraisingActivity | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/fundraiser/fundraising-activities/create-fundraising-activity`,
      {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return await parseOrThrow<FundraisingActivity>(res, "Failed to create campaign.");
  } catch {
    return null;
  }
}

export async function getFundraisingActivityById(
  token: string | null,
  id: string,
): Promise<FundraisingActivity | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/fundraiser/fundraising-activities/view-fundraising-activity/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: getHeaders(token),
      },
    );
    return await parseOrThrow<FundraisingActivity>(res, "Failed to load campaign.");
  } catch {
    return null;
  }
}

export async function updateFundraisingActivity(
  token: string | null,
  id: string,
  data: Partial<FundraisingActivityCreateRequest>,
): Promise<FundraisingActivity | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/fundraiser/fundraising-activities/update-fundraising-activity/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return await parseOrThrow<FundraisingActivity>(res, "Failed to update campaign.");
  } catch {
    return null;
  }
}

