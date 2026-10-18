/** Elapsed calendar days in the site's timezone, independent of build/browser timezone. */
export function getRunningDays(
  startedAt: string,
  now = new Date(),
  timeZone = "Asia/Shanghai"
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startedAt)) return null;
  const start = new Date(`${startedAt}T00:00:00Z`);
  if (
    !Number.isFinite(start.getTime()) ||
    start.toISOString().slice(0, 10) !== startedAt
  )
    return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find(part => part.type === type)!.value);
  const today = Date.UTC(get("year"), get("month") - 1, get("day"));
  return Math.max(0, Math.floor((today - start.getTime()) / 86_400_000));
}
