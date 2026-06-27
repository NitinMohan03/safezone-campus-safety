import { useMemo, useState, useEffect } from "react";
import { useReports } from "../hooks/useReports";
import { api } from "../services/api";
import useAuth from "../auth/useAuth";

const STATUS_PRESETS = [
  { value: "approved", label: "Approved" },
  { value: "needs review", label: "Needs Review" },
  { value: "pending", label: "Pending" },
];

const formatStatusLabel = (value) =>
  value.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

function getRelativeTime(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

function getCategoryIcon(tags) {
  const s = (tags || []).join(" ").toLowerCase();
  if (s.includes("fire") || s.includes("gas")) return "🔥";
  if (s.includes("flood") || s.includes("water")) return "💧";
  if (s.includes("road") || s.includes("traffic") || s.includes("cycling")) return "🚗";
  if (s.includes("crime") || s.includes("theft") || s.includes("assault")) return "🚨";
  if (s.includes("medical") || s.includes("injury")) return "🏥";
  if (s.includes("power") || s.includes("electric")) return "⚡";
  if (s.includes("hazard") || s.includes("emergency")) return "⚠️";
  return "📍";
}

const SEVERITY_CONFIG = {
  high: {
    border: "border-l-rose-500",
    badge: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    label: "HIGH",
  },
  medium: {
    border: "border-l-amber-400",
    badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    label: "MED",
  },
  low: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    label: "LOW",
  },
};

