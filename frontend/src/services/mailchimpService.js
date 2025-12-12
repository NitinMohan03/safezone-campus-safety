import { api } from "./api";

const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL || "";
const apiMode = (import.meta.env.VITE_API_MODE || "django").toLowerCase();
const useSnakeCasePayload = apiMode === "django";
const nowIso = () => new Date().toISOString();

function buildFallbackEmail(name = "user") {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\./, "")
    .replace(/\.$/, "") || "user"}@example.com`;
}

const toMailchimpPayload = (record) => {
  if (!useSnakeCasePayload) return record;
  return {
    id: record.id,
    created_at: record.createdAt || record.created_at || nowIso(),
    mode: record.mode,
    type: record.type,
    subject: record.subject,
    html: record.html,
    report: record.reportId || record.report || null,
    recipients: record.recipients || [],
    reviewer: record.reviewer || "",
  };
};

async function writeMockEvent(payload) {
  const event = {
    id: `evt-${crypto.randomUUID?.() || Date.now()}`,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  const body = useSnakeCasePayload ? toMailchimpPayload(event) : event;
  try {
    await api.mailchimpEvents.create(body);
  } catch (err) {
    // Logging mail events should not block admin actions; surface but continue.
    console.error("Failed to log Mailchimp event; continuing anyway.", err);
  }
  return event;
}

export const mailchimpService = {
  async sendFollowUpRequest({ report, feedback, reviewer }) {
    const derivedEmail =
      report.reporter_email ||
      report.reporterEmail ||
      (report.reporter && report.reporter.includes("@")
        ? report.reporter
        : null) ||
      buildFallbackEmail(report.userId || "user");

    const derivedName =
      [report.reporterFirstName, report.reporterLastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      (report.reporter && !report.reporter.includes("@")
        ? report.reporter
        : "Reporter");

    const recipient = {
      email: derivedEmail,
      name: derivedName,
    };

    const reviewLink = `${window.location.origin}/review-request/${report.id}`;
    const subject = `[SafeZone] Follow-up Requested: ${report.title}`;
    const html = `
      <p>Hi ${recipient.name},</p>
      <p>The SafeZone admin team has requested some updates on your report <strong>${report.title}</strong>.</p>
      <p><strong>Admin Feedback:</strong> ${feedback}</p>
      <p>You can review the feedback and edit your report here: <a href="${reviewLink}">${reviewLink}</a></p>
      <p>Thank you for keeping the community safe.</p>
    `;
    const timestamp = nowIso();

    if (!MAKE_WEBHOOK_URL) {
      return writeMockEvent({
        mode: "mock",
        type: "follow-up-request",
        subject,
        html,
        reportId: report.id,
        recipients: [recipient],
        reviewer,
        timestamp,
        note: "MAKE webhook URL not configured",
      });
    }


    try {
      const payload = {
        to: recipient.email,
        toName: recipient.name,
        subject,
        html,
        reportId: report.id,
        reviewer: reviewer || "admin",
        timestamp,
      };

      const resp = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.text();
        console.error("Make.com webhook error:", err);
        return writeMockEvent({
          mode: "fallback-on-error",
          type: "follow-up-request",
          subject,
          html,
          reportId: report.id,
          recipients: [recipient],
          reviewer,
          timestamp,
          error: err,
        });
      }

      await writeMockEvent({
        mode: "webhook-log",
        type: "follow-up-request",
        subject,
        html,
        reportId: report.id,
        recipients: [recipient],
        reviewer,
        timestamp,
        note: "Logged webhook delivery",
      });

      return {
        mode: "webhook",
        type: "follow-up-request",
        subject,
        recipients: [recipient],
        timestamp,
      };
    } catch (error) {
      console.error("Make.com webhook failed:", error);
      return writeMockEvent({
        mode: "fallback-on-error",
        type: "follow-up-request",
        subject,
        html,
        reportId: report.id,
        recipients: [recipient],
        reviewer,
        timestamp,
        error: String(error),
      });
    }
  },
};
