// Human-readable date formatting for the portal, always in Beirut time.
//
// The whole service runs on Beirut clock time (that's where the nurses and
// patients are), and the diaspora audience expects "when it happened there",
// not their own machine's locale. So we format every portal timestamp with an
// explicit Asia/Beirut timezone — deterministic regardless of the viewer's
// device — as e.g. "Thu 14 May · 18:30".

export function formatBeirut(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Beirut",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")} · ${get("hour")}:${get("minute")}`;
}
