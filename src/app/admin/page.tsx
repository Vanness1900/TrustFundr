"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/use-debounce";

type UserProfileRow = {
  id: string;
  name: string;
  description?: string | null;
};

type UserAccountRow = {
  id: string;
  fullName: string;
  username: string;
  userProfileId: string;
  userProfileName: string;
};

type ApiError = { message: string };

type CreateUserProfileRequest = {
  name: string;
  description?: string | null;
};

type UpdateUserProfileRequest = CreateUserProfileRequest;

type CreateUserAccountRequest = {
  userProfileId: string;
  fullName: string;
  username: string;
  password: string;
};

type UpdateUserAccountRequest = {
  fullName: string;
  username: string;
  password?: string;
  userProfileId?: string;
};

/**
 * When unset, use the current page origin (e.g. http://localhost:3000) so paths `/api/...` go through
 * Next.js rewrites to the backend and avoid CORS. Set NEXT_PUBLIC_API_BASE_URL to call the API host directly.
 */
function apiRequestBase(): string {
  const trimmed = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (trimmed) return trimmed.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:8080";
}

const ADMIN_TABLE_PAGE_SIZE = 20;

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

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

async function listUserProfiles(token?: string | null) {
  const res = await fetch(`${apiRequestBase()}/api/admin/user-profiles`, {
    method: "GET",
    headers: getHeaders(token),
  });
  return parseOrThrow<UserProfileRow[]>(res, "Failed to load user profiles.");
}

async function listUserAccounts(token?: string | null) {
  const res = await fetch(`${apiRequestBase()}/api/admin/user-accounts`, {
    method: "GET",
    headers: getHeaders(token),
  });
  return parseOrThrow<UserAccountRow[]>(res, "Failed to load user accounts.");
}

async function createUserProfile(
  token: string | null | undefined,
  body: CreateUserProfileRequest,
) {
  const res = await fetch(
    `${apiRequestBase()}/api/admin/user-profiles/create-user-profile`,
    {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(body),
    },
  );
  return parseOrThrow<UserProfileRow>(res, "Failed to create user profile.");
}

async function updateUserProfile(
  token: string | null | undefined,
  id: string,
  body: UpdateUserProfileRequest,
) {
  const res = await fetch(
    `${apiRequestBase()}/api/admin/user-profiles/update-user-profile/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(body),
    },
  );
  return parseOrThrow<UserProfileRow>(res, "Failed to update user profile.");
}

async function suspendUserProfile(token: string | null | undefined, id: string) {
  const res = await fetch(
    `${apiRequestBase()}/api/admin/user-profiles/suspend-user-profile/${encodeURIComponent(id)}`,
    {
      method: "POST",
      headers: getHeaders(token),
    },
  );
  return parseOrThrow<UserProfileRow>(res, "Failed to suspend user profile.");
}

async function createUserAccount(
  token: string | null | undefined,
  body: CreateUserAccountRequest,
) {
  const res = await fetch(
    `${apiRequestBase()}/api/admin/user-accounts/create-user-account`,
    {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(body),
    },
  );
  return parseOrThrow<UserAccountRow>(res, "Failed to create user account.");
}

async function updateUserAccount(
  token: string | null | undefined,
  id: string,
  body: UpdateUserAccountRequest,
) {
  const res = await fetch(
    `${apiRequestBase()}/api/admin/user-accounts/update-user-account/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(body),
    },
  );
  return parseOrThrow<UserAccountRow>(res, "Failed to update user account.");
}

async function suspendUserAccount(token: string | null | undefined, id: string) {
  const res = await fetch(
    `${apiRequestBase()}/api/admin/user-accounts/suspend-user-account/${encodeURIComponent(id)}`,
    {
      method: "POST",
      headers: getHeaders(token),
    },
  );
  return parseOrThrow<UserAccountRow>(res, "Failed to suspend user account.");
}

