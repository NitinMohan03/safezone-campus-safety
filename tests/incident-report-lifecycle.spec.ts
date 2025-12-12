import { test, expect, Page } from "@playwright/test";
import { buildReport, installMockApi } from "./utils/mockApi";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";

type MockState = { reports: ReturnType<typeof buildReport>[] };

let mockState: MockState;

const visit = (page: Page, path: string) =>
  page.goto(`${baseURL}${path}`, { waitUntil: "networkidle", timeout: 5000 });

async function mockMapboxSearch(page: Page) {
  await page.route(
    "https://api.mapbox.com/search/searchbox/v1/suggest**",
    (route) => {
      route.fulfill({
        json: {
          suggestions: [
            {
              mapbox_id: "mbx-nyu-tandon",
              name: "NYU Tandon School of Engineering",
              full_address: "NYU Tandon School of Engineering, Brooklyn, NY",
              feature_type: "poi",
            },
          ],
        },
      });
    }
  );

  await page.route(
    "https://api.mapbox.com/search/searchbox/v1/retrieve/**",
    (route) => {
      route.fulfill({
        json: {
          features: [
            {
              geometry: { coordinates: [-73.9866, 40.6943] },
              properties: {
                name: "NYU Tandon School of Engineering",
                full_address: "NYU Tandon School of Engineering, Brooklyn, NY",
              },
            },
          ],
        },
      });
    }
  );
}

async function loginAsAdmin(page: Page) {
  await visit(page, "/login");
  await page.getByLabel("Username / Email").fill("youaredead629@gmail.com");
  await page.getByLabel("Password").fill("Admin123=");

  const loginButton = page.getByRole("button", { name: /sign in/i });
  await loginButton.waitFor({ state: "visible", timeout: 5000 });
  console.log("[LOGIN] clicking login button");
  await loginButton.click({ timeout: 5000 });
  console.log("[NAV] waiting for admin center");
  await Promise.race([
    page.waitForURL("**/admin-center", { timeout: 10000 }).catch(() => null),
    page
      .waitForNavigation({ waitUntil: "networkidle", timeout: 10000 })
      .catch(() => null),
  ]);
  await page.waitForLoadState("networkidle");
}

async function submitReport(page: Page) {
  await visit(page, "/submit-report");
  await page.getByLabel("Title").fill("Broken streetlight at quad");
  await page.getByLabel("Category").fill("Lighting");
  await page
    .getByLabel("Description")
    .fill("North side lamp is out, area is dark.");
  await page.getByRole("button", { name: "High" }).click({ timeout: 5000 });

  await page.getByLabel("Location").fill("NYU Tandon");
  await page.waitForTimeout(500);
  // Wait for our suggestion (button inside Mapbox element or list item) to render and click it.
  const firstSuggestion = page
    .getByText("NYU Tandon School of Engineering", { exact: false })
    .first();
  await firstSuggestion.waitFor({ state: "visible", timeout: 8000 });
  await firstSuggestion.click({ timeout: 5000 });

  // Select multiple incident types after location selection is set.
  await page.getByRole("button", { name: "Theft / Stealing" }).click();
  await page
    .getByRole("button", { name: "Vandalism / Property Damage" })
    .click();
  await page.getByRole("button", { name: "Safety Hazard" }).click();
  await page.getByLabel(/Submit anonymously/i).check({ timeout: 5000 });
  await page.getByRole("button", { name: /Submit report/i }).click({
    timeout: 5000,
  });
}

test.describe("Auth + Report flows", () => {
  test.beforeEach(async ({ page }) => {
    mockState = await installMockApi(page, { reports: [] });
    await mockMapboxSearch(page);
  });

  test("login redirects to dashboard", async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(
      page.getByRole("heading", { name: /NYU Tandon Safety Coverage/i })
    ).toBeVisible();
  });

  test("create new report and view it in live feed", async ({ page }) => {
    mockState.reports = [];
    await loginAsAdmin(page);
    await submitReport(page);

    await expect(
      page.getByText("Report submitted successfully!")
    ).toBeVisible();

    await visit(page, "/live-feed");
    await page.getByLabel("Status").selectOption("all");
    await expect(
      page.getByRole("heading", { name: /Broken streetlight at quad/i })
    ).toBeVisible();
    await expect(
      page.getByText("North side lamp is out, area is dark.")
    ).toBeVisible();
  });

  test("edit an existing report from query param", async ({ page }) => {
    const original = buildReport({
      id: "report-123",
      title: "Outdated signage",
      description: "Old detour sign still posted.",
      category: "Signage",
      severity: "low",
      status: "needs review",
    });

    mockState.reports = [original];
    await loginAsAdmin(page);

    await visit(page, `/submit-report?reportId=${original.id}`);
    await expect(page.getByLabel("Title")).toHaveValue("Outdated signage");

    await page.getByLabel("Title").fill("Updated signage needed");
    await page
      .getByLabel("Description")
      .fill("Replace detour sign with current notice.");
    await page.getByRole("button", { name: "Medium" }).click({ timeout: 5000 });
    await page.getByRole("button", { name: /Save changes/i }).click({
      timeout: 5000,
    });

    await page.waitForURL(`${baseURL}/review-request/${original.id}`, {
      timeout: 5000,
    });
    await expect(
      page.getByRole("heading", { name: /Update your report/i })
    ).toBeVisible();

    // Verify the new values are present in the form inputs.
    await expect(page.getByLabel("Title")).toHaveValue(
      "Updated signage needed"
    );
    await expect(page.getByLabel("Description")).toHaveValue(
      "Replace detour sign with current notice."
    );

    // Apply another revision before resubmitting.
    const newDescription =
      "Adding photos of the signage and updated detour details before resubmitting.";
    await page.getByLabel("Description").fill(newDescription);
    await expect(page.getByLabel("Description")).toHaveValue(newDescription);

    await page.getByRole("button", { name: /Resubmit/i }).click({
      timeout: 5000,
    });
    await page.waitForURL("**/returned-reports", { timeout: 5000 });

    // Admin should now see the resubmitted report again.
    await visit(page, "/admin-center");
    const resubmittedCard = page.locator("article", {
      has: page.getByRole("heading", { name: /Updated signage needed/i }),
    });
    await expect(resubmittedCard).toBeVisible({ timeout: 10000 });
    await expect(resubmittedCard).toContainText(
      "Adding photos of the signage and updated detour details",
      { timeout: 10000 }
    );
  });

  test("delete a report from review page", async ({ page }) => {
    const ownReport = buildReport({
      id: "report-delete",
      title: "Remove test report",
      description: "Clean up after verification",
      status: "needs review",
      userId: "admin_test_com",
    });

    mockState.reports = [ownReport];
    await loginAsAdmin(page);

    await visit(page, `/review-request/${ownReport.id}`);
    await page
      .getByRole("button", { name: /Delete this report/i })
      .click({ timeout: 5000 });
    await page.getByRole("button", { name: /Delete report/i }).click({
      timeout: 5000,
    });

    await expect(page).toHaveURL(`${baseURL}/returned-reports`);
  });
});
