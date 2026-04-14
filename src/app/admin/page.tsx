"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

type UserProfileRow = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  status: "Active" | "Suspended" | "Pending";
  createdAt: string;
};

type UserAccountRow = {
  id: string;
  username: string;
  fullName?: string;
  accountNumber: string;
  accountType: "Personal" | "Business" | "Charity";
  bankName: string;
  currency: string;
  balance: number;
  verified: boolean;
};

type RoleRow = {
  id: string;
  role: string;
  privileges: string[];
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
  actionLabel,
  onAction,
  filterLabel = "Filter",
  onFilter,
}: {
  title: string;
  searchPlaceholder: string;
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
            className="w-full min-w-[260px] rounded-full border border-gray-300 bg-white py-2 pl-8 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#2f7a55] focus:ring-2 focus:ring-[#2f7a55]/20"
          />
        </div>
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
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f7a55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286a4a]"
        >
          <span className="text-base leading-none">+</span>
          {actionLabel}
        </button>
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
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
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
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "User" | "Something" | "Something2" | "Something3" | "Something4"
  >("User");

  const [userProfiles, setUserProfiles] = useState<UserProfileRow[]>(() => [
    {
      id: "U-1001",
      username: "admin01",
      fullName: "Admin One",
      email: "admin01@trustfundr.test",
      phone: "+60 12-345 6789",
      status: "Active",
      createdAt: "2026-03-02",
    },
    {
      id: "U-1002",
      username: "jane_doe",
      fullName: "Jane Doe",
      email: "jane.doe@trustfundr.test",
      phone: "+60 11-222 3333",
      status: "Pending",
      createdAt: "2026-03-19",
    },
    {
      id: "U-1003",
      username: "john_smith",
      fullName: "John Smith",
      email: "john.smith@trustfundr.test",
      phone: "+60 16-777 8888",
      status: "Suspended",
      createdAt: "2026-04-04",
    },
  ]);

  const [userAccounts, setUserAccounts] = useState<UserAccountRow[]>(() => [
    {
      id: "A-2001",
      username: "admin01",
      fullName: "Admin One",
      accountNumber: "TF-0001029384",
      accountType: "Business",
      bankName: "TrustFundr Bank",
      currency: "MYR",
      balance: 125000.5,
      verified: true,
    },
    {
      id: "A-2002",
      username: "jane_doe",
      fullName: "Jane Doe",
      accountNumber: "TF-0005647382",
      accountType: "Personal",
      bankName: "Maybank",
      currency: "MYR",
      balance: 245.0,
      verified: false,
    },
    {
      id: "A-2003",
      username: "john_smith",
      fullName: "John Smith",
      accountNumber: "TF-0009182736",
      accountType: "Charity",
      bankName: "CIMB",
      currency: "MYR",
      balance: 8760.75,
      verified: true,
    },
  ]);

  const [roles, setRoles] = useState<RoleRow[]>(() => [
    {
      id: "R-3001",
      role: "Admin",
      privileges: [
        "Manage users",
        "Manage accounts",
        "Manage roles & permissions",
        "View audit logs",
      ],
    },
    {
      id: "R-3002",
      role: "Staff",
      privileges: ["View users", "Approve KYC", "Respond to support tickets"],
    },
    {
      id: "R-3003",
      role: "Donor",
      privileges: ["Browse campaigns", "Donate", "View donation history"],
    },
    {
      id: "R-3004",
      role: "Creator",
      privileges: ["Create campaigns", "Edit campaigns", "Withdraw funds"],
    },
  ]);

  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openAccountModal, setOpenAccountModal] = useState(false);
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [openProfileFilterModal, setOpenProfileFilterModal] = useState(false);
  const [openAccountFilterModal, setOpenAccountFilterModal] = useState(false);
  const [openRoleFilterModal, setOpenRoleFilterModal] = useState(false);

  const [profileMode, setProfileMode] = useState<"create" | "edit">("create");
  const [accountMode, setAccountMode] = useState<"create" | "edit">("create");
  const [roleMode, setRoleMode] = useState<"create" | "edit" | "view">("create");

  const [profileFilterDraft, setProfileFilterDraft] = useState<{
    text: string;
    status: "" | UserProfileRow["status"];
    createdFrom: string;
    createdTo: string;
  }>(() => ({ text: "", status: "", createdFrom: "", createdTo: "" }));
  const [profileFilterApplied, setProfileFilterApplied] = useState<{
    text: string;
    status: "" | UserProfileRow["status"];
    createdFrom: string;
    createdTo: string;
  }>(() => ({ text: "", status: "", createdFrom: "", createdTo: "" }));

  const [accountFilterDraft, setAccountFilterDraft] = useState<{
    text: string;
    verified: "" | "Yes" | "No";
    accountType: "" | UserAccountRow["accountType"];
    currency: string;
    balanceMin: number | null;
    balanceMax: number | null;
  }>(() => ({ text: "", verified: "", accountType: "", currency: "", balanceMin: null, balanceMax: null }));
  const [accountFilterApplied, setAccountFilterApplied] = useState<{
    text: string;
    verified: "" | "Yes" | "No";
    accountType: "" | UserAccountRow["accountType"];
    currency: string;
    balanceMin: number | null;
    balanceMax: number | null;
  }>(() => ({ text: "", verified: "", accountType: "", currency: "", balanceMin: null, balanceMax: null }));

  const [roleFilterDraft, setRoleFilterDraft] = useState<{ text: string }>(() => ({ text: "" }));
  const [roleFilterApplied, setRoleFilterApplied] = useState<{ text: string }>(() => ({
    text: "",
  }));

  const [profileDraft, setProfileDraft] = useState<UserProfileRow>(() => ({
    id: newId("U"),
    username: "",
    fullName: "",
    email: "",
    phone: "",
    status: "Pending",
    createdAt: new Date().toISOString().slice(0, 10),
  }));

  const [accountDraft, setAccountDraft] = useState<UserAccountRow>(() => ({
    id: newId("A"),
    username: "",
    fullName: "",
    accountNumber: "",
    accountType: "Personal",
    bankName: "",
    currency: "MYR",
    balance: 0,
    verified: false,
  }));

  const [roleDraft, setRoleDraft] = useState<{
    id: string;
    role: string;
    privileges: string[];
  }>(() => ({
    id: newId("R"),
    role: "",
    privileges: [],
  }));
  const [rolePrivilegeInput, setRolePrivilegeInput] = useState("");

  const filteredUserProfiles = useMemo(() => {
    const q = profileFilterApplied.text.trim().toLowerCase();
    return userProfiles.filter((p) => {
      const matchesText =
        !q ||
        [p.id, p.username, p.fullName, p.email, p.phone, p.createdAt]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus =
        !profileFilterApplied.status || p.status === profileFilterApplied.status;

      const created = new Date(p.createdAt).getTime();
      const fromOk = !profileFilterApplied.createdFrom
        ? true
        : created >= new Date(profileFilterApplied.createdFrom).getTime();
      const toOk = !profileFilterApplied.createdTo
        ? true
        : created <= new Date(profileFilterApplied.createdTo).getTime();

      return matchesText && matchesStatus && fromOk && toOk;
    });
  }, [userProfiles, profileFilterApplied]);

  const accountCurrencyOptions = useMemo(() => {
    const set = new Set(userAccounts.map((a) => a.currency).filter(Boolean));
    return Array.from(set).sort();
  }, [userAccounts]);

  const accountBalanceBounds = useMemo(() => {
    if (userAccounts.length === 0) return { min: 0, max: 0 };
    const balances = userAccounts.map((a) => a.balance);
    return {
      min: Math.floor(Math.min(...balances)),
      max: Math.ceil(Math.max(...balances)),
    };
  }, [userAccounts]);

  const filteredUserAccounts = useMemo(() => {
    const q = accountFilterApplied.text.trim().toLowerCase();
    return userAccounts.filter((a) => {
      const matchesText =
        !q ||
        [a.id, a.username, a.fullName ?? "", a.accountNumber, a.bankName, a.currency]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesVerified =
        !accountFilterApplied.verified ||
        (accountFilterApplied.verified === "Yes" ? a.verified : !a.verified);
      const matchesType = !accountFilterApplied.accountType || a.accountType === accountFilterApplied.accountType;
      const matchesCurrency = !accountFilterApplied.currency || a.currency === accountFilterApplied.currency;
      const matchesBalanceMin =
        accountFilterApplied.balanceMin == null ? true : a.balance >= accountFilterApplied.balanceMin;
      const matchesBalanceMax =
        accountFilterApplied.balanceMax == null ? true : a.balance <= accountFilterApplied.balanceMax;

      return matchesText && matchesVerified && matchesType && matchesCurrency && matchesBalanceMin && matchesBalanceMax;
    });
  }, [userAccounts, accountFilterApplied]);

  const filteredRoles = useMemo(() => {
    const q = roleFilterApplied.text.trim().toLowerCase();
    return roles.filter((r) => {
      if (!q) return true;
      return [r.id, r.role, r.privileges.join(" ")].join(" ").toLowerCase().includes(q);
    });
  }, [roles, roleFilterApplied]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

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
      { key: "username", header: "User Name", render: (r: UserProfileRow) => r.username },
      { key: "fullName", header: "Full Name", render: (r: UserProfileRow) => r.fullName },
      { key: "email", header: "Email", render: (r: UserProfileRow) => r.email },
      { key: "phone", header: "Phone", render: (r: UserProfileRow) => r.phone },
      {
        key: "status",
        header: "Status",
        render: (r: UserProfileRow) => (
          <Badge
            tone={
              r.status === "Active"
                ? "success"
                : r.status === "Pending"
                  ? "warning"
                  : "danger"
            }
          >
            {r.status}
          </Badge>
        ),
      },
      { key: "createdAt", header: "Created", render: (r: UserProfileRow) => r.createdAt },
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
                setOpenAccountModal(true);
              }}
            />
            <span className="font-medium">{r.id}</span>
          </div>
        ),
      },
      { key: "username", header: "User Name", render: (r: UserAccountRow) => r.username },
      {
        key: "accountNumber",
        header: "Account Number",
        render: (r: UserAccountRow) => (
          <span className="font-mono text-xs text-gray-800">{r.accountNumber}</span>
        ),
      },
      { key: "accountType", header: "Type", render: (r: UserAccountRow) => r.accountType },
      { key: "bankName", header: "Bank", render: (r: UserAccountRow) => r.bankName },
      { key: "currency", header: "Currency", render: (r: UserAccountRow) => r.currency },
      {
        key: "balance",
        header: "Balance",
        render: (r: UserAccountRow) =>
          new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: r.currency,
          }).format(r.balance),
      },
      {
        key: "verified",
        header: "Verified",
        render: (r: UserAccountRow) =>
          r.verified ? <Badge tone="success">Yes</Badge> : <Badge tone="warning">No</Badge>,
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
      id: newId("U"),
      username: "",
      fullName: "",
      email: "",
      phone: "",
      status: "Pending",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setOpenProfileModal(true);
  }

  function openAddUserAccount() {
    setAccountMode("create");
    setAccountDraft({
      id: newId("A"),
      username: "",
      fullName: "",
      accountNumber: "",
      accountType: "Personal",
      bankName: "",
      currency: "MYR",
      balance: 0,
      verified: false,
    });
    setOpenAccountModal(true);
  }

  function openAddRole() {
    setRoleMode("create");
    setRoleDraft({
      id: newId("R"),
      role: "",
      privileges: [],
    });
    setRolePrivilegeInput("");
    setOpenRoleModal(true);
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

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => setActiveTab("User")}>
            <Pill active={activeTab === "User"}>User</Pill>
          </button>
          <button type="button" onClick={() => setActiveTab("Something")}>
            <Pill active={activeTab === "Something"}>Something</Pill>
          </button>
          <button type="button" onClick={() => setActiveTab("Something2")}>
            <Pill active={activeTab === "Something2"}>Something</Pill>
          </button>
          <button type="button" onClick={() => setActiveTab("Something3")}>
            <Pill active={activeTab === "Something3"}>Something</Pill>
          </button>
          <button type="button" onClick={() => setActiveTab("Something4")}>
            <Pill active={activeTab === "Something4"}>Something</Pill>
          </button>

          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>

        <h2 className="mt-10 text-5xl font-extrabold tracking-tight text-[#2f7a55]">
          Dashboard
        </h2>

        <section className="mt-10">
          <SectionHeader
            title="User Profile"
            searchPlaceholder="Start searching"
            actionLabel="Add User Profile"
            onAction={openAddUserProfile}
            onFilter={() => {
              setProfileFilterDraft(profileFilterApplied);
              setOpenProfileFilterModal(true);
            }}
          />
          <TableShell>
            <DataTable columns={profileColumns} rows={filteredUserProfiles} />
          </TableShell>
        </section>

        <section className="mt-12">
          <SectionHeader
            title="User Account"
            searchPlaceholder="Start searching"
            actionLabel="Add User Account"
            onAction={openAddUserAccount}
            onFilter={() => {
              setAccountFilterDraft(accountFilterApplied);
              setOpenAccountFilterModal(true);
            }}
          />
          <TableShell>
            <DataTable columns={accountColumns} rows={filteredUserAccounts} />
          </TableShell>
        </section>

        <section className="mt-12 pb-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Roles</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </span>
                <input
                  type="search"
                  placeholder="Start searching"
                  className="w-full min-w-[260px] rounded-full border border-gray-300 bg-white py-2 pl-8 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#2f7a55] focus:ring-2 focus:ring-[#2f7a55]/20"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setRoleFilterDraft(roleFilterApplied);
                  setOpenRoleFilterModal(true);
                }}
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
                Filter
              </button>
              <button
                type="button"
                onClick={openAddRole}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f7a55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286a4a]"
              >
                <span className="text-base leading-none">+</span>
                Add Role
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
            <ul className="max-h-[300px] divide-y divide-gray-200 overflow-auto bg-white">
              {filteredRoles.map((r) => (
                <li key={r.id} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {r.role}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.privileges.map((p) => (
                          <Badge key={p}>{p}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRoleMode("edit");
                          setRoleDraft({
                            id: r.id,
                            role: r.role,
                            privileges: r.privileges,
                          });
                          setRolePrivilegeInput("");
                          setOpenRoleModal(true);
                        }}
                        className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <ModalShell
        open={openProfileModal}
        title={profileMode === "edit" ? "Edit User Profile" : "Add User Profile"}
        description="Fill in the user’s details. The ID is auto-generated and cannot be changed."
        onClose={() => setOpenProfileModal(false)}
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (profileMode === "edit") {
              setUserProfiles((prev) => prev.map((p) => (p.id === profileDraft.id ? profileDraft : p)));
            } else {
              setUserProfiles((prev) => [profileDraft, ...prev]);
            }
            setOpenProfileModal(false);
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="User ID">
              <TextInput value={profileDraft.id} disabled />
            </Field>
            <Field label="User Name">
              <TextInput
                value={profileDraft.username}
                onChange={(v) => setProfileDraft((p) => ({ ...p, username: v }))}
                placeholder="e.g. jane_doe"
              />
            </Field>
            <Field label="Full Name">
              <TextInput
                value={profileDraft.fullName}
                onChange={(v) => setProfileDraft((p) => ({ ...p, fullName: v }))}
                placeholder="e.g. Jane Doe"
              />
            </Field>
            <Field label="Email">
              <TextInput
                value={profileDraft.email}
                onChange={(v) => setProfileDraft((p) => ({ ...p, email: v }))}
                placeholder="e.g. jane@example.com"
              />
            </Field>
            <Field label="Phone">
              <TextInput
                value={profileDraft.phone}
                onChange={(v) => setProfileDraft((p) => ({ ...p, phone: v }))}
                placeholder="e.g. +60 11-222 3333"
              />
            </Field>
            <Field label="Status">
              <SelectInput
                value={profileDraft.status}
                onChange={(v) =>
                  setProfileDraft((p) => ({
                    ...p,
                    status: v as UserProfileRow["status"],
                  }))
                }
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Pending", label: "Pending" },
                  { value: "Suspended", label: "Suspended" },
                ]}
              />
            </Field>
            <Field label="Created Date">
              <TextInput
                value={profileDraft.createdAt}
                onChange={(v) => setProfileDraft((p) => ({ ...p, createdAt: v }))}
                placeholder="YYYY-MM-DD"
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <div className="flex items-center justify-end gap-3">
              {profileMode === "edit" ? (
                <TrashButton
                  label="Delete account"
                  onClick={() => {
                    setUserProfiles((prev) => prev.filter((p) => p.id !== profileDraft.id));
                    setOpenProfileModal(false);
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
        description="Enter account details. The ID is auto-generated and cannot be changed."
        onClose={() => setOpenAccountModal(false)}
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (accountMode === "edit") {
              setUserAccounts((prev) => prev.map((a) => (a.id === accountDraft.id ? accountDraft : a)));
            } else {
              setUserAccounts((prev) => [accountDraft, ...prev]);
            }
            setOpenAccountModal(false);
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Account ID">
              <TextInput value={accountDraft.id} disabled />
            </Field>
            <Field label="User Name">
              <TextInput
                value={accountDraft.username}
                onChange={(v) => setAccountDraft((a) => ({ ...a, username: v }))}
                placeholder="e.g. jane_doe"
              />
            </Field>
            <Field label="Full Name">
              <TextInput
                value={accountDraft.fullName ?? ""}
                onChange={(v) => setAccountDraft((a) => ({ ...a, fullName: v }))}
                placeholder="e.g. Jane Doe"
              />
            </Field>
            <Field label="Account Number">
              <TextInput
                value={accountDraft.accountNumber}
                onChange={(v) => setAccountDraft((a) => ({ ...a, accountNumber: v }))}
                placeholder="e.g. TF-0001234567"
              />
            </Field>
            <Field label="Account Type">
              <SelectInput
                value={accountDraft.accountType}
                onChange={(v) =>
                  setAccountDraft((a) => ({
                    ...a,
                    accountType: v as UserAccountRow["accountType"],
                  }))
                }
                options={[
                  { value: "Personal", label: "Personal" },
                  { value: "Business", label: "Business" },
                  { value: "Charity", label: "Charity" },
                ]}
              />
            </Field>
            <Field label="Bank Name">
              <TextInput
                value={accountDraft.bankName}
                onChange={(v) => setAccountDraft((a) => ({ ...a, bankName: v }))}
                placeholder="e.g. Maybank"
              />
            </Field>
            <Field label="Currency">
              <TextInput
                value={accountDraft.currency}
                onChange={(v) => setAccountDraft((a) => ({ ...a, currency: v.toUpperCase() }))}
                placeholder="e.g. MYR"
              />
            </Field>
            <Field label="Balance">
              <TextInput
                value={String(accountDraft.balance)}
                onChange={(v) =>
                  setAccountDraft((a) => ({
                    ...a,
                    balance: Number.isFinite(Number(v)) ? Number(v) : a.balance,
                  }))
                }
                inputMode="decimal"
                placeholder="e.g. 0"
              />
            </Field>
          </div>

          <div className="pt-1">
            <CheckboxInput
              checked={accountDraft.verified}
              onChange={(v) => setAccountDraft((a) => ({ ...a, verified: v }))}
              label="Verified"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <div className="flex items-center justify-end gap-3">
              {accountMode === "edit" ? (
                <TrashButton
                  label="Delete account"
                  onClick={() => {
                    setUserAccounts((prev) => prev.filter((a) => a.id !== accountDraft.id));
                    setOpenAccountModal(false);
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

      <ModalShell
        open={openRoleModal}
        title={roleMode === "edit" ? "Edit Role" : "Add Role"}
        description="Define the role and its privileges. The ID is auto-generated and cannot be changed."
        onClose={() => setOpenRoleModal(false)}
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const privileges = roleDraft.privileges;
            if (roleMode === "edit") {
              setRoles((prev) =>
                prev.map((r) =>
                  r.id === roleDraft.id ? { id: roleDraft.id, role: roleDraft.role, privileges } : r,
                ),
              );
            } else if (roleMode === "create") {
              setRoles((prev) => [{ id: roleDraft.id, role: roleDraft.role, privileges }, ...prev]);
            }
            setOpenRoleModal(false);
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Role ID">
              <TextInput value={roleDraft.id} disabled />
            </Field>
            <Field label="Role Name">
              <TextInput
                value={roleDraft.role}
                onChange={(v) => setRoleDraft((r) => ({ ...r, role: v }))}
                placeholder="e.g. Auditor"
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-800">Privileges</div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="max-h-40 space-y-2 overflow-auto pr-1">
                {Array.from(
                  new Set(roles.flatMap((r) => r.privileges).concat(roleDraft.privileges)),
                )
                  .filter(Boolean)
                  .sort()
                  .map((p) => {
                    const checked = roleDraft.privileges.includes(p);
                    return (
                      <label key={p} className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? Array.from(new Set([...roleDraft.privileges, p]))
                              : roleDraft.privileges.filter((x) => x !== p);
                            setRoleDraft((r) => ({ ...r, privileges: next }));
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[#2f7a55] focus:ring-[#2f7a55]"
                        />
                        <span>{p}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <TextInput
                value={rolePrivilegeInput}
                onChange={setRolePrivilegeInput}
                placeholder="Add a new privilege (optional)"
              />
              <button
                type="button"
                onClick={() => {
                  const v = rolePrivilegeInput.trim();
                  if (!v) return;
                  setRoleDraft((r) => ({
                    ...r,
                    privileges: Array.from(new Set([...r.privileges, v])),
                  }));
                  setRolePrivilegeInput("");
                }}
                className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {roleMode === "edit" ? (
              <TrashButton
                label="Delete account"
                onClick={() => {
                  setRoles((prev) => prev.filter((r) => r.id !== roleDraft.id));
                  setOpenRoleModal(false);
                }}
              />
            ) : null}
            <button
              type="button"
              onClick={() => setOpenRoleModal(false)}
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
        </form>
      </ModalShell>

      <ModalShell
        open={openProfileFilterModal}
        title="Filter User Profiles"
        description="Filter what’s shown in the User Profile table."
        onClose={() => setOpenProfileFilterModal(false)}
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setProfileFilterApplied(profileFilterDraft);
            setOpenProfileFilterModal(false);
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Search text">
              <TextInput
                value={profileFilterDraft.text}
                onChange={(v) => setProfileFilterDraft((f) => ({ ...f, text: v }))}
                placeholder="ID, username, name, email..."
              />
            </Field>
            <Field label="Status">
              <SelectInput
                value={profileFilterDraft.status}
                onChange={(v) =>
                  setProfileFilterDraft((f) => ({
                    ...f,
                    status: (v as "" | UserProfileRow["status"]) ?? "",
                  }))
                }
                options={[
                  { value: "", label: "Any" },
                  { value: "Active", label: "Active" },
                  { value: "Pending", label: "Pending" },
                  { value: "Suspended", label: "Suspended" },
                ]}
              />
            </Field>
            <Field label="Created From (YYYY-MM-DD)">
              <TextInput
                value={profileFilterDraft.createdFrom}
                onChange={(v) => setProfileFilterDraft((f) => ({ ...f, createdFrom: v }))}
                placeholder="e.g. 2026-01-01"
              />
            </Field>
            <Field label="Created To (YYYY-MM-DD)">
              <TextInput
                value={profileFilterDraft.createdTo}
                onChange={(v) => setProfileFilterDraft((f) => ({ ...f, createdTo: v }))}
                placeholder="e.g. 2026-12-31"
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpenProfileFilterModal(false)}
              className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileFilterDraft({ text: "", status: "", createdFrom: "", createdTo: "" });
                setProfileFilterApplied({ text: "", status: "", createdFrom: "", createdTo: "" });
                setOpenProfileFilterModal(false);
              }}
              className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#2f7a55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286a4a]"
            >
              Apply
            </button>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={openAccountFilterModal}
        title="Filter User Accounts"
        description="Filter what’s shown in the User Account table."
        onClose={() => setOpenAccountFilterModal(false)}
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setAccountFilterApplied(accountFilterDraft);
            setOpenAccountFilterModal(false);
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Search text">
              <TextInput
                value={accountFilterDraft.text}
                onChange={(v) => setAccountFilterDraft((f) => ({ ...f, text: v }))}
                placeholder="ID, username, account #, bank..."
              />
            </Field>
            <Field label="Account Type">
              <SelectInput
                value={accountFilterDraft.accountType}
                onChange={(v) =>
                  setAccountFilterDraft((f) => ({
                    ...f,
                    accountType: v as "" | UserAccountRow["accountType"],
                  }))
                }
                options={[
                  { value: "", label: "Any" },
                  { value: "Personal", label: "Personal" },
                  { value: "Business", label: "Business" },
                  { value: "Charity", label: "Charity" },
                ]}
              />
            </Field>
            <Field label="Currency">
              <SelectInput
                value={accountFilterDraft.currency}
                onChange={(v) =>
                  setAccountFilterDraft((f) => ({
                    ...f,
                    currency: v,
                  }))
                }
                options={[
                  { value: "", label: "Any" },
                  ...accountCurrencyOptions.map((c) => ({ value: c, label: c })),
                ]}
              />
            </Field>
            <Field label="Verified">
              <SelectInput
                value={accountFilterDraft.verified}
                onChange={(v) =>
                  setAccountFilterDraft((f) => ({
                    ...f,
                    verified: v as "" | "Yes" | "No",
                  }))
                }
                options={[
                  { value: "", label: "Any" },
                  { value: "Yes", label: "Yes" },
                  { value: "No", label: "No" },
                ]}
              />
            </Field>
          </div>

          <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between text-sm font-medium text-gray-800">
              <span>Balance range</span>
              <span className="text-xs font-normal text-gray-600">
                {accountFilterDraft.balanceMin ?? accountBalanceBounds.min} –{" "}
                {accountFilterDraft.balanceMax ?? accountBalanceBounds.max}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Min</span>
                <input
                  type="range"
                  min={accountBalanceBounds.min}
                  max={accountBalanceBounds.max}
                  value={accountFilterDraft.balanceMin ?? accountBalanceBounds.min}
                  onChange={(e) =>
                    setAccountFilterDraft((f) => ({
                      ...f,
                      balanceMin: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[#2f7a55]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Max</span>
                <input
                  type="range"
                  min={accountBalanceBounds.min}
                  max={accountBalanceBounds.max}
                  value={accountFilterDraft.balanceMax ?? accountBalanceBounds.max}
                  onChange={(e) =>
                    setAccountFilterDraft((f) => ({
                      ...f,
                      balanceMax: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[#2f7a55]"
                />
              </label>
            </div>
            <div className="text-xs text-gray-600">
              Tip: If Min &gt; Max, the filter will simply match none until you adjust.
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpenAccountFilterModal(false)}
              className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountFilterDraft({
                  text: "",
                  verified: "",
                  accountType: "",
                  currency: "",
                  balanceMin: null,
                  balanceMax: null,
                });
                setAccountFilterApplied({
                  text: "",
                  verified: "",
                  accountType: "",
                  currency: "",
                  balanceMin: null,
                  balanceMax: null,
                });
                setOpenAccountFilterModal(false);
              }}
              className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#2f7a55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286a4a]"
            >
              Apply
            </button>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={openRoleFilterModal}
        title="Filter Roles"
        description="Filter what’s shown in the Roles panel."
        onClose={() => setOpenRoleFilterModal(false)}
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setRoleFilterApplied(roleFilterDraft);
            setOpenRoleFilterModal(false);
          }}
        >
          <Field label="Search text">
            <TextInput
              value={roleFilterDraft.text}
              onChange={(v) => setRoleFilterDraft((f) => ({ ...f, text: v }))}
              placeholder="Role name, privilege..."
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpenRoleFilterModal(false)}
              className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleFilterDraft({ text: "" });
                setRoleFilterApplied({ text: "" });
                setOpenRoleFilterModal(false);
              }}
              className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#2f7a55] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#286a4a]"
            >
              Apply
            </button>
          </div>
        </form>
      </ModalShell>
    </main>
  );
}

