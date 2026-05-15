/** Active fundraising category (fundraiser pick list). */
export interface FundraiserCategoryOption {
  id: string;
  name: string;
  description?: string | null;
}

export type FundraisingStatus =
  | "Draft"
  | "Published"
  | "Suspended"
  | "Completed"
  | string;

export interface FundraisingActivity {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  /** Resolved category UUID from backend. */
  categoryId?: string;
  category: string;
  location: string;
  status: FundraisingStatus;
  imageUrl?: string;
  viewCount: number;
  favouriteCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FundraisingActivityCreateRequest {
  title: string;
  description: string;
  goalAmount?: number;
  /** Omit or 0 for new campaigns; server defaults to 0. */
  currentAmount?: number;
  /** Fundraising category row id (UUID). */
  categoryId: string;
  location?: string;
  imageUrl?: string | null;
}

export interface FundraisingActivityUpdateRequest {
  title?: string;
  description?: string;
  goalAmount?: number;
  currentAmount?: number;
  /** Fundraising category row id (UUID); required when updating category. */
  categoryId: string;
  location?: string;
  imageUrl?: string | null;
  status?: string;
}