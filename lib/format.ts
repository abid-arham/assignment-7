const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** API money values arrive as Decimal strings ("50", "135.00"). */
export function formatMoney(value: string | number | null | undefined) {
  return currency.format(Number(value ?? 0));
}

/** Calendar dates (semester start/end) are stored at UTC midnight, so format them in UTC. */
export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return dateFmt.format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return dateTimeFmt.format(new Date(value));
}

export function formatDateRange(start: string, end: string) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatRelative(value: string | Date) {
  const diffSeconds = (new Date(value).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) return relative.format(Math.round(diffSeconds / seconds), unit);
  }
  return "just now";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((part) => /^[A-Za-z]/.test(part) && !/^(dr|prof|mr|ms|mrs)\.?$/i.test(part))
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** "ENROLLMENT_CREATED" → "Enrollment created" */
export function humanize(value: string) {
  const text = value.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
