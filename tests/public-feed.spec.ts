import { test, expect, Page } from "@playwright/test";
import { buildReport, installMockApi } from "./utils/mockApi";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";
let mockState: { reports: any };

const visit = (page: Page, path: string) =>
  page.goto(`${baseURL}${path}`, { waitUntil: "networkidle", timeout: 5000 });

async function loginAsAdmin(page: Page) {
  await visit(page, "/login");
  await page
    .getByLabel("Username / Email")
    .fill("youaredead629@gmail.com", { timeout: 5000 });
  await page.getByLabel("Password").fill("Admin123=");
  const loginButton = page.getByRole("button", { name: /sign in/i });
  await loginButton.waitFor({ state: "visible", timeout: 5000 });
  console.log("[LOGIN] clicking login button");
  await loginButton.click({ timeout: 5000 });
  console.log("[NAV] waiting for admin center");
  await Promise.race([
    page.waitForURL("**/admin-center", { timeout: 10000 }).catch(() => null),
    page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }).catch(
      () => null
    ),
  ]);
  await page.waitForLoadState("networkidle");
}

test.describe("Public Reports Feed", () => {
  test.beforeEach(async ({ page }) => {
    mockState = await installMockApi(page, { reports: [] });
  });

  test("approved report shows upvote button and disables after click", async ({
    page,
  }) => {
    const approved = buildReport({
      id: "approved-1",
      title: "Open hydrant on block",
      description: "Hydrant is gushing water onto sidewalk.",
      severity: "medium",
      status: "approved",
      upvotes: 2,
    });

    mockState.reports = [approved];
    await loginAsAdmin(page);

    await visit(page, "/live-feed");
    await page.getByLabel("Status").selectOption("all");
    const card = page.locator("article", {
      has: page.getByRole("heading", { name: /Open hydrant on block/i }),
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    const voteRequest = page.waitForRequest("**/votes");
    await card.getByRole("button", { name: /^Upvote$/i }).click({
      timeout: 5000,
    });
    await voteRequest;

    await expect(card.getByRole("button", { name: /👍 Upvoted/ })).toBeDisabled();
    await expect(
      card.locator("span", { hasText: "3" }).filter({
        hasNotText: /seconds ago|minutes ago/i,
      })
    ).toBeVisible();
  });
});
