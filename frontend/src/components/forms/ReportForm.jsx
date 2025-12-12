import React from "react";
import PropTypes from "prop-types";
const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function ReportForm({ values, onChange, disabled }) {
  const handleInputChange = (field) => (event) => {
    onChange(field, event.target.value);
  };

  const handleSeverityClick = (value) => {
    if (!disabled) {
      onChange("severity", value);
    }
  };

  return (
    <>
      <div className="grid gap-2.5">
        <label
          htmlFor="report-title"
          className="font-semibold text-slate-800"
        >
          Title
        </label>
        <input
          id="report-title"
          name="title"
          type="text"
          value={values.title}
          onChange={handleInputChange("title")}
          required
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-base shadow-sm transition-colors duration-200 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="grid gap-2.5">
        <label
          htmlFor="report-category"
          className="font-semibold text-slate-800"
        >
          Category
        </label>
        <input
          id="report-category"
          name="category"
          type="text"
          value={values.category}
          onChange={handleInputChange("category")}
          required
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-base shadow-sm transition-colors duration-200 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="grid gap-2.5">
        <label
          htmlFor="report-description"
          className="font-semibold text-slate-800"
        >
          Description
        </label>
        <textarea
          id="report-description"
          name="description"
          rows="5"
          value={values.description}
          onChange={handleInputChange("description")}
          required
          disabled={disabled}
          className="w-full min-h-[140px] resize-y rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-base shadow-sm transition-colors duration-200 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="grid gap-2.5">
        <span className="font-semibold text-slate-800">Severity</span>
        <div className="flex flex-wrap gap-4">
          {SEVERITY_OPTIONS.map(({ value, label }) => {
            const isSelected = values.severity === value;
            const severityStyles = {
              low: "bg-green-500 hover:bg-green-600",
              medium: "bg-orange-500 hover:bg-orange-600",
              high: "bg-rose-500 hover:bg-rose-600",
            };
            return (
              <button
                key={value}
                type="button"
                className={[
                  "rounded-xl px-6 py-3 text-base font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  severityStyles[value],
                  disabled ? "opacity-60" : "",
                  isSelected
                    ? "ring-2 ring-slate-900/30 ring-offset-2"
                    : "shadow-sm hover:shadow-md",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleSeverityClick(value)}
                aria-pressed={isSelected}
                disabled={disabled}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

ReportForm.propTypes = {
  values: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(["low", "medium", "high"]).isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ReportForm.defaultProps = {
  disabled: false,
};

export default ReportForm;
