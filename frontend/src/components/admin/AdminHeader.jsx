import Button from "../ui/Button";

export function AdminHeader({
  stats,
  isExporting,
  reportsLoading,
  onExport,
}) {
  return (
    <header className="flex flex-wrap justify-between gap-8 rounded-[24px] border border-slate-900/10 bg-white p-8 shadow-[0_22px_46px_rgba(15,23,42,0.1)]">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold text-slate-950 [text-wrap:balance]">
          Validate community reports
        </h1>
        <p className="max-w-xl text-slate-600 [text-wrap:pretty]">
          Review incoming incidents, verify evidence, and trigger alert dispatch.
        </p>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-sm">
          <div className="flex items-center gap-1.5">
            <dt className="text-slate-500">Pending</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{stats.pending}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="text-slate-500">Needs review</dt>
            <dd className="font-semibold tabular-nums text-amber-700">{stats.needsReview}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="text-slate-500">Approved</dt>
            <dd className="font-semibold tabular-nums text-emerald-700">{stats.approved}</dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-col items-end gap-3">
        <Button
          type="button"
          onClick={onExport}
          disabled={isExporting || reportsLoading}
          className="w-full sm:w-auto"
        >
          {isExporting ? "Preparing CSV…" : "Export Recent Reports (CSV)"}
        </Button>
        <p className="text-xs text-slate-500">
          Includes all reports from the last 30 days.
        </p>
      </div>
    </header>
  );
}
