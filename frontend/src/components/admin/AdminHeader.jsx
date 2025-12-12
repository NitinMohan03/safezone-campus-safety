import Button from "../ui/Button";

export function AdminHeader({
  stats,
  isExporting,
  reportsLoading,
  onExport,
}) {
  return (
    <header className="flex flex-wrap justify-between gap-8 rounded-[24px] border border-slate-900/10 bg-white p-8 shadow-[0_22px_46px_rgba(15,23,42,0.1)]">
      <div className="space-y-4">
        <p className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
          Admin Review Portal
        </p>
        <h1 className="text-4xl font-bold text-slate-950">
          Validate community reports
        </h1>
        <p className="text-slate-600">
          Review incoming incidents, verify evidence, and trigger alert dispatch
          — mirroring the Admin Review flow from Sprint 3 diagrams.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        <div className="rounded-2xl bg-primary-500/10 px-4 py-5 text-center">
          <dt className="text-sm font-medium text-slate-600">Pending</dt>
          <dd className="mt-2 text-2xl font-bold text-primary-700">
            {stats.pending}
          </dd>
        </div>
        <div className="rounded-2xl bg-amber-500/10 px-4 py-5 text-center">
          <dt className="text-sm font-medium text-slate-600">Needs review</dt>
          <dd className="mt-2 text-2xl font-bold text-amber-600">
            {stats.needsReview}
          </dd>
        </div>
        <div className="rounded-2xl bg-emerald-500/10 px-4 py-5 text-center">
          <dt className="text-sm font-medium text-slate-600">Approved</dt>
          <dd className="mt-2 text-2xl font-bold text-emerald-600">
            {stats.approved}
          </dd>
        </div>
      </dl>
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
          Includes all reports filed within the last 7 days.
        </p>
      </div>
    </header>
  );
}
