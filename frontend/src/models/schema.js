const DEFAULT_LOCATION = { lat: null, lng: null };

const generateId = () => {
  // Prefer stable, collision-resistant IDs; fall back to timestamp-based.
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `r-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export function createReport(userId, zoneId, overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: overrides.id || generateId(),
    title: overrides.title || "Untitled Report",
    category: overrides.category || "General",
    description: overrides.description || "",
    severity: overrides.severity || "medium",
    status: (overrides.status || "pending").toLowerCase(),
    tags: overrides.tags || [],
    location: overrides.location || DEFAULT_LOCATION,
    reporter: overrides.reporter || "Anonymous Reporter",
    reporterFirstName: overrides.reporterFirstName ?? null,
    reporterLastName: overrides.reporterLastName ?? null,
    reporter_email: overrides.reporterEmail ?? overrides.reporter_email ?? null,
    isAnonymous: Boolean(overrides.isAnonymous),
    attachments: overrides.attachments || [],
    createdAt: now,
    updatedAt: overrides.updatedAt || now,
    zoneId,
    userId,
    ...overrides,
  };
}
