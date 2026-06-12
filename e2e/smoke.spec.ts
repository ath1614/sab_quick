import { test, expect } from "@playwright/test";

// Smoke tests for the critical unauthenticated paths. Extend with an
// authenticated customer order flow once test credentials are wired up.

test("unauthenticated user is routed to auth", async ({ page }) => {
  await page.goto("/checkout");
  // proxy.ts redirects protected routes to /auth
  await expect(page).toHaveURL(/\/auth/);
});

test("auth page renders sign-in form", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByPlaceholder("Email address")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("can switch to the sign-up form", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: /don't have an account/i }).click();
  await expect(page.getByPlaceholder("Full name")).toBeVisible();
});
