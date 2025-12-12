import { api } from "./api";

const ALERT_WEBHOOK_URL = import.meta.env.VITE_ALERT_WEBHOOK_URL || "";
const EARTH_RADIUS_M = 6371000; // meters

const toRad = (deg) => (Number.isFinite(deg) ? (deg * Math.PI) / 180 : NaN);

function haversineMeters(a, b) {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = lat2 - lat1;
  const dLon = toRad(b.lng) - toRad(a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

export const alertService = {
  /**
   * Notify nearby subscribers when a high-severity incident is approved.
   * This runs server-side safe (reads subscriptions, posts to webhook).
   */
  async triggerNearbyNotification(report) {
    const severity = (report?.severity || "").toLowerCase();
    const status = (report?.status || "").toLowerCase();
    if (severity !== "high" || status !== "approved") return;
    if (!report?.location || typeof report.location !== "object") return;
    const { lat, lng } = report.location;
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return;

    if (!ALERT_WEBHOOK_URL) {
      console.warn(
        "[alertService] VITE_ALERT_WEBHOOK_URL not configured; skipping alert."
      );
      return;
    }

    let subscriptions = [];
    try {
      const records = await api.alerts.getAll();
      subscriptions = Array.isArray(records) ? records : [];
    } catch (err) {
      console.error("[alertService] Failed to load alert subscriptions", err);
      return;
    }

    const incidentPoint = { lat: Number(lat), lng: Number(lng) };
    const nearby = subscriptions
      .map((sub) => {
        const subLoc = sub?.location || {};
        const candidate = {
          lat: Number(subLoc.lat),
          lng: Number(subLoc.lng),
        };
        if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lng)) {
          return null;
        }
        const distanceMeters = haversineMeters(incidentPoint, candidate);
        const radius = Number(sub.radiusMeters) || 500;
        if (distanceMeters <= radius) {
          return {
            id: sub.id,
            email: sub.email,
            name: sub.reporter || sub.name || "",
            distanceMeters: Math.round(distanceMeters),
            radiusMeters: radius,
            location: candidate,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (!nearby.length) return;

    const payload = {
      type: "nearby-high-severity-incident",
      reportId: report.id,
      title: report.title,
      severity: report.severity,
      status: report.status,
      location: incidentPoint,
      timestamp: new Date().toISOString(),
      recipients: nearby,
    };

    try {
      await fetch(ALERT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[alertService] Failed to post alert webhook", err);
    }
  },
};
