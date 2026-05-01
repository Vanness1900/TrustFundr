/** Spring Security authority → UserProfile-style name used by layouts/routes */

const AUTHORITY_TO_APP_ROLE: Record<string, string> = {
  ROLE_ADMIN: "Admin",
  ROLE_DONEE: "Donee",
  ROLE_FUNDRAISER: "Fund Raiser",
  ROLE_PLATFORM_MANAGEMENT: "Platform Management",
};

type JwtPayload = {
  roles?: unknown;
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Maps JWT `roles` claim (from TrustFundr-be JwtService) to app role strings.
 * Returns null if token is malformed, expired, or has no recognized role.
 */
export function getAppRoleFromJwt(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  if (
    typeof payload.exp === "number" &&
    payload.exp * 1000 < Date.now()
  ) {
    return null;
  }
  const { roles } = payload;
  if (!Array.isArray(roles)) return null;
  for (const r of roles) {
    if (typeof r !== "string") continue;
    const app = AUTHORITY_TO_APP_ROLE[r];
    if (app) return app;
  }
  return null;
}