async function searchUserProfilesApi(
  token: string | null | undefined,
  q: string,
) {
  const url = new URL(
    `${apiRequestBase()}/api/admin/user-profiles/search-user-profiles`,
  );
  url.searchParams.set("q", q.trim());
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(token),
  });
  return parseOrThrow<UserProfileRow[]>(res, "Failed to search user profiles.");
}

async function searchUserAccountsApi(
  token: string | null | undefined,
  q: string,
) {
  const url = new URL(
    `${apiRequestBase()}/api/admin/user-accounts/search-user-accounts`,
  );
  url.searchParams.set("q", q.trim());
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(token),
  });
  return parseOrThrow<UserAccountRow[]>(res, "Failed to search user accounts.");
}

function Pill({
  children,
  active,
  onClick,
  radio,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** Use with role="radiogroup": button acts as a radio option. */
  radio?: boolean;
}) {
  const className = [
    "inline-flex rounded-full border px-4 py-1.5 text-sm font-medium transition",
    active
      ? "border-[#2F7A55] bg-[#2F7A55] text-white"
      : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
    onClick
      ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7A55]/40"
      : "",
  ].join(" ");

  if (onClick) {
    return (
      <button
        type="button"
        role={radio ? "radio" : undefined}
        aria-checked={radio ? active : undefined}
        onClick={onClick}
        className={className}
      >
        {children}
      </button>
    );
  }

  return <span className={className}>{children}</span>;
}

function SectionHeader({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actionLabel,
  onAction,
  filterLabel = "Filter",
  onFilter,
}: {
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  actionLabel: string;
  onAction?: () => void;
  filterLabel?: string;
  onFilter?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full min-w-[260px] rounded-full border border-gray-300 bg-white py-2 pl-8 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20"
          />
        </div>
        {onFilter ? (
          <button
            type="button"
            onClick={onFilter}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="size-4 text-gray-700"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5h18M6 12h12M10 19h4"
              />
            </svg>
            {filterLabel}
          </button>
        ) : null}
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2F7A55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            <span className="text-base leading-none">+</span>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
      <div className="max-h-[300px] overflow-auto bg-gray-100">{children}</div>
    </div>
  );
}

