import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/calendar/calendar-page";
import { RequireAuth } from "@/auth/require-auth";

export interface CalendarSearch {
  /** Restore which top-level view (week/month) when returning from detail. */
  view?: "week" | "month";
  /** Restore selected day (YYYY-MM-DD) when returning from detail. */
  day?: string;
}

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Ewà Biz" }] }),
  validateSearch: (search: Record<string, unknown>): CalendarSearch => {
    const out: CalendarSearch = {};
    const v = search.view;
    if (v === "week" || v === "month") out.view = v;
    const d = search.day;
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) out.day = d;
    return out;
  },
  component: CalendarRoute,
});

function CalendarRoute() {
  return (
    <RequireAuth>
      <CalendarPage />
    </RequireAuth>
  );
}
