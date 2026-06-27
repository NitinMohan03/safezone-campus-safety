import { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import { useReports } from "../hooks/useReports";
import { adminWorkflow } from "../services/adminWorkflow";
import { api } from "../services/api";
import { getRelativeTime } from "../utils/date";

const STATUS_LABELS = {
  pending: "Pending",
  "needs review": "Needs Review",
  approved: "Approved",
};

const SEVERITY_PRIORITY = { high: 3, medium: 2, low: 1 };

const SEVERITY_CONFIG = {
  high: {
    border: "border-l-rose-500",
    badge: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
  },
  medium: {
    border: "border-l-amber-400",
    badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-400",
  },
  low: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
  },
};

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "needs review", label: "Needs Review" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All" },
];

function AdminCenterPage() {
  const {
    reports,
    isLoading: reportsLoading,
    error: reportsError,
    refresh: refreshReports,
  } = useReports();

  const enrichedReports = useMemo(
    () =>
      reports
        .map((incident) => {
          const severity = (incident.severity || "medium").toLowerCase();
          return {
            ...incident,
            severity,
            status: (incident.status || "pending").toLowerCase(),
            reporter: incident.reporter || "Unknown",
            submittedAt: getRelativeTime(incident.updatedAt || incident.createdAt),
            attachments: incident.attachments || [],
            tags: incident.tags || [],
            upvotes: Number(incident.upvotes ?? 0),
          };
        })
        .sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          if (timeB !== timeA) return timeB - timeA;
          if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
          return (SEVERITY_PRIORITY[b.severity] ?? 0) - (SEVERITY_PRIORITY[a.severity] ?? 0);
        }),
    [reports]
  );

  const stats = useMemo(
    () =>
      enrichedReports.reduce(
        (memo, item) => {
          if (item.status === "approved") memo.approved += 1;
          else if (item.status === "needs review") memo.needsReview += 1;
          else memo.pending += 1;
          return memo;
        },
        { pending: 0, needsReview: 0, approved: 0 }
      ),
    [enrichedReports]
  );

  const [activeTab, setActiveTab] = useState("pending");
  const [feedbackNotes, setFeedbackNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [dismissedIds, setDismissedIds] = useState([]);

  const visibleReports = useMemo(() => {
    const base =
      activeTab === "all"
        ? enrichedReports
        : enrichedReports.filter((r) => r.status === activeTab);
    return base.filter((r) => !dismissedIds.includes(r.id));
  }, [enrichedReports, activeTab, dismissedIds]);

  const scheduleDismiss = (id) => {
    setTimeout(() => {
      setDismissedIds((prev) => [...prev, id]);
    }, 350);
  };

  useEffect(() => {
    setDismissedIds([]);
  }, [activeTab]);

  const handleApprove = async (incident) => {
    setProcessingId(incident.id);
    setActionError(null);
    try {
      await adminWorkflow.approveAndPublish(incident);
      scheduleDismiss(incident.id);
      await refreshReports();
    } catch (err) {
      setActionError(err.message || "Unable to approve right now.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleFollowUp = async (incident) => {
    setProcessingId(incident.id);
    setActionError(null);
    try {
      const feedback = feedbackNotes[incident.id] || "";
      await adminWorkflow.requestFollowUp(incident, feedback);
      scheduleDismiss(incident.id);
      await refreshReports();
    } catch (err) {
      setActionError(err.message || "Unable to request follow-up right now.");
    } finally {
      setProcessingId(null);
    }
  };

  const stringifiedValue = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value) || typeof value === "object") {
      try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
  };

  const buildCsv = (records) => {
    if (!records.length) return "";
    const fieldSet = records.reduce((acc, record) => {
      Object.keys(record || {}).forEach((key) => acc.add(key));
      return acc;
    }, new Set());
    const headers = Array.from(fieldSet);
    const escapeCsv = (raw) => {
      const safeValue = stringifiedValue(raw).replace(/"/g, '""');
      return /[",\n]/.test(safeValue) ? `"${safeValue}"` : safeValue;
    };
    return [
      headers.map(escapeCsv).join(","),
      ...records.map((record) => headers.map((h) => escapeCsv(record?.[h])).join(",")),
    ].join("\n");
  };

  const handleExportRecentReports = async () => {
    setIsExporting(true);
    setActionError(null);
    try {
      const allReports = await api.reports.getAll();
      if (!allReports?.length) { setActionError("No reports available to export yet."); return; }
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentReports = allReports.filter((r) => {
        const d = new Date(r.createdAt || r.updatedAt);
        return !Number.isNaN(d.getTime()) && d >= thirtyDaysAgo;
      });
      if (!recentReports.length) { setActionError("No reports found in the last 30 days."); return; }
      const blob = new Blob([buildCsv(recentReports)], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.setAttribute("download", `safezone-reports-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setActionError("Unable to export reports right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const tabCount = (key) => {
    if (key === "all") return enrichedReports.length;
    if (key === "pending") return stats.pending;
    if (key === "needs review") return stats.needsReview;
    if (key === "approved") return stats.approved;
    return 0;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-6 rounded-[24px] border border-slate-200/80 bg-white p-7 shadow-[0_20px_44px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-950 [text-wrap:balance]">
            Admin Review Center
          </h1>
          <p className="text-slate-500">
            Validate community reports, approve incidents, and manage follow-ups.
          </p>

          {reportsLoading ? (
            <div className="mt-2 flex gap-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-slate-500">Pending</span>
                <strong className="tabular-nums text-slate-900">{stats.pending}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span className="text-slate-500">Needs Review</span>
                <strong className="tabular-nums text-amber-700">{stats.needsReview}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-slate-500">Approved</span>
                <strong className="tabular-nums text-emerald-700">{stats.approved}</strong>
              </span>
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={handleExportRecentReports}
          disabled={isExporting || reportsLoading}
        >
          {isExporting ? "Preparing CSV…" : "Export CSV"}
        </Button>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
        {TABS.map((tab) => {
          const count = tabCount(tab.key);
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150",
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {tab.label}
              {!reportsLoading && (
                <span className={[
                  "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[0.65rem] font-bold tabular-nums",
                  active ? "bg-primary-100 text-primary-700" : "bg-slate-200 text-slate-500",
                ].join(" ")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Queue */}
      <section className="grid gap-4">
        {reportsLoading && (
          <div className="grid gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}

        {reportsError && (
          <p className="rounded-2xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
            Couldn&apos;t load the review queue. Please retry shortly.
          </p>
        )}

        {!reportsLoading && visibleReports.map((incident) => {
          const severityKey = (incident.severity || "medium").toLowerCase();
          const cfg = SEVERITY_CONFIG[severityKey] || SEVERITY_CONFIG.medium;
          const statusKey = incident.status || "pending";
          const statusLabel = STATUS_LABELS[statusKey] || incident.status;
          const canAct = statusKey !== "approved";
          const isProcessing = processingId === incident.id;

          return (
            <article
              key={incident.id}
              className={[
                "grid gap-4 rounded-2xl border-l-4 border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md",
                cfg.border,
              ].join(" ")}
            >
              {/* Top row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={["rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide", cfg.badge].join(" ")}>
                    {(incident.severity || "medium").toUpperCase()}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {statusLabel}
                  </span>
                  <time className="text-xs text-slate-400">{incident.submittedAt}</time>
                </div>
                {incident.upvotes > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4L8 11l-3.6 1.9.7-4L2.1 6.2l4-.6L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                    {incident.upvotes}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-semibold text-slate-900 [text-wrap:balance]">
                {incident.title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 line-clamp-2">
                {incident.description}
              </p>

              {/* Meta strip */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                <span><strong className="text-slate-700">Reporter:</strong> {incident.reporter}</span>
                {incident.locationLabel && (
                  <span><strong className="text-slate-700">Location:</strong> {incident.locationLabel}</span>
                )}
                {incident.tags.length > 0 && (
                  <span><strong className="text-slate-700">Tags:</strong> {incident.tags.join(", ")}</span>
                )}
              </div>

              {/* Actions — only for non-approved */}
              {canAct && (
                <>
                  <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                    Follow-up note
                    <textarea
                      rows={2}
                      placeholder="Add context for the reporter…"
                      value={feedbackNotes[incident.id] || ""}
                      onChange={(e) =>
                        setFeedbackNotes((prev) => ({ ...prev, [incident.id]: e.target.value }))
                      }
                      className="resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => handleApprove(incident)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing…" : "Approve & Publish"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleFollowUp(incident)}
                      disabled={isProcessing}
                    >
                      Request Follow-up
                    </Button>
                  </div>
                </>
              )}

              {statusKey === "approved" && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Published to live feed
                </p>
              )}
            </article>
          );
        })}

        {!reportsLoading && visibleReports.length === 0 && !reportsError && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true" className="text-slate-300">
              <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 18l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm font-medium text-slate-500">
              No {activeTab === "all" ? "" : activeTab} reports right now.
            </p>
          </div>
        )}

        {actionError && (
          <p className="rounded-2xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
            {actionError}
          </p>
        )}
      </section>
    </div>
  );
}

export default AdminCenterPage;
