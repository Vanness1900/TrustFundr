export interface FundraiserLocalExtra {
  category?: string;
  location?: string;
  goalAmount?: number;
  imageUrl?: string;
  status?: string;
}

const STORAGE_KEY = "trustfundr_fundraiser_local_extra";

function readAllExtras(): Record<string, FundraiserLocalExtra> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, FundraiserLocalExtra>) : {};
  } catch {
    return {};
  }
}

function writeAllExtras(data: Record<string, FundraiserLocalExtra>) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getFundraiserLocalExtra(id: string): FundraiserLocalExtra {
  const all = readAllExtras();
  return all[id] ?? {};
}

export function saveFundraiserLocalExtra(
  id: string,
  extra: FundraiserLocalExtra,
) {
  const all = readAllExtras();

  all[id] = {
    ...all[id],
    ...extra,
  };

  writeAllExtras(all);
}

export function mergeFundraiserLocalExtra<T extends { id: string }>(
  activity: T,
): T & FundraiserLocalExtra {
  return {
    ...activity,
    ...getFundraiserLocalExtra(activity.id),
  };
}

export function mergeFundraiserLocalExtras<T extends { id: string }>(
  activities: T[],
): Array<T & FundraiserLocalExtra> {
  return activities.map(mergeFundraiserLocalExtra);
}