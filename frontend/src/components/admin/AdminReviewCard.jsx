import Button from "../ui/Button";

export function AdminReviewCard({
  incident,
  severityDecorators,
  statusLabel,
  feedbackValue,
  onFeedbackChange,
  onApprove,
  onFollowUp,
  processing,
}) {
  const severityKey = (incident.severity || "").toLowerCase();
  const severityLabel = (incident.severity || "medium").toUpperCase();
  const tags = incident.tags || [];
  const attachments = incident.attachments || [];

  return (
    <article
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
            severityDecorators[severityKey]?.badge ||
              "bg-slate-800 text-white",
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
          <strong>Tags:</strong> {tags.join(", ")}
        </li>
        <li className="text-sm">
          <strong>Attachments:</strong>{" "}
          {attachments.length ? attachments.join(", ") : "None"}
        </li>
      </ul>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => onApprove(incident)}
          disabled={processing}
        >
          {processing ? "Processing…" : "Approve & Publish"}
        </Button>
        <Button
          type="button"
          onClick={() => onFollowUp(incident)}
          disabled={processing}
        >
          Request Follow-up
        </Button>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Follow-up notes
        <textarea
          rows={3}
          placeholder="Add context for the reporter…"
          value={feedbackValue || ""}
          onChange={(e) => onFeedbackChange(incident.id, e.target.value)}
          className="min-h-[80px] resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200"
        />
      </label>

      <p className="text-sm font-semibold text-primary-700">
        Status updated: <strong>{statusLabel}</strong>
      </p>
    </article>
  );
}
