import { test, expect, type Page } from "@playwright/test";

// Frontend click-through against the LIVE site, one per role.
// Run: E2E_BASE_URL=https://sab-quick.vercel.app npx playwright test e2e/frontend.spec.ts --project=chromium
const PW = "Demo@1234";
const ACCT = {
  owner: "demo.owner@sabquick.app",
  manager: "demo.manager@sabquick.app",
  staff: "demo.staff@sabquick.app",
  delivery: "demo.delivery@sabquick.app",
  customer: "demo.customer@sabquick.app",
};

async function login(page: Page, email: string) {
  await page.goto("/auth");
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill(PW);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe("role logins land on the right dashboard", () => {
  for (const [role, email] of Object.entries(ACCT)) {
    test(`${role} can log in`, async ({ page }) => {
      await login(page, email);
      const expectedPath = role === "customer" ? "/home" : `/${role}`;
      await expect(page).toHaveURL(new RegExp(expectedPath.replace("/", "\\/")), { timeout: 20000 });
    });
  }
});

test("customer: home shows real products, detail sheet + recommendations, add to cart", async ({ page }) => {
  await login(page, ACCT.customer);
  await expect(page).toHaveURL(/\/home/, { timeout: 20000 });
  // real product prices render (₹)
  await expect(page.getByText("₹", { exact: false }).first()).toBeVisible({ timeout: 20000 });
  // open a product detail by tapping the first product image
  await page.locator("img[alt]").nth(1).click();
  await expect(page.getByText(/you may also like/i)).toBeVisible({ timeout: 15000 });
  // add to cart from the sheet
  await page.getByRole("button", { name: /add to cart/i }).first().click();
});

test("customer: full COD checkout reaches the tracking page", async ({ page }) => {
  // No geolocation granted -> GPS auto-fetch fails fast and won't overwrite fields.
  await login(page, ACCT.customer);
  await expect(page).toHaveURL(/\/home/, { timeout: 20000 });
  await page.locator("img[alt]").nth(1).click();
  await page.getByRole("button", { name: /add to cart/i }).first().click();
  await page.waitForTimeout(600);
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/checkout/, { timeout: 20000 });
  await page.waitForTimeout(1500); // let the GPS attempt resolve/fail
  await page.getByPlaceholder(/Green Avenue/i).fill("12 Test Street, Andheri");
  await page.getByPlaceholder("Mumbai").fill("Mumbai");
  await page.getByPlaceholder("400001").fill("400053");
  await page.getByRole("button", { name: /continue to payment/i }).click({ force: true });
  await page.waitForTimeout(1000);
  await page.getByRole("button").filter({ hasText: /cash on delivery/i }).click({ force: true });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /place order/i }).click({ force: true });
  await expect(page).toHaveURL(/\/orders\/track/, { timeout: 25000 });
});

test("staff: browser back from dashboard does not land on customer page or white screen", async ({ page }) => {
  // Realistic entry: land on the app root first (onboarding already seen),
  // which routes an unauthenticated user to /auth — so there's real history.
  await page.addInitScript(() => {
    localStorage.setItem("sab-app", JSON.stringify({ state: { onboardingDone: true }, version: 0 }));
  });
  await page.goto("/");
  await page.waitForURL(/\/auth/, { timeout: 20000 });
  await page.getByPlaceholder("Email address").fill(ACCT.staff);
  await page.getByPlaceholder("Password").fill(PW);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/staff/, { timeout: 20000 });

  await page.goBack();
  await page.waitForTimeout(3000);
  const url = page.url();
  expect(url).not.toMatch(/\/home/); // not the customer page
  const bodyText = (await page.locator("body").innerText()).trim();
  expect(bodyText.length).toBeGreaterThan(0); // not a white/blank screen
});

test("owner can log out and the session is actually cleared", async ({ page }) => {
  await login(page, ACCT.owner);
  await expect(page).toHaveURL(/\/owner/, { timeout: 20000 });
  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/auth/, { timeout: 15000 });
  // session must be gone: visiting a protected route bounces back to /auth
  await page.goto("/owner");
  await expect(page).toHaveURL(/\/auth/, { timeout: 15000 });
});

test("customer orders page renders with a placed order (no crash)", async ({ page }) => {
  // place a COD order, then open /orders — previously this crashed (raw rows).
  await login(page, ACCT.customer);
  await expect(page).toHaveURL(/\/home/, { timeout: 20000 });
  await page.locator("img[alt]").nth(1).click();
  await page.getByRole("button", { name: /add to cart/i }).first().click();
  await page.waitForTimeout(600);
  await page.goto("/checkout");
  await page.waitForTimeout(1500);
  await page.getByPlaceholder(/Green Avenue/i).fill("12 Test St");
  await page.getByPlaceholder("400001").fill("400053");
  await page.getByRole("button", { name: /continue to payment/i }).click({ force: true });
  await page.waitForTimeout(1000);
  await page.getByRole("button").filter({ hasText: /cash on delivery/i }).click({ force: true });
  await page.getByRole("button", { name: /place order/i }).click({ force: true });
  await expect(page).toHaveURL(/\/orders\/track/, { timeout: 25000 });
  // now the orders list must render (not crash) and show the order
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/orders$/, { timeout: 15000 });
  await expect(page.getByText(/My Orders/i).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/items ·/i).first()).toBeVisible({ timeout: 15000 });
});
