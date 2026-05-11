// src/lib/donee-types.ts

/**
 * Typed shapes for Donee API responses. Central place to align with the
 * backend when fields change.
 */

/** Paginated list from donee view/search fundraising activities endpoints. */
export interface PagedFundraisingActivities {
  content: FundraisingActivity[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** Listing row from view/search fundraising activities endpoints. */
export interface FundraisingActivity {
  id: string;
  title: string;
  description: string;
  viewCount: number;
  favouriteCount: number;
  ownerName: string;
  ownerUsername?: string;
  createdAt: string;
  goalAmount?: number;
  currentAmount?: number;
  status?: string;
  imageUrl?: string | null;
  category?: string;
  location?: string;
}

/** Detail endpoint; aligned with list row (`viewCount` / `favouriteCount` included). */
export type FundraisingActivityDetail = FundraisingActivity;

export type FavouriteActivity = FundraisingActivity;

/** Row from donation history endpoints. */
export interface DonationHistory {
  id: string;
  amount: string;
  memo: string | null;
  fundraisingActivityId: string;
  fundraisingActivityTitle: string;
  donatedAt: string;
}

export type ApiError = { message: string };
