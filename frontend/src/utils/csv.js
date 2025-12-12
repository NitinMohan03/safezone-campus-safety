const stringifiedValue = (value) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value) || typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

export const buildCsv = (records) => {
  if (!records || !records.length) return "";

  const fieldSet = records.reduce((acc, record) => {
    Object.keys(record || {}).forEach((key) => acc.add(key));
    return acc;
  }, new Set());

  const headers = Array.from(fieldSet);

  const escapeCsv = (raw) => {
    const safeValue = stringifiedValue(raw).replace(/"/g, '""');
    return /[",\n]/.test(safeValue) ? `"${safeValue}"` : safeValue;
  };

  const lines = [
    headers.map((header) => escapeCsv(header)).join(","),
    ...records.map((record) =>
      headers.map((header) => escapeCsv(record?.[header])).join(",")
    ),
  ];

  return lines.join("\n");
};
