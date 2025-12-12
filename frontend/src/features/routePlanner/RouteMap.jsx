/* eslint-disable react/react-in-jsx-scope */
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import Map, { Layer, Marker, Popup, Source } from 'react-map-gl';
import { getSeverityColor } from './utils';
import AttachmentPreview from '../../components/AttachmentPreview';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const SEVERITY_WEIGHTS = {
  low: 0.35,
  medium: 0.8,
  high: 1,
};
const MIN_HEATMAP_WEIGHT = 0.25;
const HEATMAP_RADIUS_PX = 60;
const HEATMAP_ALERT_THRESHOLD = 0.65;
const MAP_ZOOM_LOCK = {
  min: 13,
  max: 15,
};

function RouteMap({
  mapRef,
  onMove,
  formData,
  incidents,
  selectedIncident,
  setSelectedIncident,
  routeGeoJSON,
  avoidGeoJSON,
  onMarkerDrag,
  userLocation,
  incidentViewMode,
}) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const hoverTimer = useRef(null);

  const startPreview = (idx) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setIsLoadingImage(true);
      setExpandedIdx(idx);
    }, 1000);
  };

  const stopPreview = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setExpandedIdx(null);
    setIsLoadingImage(false);
  };

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        minZoom={MAP_ZOOM_LOCK.min}
        maxZoom={MAP_ZOOM_LOCK.max}
        initialViewState={{
          longitude: formData.origin.coords[0],
          latitude: formData.origin.coords[1],
          zoom: 14,
        }}
        onMove={onMove}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
      >
        <Marker
          longitude={formData.origin.coords[0]}
          latitude={formData.origin.coords[1]}
          color="red"
          draggable
          onDragEnd={(e) => onMarkerDrag('origin', e.lngLat)}
        />
        <Marker
          longitude={formData.destination.coords[0]}
          latitude={formData.destination.coords[1]}
          color="green"
          draggable
          onDragEnd={(e) => onMarkerDrag('destination', e.lngLat)}
        />

        {userLocation && (
          <Marker
            longitude={userLocation.coords[0]}
            latitude={userLocation.coords[1]}
            anchor="center"
          >
            <div className="h-[18px] w-[18px] rounded-full border-2 border-white bg-gradient-to-br from-primary-500 to-primary-700 shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
          </Marker>
        )}

        {incidentViewMode !== 'heatmap' &&
          incidents.map((incident) => (
            <Marker
              key={incident.id}
              longitude={incident.location.lng}
              latitude={incident.location.lat}
              color={getSeverityColor(incident.severity)}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedIncident(incident);
              }}
            >
              <div
                className={[
                  'h-[16px] w-[16px] cursor-pointer rounded-full border border-white shadow-[0_0_8px_rgba(15,23,42,0.25)]',
                  incident.severity === 'high'
                    ? 'bg-rose-500'
                    : incident.severity === 'medium'
                      ? 'bg-orange-500'
                      : 'bg-emerald-500',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setSelectedIncident(incident)}
              />
            </Marker>
          ))}

        {incidentViewMode === 'heatmap' && incidents.length > 0 && (
          <Source
            id="incidents-heatmap"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: incidents.map((incident) => {
                const severityKey =
                  typeof incident.severity === 'string'
                    ? incident.severity.toLowerCase()
                    : 'medium';
                const weight =
                  SEVERITY_WEIGHTS[severityKey] ?? SEVERITY_WEIGHTS.medium;

                return {
                  type: 'Feature',
                  properties: {
                    severity: severityKey,
                    weight: Math.max(weight, MIN_HEATMAP_WEIGHT),
                  },
                  geometry: {
                    type: 'Point',
                    coordinates: [incident.location.lng, incident.location.lat],
                  },
                };
              }),
            }}
          >
            <Layer
              id="incidents-heatmap-layer"
              type="heatmap"
              paint={{
                'heatmap-radius': HEATMAP_RADIUS_PX,
                'heatmap-intensity': 0.75,
                'heatmap-opacity': 0.85,
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0,
                  'rgba(15, 23, 42, 0)',
                  0.1,
                  'rgba(140, 162, 235, 0)',
                  0.25,
                  'rgba(37, 166, 235, 0.6)',
                  0.4,
                  'rgba(37, 243, 143, 0.75)',
                  0.55,
                  'rgba(206, 193, 8, 0.91)',
                  HEATMAP_ALERT_THRESHOLD,
                  'rgba(251, 197, 36, 0.58)',
                  HEATMAP_ALERT_THRESHOLD + 0.1,
                  'rgba(249, 116, 22, 0.66)',
                  HEATMAP_ALERT_THRESHOLD + 0.2,
                  'rgba(239, 68, 68, 0.69)',
                  1,
                  'rgba(185, 28, 28, 0.64)',
                ],
                'heatmap-weight': ['get', 'weight'],
              }}
            />
          </Source>
        )}

        {selectedIncident && (
          <Popup
            longitude={selectedIncident.location.lng}
            latitude={selectedIncident.location.lat}
            anchor="top"
            onClose={() => setSelectedIncident(null)}
            closeOnClick
            closeButton={false}
            closeOnMove={false}
            className="[&_.mapboxgl-popup-content]:rounded-2xl [&_.mapboxgl-popup-content]:p-0 [&_.mapboxgl-popup-content]:bg-transparent [&_.mapboxgl-popup-content]:shadow-none [&_.mapboxgl-popup-content]:overflow-visible"
          >
            <div
              className={[
                'grid max-w-xs gap-3 rounded-2xl p-[1px] shadow-xl shadow-slate-900/10',
                selectedIncident.severity === 'high'
                  ? 'bg-gradient-to-br from-rose-400 via-white to-rose-100'
                  : selectedIncident.severity === 'medium'
                    ? 'bg-gradient-to-br from-amber-300 via-white to-amber-100'
                    : 'bg-gradient-to-br from-emerald-300 via-white to-emerald-100',
              ].join(' ')}
            >
              <div className="rounded-2xl bg-white/95 p-4 text-slate-800 shadow-sm shadow-white/40 ring-1 ring-white/70">
              <h4 className="text-base font-semibold text-slate-900">
                {selectedIncident.title}
              </h4>
              <p className="text-sm text-slate-700">
                {selectedIncident.description}
              </p>
              <AttachmentPreview attachments={selectedIncident.attachments} />
              </div>
            </div>
          </Popup>
        )}

        {avoidGeoJSON && (
          <Source id="avoid-zone" type="geojson" data={avoidGeoJSON}>
            <Layer
              id="avoid-zone-fill"
              type="fill"
              paint={{
                'fill-color': '#f87171',
                'fill-opacity': 0.2,
              }}
            />
            <Layer
              id="avoid-zone-outline"
              type="line"
              paint={{
                'line-color': '#b91c1c',
                'line-width': 2,
              }}
            />
          </Source>
        )}

        {routeGeoJSON && (
          <Source
            key={`route-${routeGeoJSON.properties?.time || Date.now()}`}
            id={`route-${routeGeoJSON.properties?.time || Date.now()}`}
            type="geojson"
            data={routeGeoJSON}
          >
            <Layer
              id={`route-line-${routeGeoJSON.properties?.time || Date.now()}`}
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': routeGeoJSON.properties?.rerouted
                  ? '#10b981'
                  : '#3b82f6',
                'line-width': 5,
                'line-opacity': 0.9,
              }}
            />
          </Source>
        )}
      </Map>
      <div className="pointer-events-none absolute bottom-4 right-4 z-40 flex flex-col gap-3">
        <button
          type="button"
          className="pointer-events-auto rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5"
          title="Recenter map"
          onClick={() => {
            const target = userLocation?.coords || formData.origin.coords;
            if (mapRef?.current && Array.isArray(target)) {
              mapRef.current.flyTo({
                center: target,
                zoom: 14,
                speed: 1.2,
                bearing: 0,
                pitch: 0,
              });
            }
          }}
        >
          <span aria-hidden="true" className="text-xl text-primary-600">
            ◉
          </span>
          <span className="sr-only">Recenter map</span>
        </button>
        <div className="pointer-events-auto flex flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.2)]">
          <button
            type="button"
            className="border-b border-slate-200 px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-100"
            title="Zoom in"
            onClick={() => mapRef?.current?.zoomIn?.()}
          >
            +
          </button>
          <button
            type="button"
            className="px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-100"
            title="Zoom out"
            onClick={() => mapRef?.current?.zoomOut?.()}
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}

