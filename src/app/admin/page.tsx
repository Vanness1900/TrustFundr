"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  api,
  type CreateUserAccountRequest,
  type CreateUserProfileRequest,
  type UpdateUserAccountRequest,
  type UpdateUserProfileRequest,
} from "@/lib/api";

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

function Pill({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-4 py-1.5 text-sm font-medium transition",
        active
          ? "border-[#2f7a55] bg-[#2f7a55] text-white"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </span>
  );
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
            className="w-full min-w-[260px] rounded-full border border-gray-300 bg-white py-2 pl-8 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#2f7a55] focus:ring-2 focus:ring-[#2f7a55]/20"
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
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f7a55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286a4a]"
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-800">{label}</span>
      {children}
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
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      className={[
        "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition",
        "focus:border-[#2f7a55] focus:ring-2 focus:ring-[#2f7a55]/20",
        disabled ? "cursor-not-allowed bg-gray-100 text-gray-500" : "",
      ].join(" ")}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#2f7a55] focus:ring-2 focus:ring-[#2f7a55]/20"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
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
        className="h-4 w-4 rounded border-gray-300 text-[#2f7a55] focus:ring-[#2f7a55]"
      />
      <span>{label}</span>
    </label>
  );
}

function newId(prefix: string) {
  // Short, readable, unique-enough for demo UI state.
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${n}`;
}

function PencilButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
  const { user, token, isLoading, logout } = useAuth();
  const router = useRouter();
  const [userProfiles, setUserProfiles] = useState<UserProfileRow[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccountRow[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openAccountModal, setOpenAccountModal] = useState(false);

  const [profileMode, setProfileMode] = useState<"create" | "edit">("create");
  const [accountMode, setAccountMode] = useState<"create" | "edit">("create");
  const [profileSearch, setProfileSearch] = useState("");
  const [accountSearch, setAccountSearch] = useState("");

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

  const filteredUserProfiles = useMemo(() => {
    const q = profileSearch.trim().toLowerCase();
    return userProfiles.filter((p) => {
      const matchesText =
        !q ||
        [p.id, p.name, p.description ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesText;
    });
  }, [userProfiles, profileSearch]);

  const filteredUserAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    return userAccounts.filter((a) => {
      const matchesText =
        !q ||
        [
          a.id,
          a.username,
          a.fullName,
          a.userProfileId,
          a.userProfileName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesText;
    });
  }, [userAccounts, accountSearch]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (isLoading || !user || !token) return;
    let cancelled = false;
    setIsDataLoading(true);
    setDataError(null);
    Promise.all([api.listUserProfiles(token), api.listUserAccounts(token)])
      .then(([profiles, accounts]) => {
        if (cancelled) return;
        setUserProfiles(profiles);
        setUserAccounts(accounts);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setDataError(e instanceof Error ? e.message : "Failed to load admin data.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, token, user]);

  const profileColumns = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        render: (r: UserProfileRow) => (
          <div className="flex items-center gap-2">
            <PencilButton
              label={`Edit ${r.id}`}
              onClick={() => {
                setProfileMode("edit");
                setProfileDraft(r);
                setOpenProfileModal(true);
              }}
            />
            <span className="font-medium">{r.id}</span>
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
              label={`Edit ${r.id}`}
              onClick={() => {
                setAccountMode("edit");
                setAccountDraft(r);
                setAccountPassword("");
                setOpenAccountModal(true);
              }}
            />
            <span className="font-medium">{r.id}</span>
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
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f7a55] border-t-transparent" />
      </main>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function openAddUserProfile() {
    setProfileMode("create");
    setProfileDraft({
      id: "",
      name: "",
      description: "",
    });
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
    setOpenAccountModal(true);
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold tracking-tight text-[#2f7a55]">
              TrustFundr
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f7a55] text-sm font-extrabold text-white"
              aria-label="Admin avatar"
              title={user.fullName}
            >
              T
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm text-gray-600">Welcome, {user.fullName}!</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Currently Managing
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Pill active>User Profiles</Pill>
          <Pill active>User Accounts</Pill>

          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>

        {dataError ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {dataError}
          </div>
        ) : null}

        <h2 className="mt-10 text-5xl font-extrabold tracking-tight text-[#2f7a55]">
          Dashboard
        </h2>

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
            <DataTable columns={profileColumns} rows={filteredUserProfiles} />
          </TableShell>
        </section>

        <section className="mt-12">
          <SectionHeader
            title="User Account"
            searchPlaceholder="Search by ID, username, full name, profile..."
            searchValue={accountSearch}
            onSearchChange={setAccountSearch}
            actionLabel="Add User Account"
            onAction={openAddUserAccount}
          />
          <TableShell>
            <DataTable columns={accountColumns} rows={filteredUserAccounts} />
          </TableShell>
        </section>
      </div>

      <ModalShell
        open={openProfileModal}
        title={profileMode === "edit" ? "Edit User Profile" : "Add User Profile"}
        description="User profiles map to backend table user_profiles."
        onClose={() => setOpenProfileModal(false)}
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
              setDataError("Profile name is required.");
              return;
            }
            setIsDataLoading(true);
            setDataError(null);
            try {
              const saved =
                profileMode === "edit"
                  ? await api.updateUserProfile(token, profileDraft.id, body)
                  : await api.createUserProfile(token, body);
              setUserProfiles((prev) => {
                const exists = prev.some((p) => p.id === saved.id);
                return exists
                  ? prev.map((p) => (p.id === saved.id ? saved : p))
                  : [saved, ...prev];
              });
              setOpenProfileModal(false);
            } catch (err: unknown) {
              setDataError(err instanceof Error ? err.message : "Failed to save user profile.");
            } finally {
              setIsDataLoading(false);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Profile ID">
              <TextInput value={profileDraft.id || "Auto-generated"} disabled />
            </Field>
            <Field label="Name">
              <TextInput
                value={profileDraft.name}
                onChange={(v) => setProfileDraft((p) => ({ ...p, name: v }))}
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

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <div className="flex items-center justify-end gap-3">
              {profileMode === "edit" ? (
                <TrashButton
                  label="Suspend profile"
                  onClick={async () => {
                    if (!token) return;
                    setIsDataLoading(true);
                    setDataError(null);
                    try {
                      await api.suspendUserProfile(token, profileDraft.id);
                      setUserProfiles((prev) =>
                        prev.filter((p) => p.id !== profileDraft.id),
                      );
                      setOpenProfileModal(false);
                    } catch (err: unknown) {
                      setDataError(
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
                className="rounded-full bg-[#2f7a55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286a4a]"
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
        description="User accounts map to backend table user_accounts."
        onClose={() => setOpenAccountModal(false)}
      >
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!token) return;
            const selectedProfile = userProfiles.find(
              (p) => p.id === accountDraft.userProfileId,
            );
            if (!accountDraft.fullName.trim()) {
              setDataError("Full name is required.");
              return;
            }
            if (!accountDraft.username.trim()) {
              setDataError("Username is required.");
              return;
            }
            if (!accountDraft.userProfileId) {
              setDataError("User profile is required.");
              return;
            }
            if (accountMode === "create" && !accountPassword.trim()) {
              setDataError("Password is required for new accounts.");
              return;
            }

            setIsDataLoading(true);
            setDataError(null);
            try {
              const saved =
                accountMode === "edit"
                  ? await api.updateUserAccount(token, accountDraft.id, {
                      fullName: accountDraft.fullName.trim(),
                      username: accountDraft.username.trim(),
                      userProfileId: accountDraft.userProfileId,
                      ...(accountPassword.trim()
                        ? { password: accountPassword }
                        : {}),
                    } satisfies UpdateUserAccountRequest)
                  : await api.createUserAccount(token, {
                      fullName: accountDraft.fullName.trim(),
                      username: accountDraft.username.trim(),
                      userProfileId: accountDraft.userProfileId,
                      password: accountPassword,
                    } satisfies CreateUserAccountRequest);

              // Ensure display name matches selected profile (backend also returns name)
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
              setDataError(
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
            <Field label="Username">
              <TextInput
                value={accountDraft.username}
                onChange={(v) => setAccountDraft((a) => ({ ...a, username: v }))}
                placeholder="e.g. jane_doe"
              />
            </Field>
            <Field label="Full Name">
              <TextInput
                value={accountDraft.fullName}
                onChange={(v) => setAccountDraft((a) => ({ ...a, fullName: v }))}
                placeholder="e.g. Jane Doe"
              />
            </Field>
            <Field label="User Profile">
              <SelectInput
                value={accountDraft.userProfileId}
                onChange={(v) => {
                  const p = userProfiles.find((x) => x.id === v);
                  setAccountDraft((a) => ({
                    ...a,
                    userProfileId: v,
                    userProfileName: p?.name || a.userProfileName,
                  }));
                }}
                options={[
                  { value: "", label: "Select profile" },
                  ...userProfiles
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </Field>
            <Field label={accountMode === "edit" ? "Password (optional)" : "Password"}>
              <TextInput
                type="password"
                value={accountPassword}
                onChange={setAccountPassword}
                placeholder={accountMode === "edit" ? "Leave blank to keep unchanged" : "Enter a password"}
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <div className="flex items-center justify-end gap-3">
              {accountMode === "edit" ? (
                <TrashButton
                  label="Suspend account"
                  onClick={async () => {
                    if (!token) return;
                    setIsDataLoading(true);
                    setDataError(null);
                    try {
                      await api.suspendUserAccount(token, accountDraft.id);
                      setUserAccounts((prev) =>
                        prev.filter((a) => a.id !== accountDraft.id),
                      );
                      setOpenAccountModal(false);
                    } catch (err: unknown) {
                      setDataError(
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
                className="rounded-full bg-[#2f7a55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286a4a]"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </ModalShell>
    </main>
  );
}

