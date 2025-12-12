/* eslint-disable react/react-in-jsx-scope */
import PropTypes from "prop-types";

function IncidentTicker({ incidents }) {
  const items =
    incidents.length > 0
      ? incidents
      : [
          {
            id: "none",
            title: "No critical events reported recently",
            description: "You're all clear to plan your route.",
            severity: "low",
          },
        ];

  const severityStyles = {
    high: "bg-rose-500/20 text-rose-900",
    medium: "bg-orange-500/20 text-orange-900",
    low: "bg-emerald-500/20 text-emerald-900",
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-[20px] border border-white/60 bg-white/90 px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-lg">
      <div className="flex flex-col items-center gap-2 text-center text-pretty sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary-700 shadow-sm">
          Route Safety Planner
        </span>
        <p className="text-sm font-semibold text-slate-700 sm:max-w-xl">
          Stay informed before you head out.
        </p>
      </div>
      <div
        className="relative w-full overflow-hidden"
        role="status"
        aria-live="polite"
      >
        <div className="flex gap-4 animate-ticker pr-4">
          {items.concat(items).map((incident, index) => (
            <div
              key={`${incident.id}-${index}`}
              className={[
                "flex min-w-[240px] max-w-[280px] flex-col justify-start gap-1 rounded-2xl px-4 py-3 text-left shadow-sm ring-1 ring-white/60 backdrop-blur h-[110px] overflow-hidden",
                severityStyles[incident.severity] ||
                  "bg-slate-100/80 text-slate-700",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <strong className="text-sm font-semibold text-slate-900 break-words line-clamp-2">
                {incident.title}
              </strong>
              <span className="text-xs text-slate-600 break-words line-clamp-2 overflow-hidden text-ellipsis">
                {incident.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IncidentTicker;

IncidentTicker.propTypes = {
  incidents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      severity: PropTypes.string.isRequired,
      location: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
    })
  ).isRequired,
};
