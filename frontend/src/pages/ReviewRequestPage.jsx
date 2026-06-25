import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { adminWorkflow } from "../services/adminWorkflow";
import Button from "../components/ui/Button";
import ReportForm from "../components/forms/ReportForm";
import useAuth from "../auth/useAuth";

function useReport(reportId) {
  const [report, setReport] = useState(null);
  const [followUp, setFollowUp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        setLoading(true);
        const [reportData, followUpData] = await Promise.all([
          api.reports.get(reportId),
          api.followUps.getByReport(reportId),
        ]);
        if (!active) return;
        setReport(reportData);
        setFollowUp(followUpData);
      } catch (err) {
        console.error("Failed to load review request", err);
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, [reportId]);

  return { report, followUp, loading, error, setReport };
}

function ReviewRequestPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { report, followUp, loading, error, setReport } = useReport(reportId);

  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    category: "",
    severity: "medium",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const currentUserId = useMemo(() => {
    if (!user) return null;
    const raw = user.attributes?.sub || user.username || "";
    return raw ? String(raw).replace(/[^a-zA-Z0-9_-]/g, "_") : null;
  }, [user]);

  useEffect(() => {
    if (report) {
      setFormValues({
        title: report.title || "",
        description: report.description || "",
        category: report.category || "",
        severity: report.severity || "medium",
      });
    }
  }, [report]);

  const feedback = useMemo(
    () => followUp?.feedback || "Admin feedback will appear here.",
    [followUp]
  );

  const canDelete =
    Boolean(report) &&
    Boolean(currentUserId) &&
    report.userId === currentUserId;

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-10 text-slate-600 shadow-xl">
        Loading review request…
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto grid max-w-3xl gap-4 rounded-2xl border border-rose-300/60 bg-white/80 p-10 text-center shadow-xl">
        <h1 className="text-3xl font-bold text-rose-700">
          Something went wrong
        </h1>
        <p className="text-slate-600">
          {error?.message ||
            "We could not load this report. Please return to the dashboard."}
        </p>
        <Button type="button" onClick={() => navigate("/route-planner")}>
          Back to Route Check
        </Button>
      </div>
    );
  }

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await adminWorkflow.resolveFollowUp(
        report,
        followUp,
        formValues
      );
      setReport(updated);
      navigate("/returned-reports", {
        replace: true,
        state: { refreshed: true },
      });
    } catch (err) {
      console.error("Failed to resubmit report", err);
      setSaveError(err.message || "Unable to resubmit right now.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!report?.id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.reports.delete(report.id);
      navigate("/returned-reports", {
        replace: true,
        state: { deletedReportId: report.id },
      });
    } catch (err) {
      console.error("Failed to delete report", err);
      setDeleteError(
        err.message || "Unable to delete this report. Please try again."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-6 py-8 sm:px-8">
      <form
        className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-slate-950 [text-wrap:balance]">
              Update your report
            </h1>
            <p className="max-w-xl text-slate-600 [text-wrap:pretty]">
              The SafeZone admin team asked for a few tweaks before the report
              can go live.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Admin feedback
            </h2>
            <p className="text-sm text-slate-700 [text-wrap:pretty]">{feedback}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            className="border border-emerald-200 bg-emerald-100/70 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-500 hover:text-white"
            onClick={() => navigate("/route-planner")}
          >
            Return to Route Check
          </Button>
          {canDelete && (
            <Button
              type="button"
              variant="secondary"
              className="border border-rose-200 bg-rose-100/70 text-rose-700 hover:border-rose-500 hover:bg-rose-600 hover:text-white"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete this report
            </Button>
          )}
        </div>

        <ReportForm
          values={formValues}
          onChange={(field, value) =>
            setFormValues((prev) => ({ ...prev, [field]: value }))
          }
          disabled={saving}
        />

        {deleteError && (
          <p className="rounded-xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
            {deleteError}
          </p>
        )}

        {saveError && (
          <p className="rounded-xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
            {saveError}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Resubmitting…" : "Resubmit"}
          </Button>
        </div>
      </form>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">
              Delete this report?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This action cannot be undone and will remove the report from the
              live feed.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                onClick={handleDeleteReport}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewRequestPage;
