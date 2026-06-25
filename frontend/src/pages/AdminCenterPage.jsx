import { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import { useReports } from "../hooks/useReports";
import { adminWorkflow } from "../services/adminWorkflow";
import { api } from "../services/api";
import { getRelativeTime } from "../utils/date";

const STATUS_LABELS = {
  pending: "Pending review",
  "needs review": "Needs review",
  approved: "Approved",
};

const SEVERITY_PRIORITY = {
  high: 3,
  medium: 2,
  low: 1,
};


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
        .map((incident, index) => {
          const severity = (incident.severity || "medium").toLowerCase();
          return {
            ...incident,
            severity,
            status: (incident.status || "pending").toLowerCase(),
            reporter:
              incident.reporter ||
              [
                "Jordan Lee",
                "Sasha Patel",
                "Min Park",
                "Jamie Ortiz",
                "Priya Singh",
              ][index % 5],
            submittedAt: getRelativeTime(
              incident.updatedAt || incident.createdAt
            ),
            attachments: incident.attachments || [],
            tags: incident.tags || [],
            upvotes: Number(incident.upvotes ?? 0),
          };
        })
        .sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          if (timeB !== timeA) {
            return timeB - timeA;
          }
          if (b.upvotes !== a.upvotes) {
            return b.upvotes - a.upvotes;
          }
          const priorityA = SEVERITY_PRIORITY[a.severity] ?? 0;
          const priorityB = SEVERITY_PRIORITY[b.severity] ?? 0;
          return priorityB - priorityA;
        }),
    [reports]
  );

  const pendingReports = useMemo(
    () => enrichedReports.filter((incident) => incident.status === "pending"),
    [enrichedReports]
  );

  const [queue, setQueue] = useState(pendingReports);
  const [feedbackNotes, setFeedbackNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    setQueue(pendingReports);
  }, [pendingReports]);

  const stats = useMemo(
    () =>
      enrichedReports.reduce(
        (memo, item) => {
          const status = (item.status || "pending").toLowerCase();
          if (status === "approved") memo.approved += 1;
          else if (status === "needs review") memo.needsReview += 1;
          else memo.pending += 1;
          return memo;
        },
        { pending: 0, needsReview: 0, approved: 0 }
      ),
    [enrichedReports]
  );

  const updateQueueEntry = (id, updater) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updater(item) } : item
      )
    );
  };

  const scheduleDismiss = (id) => {
    setDismissedIds((prev) => [...prev, id]);
    setTimeout(() => {
      setQueue((prev) => prev.filter((item) => item.id !== id));
      setDismissedIds((prev) => prev.filter((itemId) => itemId !== id));
    }, 350);
  };

  const handleApprove = async (incident) => {
    setProcessingId(incident.id);
    setActionError(null);
    try {
      const updated = await adminWorkflow.approveAndPublish(incident);
      updateQueueEntry(incident.id, () => ({ ...updated }));
      scheduleDismiss(incident.id);
      await refreshReports();
    } catch (err) {
      console.error("Approve failed", err);
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
      const { updatedReport } = await adminWorkflow.requestFollowUp(
        incident,
        feedback
      );
      updateQueueEntry(incident.id, () => ({
        ...updatedReport,
        adminFeedback: feedback,
      }));
      scheduleDismiss(incident.id);
      await refreshReports();
    } catch (err) {
      console.error("Follow-up failed", err);
      setActionError(err.message || "Unable to request follow-up right now.");
    } finally {
      setProcessingId(null);
    }
  };

  const severityDecorators = {
    high: {
      card: "border-rose-300/60 shadow-[0_18px_40px_rgba(185,28,28,0.12)]",
      badge: "bg-rose-600 text-white",
    },
    medium: {
      card: "border-amber-300/60 shadow-[0_18px_40px_rgba(217,119,6,0.10)]",
      badge: "bg-amber-600 text-white",
    },
    low: {
      card: "border-emerald-300/60 shadow-[0_18px_40px_rgba(22,163,74,0.10)]",
      badge: "bg-emerald-600 text-white",
    },
  };

  const stringifiedValue = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value) || typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
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
    const lines = [
      headers.map((header) => escapeCsv(header)).join(","),
      ...records.map((record) =>
        headers.map((header) => escapeCsv(record?.[header])).join(",")
      ),
    ];
    return lines.join("\n");
  };

  const handleExportRecentReports = async () => {
    setIsExporting(true);
    setActionError(null);
    try {
      const allReports = await api.reports.getAll();
      if (!allReports || !allReports.length) {
        setActionError("No reports available to export yet.");
        return;
      }
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentReports = allReports.filter((report) => {
        const dateCandidate = new Date(report.createdAt || report.updatedAt);
        return (
          !Number.isNaN(dateCandidate.getTime()) &&
          dateCandidate >= thirtyDaysAgo
        );
      });
      if (!recentReports.length) {
        setActionError("No reports found in the last 30 days.");
        return;
      }

      const csvContent = buildCsv(recentReports);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split("T")[0];
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.setAttribute("download", `safezone-reports-${timestamp}.csv`);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export reports", err);
      setActionError("Unable to export reports right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-wrap items-start justify-between gap-6 rounded-[24px] border border-slate-900/10 bg-white p-8 shadow-[0_22px_46px_rgba(15,23,42,0.1)]">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold text-slate-950 [text-wrap:balance]">
            Validate community reports
          </h1>
          <p className="max-w-xl text-slate-600 [text-wrap:pretty]">
            Review incoming incidents, verify evidence, and trigger alert
            dispatch.
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
                <span className="text-slate-500">Pending</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {stats.pending}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Needs review</span>
                <span className="font-semibold tabular-nums text-amber-700">
                  {stats.needsReview}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Approved</span>
                <span className="font-semibold tabular-nums text-emerald-700">
                  {stats.approved}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button
            type="button"
            onClick={handleExportRecentReports}
            disabled={isExporting || reportsLoading}
            className="w-full sm:w-auto"
          >
            {isExporting ? "Preparing CSV…" : "Export Reports (CSV)"}
          </Button>
          <p className="text-xs text-slate-500">
            Includes all reports from the last 30 days.
          </p>
        </div>
      </header>

      <section className="grid gap-7">
        {reportsLoading && (
          <p className="text-slate-600">Loading reports awaiting review…</p>
        )}
        {reportsError && (
          <p className="rounded-2xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
            We couldn&apos;t load the review queue. Please retry shortly.
          </p>
        )}

        {!reportsLoading &&
          queue.map((incident) => {
            const statusKey = (incident.status || "pending").toLowerCase();
            const statusLabel =
              STATUS_LABELS[statusKey] || incident.status || "Pending review";
            const severityLabel = (incident.severity || "medium").toUpperCase();
            const severityKey = (incident.severity || "").toLowerCase();
            return (
              <article
                key={incident.id}
                className={[
                  "grid gap-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-xl transition-all duration-200",
                  severityDecorators[severityKey]?.card,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <header className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                      {statusLabel}
                    </span>
                    <time className="text-sm text-slate-500">
                      {incident.submittedAt}
                    </time>
                  </div>
                  <span
                    className={[
                      "rounded-full px-3 py-0.5 text-xs font-bold text-white",
                      severityDecorators[severityKey]?.badge || "bg-slate-700",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {severityLabel}
                  </span>
                </header>

                <h2 className="text-2xl font-semibold text-slate-900 [text-wrap:balance]">
                  {incident.title}
                </h2>
                <p className="text-slate-700">{incident.description}</p>

                <ul className="grid gap-2 text-slate-700">
                  <li className="text-sm">
                    <strong>Reporter:</strong> {incident.reporter}
                  </li>
                  <li className="text-sm">
                    <strong>Tags:</strong> {incident.tags.join(", ")}
                  </li>
                  <li className="text-sm">
                    <strong>Attachments:</strong>{" "}
                    {incident.attachments.length
                      ? incident.attachments.join(", ")
                      : "None"}
                  </li>
                </ul>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => handleApprove(incident)}
                    disabled={processingId === incident.id}
                  >
                    {processingId === incident.id
                      ? "Processing…"
                      : "Approve & Publish"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleFollowUp(incident)}
                    disabled={processingId === incident.id}
                  >
                    Request Follow-up
                  </Button>
                </div>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Follow-up notes
                  <textarea
                    rows={3}
                    placeholder="Add context for the reporter…"
                    value={feedbackNotes[incident.id] || ""}
                    onChange={(e) =>
                      setFeedbackNotes((prev) => ({
                        ...prev,
                        [incident.id]: e.target.value,
                      }))
                    }
                    className="min-h-[80px] resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200"
                  />
                </label>

                <p className="text-sm font-semibold text-primary-700">
                  Status updated: <strong>{statusLabel}</strong>
                </p>
              </article>
            );
          })}
        {!reportsLoading && queue.length === 0 && !reportsError && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
            All caught up — no pending incidents require review.
          </p>
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
