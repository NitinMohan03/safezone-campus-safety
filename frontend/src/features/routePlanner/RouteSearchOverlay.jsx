import { useCallback } from "react";
import PropTypes from "prop-types";
import LocationSearchResult from "../../components/ui/LocationSearchResult";

function RouteSearchOverlay({
  formData,
  setAddressField,
  setLocationField,
  modeType,
  setModeType,
  userLocation,
  isLocating,
  locationError,
  onUseCurrentLocation,
  onFindSafeRoute,
  mapCenter,
  originSearch,
  destinationSearch,
}) {
  const proximity =
    userLocation?.coords ||
    (mapCenter?.lng && mapCenter?.lat ? [mapCenter.lng, mapCenter.lat] : null);

  const handleChange = useCallback(
    async (field, value) => {
      setModeType("search");
      setAddressField(field, value);
      const hook = field === "origin" ? originSearch : destinationSearch;
      await hook.search(value, proximity);
    },
    [destinationSearch, originSearch, proximity, setAddressField, setModeType]
  );

  const handleSelect = useCallback(
    async (field, item) => {
      const hook = field === "origin" ? originSearch : destinationSearch;
      const result = await hook.retrieve(item.mapbox_id);
      const address =
        result?.address || item.full_address || item.place_formatted || item.name || "";
      if (result?.coords) {
        setLocationField(field, result.coords, address);
        setAddressField(field, address);
      }
      hook.clearSuggestions();
      setModeType("search");
    },
    [destinationSearch, originSearch, setAddressField, setLocationField, setModeType]
  );

  const originSuggestions = originSearch?.suggestions ?? [];
  const destinationSuggestions = destinationSearch?.suggestions ?? [];

  return (
    <div className="absolute left-4 top-4 z-30 w-[min(380px,_calc(100%-2rem))] sm:left-5 sm:top-5">
      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/92 shadow-[0_16px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        {/* Header */}
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-primary-600">
                <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-800">Plan Safe Route</span>
          </div>
        </div>

        <div className="grid gap-0 divide-y divide-slate-100">
          {/* Origin */}
          <div className="relative flex items-center gap-2.5 px-4 py-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[0.6rem] font-bold text-white">A</span>
            <input
              id="origin"
              name="origin"
              value={formData.origin.address}
              placeholder="Starting point"
              onChange={(e) => handleChange("origin", e.target.value)}
              autoComplete="off"
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={onUseCurrentLocation}
              disabled={isLocating}
              title="Use current location"
              aria-label="Use current location"
              className={[
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300",
                "disabled:cursor-not-allowed disabled:opacity-40",
                userLocation?.coords
                  ? "bg-primary-100 text-primary-600 hover:bg-primary-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              ].join(" ")}
            >
              ⦿
            </button>
            {modeType === "search" && originSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-10 max-h-48 list-none overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 shadow-2xl">
                {originSuggestions.map((item) => (
                  <LocationSearchResult
                    key={item.mapbox_id || item.id}
                    item={item}
                    onClick={() => handleSelect("origin", item)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Destination */}
          <div className="relative flex items-center gap-2.5 px-4 py-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[0.6rem] font-bold text-white">B</span>
            <input
              id="destination"
              name="destination"
              value={formData.destination.address}
              placeholder="Destination"
              onChange={(e) => handleChange("destination", e.target.value)}
              autoComplete="off"
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            {modeType === "search" && destinationSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-10 max-h-48 list-none overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 shadow-2xl">
                {destinationSuggestions.map((item) => (
                  <LocationSearchResult
                    key={item.mapbox_id || item.id}
                    item={item}
                    onClick={() => handleSelect("destination", item)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {(isLocating || locationError) && (
          <div className="border-t border-slate-100 px-4 py-2 text-xs">
            {isLocating && <span className="text-slate-500">Locating…</span>}
            {!isLocating && locationError && <span className="text-rose-600">{locationError}</span>}
          </div>
        )}

        {/* CTA */}
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={onFindSafeRoute}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 transition hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Find Safe Route
          </button>
        </div>
      </div>
    </div>
  );
}

RouteSearchOverlay.propTypes = {
  formData: PropTypes.shape({
    origin: PropTypes.shape({ address: PropTypes.string.isRequired }).isRequired,
    destination: PropTypes.shape({ address: PropTypes.string.isRequired }).isRequired,
  }).isRequired,
  setAddressField: PropTypes.func.isRequired,
  setLocationField: PropTypes.func.isRequired,
  modeType: PropTypes.string.isRequired,
  setModeType: PropTypes.func.isRequired,
  userLocation: PropTypes.shape({
    address: PropTypes.string,
    coords: PropTypes.arrayOf(PropTypes.number),
  }),
  isLocating: PropTypes.bool,
  locationError: PropTypes.string,
  onUseCurrentLocation: PropTypes.func.isRequired,
  onFindSafeRoute: PropTypes.func.isRequired,
  mapCenter: PropTypes.shape({ lng: PropTypes.number, lat: PropTypes.number }),
  originSearch: PropTypes.shape({
    suggestions: PropTypes.arrayOf(PropTypes.object),
    search: PropTypes.func.isRequired,
    retrieve: PropTypes.func.isRequired,
    clearSuggestions: PropTypes.func.isRequired,
  }).isRequired,
  destinationSearch: PropTypes.shape({
    suggestions: PropTypes.arrayOf(PropTypes.object),
    search: PropTypes.func.isRequired,
    retrieve: PropTypes.func.isRequired,
    clearSuggestions: PropTypes.func.isRequired,
  }).isRequired,
};

RouteSearchOverlay.defaultProps = {
  userLocation: null,
  isLocating: false,
  locationError: null,
  mapCenter: null,
};

export default RouteSearchOverlay;
