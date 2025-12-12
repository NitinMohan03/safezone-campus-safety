import { Page } from "@playwright/test";

type ReportRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  reporter?: string;
  reporterFirstName?: string | null;
  reporterLastName?: string | null;
  location?: { lat?: number; lng?: number };
  locationLabel?: string;
  upvotes?: number;
};

type FollowUpRecord = {
  id: string;
  reportId: string;
  reporterId?: string;
  reporter?: string;
  status: string;
  feedback?: string;
};

type VoteRecord = { id: string; reportId: string; userId: string };
type AlertSubscription = { id: string; email: string; name?: string };
type MailchimpEvent = { id: string; subject: string; mode: string };

type MockState = {
  reports: ReportRecord[];
  followUps: FollowUpRecord[];
  votes: VoteRecord[];
  alertSubscriptions: AlertSubscription[];
  mailchimpEvents: MailchimpEvent[];
};
type MockSeed = Partial<
  MockState & {
    followUpRequests?: FollowUpRecord[];
  }
>;

const defaultState: MockState = {
  reports: [],
  followUps: [],
  votes: [],
  alertSubscriptions: [],
  mailchimpEvents: [],
};

const parseId = (url: URL) =>
  url.pathname.split("/").filter(Boolean).pop() || "";

const buildId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(
    36
  )}`;

/**
 * Attach lightweight API mocks so tests can run without the json-server.
 * It intercepts calls to the API resources regardless of host/port (e.g., Vite dev server fetch('/reports')).
 */
export async function setupMockApi(
  page: Page,
  seed: MockSeed = {}
): Promise<MockState> {
  const state: MockState = {
    reports: seed.reports ? [...seed.reports] : [...defaultState.reports],
    followUps: seed.followUpRequests
      ? [...seed.followUpRequests]
      : seed.followUps
      ? [...seed.followUps]
      : [...defaultState.followUps],
    votes: seed.votes ? [...seed.votes] : [...defaultState.votes],
    alertSubscriptions: seed.alertSubscriptions
      ? [...seed.alertSubscriptions]
      : [...defaultState.alertSubscriptions],
    mailchimpEvents: seed.mailchimpEvents
      ? [...seed.mailchimpEvents]
      : [...defaultState.mailchimpEvents],
  };

  const collectionMap: Record<string, keyof MockState> = {
    reports: "reports",
    followUpRequests: "followUps",
    votes: "votes",
    alertSubscriptions: "alertSubscriptions",
    mailchimpEvents: "mailchimpEvents",
  };

  const resources = [
    "reports",
    "followUpRequests",
    "votes",
    "alertSubscriptions",
    "mailchimpEvents",
  ];

  async function handleApiRoute(route: any, resource: string) {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method().toUpperCase();
    const collectionKey = collectionMap[resource];
    const collection = state[collectionKey] as any[];
    const id = parseId(url);

    if (method === "GET") {
      console.log(`[MOCK] Intercepted GET /${resource}`);
      if (url.searchParams.has("reportId") && collectionKey === "followUps") {
        const record = collection.find(
          (item: any) => item.reportId === url.searchParams.get("reportId")
        );
        await route.fulfill({ json: record || null });
        return;
      }

      if (url.pathname.endsWith(resource)) {
        await route.fulfill({ json: collection });
        return;
      }

      const record = collection.find((item: any) => String(item.id) === id);
      if (!record) {
        await route.fulfill({ status: 404, json: { message: "Not found" } });
        return;
      }
      await route.fulfill({ json: record });
      return;
    }

    if (method === "POST") {
      const body = req.postDataJSON() || {};
      const nextRecord = {
        ...body,
        id: body.id || buildId(resource.slice(0, 2)),
      };
      collection.push(nextRecord);
      await route.fulfill({ status: 201, json: nextRecord });
      return;
    }

    if (method === "PUT" || method === "PATCH") {
      const body = req.postDataJSON() || {};
      const idx = collection.findIndex((item: any) => String(item.id) === id);
      if (idx === -1) {
        await route.fulfill({ status: 404, json: { message: "Not found" } });
        return;
      }
      collection[idx] = { ...collection[idx], ...body };
      await route.fulfill({ json: collection[idx] });
      return;
    }

    if (method === "DELETE") {
      const idx = collection.findIndex((item: any) => String(item.id) === id);
      if (idx !== -1) collection.splice(idx, 1);
      await route.fulfill({ status: 204 });
      return;
    }

    await route.fallback();
  }

  for (const resource of resources) {
    await page.route(`**/${resource}`, async (route) => {
      await handleApiRoute(route, resource);
    });
    await page.route(`**/${resource}?**`, async (route) => {
      await handleApiRoute(route, resource);
    });
    await page.route(`**/${resource}/*`, async (route) => {
      await handleApiRoute(route, resource);
    });
    await page.route(`**/${resource}/*?**`, async (route) => {
      await handleApiRoute(route, resource);
    });
  }

  return state;
}

/**
 * Backward-compatible installer with console logging entry point.
 */
export async function installMockApi(
  page: Page,
  seed: MockSeed = {}
): Promise<MockState> {
  console.log("[MOCK] Installing mock routes...");
  return setupMockApi(page, seed);
}

/**
 * Mapbox APIs are called for routing; this helper keeps them deterministic in CI.
 */
export async function mockMapboxDirections(page: Page) {
  await page.route("https://api.mapbox.com/**", async (route) => {
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
}

export function buildReport(partial: Partial<ReportRecord>): ReportRecord {
  return {
    id: partial.id || buildId("r"),
    title: partial.title || "Test Report",
    description: partial.description || "Description",
    category: partial.category || "General",
    severity: partial.severity || "medium",
    status: partial.status || "pending",
    tags: partial.tags || ["General"],
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: partial.updatedAt || new Date().toISOString(),
    userId: "94283448-f0e1-700b-6326-937d9f54b07c",
    reporter: partial.reporter || "Reporter",
    reporterFirstName: partial.reporterFirstName ?? "Reporter",
    reporterLastName: partial.reporterLastName ?? "One",
    location: partial.location,
    locationLabel: partial.locationLabel,
    upvotes: partial.upvotes ?? 0,
  };
}
