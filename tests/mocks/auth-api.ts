import type { Page, Route } from "@playwright/test";

/** Matches browser requests to the backend login endpoint (any host, default localhost:8080). */
const LOGIN_URL_GLOB = "**/api/auth/login";

/** Minimal JWT the app accepts (role claim + expiry). Mirrors `jwt-role.ts` decoding. */
export function encodeTestJwt(authority = "ROLE_ADMIN"): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      roles: [authority],
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    }),
  ).toString("base64url");
  return `${header}.${payload}.`;
}

export interface LoginSuccessPayload {
  id: string;
  fullName: string;
  username: string;
  token: string;
}

const defaultSuccessPayload: LoginSuccessPayload = {
  id: "e2e-user-id",
  fullName: "E2E Test User",
  username: "e2euser",
  token: encodeTestJwt(),
};

export async function installLoginSuccessRoute(
  page: Page,
  payload: LoginSuccessPayload = defaultSuccessPayload,
): Promise<void> {
  await page.route(LOGIN_URL_GLOB, async (route: Route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

export async function installLoginFailureRoute(
  page: Page,
  status: number,
  body: { message: string },
): Promise<void> {
  await page.route(LOGIN_URL_GLOB, async (route: Route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}
