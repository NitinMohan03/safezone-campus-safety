import { api } from "./api";
import { mailchimpService } from "./mailchimpService";
import { alertService } from "./alertService";

function nowIso() {
  return new Date().toISOString();
}

const apiMode = (import.meta.env.VITE_API_MODE || "django").toLowerCase();
const useSnakeCasePayload = apiMode === "django";

const toSnake = (key) => key.replace(/([A-Z])/g, "_$1").toLowerCase();

function normalizePayload(payload) {
  if (!useSnakeCasePayload) {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );
  }
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    acc[toSnake(key)] = value;
    return acc;
  }, {});
}

function ensureFeedback(feedback) {
  if (!feedback || !feedback.trim()) {
    return "Please update the report with additional details.";
  }
  return feedback.trim();
}

const toFollowUpPayload = (record) => {
  if (!useSnakeCasePayload) return record;
  return {
    id: record.id,
    report: record.reportId || record.report,
    reporter_id: record.reporterId || record.reporter_id || "",
    reporter: record.reporter,
    status: record.status,
    feedback: record.feedback,
    requested_at: record.requestedAt || record.requested_at || nowIso(),
    reviewer: record.reviewer,
    review_link: record.reviewLink || record.review_link || "",
    responded_at: record.respondedAt || record.responded_at || null,
  };
};

export const adminWorkflow = {
  async approveAndPublish(report) {
    const camelPatch = {
      status: "approved",
      publishedAt: nowIso(),
      updatedAt: nowIso(),
    };
    const payload = normalizePayload(camelPatch);

    await api.reports.patch(report.id, payload);
    const updated = { ...report, ...camelPatch };

    // Trigger nearby alert notifications for high-severity reports
    await alertService.triggerNearbyNotification(updated);

    return updated;
  },

  async requestFollowUp(report, feedback, reviewer = "admin-demo") {
    const message = ensureFeedback(feedback);
    const requestRecord = {
      id: `fr-${crypto.randomUUID?.() || Date.now()}`,
      reportId: report.id,
      reporterId: report.userId,
      reporter: report.reporter,
      status: "pending",
      feedback: message,
      requestedAt: nowIso(),
      reviewer,
      reviewLink: `/review-request/${report.id}`,
    };

    const camelPatch = {
      status: "needs review",
      adminFeedback: message,
      updatedAt: nowIso(),
    };
    const reportPatch = normalizePayload(camelPatch);

    await api.reports.patch(report.id, reportPatch);
    const updatedReport = {
      ...report,
      status: "needs review",
      adminFeedback: message,
      updatedAt: camelPatch.updatedAt,
    };
    await api.followUps.create(toFollowUpPayload(requestRecord));
    await mailchimpService.sendFollowUpRequest({
      report: updatedReport,
      feedback: message,
      reviewer,
    });

    return { updatedReport, followUp: requestRecord };
  },

  async resolveFollowUp(report, followUpRecord, resubmittedData) {
    const camelPatch = {
      ...resubmittedData,
      status: "pending",
      updatedAt: nowIso(),
    };
    const reportPatch = normalizePayload(camelPatch);

    await api.reports.patch(report.id, reportPatch);

    return { ...report, ...camelPatch };
  },
};