export default RouteMap;

RouteMap.propTypes = {
  mapRef: PropTypes.shape({
    current: PropTypes.any,
  }).isRequired,
  onMove: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    origin: PropTypes.shape({
      coords: PropTypes.arrayOf(PropTypes.number).isRequired,
      address: PropTypes.string.isRequired,
    }).isRequired,
    destination: PropTypes.shape({
      coords: PropTypes.arrayOf(PropTypes.number).isRequired,
      address: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  incidents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      severity: PropTypes.string.isRequired,
      location: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired,
      }).isRequired,
    }),
  ).isRequired,
  selectedIncident: PropTypes.oneOfType([
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      severity: PropTypes.string,
      location: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
    }),
    PropTypes.oneOf([null]),
  ]),
  setSelectedIncident: PropTypes.func.isRequired,
  routeGeoJSON: PropTypes.oneOfType([
    PropTypes.shape({
      type: PropTypes.string,
      properties: PropTypes.object,
      geometry: PropTypes.object,
    }),
    PropTypes.oneOf([null]),
  ]),
  avoidGeoJSON: PropTypes.oneOfType([
    PropTypes.shape({
      type: PropTypes.string,
      properties: PropTypes.object,
      geometry: PropTypes.object,
    }),
    PropTypes.oneOf([null]),
  ]),
  onMarkerDrag: PropTypes.func.isRequired,
  userLocation: PropTypes.shape({
    coords: PropTypes.arrayOf(PropTypes.number),
    address: PropTypes.string,
  }),
  incidentViewMode: PropTypes.oneOf(['markers', 'heatmap']),
};

RouteMap.defaultProps = {
  routeGeoJSON: null,
  avoidGeoJSON: null,
  selectedIncident: null,
  userLocation: null,
  incidentViewMode: 'markers',
};
