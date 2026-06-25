import LocationSearchResult from "../ui/LocationSearchResult";

export function ToastMessage({ message }) {
  if (!message) return null;
  return (
    <div className="fixed right-4 top-4 z-50 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-800 shadow-xl">
      {message}
    </div>
  );
}

export function LocationField({
  value,
  onChange,
  suggestions,
  onSelectSuggestion,
  disabled,
}) {
  return (
    <div className="relative grid gap-2">
      <label className="font-semibold text-slate-800" htmlFor="location">
        Location
      </label>
      <input
        type="text"
        id="location"
        name="locationText"
        value={value}
        onChange={onChange}
        placeholder="Enter or search location"
        autoComplete="off"
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-base shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-20 max-h-56 list-none overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl">
          {suggestions.map((place) => (
            <LocationSearchResult
              key={place.mapbox_id || place.id}
              item={place}
              onClick={() => onSelectSuggestion(place)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export function IncidentTypeSelector({
  incidentTypes,
  selected,
  onToggle,
  disabled,
}) {
  return (
    <div className="grid gap-2">
      <span className="font-semibold text-slate-800">Incident Type</span>
      <div className="flex flex-wrap gap-3">
        {incidentTypes.map(({ value, label }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={[
                "rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60",
                isSelected
                  ? "border-primary-500 bg-primary-600 text-white shadow-[0_0_0_3px_rgba(37,99,235,0.16)]"
                  : "bg-slate-100",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={disabled}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AttachmentPicker({
  existingAttachments,
  pendingFilePreviews,
  onRemoveExisting,
  onRemovePending,
  onFileInput,
  disabled,
}) {
  const hasFiles =
    existingAttachments.length > 0 || pendingFilePreviews.length > 0;

  return (
    <div className="grid gap-2">
      <label className="font-semibold text-slate-800" htmlFor="attachments">
        Photo / Evidence (optional)
      </label>
      <input
        id="attachments"
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={onFileInput}
        disabled={disabled}
        className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-primary-300 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {hasFiles && (
        <div className="flex flex-wrap gap-2 pt-2">
          {existingAttachments.map((url) => (
            <div
              key={url}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800"
            >
              <span>{url.split("/").pop()}</span>
              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                disabled={disabled}
                className="rounded-full bg-transparent p-0 text-base leading-none text-slate-600 transition hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
              >
                ×
              </button>
            </div>
          ))}
          {pendingFilePreviews.map(({ index, name, sizeKb }) => (
            <div
              key={`${name}-${index}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-700"
            >
              <span>
                {name} ({sizeKb} KB)
              </span>
              <button
                type="button"
                onClick={() => onRemovePending(index)}
                disabled={disabled}
                className="rounded-full bg-transparent p-0 text-base leading-none text-primary-700 transition hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnonymityToggle({ checked, disabled, onChange }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left text-sm text-slate-700">
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-400 disabled:cursor-not-allowed"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span>
        <span className="font-semibold text-slate-900">Submit anonymously</span>
        <br />
        Hide your name in the Live Feed and My Reports. SafeZone staff will
        still be able to reach you through your account if follow-up is
        required.
      </span>
    </label>
  );
}
