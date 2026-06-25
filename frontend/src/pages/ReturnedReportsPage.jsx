import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useReports } from "../hooks/useReports";
import Button from "../components/ui/Button";
import { getRelativeTime } from "../utils/date";
import useAuth from "../auth/useAuth";

function ReturnedReportsPage() {
  const navigate = useNavigate();
  const { reports, isLoading, error } = useReports();
  const { user } = useAuth();

  const currentUserId = useMemo(() => {
    if (!user) return null;
    const raw = user.attributes?.sub || user.username || "";
    return raw ? String(raw).replace(/[^a-zA-Z0-9_-]/g, "_") : null;
  }, [user]);

  const returnedReports = useMemo(() => {
    if (!currentUserId) return [];
    const filtered = reports.filter((report) => {
      const status = (report.status || "").toLowerCase();
      return (
        report.userId === currentUserId &&
        (status === "needs review" || status === "pending")
      );
    });
    const getTimestamp = (record) =>
      new Date(record.updatedAt || record.createdAt || 0).getTime();
    return filtered.sort((a, b) => getTimestamp(b) - getTimestamp(a));
  }, [reports, currentUserId]);

  if (!user) {
    return (
      <div className="mx-auto grid max-w-content gap-4 px-6 py-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Sign in to view your reports</h1>
        <p className="text-slate-600">
          You need to log in with your SafeZone account before viewing submitted reports.
        </p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-content gap-4 px-6 py-8">
        <p className="text-slate-600">Loading your returned reports…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto grid max-w-content gap-4 px-6 py-8 text-center">
        <h1 className="text-3xl font-bold text-rose-700">
          Unable to load returned reports
        </h1>
        <p className="text-slate-600">{error.message || "Please try again shortly."}</p>
      </div>
    );
  }

  const severityBadge = {
    high: "bg-rose-600 text-white",
    medium: "bg-amber-600 text-white",
    low: "bg-emerald-600 text-white",
  };

  const resolveReporterName = (report) => {
    const fullName = [report.reporterFirstName, report.reporterLastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || report.reporter || "Reporter";
  };

  return (
    <div className="mx-auto grid max-w-content gap-10 px-6 py-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold text-slate-950 [text-wrap:balance]">
          Updates requested by SafeZone admins
        </h1>
        <p className="max-w-2xl text-slate-600 [text-wrap:pretty]">
          These reports need more detail before they can be approved. Review the
          admin comments and resubmit when you are ready.
        </p>
      </header>

      {returnedReports.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <h2 className="text-xl font-semibold text-slate-900 [text-wrap:balance]">All clear</h2>
          <p className="mt-2 text-sm text-slate-600">
            No reports have been returned for updates right now.
          </p>
        </section>
      ) : (
        <section className="grid gap-6">
          {returnedReports.map((report) => {
            const needsReview =
              (report.status || "").trim().toLowerCase() === "needs review";
            const cardClasses = [
              "grid gap-4 rounded-2xl border p-6 shadow-[0_18px_46px_rgba(15,23,42,0.08)] sm:p-8",
              needsReview ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white",
            ].join(" ");
            return (
              <article key={report.id} className={cardClasses}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold",
                    severityBadge[report.severity?.toLowerCase()] || "bg-slate-700 text-white",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {report.severity?.toUpperCase() || "UNKNOWN"}
                </span>
                <time className="text-xs text-slate-500 tabular-nums">
                  {getRelativeTime(report.updatedAt || report.createdAt)}
                </time>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 [text-wrap:balance]">{report.title}</h2>
              <p className="text-sm font-medium text-slate-600">
                {report.isAnonymous
                  ? "Submitted anonymously"
                  : `Reported by ${resolveReporterName(report)}`}
              </p>
              <p className="text-slate-700">{report.description}</p>
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <div className="flex items-center gap-1.5">
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-semibold text-slate-800">{report.category}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-semibold text-slate-800">
                    {(report.status || "needs review")
                      .replace(/(^|\s)\S/g, (s) => s.toUpperCase())}
                  </dd>
                </div>
              </dl>
              <div className="grid gap-1.5 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900">Admin feedback</h3>
                <p className="text-sm text-slate-700 [text-wrap:pretty]">
                  {report.adminFeedback ||
                    "Admin feedback will appear here once provided."}
                </p>
              </div>
              <Button onClick={() => navigate(`/review-request/${report.id}`)}>
                Review &amp; Resubmit
              </Button>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default ReturnedReportsPage;
