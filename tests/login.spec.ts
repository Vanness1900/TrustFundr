import { expect, test } from "@playwright/test";
import {
  encodeTestJwt,
  installLoginFailureRoute,
  installLoginSuccessRoute,
} from "./mocks/auth-api";

test.describe("Login", () => {
  test("shows validation when username and password are empty", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Username")).toBeVisible();
    await page.getByRole("button", { name: /Sign In/ }).click();
    await expect(page.getByText("Please enter both username and password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs in and redirects to admin with persisted session", async ({
    page,
  }) => {
    const payload = {
      id: "id-1",
      fullName: "Playwright User",
      username: "pwuser",
      token: encodeTestJwt("ROLE_ADMIN"),
    };
    await installLoginSuccessRoute(page, payload);

    await page.goto("/login");
    await page.getByLabel("Username").fill("pwuser");
    await page.getByLabel("Password").fill("any-password");
    await page.getByRole("button", { name: /Sign In/ }).click();

    await expect(page).toHaveURL(/\/admin/);

    const token = await page.evaluate(() =>
      sessionStorage.getItem("trustfundr_token"),
    );
    const userRaw = await page.evaluate(() =>
      sessionStorage.getItem("trustfundr_user"),
    );
    expect(token).toBe(payload.token);
    expect(userRaw).toBeTruthy();
    const user = JSON.parse(userRaw!);
    expect(user.username).toBe(payload.username);
    expect(user.fullName).toBe(payload.fullName);
    expect(user.id).toBe(payload.id);
  });

  test("shows API error and stays on login when credentials are rejected", async ({
    page,
  }) => {
    await installLoginFailureRoute(page, 401, {
      message: "Invalid credentials",
    });

    await page.goto("/login");
    await page.getByLabel("Username").fill("wrong");
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: /Sign In/ }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() =>
      sessionStorage.getItem("trustfundr_token"),
    );
    expect(token).toBeNull();
  });
});

test.describe("Home redirect", () => {
  test("sends guests to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("sends users with stored session to admin", async ({ page }) => {
    const token = encodeTestJwt("ROLE_ADMIN");
    const userSnap = JSON.stringify({
      id: "stored-id",
      fullName: "Stored User",
      username: "storeduser",
    });
    await page.addInitScript(
      ({ t, u }) => {
        sessionStorage.setItem("trustfundr_token", t);
        sessionStorage.setItem("trustfundr_user", u);
      },
      { t: token, u: userSnap },
    );
    await page.goto("/");
    await expect(page).toHaveURL(/\/admin/);
  });
});