function DataTable<T extends { id: string }>({
  columns,
  rows,
}: {
  columns: { key: string; header: string; render: (row: T) => React.ReactNode }[];
  rows: T[];
}) {
  return (
    <table className="min-w-full border-separate border-spacing-0">
      <thead className="sticky top-0 z-10 bg-white">
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              scope="col"
              className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white">
        {rows.map((row, idx) => (
          <tr key={row.id} className={idx % 2 ? "bg-white" : "bg-gray-50/50"}>
            {columns.map((c) => (
              <td
                key={c.key}
                className="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-sm text-gray-800"
              >
                {c.render(row)}
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-10 text-center text-sm text-gray-500"
            >
              No data to display.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : tone === "danger"
          ? "bg-red-50 text-red-700 ring-red-200"
          : "bg-gray-50 text-gray-700 ring-gray-200";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        cls,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function ModalShell({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {description ? (
                  <p className="mt-1 text-sm text-gray-600">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-auto px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-800">{label}</span>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  inputMode,
  type,
  maxLength,
  minLength,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  maxLength?: number;
  minLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      maxLength={maxLength}
      minLength={minLength}
      className={[
        "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition",
        "focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20",
        disabled ? "cursor-not-allowed bg-gray-100 text-gray-500" : "",
      ].join(" ")}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#2F7A55] focus:ring-2 focus:ring-[#2F7A55]/20",
        disabled ? "cursor-not-allowed bg-gray-100 text-gray-500" : "",
      ].join(" ")}
    >
      {options.map((o) => (
        <option key={o.value || "__empty"} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function CheckboxInput({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-[#2F7A55] focus:ring-[#2F7A55]"
      />
      <span>{label}</span>
    </label>
  );
}

function PencilButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center justify-center rounded-full p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="size-4"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182L8.61 18.103a4.5 4.5 0 0 1-1.897 1.13l-2.62.874.874-2.62a4.5 4.5 0 0 1 1.13-1.897L16.862 3.487Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 4.5 19.5 8.25" />
      </svg>
    </button>
  );
}

function TrashButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="size-4"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 7l1 14h10l1-14M9 7V4h6v3"
        />
      </svg>
    </button>
  );
}

export default function AdminPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [userProfiles, setUserProfiles] = useState<UserProfileRow[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccountRow[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  /** Table list/search fetch only — not modal validation. */
  const [listLoadError, setListLoadError] = useState<string | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<{
    name?: string;
  }>({});
  const [profileSubmitError, setProfileSubmitError] = useState<string | null>(
    null,
  );
  const [accountFieldErrors, setAccountFieldErrors] = useState<{
    fullName?: string;
    username?: string;
    userProfileId?: string;
    password?: string;
  }>({});
  const [accountSubmitError, setAccountSubmitError] = useState<string | null>(
    null,
  );

  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openAccountModal, setOpenAccountModal] = useState(false);
  /** Which admin table is shown under Dashboard (radio-style: one at a time). */
  const [adminView, setAdminView] = useState<"profiles" | "accounts">(
    "profiles",
  );

  const [profileMode, setProfileMode] = useState<"create" | "edit">("create");
  const [accountMode, setAccountMode] = useState<"create" | "edit">("create");
  const [profileSearch, setProfileSearch] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const debouncedProfileSearch = useDebouncedValue(
    profileSearch,
    SEARCH_DEBOUNCE_MS,
  );
  const debouncedAccountSearch = useDebouncedValue(
    accountSearch,
    SEARCH_DEBOUNCE_MS,
  );

  const [profilePage, setProfilePage] = useState(0);
  const [accountPage, setAccountPage] = useState(0);

  const [profileDraft, setProfileDraft] = useState<UserProfileRow>(() => ({
    id: "",
    name: "",
    description: "",
  }));

  const [accountDraft, setAccountDraft] = useState<UserAccountRow>(() => ({
    id: "",
    fullName: "",
    username: "",
    userProfileId: "",
    userProfileName: "",
  }));
  const [accountPassword, setAccountPassword] = useState("");

  /** Full profile list for the account modal only (table search must not empty this dropdown). */
  const [accountModalProfiles, setAccountModalProfiles] = useState<
    UserProfileRow[]
  >([]);
  const [isLoadingAccountModalProfiles, setIsLoadingAccountModalProfiles] =
    useState(false);
  const [accountModalProfilesError, setAccountModalProfilesError] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!openAccountModal || !token) return;
    let cancelled = false;
    setIsLoadingAccountModalProfiles(true);
    setAccountModalProfilesError(null);
    void listUserProfiles(token)
      .then((rows) => {
        if (!cancelled) setAccountModalProfiles(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setAccountModalProfiles([]);
          setAccountModalProfilesError(
            e instanceof Error
              ? e.message
              : "Failed to load profiles for this form.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAccountModalProfiles(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openAccountModal, token]);

  useEffect(() => {
    if (isLoading || !user || !token) return;
    let cancelled = false;
    const qp = debouncedProfileSearch.trim();
    const qa = debouncedAccountSearch.trim();
    setIsDataLoading(true);
    setListLoadError(null);
    Promise.all([
      qp ? searchUserProfilesApi(token, qp) : listUserProfiles(token),
      qa ? searchUserAccountsApi(token, qa) : listUserAccounts(token),
    ])
      .then(([profiles, accounts]) => {
        if (cancelled) return;
        setUserProfiles(profiles);
        setUserAccounts(accounts);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setListLoadError(
          e instanceof Error ? e.message : "Failed to load admin data.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setIsDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, token, user, debouncedProfileSearch, debouncedAccountSearch]);

  useEffect(() => {
    setProfilePage(0);
  }, [debouncedProfileSearch]);

  useEffect(() => {
    setAccountPage(0);
  }, [debouncedAccountSearch]);

  const profileRowsPage = useMemo(() => {
    const start = profilePage * ADMIN_TABLE_PAGE_SIZE;
    return userProfiles.slice(start, start + ADMIN_TABLE_PAGE_SIZE);
  }, [userProfiles, profilePage]);

  const accountRowsPage = useMemo(() => {
    const start = accountPage * ADMIN_TABLE_PAGE_SIZE;
    return userAccounts.slice(start, start + ADMIN_TABLE_PAGE_SIZE);
  }, [userAccounts, accountPage]);

  const profileTotalPages = Math.max(
    1,
    Math.ceil(userProfiles.length / ADMIN_TABLE_PAGE_SIZE),
  );
  const accountTotalPages = Math.max(
    1,
    Math.ceil(userAccounts.length / ADMIN_TABLE_PAGE_SIZE),
  );

  const profileColumns = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        render: (r: UserProfileRow) => (
          <div className="flex items-center gap-2">
            <PencilButton
              label={`Edit profile: ${r.name}`}
              onClick={() => {
                setProfileMode("edit");
                setProfileDraft(r);
                setProfileFieldErrors({});
                setProfileSubmitError(null);
                setOpenProfileModal(true);
              }}
            />
            <span
              className="font-mono text-xs font-medium text-gray-700"
              title={r.id}
            >
              {r.id.length > 12 ? `${r.id.slice(0, 8)}…` : r.id}
            </span>
          </div>
        ),
      },
      { key: "name", header: "Name", render: (r: UserProfileRow) => r.name },
      {
        key: "description",
        header: "Description",
        render: (r: UserProfileRow) => r.description || "—",
      },
    ],
    [],
  );

  const accountColumns = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        render: (r: UserAccountRow) => (
          <div className="flex items-center gap-2">
            <PencilButton
              label={`Edit account: ${r.username}`}
              onClick={() => {
                setAccountMode("edit");
                setAccountDraft(r);
                setAccountPassword("");
                setAccountFieldErrors({});
                setAccountSubmitError(null);
                setOpenAccountModal(true);
              }}
            />
            <span
              className="font-mono text-xs font-medium text-gray-700"
              title={r.id}
            >
              {r.id.length > 12 ? `${r.id.slice(0, 8)}…` : r.id}
            </span>
          </div>
        ),
      },
      { key: "username", header: "Username", render: (r: UserAccountRow) => r.username },
      { key: "fullName", header: "Full Name", render: (r: UserAccountRow) => r.fullName },
      {
        key: "userProfileName",
        header: "User Profile",
        render: (r: UserAccountRow) => r.userProfileName,
      },
    ],
    [],
  );

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2F7A55] border-t-transparent" />
      </div>
    );
  }

  function openAddUserProfile() {
    setProfileMode("create");
    setProfileDraft({
      id: "",
      name: "",
      description: "",
    });
    setProfileFieldErrors({});
    setProfileSubmitError(null);
    setOpenProfileModal(true);
  }

  function openAddUserAccount() {
    setAccountMode("create");
    setAccountDraft({
      id: "",
      fullName: "",
      username: "",
      userProfileId: "",
      userProfileName: "",
    });
    setAccountPassword("");
    setAccountFieldErrors({});
    setAccountSubmitError(null);
    setOpenAccountModal(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm text-gray-600">Welcome, {user.fullName}!</p>
        <h1 id="admin-managing-heading" className="mt-1 text-2xl font-bold text-gray-900">
          Currently Managing
        </h1>

        <div
          className="mt-4 flex flex-wrap items-center gap-3"
          role="radiogroup"
          aria-labelledby="admin-managing-heading"
        >
          <Pill
            radio
            active={adminView === "profiles"}
            onClick={() => setAdminView("profiles")}
          >
            User Profiles
          </Pill>
          <Pill
            radio
            active={adminView === "accounts"}
            onClick={() => setAdminView("accounts")}
          >
            User Accounts
          </Pill>
        </div>

        {listLoadError ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listLoadError}
          </div>
        ) : null}

        <h2 className="mt-10 text-5xl font-extrabold tracking-tight text-[#2F7A55]">
          Dashboard
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {adminView === "profiles"
            ? "User profiles"
            : "User accounts"}
        </p>

        {adminView === "profiles" ? (
        <section className="mt-10">
          <SectionHeader
            title="User Profile"
            searchPlaceholder="Search by ID, name, description..."
            searchValue={profileSearch}
            onSearchChange={setProfileSearch}
            actionLabel="Add User Profile"
            onAction={openAddUserProfile}
          />
          <TableShell>
            <DataTable columns={profileColumns} rows={profileRowsPage} />
          </TableShell>
          {userProfiles.length > ADMIN_TABLE_PAGE_SIZE ? (
            <nav
              className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              aria-label="User profiles pagination"
            >
              <p className="text-sm text-gray-600">
                Page {profilePage + 1} of {profileTotalPages} ·{" "}
                {userProfiles.length} profiles
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={profilePage <= 0}
                  onClick={() => setProfilePage((p) => Math.max(0, p - 1))}
                  className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={profilePage >= profileTotalPages - 1}
                  onClick={() => setProfilePage((p) => p + 1)}
                  className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </section>
        ) : null}

        {adminView === "accounts" ? (
        <section className="mt-10">
          <SectionHeader
            title="User Account"
            searchPlaceholder="Search by ID, username, full name, profile..."
            searchValue={accountSearch}
            onSearchChange={setAccountSearch}
            actionLabel="Add User Account"
            onAction={openAddUserAccount}
          />
          <TableShell>
            <DataTable columns={accountColumns} rows={accountRowsPage} />
          </TableShell>
          {userAccounts.length > ADMIN_TABLE_PAGE_SIZE ? (
            <nav
              className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              aria-label="User accounts pagination"
            >
              <p className="text-sm text-gray-600">
                Page {accountPage + 1} of {accountTotalPages} ·{" "}
                {userAccounts.length} accounts
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={accountPage <= 0}
                  onClick={() => setAccountPage((p) => Math.max(0, p - 1))}
                  className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={accountPage >= accountTotalPages - 1}
                  onClick={() => setAccountPage((p) => p + 1)}
                  className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </section>
        ) : null}
      </div>

      <ModalShell
        open={openProfileModal}
        title={profileMode === "edit" ? "Edit User Profile" : "Add User Profile"}
        onClose={() => {
          setOpenProfileModal(false);
          setProfileFieldErrors({});
          setProfileSubmitError(null);
        }}
      >
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!token) return;
            const body: CreateUserProfileRequest | UpdateUserProfileRequest = {
              name: profileDraft.name.trim(),
              description: profileDraft.description ?? "",
            };
            if (!body.name) {
              setProfileFieldErrors({ name: "Profile name is required." });
              return;
            }
            setIsDataLoading(true);
            setProfileFieldErrors({});
            setProfileSubmitError(null);
            try {
              const saved =
                profileMode === "edit"
                  ? await updateUserProfile(token, profileDraft.id, body)
                  : await createUserProfile(token, body);
              setUserProfiles((prev) => {
                const exists = prev.some((p) => p.id === saved.id);
                return exists
                  ? prev.map((p) => (p.id === saved.id ? saved : p))
                  : [saved, ...prev];
              });
              setOpenProfileModal(false);
            } catch (err: unknown) {
              setProfileSubmitError(
                err instanceof Error ? err.message : "Failed to save user profile.",
              );
            } finally {
              setIsDataLoading(false);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Profile ID">
              <TextInput value={profileDraft.id || "Auto-generated"} disabled />
            </Field>
            <Field label="Name" error={profileFieldErrors.name}>
              <TextInput
                value={profileDraft.name}
                onChange={(v) => {
                  setProfileFieldErrors((e) => ({ ...e, name: undefined }));
                  setProfileDraft((p) => ({ ...p, name: v }));
                }}
                placeholder="e.g. Admin"
              />
            </Field>
            <Field label="Description">
              <TextInput
                value={profileDraft.description ?? ""}
                onChange={(v) =>
                  setProfileDraft((p) => ({ ...p, description: v }))
                }
                placeholder="Optional"
              />
            </Field>
          </div>

          {profileSubmitError ? (
            <div
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2"
              role="alert"
            >
              {profileSubmitError}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <div className="flex items-center justify-end gap-3">
              {profileMode === "edit" ? (
                <TrashButton
                  label="Suspend profile"
                  onClick={async () => {
                    if (!token) return;
                    setIsDataLoading(true);
                    setProfileSubmitError(null);
                    try {
                      await suspendUserProfile(token, profileDraft.id);
                      setUserProfiles((prev) =>
                        prev.filter((p) => p.id !== profileDraft.id),
                      );
                      setOpenProfileModal(false);
                    } catch (err: unknown) {
                      setProfileSubmitError(
                        err instanceof Error
                          ? err.message
                          : "Failed to suspend user profile.",
                      );
                    } finally {
                      setIsDataLoading(false);
                    }
                  }}
                />
              ) : null}
              <button
                type="button"
                onClick={() => setOpenProfileModal(false)}
                className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#2F7A55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={openAccountModal}
        title={accountMode === "edit" ? "Edit User Account" : "Add User Account"}
        onClose={() => {
          setOpenAccountModal(false);
          setAccountFieldErrors({});
          setAccountSubmitError(null);
        }}
      >
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!token) return;
            const selectedProfile = accountModalProfiles.find(
              (p) => p.id === accountDraft.userProfileId,
            );
            const nextAccountErrors: typeof accountFieldErrors = {};
            if (!accountDraft.fullName.trim()) {
              nextAccountErrors.fullName = "Full name is required.";
            }
            if (!accountDraft.username.trim()) {
              nextAccountErrors.username = "Username is required.";
            }
            if (!accountDraft.userProfileId) {
              nextAccountErrors.userProfileId = "User profile is required.";
            }
            if (accountMode === "create" && !accountPassword.trim()) {
              nextAccountErrors.password = "Password is required for new accounts.";
            } else if (
              accountMode === "create" &&
              accountPassword.trim().length > 0 &&
              accountPassword.length < 6
            ) {
              nextAccountErrors.password = "Password must be at least 6 characters.";
            } else if (
              accountMode === "edit" &&
              accountPassword.trim().length > 0 &&
              accountPassword.length < 6
            ) {
              nextAccountErrors.password = "Password must be at least 6 characters.";
            }
            if (Object.keys(nextAccountErrors).length > 0) {
              setAccountFieldErrors(nextAccountErrors);
              return;
            }

            setIsDataLoading(true);
            setAccountFieldErrors({});
            setAccountSubmitError(null);
            try {
              const saved =
                accountMode === "edit"
                  ? await updateUserAccount(token, accountDraft.id, {
                      fullName: accountDraft.fullName.trim(),
                      username: accountDraft.username.trim(),
                      userProfileId: accountDraft.userProfileId,
                      ...(accountPassword.trim()
                        ? { password: accountPassword }
                        : {}),
                    } satisfies UpdateUserAccountRequest)
                  : await createUserAccount(token, {
                      fullName: accountDraft.fullName.trim(),
                      username: accountDraft.username.trim(),
                      userProfileId: accountDraft.userProfileId,
                      password: accountPassword,
                    } satisfies CreateUserAccountRequest);

              // Prefer profile name from save response; fall back to selection
              const merged: UserAccountRow = {
                ...saved,
                userProfileName:
                  saved.userProfileName ||
                  selectedProfile?.name ||
                  accountDraft.userProfileName,
              };

              setUserAccounts((prev) => {
                const exists = prev.some((a) => a.id === merged.id);
                return exists
                  ? prev.map((a) => (a.id === merged.id ? merged : a))
                  : [merged, ...prev];
              });
              setAccountPassword("");
              setOpenAccountModal(false);
            } catch (err: unknown) {
              setAccountSubmitError(
                err instanceof Error ? err.message : "Failed to save user account.",
              );
            } finally {
              setIsDataLoading(false);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Account ID">
              <TextInput value={accountDraft.id || "Auto-generated"} disabled />
            </Field>
            <Field label="Username" error={accountFieldErrors.username}>
              <TextInput
                value={accountDraft.username}
                onChange={(v) => {
                  setAccountFieldErrors((e) => ({ ...e, username: undefined }));
                  setAccountDraft((a) => ({ ...a, username: v }));
                }}
                placeholder="e.g. jane_doe"
              />
            </Field>
            <Field label="Full Name" error={accountFieldErrors.fullName}>
              <TextInput
                value={accountDraft.fullName}
                onChange={(v) => {
                  setAccountFieldErrors((e) => ({ ...e, fullName: undefined }));
                  setAccountDraft((a) => ({ ...a, fullName: v }));
                }}
                placeholder="e.g. Jane Doe"
              />
            </Field>
            <Field label="User Profile" error={accountFieldErrors.userProfileId}>
              {accountModalProfilesError ? (
                <p className="mb-2 text-sm text-red-600">{accountModalProfilesError}</p>
              ) : null}
              <SelectInput
                value={accountDraft.userProfileId}
                disabled={isLoadingAccountModalProfiles || Boolean(accountModalProfilesError)}
                onChange={(v) => {
                  setAccountFieldErrors((e) => ({ ...e, userProfileId: undefined }));
                  const p = accountModalProfiles.find((x) => x.id === v);
                  setAccountDraft((a) => ({
                    ...a,
                    userProfileId: v,
                    userProfileName: p?.name || a.userProfileName,
                  }));
                }}
                options={
                  isLoadingAccountModalProfiles
                    ? [{ value: "", label: "Loading profiles…" }]
                    : accountModalProfilesError
                      ? [{ value: "", label: "—" }]
                      : [
                          { value: "", label: "Select profile" },
                          ...accountModalProfiles
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((p) => ({ value: p.id, label: p.name })),
                        ]
                }
              />
            </Field>
            <Field
              label={accountMode === "edit" ? "Password (optional)" : "Password"}
              error={accountFieldErrors.password}
            >
              <TextInput
                type="password"
                value={accountPassword}
                onChange={(v) => {
                  setAccountFieldErrors((e) => ({ ...e, password: undefined }));
                  setAccountPassword(v);
                }}
                placeholder={accountMode === "edit" ? "Leave blank to keep unchanged" : "Enter a password"}
                maxLength={72}
              />
            </Field>
          </div>

          {accountSubmitError ? (
            <div
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {accountSubmitError}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <div className="flex items-center justify-end gap-3">
              {accountMode === "edit" ? (
                <TrashButton
                  label="Suspend account"
                  onClick={async () => {
                    if (!token) return;
                    setIsDataLoading(true);
                    setAccountSubmitError(null);
                    try {
                      await suspendUserAccount(token, accountDraft.id);
                      setUserAccounts((prev) =>
                        prev.filter((a) => a.id !== accountDraft.id),
                      );
                      setOpenAccountModal(false);
                    } catch (err: unknown) {
                      setAccountSubmitError(
                        err instanceof Error
                          ? err.message
                          : "Failed to suspend user account.",
                      );
                    } finally {
                      setIsDataLoading(false);
                    }
                  }}
                />
              ) : null}
              <button
                type="button"
                onClick={() => setOpenAccountModal(false)}
                className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#2F7A55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}

