// src/lib/donee-api.ts

/**
 * API client untuk semua endpoint Donee.
 * 
 * Pattern ini meniru struktur yang sudah dipakai di src/app/admin/page.tsx dan
 * src/context/auth-context.tsx — supaya konsisten dan gampang di-maintain.
 * 
 * Setiap function:
 * 1. Menerima `token` (JWT) dan optional body/params
 * 2. Memanggil fetch dengan headers yang benar
 * 3. Return type yang sudah didefinisikan di donee-types.ts
 * 4. Throw Error dengan message yang descriptive kalau gagal
 */

import {
    FundraisingActivity,
    FundraisingActivityDetail,
    FavouriteActivity,
    DonationHistory,
    ApiError,
  } from "./donee-types";
  
  const DEFAULT_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";
  
  /**
   * Helper untuk bikin headers dengan optional Authorization.
   * Sama persis dengan pattern di auth-context.tsx.
   */
  function getHeaders(token?: string | null): HeadersInit {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }
  
  /**
   * Helper untuk parse response. Throw kalau status bukan 2xx.
   * Pattern yang sama dengan auth-context.tsx — biar konsisten.
   */
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
  
  // ============================================================
  // FUNDRAISING ACTIVITIES (Browse & Detail)
  // ============================================================
  
  /**
   * Ambil semua FRA yang aktif untuk dipilih Donee.
   * Endpoint: GET /api/donee/fundraising-activities/view-fundraising-activities
   */
  export async function listFundraisingActivities(
    token: string | null,
  ): Promise<FundraisingActivity[]> {
    const res = await fetch(
      `${DEFAULT_BASE_URL}/api/donee/fundraising-activities/view-fundraising-activities`,
      {
        method: "GET",
        headers: getHeaders(token),
      },
    );
    return parseOrThrow<FundraisingActivity[]>(
      res,
      "Failed to load fundraising activities.",
    );
  }
  
  /**
   * Search FRA by keyword.
   * Endpoint: GET /api/donee/fundraising-activities/search-fundraising-activities?q=...
   */
  export async function searchFundraisingActivities(
    token: string | null,
    query: string,
  ): Promise<FundraisingActivity[]> {
    const url = new URL(
      `${DEFAULT_BASE_URL}/api/donee/fundraising-activities/search-fundraising-activities`,
    );
    url.searchParams.set("q", query);
  
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: getHeaders(token),
    });
    return parseOrThrow<FundraisingActivity[]>(
      res,
      "Failed to search fundraising activities.",
    );
  }
  
  /**
   * Ambil detail satu FRA by ID.
   * Endpoint: GET /api/donee/fundraising-activities/view-fundraising-activity/{id}
   */
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
    return parseOrThrow<FundraisingActivityDetail>(
      res,
      "Failed to load fundraising activity detail.",
    );
  }
  
  // ============================================================
  // FAVOURITES
  // ============================================================
  
  /**
   * Ambil list FRA yang di-favourite oleh Donee yang sedang login.
   * Endpoint: GET /api/donee/fundraising-activity-favourites/view-my-favourites
   */
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
    return parseOrThrow<FavouriteActivity[]>(
      res,
      "Failed to load favourites.",
    );
  }
  
  /**
   * Search dalam favourite list.
   * Endpoint: GET /api/donee/fundraising-activity-favourites/search-my-favourites?q=...
   */
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
    return parseOrThrow<FavouriteActivity[]>(
      res,
      "Failed to search favourites.",
    );
  }
  
  /**
   * Tambah FRA ke favourite list.
   * Endpoint: POST /api/donee/fundraising-activity-favourites/save-favourite/{activityId}
   */
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
  
  // ============================================================
  // DONATION HISTORY
  // ============================================================
  
  /**
   * Ambil history donasi Donee yang sedang login.
   * Endpoint: GET /api/donee/donations/view-my-donations
   */
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
    return parseOrThrow<DonationHistory[]>(
      res,
      "Failed to load donations.",
    );
  }
  
  /**
   * Search dalam donation history.
   * Endpoint: GET /api/donee/donations/search-my-donations?q=...
   */
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
    return parseOrThrow<DonationHistory[]>(
      res,
      "Failed to search donations.",
    );
  }