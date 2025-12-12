export function getRelativeTime(timestamp) {
  if (!timestamp) return "";

  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const value = date instanceof Date ? date.getTime() : Number(date);
  if (Number.isNaN(value)) return "";

  const now = Date.now();

  const units = [
    { limit: 60, divisor: 1, unit: "second" },
    { limit: 3600, divisor: 60, unit: "minute" },
    { limit: 86400, divisor: 3600, unit: "hour" },
    { limit: 604800, divisor: 86400, unit: "day" },
    { limit: 2629800, divisor: 604800, unit: "week" },
    { limit: 31557600, divisor: 2629800, unit: "month" },
    { limit: Infinity, divisor: 31557600, unit: "year" },
  ];

  const seconds = Math.round((value - now) / 1000);
  const absSeconds = Math.abs(seconds);

  for (const { limit, divisor, unit } of units) {
    if (absSeconds < limit) {
      const delta = Math.round(seconds / divisor);
      const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
      return rtf.format(delta, unit);
    }
  }

  return "";
}
