export function normalizeString(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    return String(value).trim();
  }
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export function normalizeCep(value: unknown): string {
  const normalized = normalizeString(value).replace(/[^0-9]/g, "");
  if (normalized.length === 8) {
    return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
  }
  return normalized;
}

export function normalizeAddress(parts: Array<unknown>): string {
  return parts
    .map((part) => normalizeString(part))
    .filter((part) => part.length > 0)
    .join(", ");
}
