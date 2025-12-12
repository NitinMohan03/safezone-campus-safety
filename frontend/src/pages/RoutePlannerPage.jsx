import { useCallback, useMemo, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import IncidentTicker from "../features/routePlanner/IncidentTicker";
import RouteMap from "../features/routePlanner/RouteMap";
import RouteSearchOverlay from "../features/routePlanner/RouteSearchOverlay";
import { useRoutePlanner } from "../features/routePlanner/useRoutePlanner";
import { useReports } from "../hooks/useReports";
import { getRelativeTime } from "../utils/date";
import useMapboxSearch from "../hooks/useMapboxSearch";

function mapReportToIncident(report) {
  if (!report) return null;
  return {
    id: report.id,
    title: report.title || report.category || "Untitled Report",
    description: report.description || "No description available.",
    severity: report.severity || "medium",
    status: report.status || "unknown",
    location: report.location || {},
    tags: report.tags || [],
    attachments: report.attachments || [],
    time: getRelativeTime(report.updatedAt || report.createdAt) || "Recently",
  };
}

function RoutePlannerPage() {
  const { reports = [], isLoading, error } = useReports();
  const originSearch = useMapboxSearch();
  const destinationSearch = useMapboxSearch();

  const incidentsSource = useMemo(() => {
    // Only display incidents that were approved by Admin; prevents freshly submitted reports from appearing on the map
    return reports
      .filter((r) => (r?.status || "").toLowerCase() === "approved")
      .filter((r) => r?.location?.lat && r?.location?.lng)
      .map(mapReportToIncident);
  }, [reports]);

  const route = useRoutePlanner(incidentsSource || []);

  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [incidentViewMode, setIncidentViewMode] = useState("markers");

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = [longitude, latitude];
        setUserLocation({ coords });

        if (route.mapRef?.current) {
          route.mapRef.current.flyTo({
            center: coords,
            zoom: 14,
          });
        }

        // Reverse geocode for address
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
          );
          const data = await res.json();
          const address = data.features?.[0]?.place_name || "Current location";
          setUserLocation({ coords, address });
          route.setAddressField?.("origin", address);
          route.setLocationField?.("origin", coords, address);
          route.setModeType?.("search");
        } catch (err) {
          console.error(err);
        }

        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setLocationError("Unable to retrieve your location.");
        setIsLocating(false);
      }
    );
  }, [route]);

  const handleMapMove = useCallback(
    (evt) => {
      route.setMapCenter?.({
        lng: evt?.viewState?.longitude,
        lat: evt?.viewState?.latitude,
      });
    },
    [route]
  );

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-rose-300/60 bg-white/80 p-10 text-center shadow-xl">
        <h2 className="text-2xl font-semibold text-rose-700">
          ⚠️ Unable to load route data
        </h2>
        <p className="text-slate-600">
          {error.message ||
            "An unexpected error occurred while loading reports."}
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-10 text-slate-600 shadow-lg">
        Loading route planner data…
      </div>
    );
  }

  const toolbarButtonBase =
    "rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <IncidentTicker incidents={route.incidents || []} />
        {error && (
          <p className="rounded-2xl border border-rose-300/60 bg-rose-200/40 px-4 py-3 text-sm font-medium text-rose-700 shadow-lg shadow-rose-500/20">
            Unable to load live incident data. Showing last known details.
          </p>
        )}
      </div>

      <div className="relative h-[720px] overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-100 via-white to-slate-200/60 shadow-[0_30px_70px_rgba(15,23,42,0.18)] md:h-[760px]">
        <RouteMap
          mapRef={route.mapRef}
          onMove={handleMapMove}
          formData={route.formData}
          incidents={route.incidents || []}
          selectedIncident={route.selectedIncident}
          setSelectedIncident={route.setSelectedIncident}
          routeGeoJSON={route.routeGeoJSON}
          avoidGeoJSON={route.avoidGeoJSON}
          onMarkerDrag={route.handleMarkerDrag}
          userLocation={userLocation || route.userLocation}
          incidentViewMode={incidentViewMode}
        />

        <div className="pointer-events-none absolute right-4 top-4 z-50 sm:right-6 sm:top-6">
          <div className="pointer-events-auto flex gap-2 rounded-2xl border border-white/60 bg-white/90 p-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-lg">
            <button
              type="button"
              className={[
                toolbarButtonBase,
                incidentViewMode === "markers"
                  ? "border-primary-500 bg-primary-100/80 text-primary-600 shadow-inner shadow-primary-500/20"
                  : "bg-slate-100/80 hover:bg-primary-100/60",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setIncidentViewMode("markers")}
            >
              Marker Pins
            </button>
            <button
              type="button"
              className={[
                toolbarButtonBase,
                incidentViewMode === "heatmap"
                  ? "border-primary-500 bg-primary-100/80 text-primary-600 shadow-inner shadow-primary-500/20"
                  : "bg-slate-100/80 hover:bg-primary-100/60",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setIncidentViewMode("heatmap")}
            >
              Heatmap
            </button>
          </div>
        </div>

        <RouteSearchOverlay
          formData={route.formData}
          setAddressField={route.setAddressField}
          setLocationField={route.setLocationField}
          modeType={route.modeType}
          setModeType={route.setModeType}
          mapCenter={route.mapCenter}
          userLocation={userLocation}
          isLocating={isLocating}
          locationError={locationError}
          onUseCurrentLocation={handleUseCurrentLocation}
          onFindSafeRoute={route.findSafeRoute}
          originSearch={originSearch}
          destinationSearch={destinationSearch}
        />
      </div>
    </div>
  );
}

export default RoutePlannerPage;
