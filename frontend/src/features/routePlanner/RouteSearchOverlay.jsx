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
      const searchHook = field === "origin" ? originSearch : destinationSearch;
      await searchHook.search(value, proximity);
    },
    [destinationSearch, originSearch, proximity, setAddressField, setModeType]
  );

  const handleSelect = useCallback(
    async (field, item) => {
      const searchHook = field === "origin" ? originSearch : destinationSearch;
      const result = await searchHook.retrieve(item.mapbox_id);
      const address =
        result?.address ||
        item.full_address ||
        item.place_formatted ||
        item.name ||
        "";
      if (result?.coords) {
        setLocationField(field, result.coords, address);
        setAddressField(field, address);
      }
      searchHook.clearSuggestions();
      setModeType("search");
    },
    [destinationSearch, originSearch, setAddressField, setLocationField, setModeType]
  );

  const originSuggestions = originSearch?.suggestions ?? [];
  const destinationSuggestions = destinationSearch?.suggestions ?? [];

  return (
    <div
      className="absolute left-4 top-6 z-30 w-[min(520px,_calc(100%-2rem))] rounded-3xl bg-white/95 p-3 backdrop-blur-xl sm:top-8"
      style={{ transform: "scale(0.8)", transformOrigin: "top left" }}
    >
      <div className="flex flex-col gap-2.5">
        <div className="relative flex min-h-[56px] items-center gap-3 rounded-3xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-xl">
          <label
            htmlFor="origin"
            className="w-14 flex-shrink-0 text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-slate-600"
          >
            From
          </label>
          <input
            id="origin"
            name="origin"
            value={formData.origin.address}
            placeholder="Search starting point"
            onChange={(e) => handleChange("origin", e.target.value)}
            autoComplete="off"
            className="flex-1 min-w-0 border-none bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-500"
          />
          <button
            type="button"
            className={[
              "ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-lg transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-40",
              userLocation?.coords
                ? "bg-primary-100 text-primary-600 hover:bg-primary-200"
                : "bg-slate-200/60 text-slate-900 hover:bg-slate-300/60",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={onUseCurrentLocation}
            disabled={isLocating}
            title="Use current location"
            aria-label="Use current location"
          >
            <span aria-hidden="true">⦿</span>
          </button>
          {modeType === "search" && originSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 max-h-48 list-none overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-0 shadow-2xl">
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
        {isLocating && (
          <div className="min-h-[1.25rem] text-sm text-slate-600">
            <span>Locating current position…</span>
          </div>
        )}
        {!isLocating && locationError && (
          <div className="min-h-[1.25rem] text-sm text-slate-600">
            <span className="text-rose-600">{locationError}</span>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-col gap-2.5">
        <div className="relative flex min-h-[56px] items-center gap-3 rounded-3xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-xl">
          <label
            htmlFor="destination"
            className="w-14 flex-shrink-0 text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-slate-600"
          >
            To
          </label>
          <input
            id="destination"
            name="destination"
            value={formData.destination.address}
            placeholder="Search destination"
            onChange={(e) => handleChange("destination", e.target.value)}
            autoComplete="off"
            className="flex-1 min-w-0 border-none bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-500"
          />
          {modeType === "search" && destinationSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 max-h-48 list-none overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-0 shadow-2xl">
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

      <div className="mt-3">
        <button
          type="button"
          onClick={onFindSafeRoute}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2"
        >
          Find Safe Route
        </button>
      </div>
    </div>
  );
}

RouteSearchOverlay.propTypes = {
  formData: PropTypes.shape({
    origin: PropTypes.shape({
      address: PropTypes.string.isRequired,
    }).isRequired,
    destination: PropTypes.shape({
      address: PropTypes.string.isRequired,
    }).isRequired,
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
  mapCenter: PropTypes.shape({
    lng: PropTypes.number,
    lat: PropTypes.number,
  }),
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
