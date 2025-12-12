import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as turf from '@turf/turf';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_ORIGIN = {
  coords: [-73.9875, 40.6937],
  address: 'NYU Tandon School of Engineering',
};

const DEFAULT_DESTINATION = {
  coords: [-73.996, 40.6895],
  address: 'Brooklyn Heights Promenade',
};

const BLOCKING_DISTANCE_KM = 0.3;
const VISUAL_RADIUS_KM = 0.1;
const LOGICAL_PADDING_KM = 0.25;
const COLLISION_BUFFER_METERS = 50;
const MAX_ITERATIONS = 3;
const WAYPOINT_FAILSAFE_METERS = 100; // Mapbox radius snap limit

export function useRoutePlanner(incidents = []) {
  const mapRef = useRef(null);
  const [formData, setFormData] = useState({
    origin: DEFAULT_ORIGIN,
    destination: DEFAULT_DESTINATION,
  });
  const [mode, setMode] = useState('walking');
  const [modeType, setModeType] = useState('search');
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [avoidGeoJSON, setAvoidGeoJSON] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lng: DEFAULT_ORIGIN.coords[0],
    lat: DEFAULT_ORIGIN.coords[1],
  });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const highSeverityIncidents = useMemo(() => {
    return incidents.filter((i) => (i.severity || '').toLowerCase() === 'high');
  }, [incidents]);

  const fetchDirections = useCallback(
    async ({ coordinates, profile, radiuses }) => {
      const coordString = coordinates
        .map(([lng, lat]) => `${lng},${lat}`)
        .join(';');
      const params = new URLSearchParams({
        geometries: 'geojson',
        overview: 'full',
        steps: 'false',
        continue_straight: 'true',
        access_token: MAPBOX_TOKEN,
      });

      if (radiuses) {
        params.set('radiuses', radiuses);
      }

      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordString}?${params.toString()}`,
        );
        const data = await res.json();

        if (!res.ok || !data.routes?.length) {
          return null;
        }

        return data.routes[0];
      } catch (err) {
        console.error('Mapbox directions failed:', err);
        return null;
      }
    },
    [],
  );

  const getDirectRoute = useCallback(
    async ({
      originOverride,
      destinationOverride,
      travelModeOverride,
      shouldCenter,
    } = {}) => {
      const origin = originOverride ?? formData.origin.coords;
      const destination = destinationOverride ?? formData.destination.coords;
      const travelMode = travelModeOverride ?? mode ?? 'walking';

      if (!origin?.length || !destination?.length) return null;

      const route = await fetchDirections({
        coordinates: [origin, destination],
        profile: travelMode,
      });

      setAvoidGeoJSON(null);

      if (route?.geometry) {
        setRouteGeoJSON({
          type: 'Feature',
          properties: { rerouted: false, time: Date.now() },
          geometry: route.geometry,
        });

        if (shouldCenter && mapRef.current) {
          const midPoint =
            route.geometry.coordinates[
              Math.floor(route.geometry.coordinates.length / 2)
            ];
          mapRef.current.flyTo({ center: midPoint, zoom: 14 });
        }
      } else {
        setRouteGeoJSON(null);
      }

      return route;
    },
    [
      fetchDirections,
      formData.destination.coords,
      formData.origin.coords,
      mapRef,
      mode,
    ],
  );

  const calculateRoute = useCallback(
    async (originCoords, destinationCoords, travelModeOverride) => {
      const origin = originCoords ?? formData.origin.coords;
      const destination = destinationCoords ?? formData.destination.coords;
      const travelMode = travelModeOverride ?? mode ?? 'walking';

      if (!origin?.length || !destination?.length) return;

      const directLine = turf.lineString([origin, destination]);

      const blockingIncidents = incidents.filter((incident) => {
        if (!incident?.id || !incident?.location) return false;
        const isHighSeverity =
          (incident.severity || '').toLowerCase() === 'high';
        if (!isHighSeverity) return false;

        const incidentPoint = turf.point([
          incident.location.lng,
          incident.location.lat,
        ]);

        const distanceToLine = turf.pointToLineDistance(
          incidentPoint,
          directLine,
          { units: 'meters' },
        );

        return distanceToLine <= BLOCKING_DISTANCE_KM * 1000;
      });

      if (!blockingIncidents.length) {
        setAvoidGeoJSON(null);
        await getDirectRoute({
          originOverride: origin,
          destinationOverride: destination,
          travelModeOverride: travelMode,
        });
        return;
      }

      let accumulatedBlockers = [...blockingIncidents];
      let lastRoute = null;

      for (let attempt = 0; attempt < MAX_ITERATIONS; attempt += 1) {
        const incidentPoints = accumulatedBlockers.map((incident) =>
          turf.point([incident.location.lng, incident.location.lat], {
            id: incident.id,
          }),
        );

        const avoidanceOverlays = accumulatedBlockers.map((incident) => {
          const center = [incident.location.lng, incident.location.lat];
          const circle = turf.circle(center, VISUAL_RADIUS_KM, {
            steps: 64,
            units: 'kilometers',
          });
          return {
            ...circle,
            properties: {
              id: incident.id,
              severity: incident.severity,
              type: 'blocking',
            },
          };
        });

        setAvoidGeoJSON(turf.featureCollection(avoidanceOverlays));

        const incidentCollection = turf.featureCollection(incidentPoints);
        const centerPoint = turf.center(incidentCollection);

        const maxRadiusKm = accumulatedBlockers.reduce((max, incident) => {
          const distanceKm = turf.distance(
            centerPoint,
            turf.point([incident.location.lng, incident.location.lat]),
            { units: 'kilometers' },
          );
          return Math.max(max, distanceKm);
        }, 0);

        const flankDistanceKm = maxRadiusKm + LOGICAL_PADDING_KM;
        const routeBearing = turf.bearing(
          turf.point(origin),
          turf.point(destination),
        );

        const leftWaypoint = turf.destination(
          centerPoint,
          flankDistanceKm,
          routeBearing - 90,
          { units: 'kilometers' },
        );
        const rightWaypoint = turf.destination(
          centerPoint,
          flankDistanceKm,
          routeBearing + 90,
          { units: 'kilometers' },
        );

        const radiuses = `unlimited;${WAYPOINT_FAILSAFE_METERS};unlimited`;

        const [leftRoute, rightRoute] = await Promise.all([
          fetchDirections({
            coordinates: [
              origin,
              leftWaypoint.geometry.coordinates,
              destination,
            ],
            profile: travelMode,
            radiuses,
          }),
          fetchDirections({
            coordinates: [
              origin,
              rightWaypoint.geometry.coordinates,
              destination,
            ],
            profile: travelMode,
            radiuses,
          }),
        ]);

        const candidates = [];
        if (leftRoute?.geometry) {
          candidates.push(leftRoute);
        }
        if (rightRoute?.geometry) {
          candidates.push(rightRoute);
        }

        if (!candidates.length) {
          break;
        }

        const bestRoute = candidates.reduce((shortest, route) => {
          if (!shortest) return route;
          return route.distance < shortest.distance ? route : shortest;
        }, null);

        lastRoute = bestRoute;

        const routeLine = turf.lineString(bestRoute.geometry.coordinates);
        const newColliders = highSeverityIncidents.filter((incident) => {
          if (!incident?.id || !incident?.location) return false;
          const alreadyBlocked = accumulatedBlockers.some(
            (b) => b.id === incident.id,
          );
          if (alreadyBlocked) return false;
          const incidentPoint = turf.point([
            incident.location.lng,
            incident.location.lat,
          ]);
          const distanceToRoute = turf.pointToLineDistance(
            incidentPoint,
            routeLine,
            { units: 'meters' },
          );
          return distanceToRoute <= COLLISION_BUFFER_METERS;
        });

        if (!newColliders.length) {
          setRouteGeoJSON({
            type: 'Feature',
            properties: {
              rerouted: true,
              method: 'elastic-corridor',
              time: Date.now(),
            },
            geometry: bestRoute.geometry,
          });

          if (mapRef.current && bestRoute.geometry.coordinates.length) {
            const midPoint =
              bestRoute.geometry.coordinates[
                Math.floor(bestRoute.geometry.coordinates.length / 2)
              ];
            mapRef.current.flyTo({ center: midPoint, zoom: 14 });
          }
          return;
        }

        accumulatedBlockers = [...accumulatedBlockers, ...newColliders];
      }

      if (lastRoute?.geometry) {
        setRouteGeoJSON({
          type: 'Feature',
          properties: {
            rerouted: true,
            method: 'elastic-corridor',
            time: Date.now(),
          },
          geometry: lastRoute.geometry,
        });
        if (mapRef.current && lastRoute.geometry.coordinates.length) {
          const midPoint =
            lastRoute.geometry.coordinates[
              Math.floor(lastRoute.geometry.coordinates.length / 2)
            ];
          mapRef.current.flyTo({ center: midPoint, zoom: 14 });
        }
        return;
      }

      await getDirectRoute({
        originOverride: origin,
        destinationOverride: destination,
        travelModeOverride: travelMode,
      });
    },
    [
      fetchDirections,
      getDirectRoute,
      formData.destination.coords,
      formData.origin.coords,
      incidents,
      highSeverityIncidents,
      mapRef,
      mode,
    ],
  );

  const findSafeRoute = useCallback(() => {
    return calculateRoute(
      formData.origin.coords,
      formData.destination.coords,
      mode,
    );
  }, [
    calculateRoute,
    formData.destination.coords,
    formData.origin.coords,
    mode,
  ]);

  useEffect(() => {
    getDirectRoute();
  }, [getDirectRoute]);

  const reverseGeocode = useCallback(async (lng, lat) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`,
      );
      const data = await res.json();
      return (
        data.features?.[0]?.place_name || `${lng.toFixed(4)}, ${lat.toFixed(4)}`
      );
    } catch {
      return `${lng.toFixed(4)}, ${lat.toFixed(4)}`;
    }
  }, []);

  const setAddressField = useCallback((field, address) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { ...prev[field], address },
    }));
  }, []);

  const setLocationField = useCallback((field, coords, address) => {
    if (!Array.isArray(coords) || coords.length !== 2) return;
    setFormData((prev) => ({
      ...prev,
      [field]: { coords, address: address || prev[field].address },
    }));
  }, []);

  const handleMarkerDrag = useCallback(
    async (field, { lng, lat }) => {
      const addr = await reverseGeocode(lng, lat);
      const coords = [lng, lat];
      setFormData((prev) => ({
        ...prev,
        [field]: { coords, address: addr },
      }));
    },
    [reverseGeocode],
  );

  const useCurrentLocationAsOrigin = useCallback(() => {
    if (!userLocation) return;
    setFormData((prev) => ({
      ...prev,
      origin: {
        coords: userLocation.coords,
        address: userLocation.address,
      },
    }));
    setModeType('search');
    if (mapRef.current) {
      mapRef.current.flyTo({ center: userLocation.coords, zoom: 14 });
    }
  }, [mapRef, setModeType, userLocation]);

  useEffect(() => {
    if (selectedIncident && mapRef.current) {
      const { lng, lat } = selectedIncident.location;
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
    }
  }, [selectedIncident]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported in this environment.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        const address = `Current location (${longitude.toFixed(4)}, ${latitude.toFixed(4)})`;
        const current = {
          coords: [longitude, latitude],
          address,
        };
        setUserLocation(current);
        setIsLocating(false);
        setLocationError(null);
        setMapCenter({ lng: longitude, lat: latitude });
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationError(
          error.message || 'Unable to retrieve current location.',
        );
      },
      { enableHighAccuracy: true },
    );
  }, [mapRef]);

  return {
    mapRef,
    mapCenter,
    setMapCenter,
    formData,
    setAddressField,
    setLocationField,
    mode,
    setMode,
    modeType,
    setModeType,
    calculateRoute,
    findSafeRoute,
    routeGeoJSON,
    avoidGeoJSON,
    incidents,
    highSeverityIncidents,
    selectedIncident,
    setSelectedIncident,
    handleMarkerDrag,
    userLocation,
    isLocating,
    locationError,
    useCurrentLocationAsOrigin,
  };
}
