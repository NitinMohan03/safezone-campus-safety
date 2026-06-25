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
  value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function getRelativeTime(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec} second${diffSec === 1 ? "" : "s"} ago`;
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

function LiveFeedPage() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("approved");
  const [upvoteMap, setUpvoteMap] = useState({});
  const [votedReports, setVotedReports] = useState([]);
  const [subscriptionEmail, setSubscriptionEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState("");
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const {
    reports,
    isLoading: reportsLoading,
    error: reportsError,
  } = useReports();
  const { user } = useAuth();

  useEffect(() => {
    const derivedEmail =
      user?.attributes?.email ||
      user?.email ||
      user?.username ||
      user?.attributes?.name ||
      "";
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
          (r) =>
            r?.email &&
            r.email.toLowerCase() === subscriptionEmail.toLowerCase()
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
    return () => {
      active = false;
    };
  }, [subscriptionEmail]);

  useEffect(() => {
    const init = {};
    reports.forEach((r) => {
      init[r.id] = r.upvotes || 0;
    });
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
    if (subscriptionId) {
      setSubscriptionSuccess("You are already subscribed.");
      return;
    }
    setSubscriptionError(null);
    setSubscriptionSuccess("");
    setUnsubscribing(false);
    if (!subscriptionEmail.trim()) {
      setSubscriptionError("Email is required to subscribe.");
      return;
    }
    if (!navigator.geolocation) {
      setSubscriptionError("Geolocation not available in this browser.");
      return;
    }

    setSubscribing(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const payload = {
          id: `sub-${crypto.randomUUID?.() || Date.now()}`,
          reporter:
            user?.attributes?.name ||
            user?.username ||
            subscriptionEmail.trim(),
          email: subscriptionEmail.trim(),
          location: {
            lat: Number(coords.latitude.toFixed(6)),
            lng: Number(coords.longitude.toFixed(6)),
          },
        };
        try {
          await api.alerts.create(payload);
          setSubscriptionId(payload.id);
          setSubscriptionSuccess(
            "Subscribed to alerts near your current location."
          );
        } catch (err) {
          setSubscriptionError(err.message || "Unable to subscribe right now.");
        } finally {
          setSubscribing(false);
        }
      },
      (err) => {
        setSubscriptionError(err.message || "Unable to get your location.");
        setSubscribing(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleUnsubscribeNearby = async () => {
    if (!subscriptionId) {
      setSubscriptionError("No active nearby subscription found.");
      return;
    }
    setSubscriptionError(null);
    setSubscriptionSuccess("");
    setSubscribing(false);
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

  // Real derived stats — replaces hardcoded countUp values
  const approvedCount = useMemo(
    () => reports.filter((r) => r.status === "approved").length,
    [reports]
  );
  const highSeverityCount = useMemo(
    () => reports.filter((r) => r.severity === "high").length,
    [reports]
  );
  const needsReviewCount = useMemo(
    () =>
      reports.filter(
        (r) => r.status === "needs review" || r.status === "pending"
      ).length,
    [reports]
  );

  const statusOptions = useMemo(() => {
    const knownValues = STATUS_PRESETS.map(({ value }) => value);
    const derivedStatuses = Array.from(
      new Set(
        reports
          .map((incident) => (incident.status || "").toLowerCase())
          .filter(Boolean)
      )
    );
    const extras = derivedStatuses
      .filter((status) => !knownValues.includes(status))
      .map((status) => ({ value: status, label: formatStatusLabel(status) }));
    return [...STATUS_PRESETS, ...extras];
  }, [reports]);

  const filteredIncidents = useMemo(() => {
    return [...reports]
      .filter((incident) => {
        const severity = (incident.severity || "unknown").toLowerCase();
        const status = (incident.status || "unknown").toLowerCase();
        const matchesSeverity =
          severityFilter === "all" || severity === severityFilter;
        const matchesStatus = statusFilter === "all" || status === statusFilter;
        return matchesSeverity && matchesStatus;
      })
      .sort((a, b) => {
        const upvotesA = upvoteMap[a.id] ?? a.upvotes ?? 0;
        const upvotesB = upvoteMap[b.id] ?? b.upvotes ?? 0;
        if (upvotesA !== upvotesB) return upvotesB - upvotesA;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [reports, severityFilter, statusFilter, upvoteMap]);

  const baseCardClasses =
    "flex flex-col gap-5 rounded-2xl border border-slate-900/10 bg-white/95 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl";

  const severityStyles = {
    high: {
      card: "border-rose-600/40 bg-gradient-to-br from-rose-100/90 via-white/90 to-rose-200/40 shadow-[0_22px_48px_rgba(185,28,28,0.22)]",
      type: "bg-rose-700 text-rose-50",
      tag: "bg-rose-100/60 text-rose-900/80",
      footer: "rounded-2xl bg-rose-100/50 px-4 py-3 shadow-inner shadow-rose-400/20",
      severity: "rounded-full bg-rose-600 px-3 py-0.5 text-xs font-bold text-white shadow-md shadow-rose-500/30",
    },
    medium: {
      card: "border-amber-500/40 bg-gradient-to-br from-amber-100/80 via-white/90 to-amber-200/50 shadow-[0_20px_44px_rgba(217,119,6,0.18)]",
      type: "bg-amber-100 text-amber-800",
      tag: "bg-amber-200/70 text-amber-700",
      footer: "rounded-2xl bg-amber-100/50 px-4 py-3 shadow-inner shadow-amber-400/20",
      severity: "rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-white shadow-md shadow-amber-500/30",
    },
    low: {
      card: "border-emerald-500/40 bg-gradient-to-br from-emerald-100/80 via-white/90 to-emerald-200/50 shadow-[0_18px_40px_rgba(22,163,74,0.18)]",
      type: "bg-emerald-100 text-emerald-700",
      tag: "bg-emerald-200/70 text-emerald-700",
      footer: "rounded-2xl bg-emerald-100/50 px-4 py-3 shadow-inner shadow-emerald-400/20",
      severity: "rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white shadow-md shadow-emerald-500/30",
    },
    default: { card: "", type: "", tag: "", footer: "", severity: "" },
  };

  const resolveReporterName = (incident) => {
    const fullName = [incident.reporterFirstName, incident.reporterLastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || incident.reporter || "Community member";
  };

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 rounded-[24px] border border-slate-900/10 bg-white p-8 shadow-[0_22px_46px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold text-slate-950 [text-wrap:balance]">
              Live Safety Feed
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
              <span
                className="h-1.5 w-1.5 rounded-full bg-green-500"
                aria-hidden="true"
              />
              Live
            </span>
          </div>
          <p className="max-w-2xl text-slate-600">
            Monitor incidents as they are filed. Updates refresh automatically
            so you always have the latest status.
          </p>

          {reportsLoading ? (
            <div className="flex gap-5 pt-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-4 w-20 animate-pulse motion-reduce:animate-none motion-reduce:opacity-60 rounded-full bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Approved</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {approvedCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">High severity</span>
                <span className="font-semibold tabular-nums text-rose-700">
                  {highSeverityCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Needs review</span>
                <span className="font-semibold tabular-nums text-amber-700">
                  {needsReviewCount}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-primary-200/60 bg-primary-50/50 p-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-primary-800">
              Receive alerts for incidents near your location
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="grid gap-1 text-sm font-semibold text-slate-700 flex-1 min-w-[200px]">
                Alert email
                <input
                  type="email"
                  value={subscriptionEmail}
                  onChange={(e) => setSubscriptionEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200"
                />
              </label>
              {subscriptionId ? (
                <button
                  type="button"
                  onClick={handleUnsubscribeNearby}
                  disabled={unsubscribing}
                  className="inline-flex items-center justify-center rounded-xl border border-rose-500 bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {unsubscribing ? "Unsubscribing…" : "Unsubscribe"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubscribeNearby}
                  disabled={subscribing || subscriptionLoading}
                  className="inline-flex items-center justify-center rounded-xl border border-primary-500 bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {subscribing ? "Subscribing…" : "Subscribe to Nearby Alerts"}
                </button>
              )}
            </div>
            {subscriptionError && (
              <span
                className="text-xs font-semibold text-rose-600"
                role="alert"
              >
                {subscriptionError}
              </span>
            )}
            {subscriptionSuccess && (
              <span
                className="text-xs font-semibold text-emerald-700"
                role="status"
              >
                {subscriptionSuccess}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="severity-filter"
            >
              Severity
            </label>
            <select
              id="severity-filter"
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              className="min-w-[160px] rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200"
            >
              <option value="all">All severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="grid gap-1.5">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="status-filter"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-w-[160px] rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200"
            >
              <option value="all">All statuses</option>
              {statusOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              setSeverityFilter("all");
              setStatusFilter("approved");
            }}
            disabled={severityFilter === "all" && statusFilter === "approved"}
          >
            Reset
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-6">
        {reportsLoading && (
          <p className="text-slate-600">Loading live incident feed…</p>
        )}
        {reportsError && (
          <p
            className="rounded-2xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
            role="alert"
          >
            We couldn&apos;t reach the live feed right now. Please try
            refreshing.
          </p>
        )}

        {!reportsLoading &&
          filteredIncidents.map((incident) => {
            const reporterDisplay = resolveReporterName(incident);
            const tags = Array.isArray(incident.tags) ? incident.tags : [];
            const isVoted = votedReports.includes(incident.id);
            return (
              <article
                key={incident.id}
                className={[
                  baseCardClasses,
                  severityStyles[incident.severity]?.card ??
                    severityStyles.default.card,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                        severityStyles[incident.severity]?.type,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {incident.status}
                    </span>
                    <h2 className="text-xl font-semibold text-slate-900 [text-wrap:balance]">
                      {incident.title}
                    </h2>
                  </div>
                  <span className="text-sm font-medium text-slate-500 tabular-nums">
                    {getRelativeTime(incident.createdAt)}
                  </span>
                </div>

                <span
                  className={[
                    "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                    incident.isAnonymous
                      ? "border-slate-200 bg-slate-50 text-slate-600"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {incident.isAnonymous
                    ? "Submitted anonymously"
                    : `Reported by ${reporterDisplay}`}
                </span>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <p className="flex-1 text-base text-slate-700 [text-wrap:pretty]">
                    {incident.description}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className={[
                        "inline-flex items-center justify-center rounded-xl border px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2",
                        isVoted
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                          : "border-primary-500 bg-primary-600 text-white hover:bg-primary-700",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleUpvote(incident)}
                      disabled={isVoted}
                    >
                      {isVoted ? "Upvoted" : "Upvote"}
                    </button>
                    <span className="min-w-[2ch] text-center text-sm font-bold tabular-nums text-slate-700">
                      {upvoteMap[incident.id] ?? incident.upvotes ?? 0}
                    </span>
                  </div>
                </div>

                <footer
                  className={[
                    "flex flex-wrap items-center justify-between gap-4",
                    severityStyles[incident.severity]?.footer,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className={[
                          "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700",
                          severityStyles[incident.severity]?.tag,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span
                    className={[
                      "text-xs font-bold text-slate-900",
                      severityStyles[incident.severity]?.severity,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {(incident.severity || "Unknown").toUpperCase()}
                  </span>
                </footer>
              </article>
            );
          })}

        {!reportsLoading && filteredIncidents.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
            No incidents match the selected filters. Try broadening your search.
          </p>
        )}
      </section>
    </div>
  );
}

export default LiveFeedPage;
