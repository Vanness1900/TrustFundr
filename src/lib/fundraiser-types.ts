// src/lib/fundraiser-types.ts

export interface FundraisingActivity {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  status: string;
  viewCount: number;
  favouriteCount: number;
  createdAt: string;
  imageUrl: string | null;
  category: string;
  location: string;
}

export interface FundraisingActivityCreateRequest {
  title: string;
  description: string;
  goalAmount: number;
  category: string;
  location: string;
}

export interface DonationRecord {
  id: string;
  donorName: string;
  amount: number;
  donatedAt: string;
  fundraisingActivityId: string;
}

export interface FundraiserStats {
  totalViews: number;
  totalFavourites: number;
  totalDonations: number;
  totalAmountRaised: number;
}

export type ApiError = { message: string };
