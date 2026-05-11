"use client";

import type { FundraisingActivity } from "@/lib/donee-types";
import { shortTitleForAria } from "@/lib/a11y";

export function DoneeCampaignCard({
  activity,
  onOpen,
  heartMode,
  isFavourite,
  onToggleFavourite,
}: {
  activity: FundraisingActivity;
  onOpen: () => void;
  heartMode: "toggle" | "saved";
  isFavourite?: boolean;
  onToggleFavourite?: () => void;
}) {
  const goal = activity.goalAmount ?? 0;
  const current = activity.currentAmount ?? 0;
  const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const titleA11y = shortTitleForAria(activity.title);

  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-[#E1E5EA] bg-white shadow-sm transition hover:border-[#2F7A55]/40 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
      onClick={onOpen}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#eef1f0]">
        {activity.imageUrl ? (
          <img
            src={activity.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#e8ece9] to-[#d8deda]">
            <ImagePlaceholderIcon />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="pointer-events-none absolute bottom-9 left-4 max-w-[85%]">
          <p className="text-lg font-extrabold tracking-tight text-white drop-shadow-md">
            ${current.toLocaleString()} raised
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex h-2 bg-black/20">
          <div
            className="h-full bg-[#2F7A55] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {heartMode === "toggle" ? (
          <button
            type="button"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2.5 shadow-md ring-1 ring-black/5 transition hover:bg-white hover:shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavourite?.();
            }}
            aria-label={
              isFavourite
                ? `Remove “${titleA11y}” from favourites`
                : `Save “${titleA11y}” to favourites`
            }
          >
            <HeartIcon filled={Boolean(isFavourite)} />
          </button>
        ) : (
          <div
            className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2.5 shadow-md ring-1 ring-black/5"
            role="img"
            aria-label={`Saved — ${titleA11y}`}
          >
            <HeartIcon filled />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 pt-4">
        <h2 className="line-clamp-2 text-lg font-extrabold leading-snug tracking-tight text-[#0f172a]">
          {activity.title?.trim() || "Untitled campaign"}
        </h2>
        <p className="mt-2 text-sm text-[#64748b]">
          by{" "}
          <span className="font-semibold text-[#475569]">
            {activity.ownerName?.trim() || "Organiser"}
          </span>
        </p>
        {goal > 0 ? (
          <p className="mt-3 text-xs font-medium text-[#94a3b8]">
            {Math.round(progress)}% of ${goal.toLocaleString()} goal
          </p>
        ) : (
          <p className="mt-3 text-xs font-medium text-[#94a3b8]">
            Goal not set
          </p>
        )}
      </div>
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="size-5 text-red-500"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.85}
      stroke="currentColor"
      className="size-5 text-red-400"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.2}
      stroke="currentColor"
      className="size-12 text-[#94a3b8]"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}