function LiveFeedPage() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("approved");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [upvoteMap, setUpvoteMap] = useState({});
  const [votedReports, setVotedReports] = useState([]);
  const [subscriptionEmail, setSubscriptionEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState("");
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const { reports, isLoading: reportsLoading, error: reportsError } = useReports();
  const { user } = useAuth();

  useEffect(() => {
    const derivedEmail =
      user?.attributes?.email || user?.email || user?.username || user?.attributes?.name || "";
    if (derivedEmail) setSubscriptionEmail(derivedEmail);
  }, [user]);

  useEffect(() => {
    let active = true;
    async function loadExistingSubscription() {
      setSubscriptionLoading(true);
      try {
        const records = await api.alerts.getAll();
        if (!active || !Array.isArray(records)) return;
        const existing = records.find(
          (r) => r?.email && r.email.toLowerCase() === subscriptionEmail.toLowerCase()
        );
        if (existing?.id) {
          setSubscriptionId(existing.id);
          setSubscriptionSuccess("You are already subscribed near this location.");
        } else {
          setSubscriptionId(null);
          setSubscriptionSuccess("");
        }
      } catch (err) {
        console.error("Failed to load alert subscriptions", err);
      } finally {
        if (active) setSubscriptionLoading(false);
      }
    }
    if (subscriptionEmail) {
      loadExistingSubscription();
    } else {
      setSubscriptionId(null);
      setSubscriptionSuccess("");
    }
    return () => { active = false; };
  }, [subscriptionEmail]);

  useEffect(() => {
    const init = {};
    reports.forEach((r) => { init[r.id] = r.upvotes || 0; });
    setUpvoteMap(init);
  }, [reports]);

  const handleUpvote = async (incident) => {
    const current = upvoteMap[incident.id] ?? incident.upvotes ?? 0;
    const optimistic = current + 1;
    setUpvoteMap((prev) => ({ ...prev, [incident.id]: optimistic }));
    try {
      await api.reports.patch(incident.id, { upvotes: optimistic });
      setVotedReports((prev) => [...prev, incident.id]);
    } catch (e) {
      setUpvoteMap((prev) => ({ ...prev, [incident.id]: current }));
      console.error("Upvote failed:", e);
    }
  };

  const handleSubscribeNearby = () => {
    if (subscriptionId) { setSubscriptionSuccess("You are already subscribed."); return; }
    setSubscriptionError(null);
    setSubscriptionSuccess("");
    setUnsubscribing(false);
    if (!subscriptionEmail.trim()) { setSubscriptionError("Email is required."); return; }
    if (!navigator.geolocation) { setSubscriptionError("Geolocation not available."); return; }
    setSubscribing(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const payload = {
          id: `sub-${crypto.randomUUID?.() || Date.now()}`,
          reporter: user?.attributes?.name || user?.username || subscriptionEmail.trim(),
          email: subscriptionEmail.trim(),
          location: {
            lat: Number(coords.latitude.toFixed(6)),
            lng: Number(coords.longitude.toFixed(6)),
          },
        };
        try {
          await api.alerts.create(payload);
          setSubscriptionId(payload.id);
          setSubscriptionSuccess("Subscribed to alerts near your location.");
        } catch (err) {
          setSubscriptionError(err.message || "Unable to subscribe right now.");
        } finally {
          setSubscribing(false);
        }
      },
      (err) => {
        setSubscriptionError(err.message || "Unable to get location.");
        setSubscribing(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleUnsubscribeNearby = async () => {
    if (!subscriptionId) { setSubscriptionError("No active subscription found."); return; }
    setSubscriptionError(null);
    setSubscriptionSuccess("");
    setUnsubscribing(true);
    try {
      await api.alerts.delete(subscriptionId);
      setSubscriptionId(null);
      setSubscriptionSuccess("Unsubscribed from nearby alerts.");
    } catch (err) {
      setSubscriptionError(err.message || "Unable to unsubscribe right now.");
    } finally {
      setUnsubscribing(false);
    }
  };

  const approvedCount = useMemo(
    () => reports.filter((r) => r.status === "approved").length,
    [reports]
  );
  const highSeverityCount = useMemo(
    () => reports.filter((r) => r.severity === "high").length,
    [reports]
  );
  const needsReviewCount = useMemo(
    () => reports.filter((r) => r.status === "needs review" || r.status === "pending").length,
    [reports]
  );

  const statusOptions = useMemo(() => {
    const knownValues = STATUS_PRESETS.map(({ value }) => value);
    const derivedStatuses = Array.from(
      new Set(reports.map((i) => (i.status || "").toLowerCase()).filter(Boolean))
    );
    const extras = derivedStatuses
      .filter((s) => !knownValues.includes(s))
      .map((s) => ({ value: s, label: formatStatusLabel(s) }));
    return [...STATUS_PRESETS, ...extras];
  }, [reports]);

  const filteredIncidents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return [...reports]
      .filter((incident) => {
        const severity = (incident.severity || "unknown").toLowerCase();
        const status = (incident.status || "unknown").toLowerCase();
        const matchesSeverity = severityFilter === "all" || severity === severityFilter;
        const matchesStatus = statusFilter === "all" || status === statusFilter;
        const matchesSearch =
          !q ||
          (incident.title || "").toLowerCase().includes(q) ||
          (incident.description || "").toLowerCase().includes(q) ||
          (incident.tags || []).some((t) => t.toLowerCase().includes(q));
        return matchesSeverity && matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "upvotes") {
          return (upvoteMap[b.id] ?? b.upvotes ?? 0) - (upvoteMap[a.id] ?? a.upvotes ?? 0);
        }
        if (sortBy === "severity") {
          const order = { high: 0, medium: 1, low: 2 };
          return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reports, severityFilter, statusFilter, searchQuery, sortBy, upvoteMap]);

  const resolveReporterName = (incident) => {
    const fullName = [incident.reporterFirstName, incident.reporterLastName]
      .filter(Boolean).join(" ").trim();
    return fullName || incident.reporter || "Community member";
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Live Safety Feed
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Community-reported incidents updated in real time
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              {reportsLoading ? "—" : approvedCount} approved
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {reportsLoading ? "—" : highSeverityCount} high severity
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {reportsLoading ? "—" : needsReviewCount} needs review
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by title, description, or tag…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
        />
      </div>

      {/* Sidebar + content */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-60">
          <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            {/* Severity */}
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Severity
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["all", "high", "medium", "low"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverityFilter(s)}
                    className={[
                      "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                      severityFilter === s
                        ? s === "high"
                          ? "bg-rose-600 text-white shadow-sm"
                          : s === "medium"
                          ? "bg-amber-500 text-white shadow-sm"
                          : s === "low"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Status */}
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </p>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={[
                    "rounded-lg px-3 py-1.5 text-left text-xs font-semibold transition",
                    statusFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  All statuses
                </button>
                {statusOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={[
                      "rounded-lg px-3 py-1.5 text-left text-xs font-semibold transition",
                      statusFilter === value
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Sort */}
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Sort by
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
              >
                <option value="newest">Newest first</option>
                <option value="upvotes">Most upvoted</option>
                <option value="severity">Severity</option>
              </select>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Alert subscription */}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Nearby Alerts
              </p>
              <p className="mb-3 text-xs text-slate-500">
                Get notified about incidents near you
              </p>
              <input
                type="email"
                value={subscriptionEmail}
                onChange={(e) => setSubscriptionEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
              />
              {subscriptionId ? (
                <button
                  type="button"
                  onClick={handleUnsubscribeNearby}
                  disabled={unsubscribing}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                >
                  {unsubscribing ? "Unsubscribing…" : "Unsubscribe"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubscribeNearby}
                  disabled={subscribing || subscriptionLoading}
                  className="w-full rounded-xl bg-primary-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
                >
                  {subscribing ? "Subscribing…" : "Subscribe"}
                </button>
              )}
              {subscriptionError && (
                <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
                  {subscriptionError}
                </p>
              )}
              {subscriptionSuccess && (
                <p className="mt-1.5 text-xs font-medium text-emerald-700" role="status">
                  {subscriptionSuccess}
                </p>
              )}
            </div>

            <div className="h-px bg-slate-100" />

            <button
              type="button"
              onClick={() => {
                setSeverityFilter("all");
                setStatusFilter("approved");
                setSearchQuery("");
                setSortBy("newest");
              }}
              className="text-xs font-semibold text-slate-400 transition hover:text-slate-700"
            >
              Reset all filters
            </button>
          </div>
        </aside>

        {/* Cards */}
        <div className="flex-1 min-w-0">
          {reportsLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          )}

          {reportsError && (
            <div
              className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700"
              role="alert"
            >
              Couldn&apos;t reach the live feed. Try refreshing.
            </div>
          )}

          {!reportsLoading && filteredIncidents.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
              <span className="text-3xl">🔍</span>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                No incidents match your filters
              </p>
              <p className="text-xs text-slate-400">
                Try broadening your search or changing filters
              </p>
            </div>
          )}

          {!reportsLoading && filteredIncidents.length > 0 && (
            <>
              <p className="mb-3 text-xs font-semibold text-slate-400">
                {filteredIncidents.length} incident
                {filteredIncidents.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredIncidents.map((incident) => {
                  const sev = SEVERITY_CONFIG[incident.severity] ?? {
                    border: "border-l-slate-300",
                    badge: "bg-slate-100 text-slate-600",
                    label: "?",
                  };
                  const isVoted = votedReports.includes(incident.id);
                  const tags = Array.isArray(incident.tags) ? incident.tags : [];
                  const icon = getCategoryIcon(tags);
                  const reporter = resolveReporterName(incident);

                  return (
                    <article
                      key={incident.id}
                      className={`flex flex-col gap-3 rounded-2xl border border-slate-200 border-l-4 ${sev.border} bg-white p-5 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md`}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none" aria-hidden="true">
                            {icon}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${sev.badge}`}>
                            {sev.label}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
                            {incident.status}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-slate-400">
                          {getRelativeTime(incident.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-sm font-bold leading-snug text-slate-900 [text-wrap:balance]">
                        {incident.title}
                      </h2>

                      {/* Description */}
                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {incident.description}
                      </p>

                      {/* Footer */}
                      <div className="mt-auto flex items-end justify-between gap-3 pt-1">
                        <div className="flex min-w-0 flex-col gap-1.5">
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="truncate text-xs text-slate-400">
                            {incident.isAnonymous ? "Anonymous" : `by ${reporter}`}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpvote(incident)}
                          disabled={isVoted}
                          className={[
                            "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
                            isVoted
                              ? "cursor-not-allowed bg-slate-100 text-slate-400"
                              : "bg-primary-50 text-primary-700 ring-1 ring-primary-200 hover:bg-primary-100",
                          ].join(" ")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 0 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.381A1.15 1.15 0 0 1 7 14.25v-6.292a1 1 0 0 1 .448-.843L7.9 6.8a1.75 1.75 0 0 0 .692-1.4V3Z" />
                          </svg>
                          {upvoteMap[incident.id] ?? incident.upvotes ?? 0}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveFeedPage;
