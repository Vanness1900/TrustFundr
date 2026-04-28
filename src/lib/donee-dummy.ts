// src/lib/donee-dummy.ts
import type { FundraisingActivity } from "./donee-types";

export const DUMMY_CAMPAIGNS: FundraisingActivity[] = [
  {
    id: "1",
    title: "Help David Secure Legal Representation",
    description: "David needs urgent help to secure legal representation.",
    goalAmount: 150000,
    currentAmount: 111847,
    status: "ACTIVE",
    viewCount: 234,
    favouriteCount: 45,
    createdAt: "2026-01-15",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    category: "Legal",
    location: "Sydney",
    ownerName: "Anthony Vulin",
  },
  {
    id: "2",
    title: "Support Maria's Medical Treatment",
    description: "Maria is battling a rare disease and needs community support.",
    goalAmount: 80000,
    currentAmount: 45200,
    status: "ACTIVE",
    viewCount: 189,
    favouriteCount: 32,
    createdAt: "2026-02-01",
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop",
    category: "Medical",
    location: "Melbourne",
    ownerName: "Maria Santos",
  },
  {
    id: "3",
    title: "Community Garden Project",
    description: "Building a community garden to provide fresh produce.",
    goalAmount: 25000,
    currentAmount: 18750,
    status: "ACTIVE",
    viewCount: 156,
    favouriteCount: 28,
    createdAt: "2026-02-10",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
    category: "Community",
    location: "Brisbane",
    ownerName: "James Wong",
  },
  {
    id: "4",
    title: "Scholarship Fund for Rural Students",
    description: "Helping rural students access quality education.",
    goalAmount: 60000,
    currentAmount: 22000,
    status: "ACTIVE",
    viewCount: 201,
    favouriteCount: 19,
    createdAt: "2026-02-20",
    imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop",
    category: "Education",
    location: "Perth",
    ownerName: "Sarah Chen",
  },
  {
    id: "5",
    title: "Rebuild After the Flood",
    description: "Helping families rebuild their homes after devastating floods.",
    goalAmount: 200000,
    currentAmount: 134500,
    status: "ACTIVE",
    viewCount: 445,
    favouriteCount: 87,
    createdAt: "2026-03-01",
    imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400&h=300&fit=crop",
    category: "Community",
    location: "Queensland",
    ownerName: "Tom Bradley",
  },
  {
    id: "6",
    title: "Veterans Support Network",
    description: "Providing mental health support and resources for veterans.",
    goalAmount: 45000,
    currentAmount: 31200,
    status: "ACTIVE",
    viewCount: 178,
    favouriteCount: 41,
    createdAt: "2026-03-10",
    imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=300&fit=crop",
    category: "Community",
    location: "Canberra",
    ownerName: "Lisa Park",
  },
];

export interface DonationDisplayItem {
  id: string;
  title: string;
  donatedAt: string;
  amount: number;
  imageUrl: string | null;
  campaignId: string;
}

export const DUMMY_DONATIONS: DonationDisplayItem[] = [
  {
    id: "d1",
    title: "Help David Secure Legal Representation",
    donatedAt: "2026-03-15",
    amount: 50,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    campaignId: "1",
  },
  {
    id: "d2",
    title: "Support Maria's Medical Treatment",
    donatedAt: "2026-03-10",
    amount: 50,
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop",
    campaignId: "2",
  },
  {
    id: "d3",
    title: "Community Garden Project",
    donatedAt: "2026-02-28",
    amount: 50,
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
    campaignId: "3",
  },
];

export const DUMMY_FAVOURITES: FundraisingActivity[] = DUMMY_CAMPAIGNS.slice(0, 4);
