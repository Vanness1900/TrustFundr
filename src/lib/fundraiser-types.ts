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
  category?: string;
  location?: string;
  imageUrl?: string;
}

export interface FundraisingActivityUpdateRequest {
  title?: string;
  description?: string;
  goalAmount?: number;
  category?: string;
  location?: string;
  imageUrl?: string;
  status?: string;
}