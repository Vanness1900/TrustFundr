import type { FundraisingActivity } from "./fundraiser-types";

export const dummyFundraisingActivities: FundraisingActivity[] = [
  {
    id: "medical-001",
    title: "Support A Child's Medical Treatment",
    description:
      "This campaign supports medical treatment and recovery care for a child who requires ongoing hospital visits and medication.",
    goalAmount: 50000,
    currentAmount: 18200,
    category: "Medical",
    location: "Singapore",
    status: "Published",
    imageUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1200&auto=format&fit=crop",
    viewCount: 128,
    favouriteCount: 34,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "education-001",
    title: "Education Fund for Low-Income Students",
    description:
      "This campaign helps provide school supplies, transport support, and learning resources for students from low-income families.",
    goalAmount: 30000,
    currentAmount: 12650,
    category: "Education",
    location: "Singapore",
    status: "Published",
    imageUrl:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    viewCount: 96,
    favouriteCount: 21,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "community-001",
    title: "Community Food Support Drive",
    description:
      "This campaign supports food packs and essential items for families facing financial difficulties in the community.",
    goalAmount: 20000,
    currentAmount: 20000,
    category: "Community",
    location: "Singapore",
    status: "Completed",
    imageUrl:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1200&auto=format&fit=crop",
    viewCount: 210,
    favouriteCount: 48,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getDummyFundraisingActivityById(id: string) {
  return (
    dummyFundraisingActivities.find(
      (activity) => String(activity.id) === String(id),
    ) ?? null
  );
}