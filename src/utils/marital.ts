export const normalizeMarital = (v: unknown): string =>
  typeof v === "string" ? v.trim().toLowerCase() : "";

export const isMarried = (v: unknown): boolean =>
  normalizeMarital(v) === "married";

export const toTitleMarital = (v: unknown): string => {
  const n = normalizeMarital(v);
  if (n === "married") return "Married";
  if (n === "single") return "Single";
  if (typeof v === "string" && v.length > 0) {
    return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  }
  return "Single"; // safe default
};
