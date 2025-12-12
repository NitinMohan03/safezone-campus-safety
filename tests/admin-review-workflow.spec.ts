import { test, expect, Page } from "@playwright/test";
import { buildReport, installMockApi } from "./utils/mockApi";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";

let mockState: { reports: any; followUpRequests?: any[] };

test.beforeEach(async ({ page }) => {
  mockState = await installMockApi(page, { reports: [] });
});

async function loginAsAdmin(page: Page) {
  await page.goto(`${baseURL}/login`, {
    waitUntil: "networkidle",
    timeout: 5000,
  });
  await page.getByLabel("Username / Email").fill("youaredead629@gmail.com");
  await page.getByLabel("Password").fill("Admin123=");

  const loginButton = page.getByRole("button", { name: /sign in/i });
  await loginButton.waitFor({ state: "visible", timeout: 5000 });
  console.log("[LOGIN] clicking login button");
  await loginButton.click({ timeout: 5000 });
  console.log("[NAV] waiting for post-login state");
  await Promise.race([
    page.waitForURL("**/admin-center", { timeout: 10000 }).catch(() => null),
    page.waitForFunction(
      () =>
        !!localStorage.getItem("authToken") || !!localStorage.getItem("user"),
      { timeout: 10000 }
    ),
    page
      .waitForNavigation({ waitUntil: "networkidle", timeout: 10000 })
      .catch(() => null),
  ]);
  await page.waitForLoadState("networkidle");
}

test.describe("Admin Center", () => {
  test("request follow-up and approve report", async ({ page }) => {
    const pending = buildReport({
      id: "pending-1",
      title: "Flooded hallway",
      description: "Water pooling near lab entrance.",
      severity: "high",
      status: "pending",
      userId: "94283448-f0e1-700b-6326-937d9f54b07c",
    });
    mockState.reports = [pending];

    await page.goto(`${baseURL}/login`, {
      waitUntil: "networkidle",
      timeout: 5000,
    });
    await loginAsAdmin(page);

    await page.goto(`${baseURL}/admin-center`, {
      waitUntil: "networkidle",
      timeout: 5000,
    });
    await page.waitForLoadState("networkidle");

    const pendingCard = page.locator("article").filter({
      hasText: "Flooded hallway",
    });
    await expect(pendingCard).toBeVisible({ timeout: 10000 });

    const followUpRequest = page.waitForRequest("**/followUpRequests");
    await pendingCard
      .getByRole("button", { name: /Request Follow-up/i })
      .click({ timeout: 5000 });
    await pendingCard
      .getByLabel("Follow-up notes")
      .fill("Please add photos of the hallway.");
    await pendingCard
      .getByRole("button", { name: /Request Follow-up/i })
      .click({ timeout: 5000 });
    await followUpRequest;

    // Follow-up removes the card from the pending queue; restore it as pending for approval.
    mockState.reports = mockState.reports.map((report: { id: string }) =>
      report.id === pending.id
        ? {
            ...report,
            status: "pending",
            adminFeedback: "Please add photos of the hallway.",
            updatedAt: new Date().toISOString(),
          }
        : report
    );
    await page.reload({ waitUntil: "networkidle" });
    const refreshedCard = page.locator("article", {
      has: page.getByRole("heading", { name: /Flooded hallway/i }),
    });
    await expect(refreshedCard).toBeVisible({ timeout: 10000 });

    const approvePromise = page.waitForRequest("**/reports/*");
    await refreshedCard
      .getByRole("button", { name: /Approve & Publish/i })
      .click({ timeout: 5000 });
    await approvePromise;

    await expect(
      page.locator("article", {
        has: page.getByRole("heading", { name: /Flooded hallway/i }),
      })
    ).toHaveCount(0, { timeout: 5000 });
  });
});
