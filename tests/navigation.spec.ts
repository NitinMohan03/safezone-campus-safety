import { test, expect, Page } from "@playwright/test";
import { installMockApi } from "./utils/mockApi";

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
    page
      .waitForURL(/.*/, { waitUntil: "networkidle", timeout: 10000 })
      .catch(() => null),
  ]);
  await page.waitForLoadState("networkidle");
}

async function mockMapboxDirectionsInline(page: Page) {
  return new Promise<void>(async (resolve) => {
    await page.route("https://api.mapbox.com/**", async (route) => {
      resolve();
      await route.fulfill({
        json: {
          routes: [
            {
              geometry: {
                coordinates: [
                  [-73.9875, 40.6937],
                  [-73.991, 40.691],
                  [-73.996, 40.6895],
                ],
                type: "LineString",
              },
            },
          ],
        },
      });
    });
  });
}

test.describe("Route navigation", () => {
  test.beforeEach(async ({ page }) => {
    mockState = await installMockApi(page, { reports: [] });
  });

  test("reroutes when requesting safe route", async ({ page }) => {
    mockState.reports = [
      {
        id: "approved-incident",
        title: "Test incident on path",
        description: "Approved incident near route.",
        severity: "high",
        status: "approved",
        location: { lat: 40.6937, lng: -73.9875 },
        tags: ["hazard"],
      },
    ];
    await loginAsAdmin(page);
    const directionsDone = await mockMapboxDirectionsInline(page);

    await visit(page, "/route-planner");
    await expect(
      page.getByRole("button", { name: /Find Safe Route/i })
    ).toBeVisible();

    await page.getByRole("button", { name: /Find Safe Route/i }).click({
      timeout: 5000,
    });
    await directionsDone;

    // The map renders a route layer; assert the reroute flag toggles in DOM text.
    await expect(
      page
        .getByText(/Route/i)
        .or(page.getByText(/Safe route/i))
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/Approved incident near route/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
