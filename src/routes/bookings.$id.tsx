import { createFileRoute, useParams } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { BookingDetailPage } from "@/bookings/booking-detail-page";

/**
 * Optional `from` referrer search param so back navigation can return
 * the pro to the surface they came from with state preserved:
 *  - "calendar"  → /calendar (with view + day in `view` & `day`)
 *  - "bookings"  → /bookings?tab=… (preserved via `tab`)
 *  - "home"      → /home
 * Unknown / missing → falls back to /bookings (legacy default).
 */
export type DetailReferrer = "calendar" | "bookings" | "home";
export type DetailCalendarView = "week" | "month";
export type DetailBookingsTab = "upcoming" | "in-progress" | "history";

export interface BookingDetailSearch {
  from?: DetailReferrer;
  /** Bookings tab to restore when from=bookings. */
  tab?: DetailBookingsTab;
  /** Calendar view to restore when from=calendar. */
  view?: DetailCalendarView;
  /** ISO date (YYYY-MM-DD) of the selected day when from=calendar. */
  day?: string;
}

export const Route = createFileRoute("/bookings/$id")({
  head: () => ({ meta: [{ title: "Booking — Ewà Biz" }] }),
  validateSearch: (search: Record<string, unknown>): BookingDetailSearch => {
    const out: BookingDetailSearch = {};
    const f = search.from;
    if (f === "calendar" || f === "bookings" || f === "home") out.from = f;
    const t = search.tab;
    if (t === "upcoming" || t === "in-progress" || t === "history") out.tab = t;
    const v = search.view;
    if (v === "week" || v === "month") out.view = v;
    const d = search.day;
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) out.day = d;
    return out;
  },
  component: BookingDetailRoute,
});

function BookingDetailRoute() {
  const { id } = useParams({ from: "/bookings/$id" });
  return (
    <RequireAuth>
      <BookingDetailPage bookingId={id} />
    </RequireAuth>
  );
}
