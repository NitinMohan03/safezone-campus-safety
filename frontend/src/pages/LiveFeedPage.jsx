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

function useCountUp(target, { duration = 1200, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf;
    let start = 0;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const current = target * progress;
      const rounded =
        decimals > 0
          ? Number(current.toFixed(decimals))
          : Math.round(current);

      setValue(progress >= 1 ? target : Math.min(target, rounded));

      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals]);

  return value;
}

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

  const openReportsCount = useCountUp(3);
  const responseTeamsCount = useCountUp(7);
  const avgResolveHours = useCountUp(4.2, { decimals: 1 });

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
        // Match on email; adjust if you later add userId.
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
      // rollback on error
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
        if (upvotesA !== upvotesB) {
          return upvotesB - upvotesA;
        }
        const createdA = new Date(a.createdAt).getTime();
        const createdB = new Date(b.createdAt).getTime();
        return createdB - createdA;
      });
  }, [reports, severityFilter, statusFilter, upvoteMap]);

  const baseCardClasses =
    "flex flex-col gap-5 rounded-2xl border border-slate-900/10 bg-white/95 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl";

  const severityStyles = {
    high: {
      card: "border-rose-600/40 bg-gradient-to-br from-rose-100/90 via-white/90 to-rose-200/40 shadow-[0_22px_48px_rgba(185,28,28,0.22)]",
      type: "bg-rose-700 text-rose-50",
      tag: "bg-rose-100/60 text-rose-900/80",
      footer:
        "rounded-2xl bg-rose-100/50 px-4 py-3 shadow-inner shadow-rose-400/20",
      severity:
        "rounded-full bg-gradient-to-r from-rose-500 to-rose-700 px-4 py-1 text-xs font-bold tracking-[0.3em] text-white shadow-lg shadow-rose-500/30",
    },
    medium: {
      card: "border-amber-500/40 bg-gradient-to-br from-amber-100/80 via-white/90 to-amber-200/50 shadow-[0_20px_44px_rgba(217,119,6,0.18)]",
      type: "bg-amber-100 text-amber-700",
      tag: "bg-amber-200/70 text-amber-700",
      footer:
        "rounded-2xl bg-amber-100/50 px-4 py-3 shadow-inner shadow-amber-400/20",
      severity:
        "rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-4 py-1 text-xs font-bold tracking-[0.3em] text-white shadow-lg shadow-amber-500/30",
    },
    low: {
      card: "border-emerald-500/40 bg-gradient-to-br from-emerald-100/80 via-white/90 to-emerald-200/50 shadow-[0_18px_40px_rgba(22,163,74,0.18)]",
      type: "bg-emerald-100 text-emerald-700",
      tag: "bg-emerald-200/70 text-emerald-700",
      footer:
        "rounded-2xl bg-emerald-100/50 px-4 py-3 shadow-inner shadow-emerald-400/20",
      severity:
        "rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 px-4 py-1 text-xs font-bold tracking-[0.3em] text-white shadow-lg shadow-emerald-500/30",
    },
    default: {
      card: "",
      type: "",
      tag: "",
      footer: "",
      severity: "",
    },
  };

  const heroButtonBase =
    "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const resolveReporterName = (incident) => {
    const fullName = [incident.reporterFirstName, incident.reporterLastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || incident.reporter || "Community member";
  };

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4 rounded-[24px] border border-slate-900/10 bg-white p-8 shadow-[0_22px_46px_rgba(15,23,42,0.08)]">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-green-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_0_6px_rgba(34,197,94,0.18)]" />
            Live feed
          </p>
          <h1 className="text-4xl font-bold text-slate-950">
            Live Safety Feed
          </h1>
          <p className="text-slate-600">
            Monitor incidents as they are filed. Updates refresh automatically
            so you always have the latest status.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-start gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-primary-500/10 px-4 py-5 text-center">
              <span className="block text-2xl font-bold text-primary-700">
                {String(Math.round(openReportsCount)).padStart(2, "0")}
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-600">
                Open reports
              </span>
            </div>
            <div className="rounded-2xl bg-primary-500/10 px-4 py-5 text-center">
              <span className="block text-2xl font-bold text-primary-700">
                {String(Math.round(responseTeamsCount)).padStart(2, "0")}
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-600">
                Response teams
              </span>
            </div>
            <div className="rounded-2xl bg-primary-500/10 px-4 py-5 text-center">
              <span className="block text-2xl font-bold text-primary-700">
                {avgResolveHours.toFixed(1)}h
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-600">
                Avg. resolve time
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-[320px] rounded-2xl border border-primary-200/60 bg-white/95 p-5 shadow-[0_12px_28px_rgba(59,130,246,0.12)]">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-primary-800">
                Subscribe to dangerous events around your current area
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
                    className={[
                      heroButtonBase,
                      "rounded-xl border border-rose-500 bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-500/30 hover:scale-[1.02] hover:bg-rose-700",
                    ].join(" ")}
                  >
                    {unsubscribing ? "Unsubscribing…" : "Unsubscribe Nearby"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubscribeNearby}
                    disabled={subscribing}
                    className={[
                      heroButtonBase,
                      "rounded-xl border border-primary-500 bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-primary-500/30 hover:scale-[1.02] hover:bg-primary-700",
                    ].join(" ")}
                  >
                    {subscribing ? "Subscribing…" : "Subscribe Nearby"}
                  </button>
                )}
              </div>
              {subscriptionError && (
                <span className="text-xs font-semibold text-rose-600">
                  {subscriptionError}
                </span>
              )}
              {subscriptionSuccess && (
                <span className="text-xs font-semibold text-emerald-600">
                  {subscriptionSuccess}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className="grid gap-2">
            <label
              className="font-semibold text-slate-700"
              htmlFor="severity-filter"
            >
              Severity
            </label>
            <select
              id="severity-filter"
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              className="min-w-[180px] rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200"
            >
              <option value="all">All severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label
              className="font-semibold text-slate-700"
              htmlFor="status-filter"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-w-[180px] rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200"
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
            className={`${heroButtonBase} border border-primary-300 bg-primary-100/60 text-primary-700 hover:bg-primary-100`}
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
          <p className="rounded-2xl border border-rose-300/60 bg-rose-200/30 px-4 py-3 text-sm font-medium text-rose-800">
            We couldn&apos;t reach the live feed right now. Please try
            refreshing.
          </p>
        )}

        {!reportsLoading &&
          filteredIncidents.map((incident) => {
            const reporterDisplay = resolveReporterName(incident);
            const tags = Array.isArray(incident.tags) ? incident.tags : [];
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
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                        severityStyles[incident.severity]?.type,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {incident.status}
                    </span>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {incident.title}
                    </h2>
                  </div>
                  <span className="text-sm font-medium text-slate-600">
                    {getRelativeTime(incident.createdAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                  <span
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1",
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
                </div>

                <div className="flex flex-col gap-4 rounded-2xl bg-white/60 p-4 shadow-inner shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex-1 text-base text-slate-800">
                    {incident.description}
                  </p>
                  <div className="flex items-center gap-3 rounded-2xl border border-primary-400/40 bg-primary-500/10 px-4 py-2">
                    <button
                      className={[
                        heroButtonBase,
                        "rounded-xl border border-primary-500 bg-primary-600 px-4 py-2 text-base font-bold text-white shadow-md shadow-primary-500/30 hover:scale-[1.03] hover:bg-primary-700",
                        votedReports.includes(incident.id)
                          ? "cursor-not-allowed bg-slate-400 text-slate-100 hover:scale-100 hover:bg-slate-400"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleUpvote(incident)}
                      disabled={votedReports.includes(incident.id)}
                    >
                      {votedReports.includes(incident.id)
                        ? "👍 Upvoted"
                        : "Upvote"}
                    </button>
                    <span className="rounded-xl border border-primary-400/40 bg-white px-3 py-1 text-lg font-bold text-primary-800 shadow-sm shadow-primary-500/20">
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
                      "text-xs font-bold tracking-[0.3em] text-slate-900",
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
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/60 px-4 py-3 text-sm text-slate-600">
            No incidents match the selected filters. Try broadening your search.
          </p>
        )}
      </section>
    </div>
  );
}

export default LiveFeedPage;
