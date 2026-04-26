/**
 * CANONICAL booking mock-data source. Every surface (Home, Bookings list,
 * Booking detail, In Progress lifecycle, Calendar) reads from this file.
 *
 * Rules enforced here:
 *  - Each booking carries exactly one service. NO compound services. NO " + ".
 *  - Allowed services come from CANONICAL_SERVICES below.
 *  - Each booking has a real Date object (`startsAt`) so date formatting
 *    can branch on Today / Tomorrow / This Week / Later.
 *  - Each booking has an explicit `status`: confirmed | pending | in-progress
 *    | completed | cancelled.
 *  - Pro-side privacy: full street address (`address`) is only revealed when
 *    the booking enters Get Ready. Before then, render `neighborhood` only.
 */

/* --------- Canonical services --------- */

export const CANONICAL_SERVICES = [
  "Silk press",
  "Trim",
  "Retwist",
  "Knotless braids",
  "Box braids",
  "Cornrows",
  "Crochet",
  "Wash and go",
  "Blowout",
  "Color touch-up",
] as const;

export type CanonicalService = (typeof CANONICAL_SERVICES)[number];

/* --------- Status --------- */

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

/* --------- Booking model --------- */

export interface Booking {
  id: string;
  clientName: string;
  /** Two letters, derived from clientName. */
  clientInitial: string;
  service: CanonicalService;
  /** Authoritative scheduled start. All time/date copy derives from this. */
  startsAt: Date;
  durationMin: number;
  priceUsd: number;
  status: BookingStatus;
  isNewClient?: boolean;

  /** Neighborhood label, always safe to show. */
  neighborhood: string;
  /** Full street address. ONLY render when in Get Ready or later. */
  address: string;
  /** Distance from pro's base, e.g. "2.4 mi". */
  distance?: string;

  /** Optional client note attached at booking time. */
  note?: string;
  /** History count, used on detail page client card. 0 for first-time. */
  priorBookingsWithPro?: number;
  /** When this client last booked with the pro before today's appointment. */
  lastBookedAt?: Date;

  /** Drives the avatar tint on Home's "more today" preview. */
  avatarHue?: "blue" | "green" | "peach" | "violet" | "amber";

  /** Pending request expiry timestamp (only meaningful when status === pending). */
  expiresAt?: Date;

  /* ----- Completed-only fields ----- */
  /** Actual elapsed service duration if it differs from `durationMin`. */
  actualDurationMin?: number;
  /** Tip the client added on completion. */
  tipUsd?: number;
  /** Payout date label (e.g. "Apr 20"). Undefined while pending payout. */
  paidOutOn?: string;
  /** Pro's rating of the client (1–5). Undefined if not yet rated. */
  proRatingOfClient?: number;

  /* ----- Cancelled-only fields ----- */
  /** Who initiated the cancellation. */
  cancelledBy?: "client" | "pro" | "expired";
  /** When it was cancelled (display string, already formatted). */
  cancelledAt?: string;
  /** Optional client- or pro-supplied reason. */
  cancellationReason?: string;
  /** Cancellation fee paid out to the pro, in USD. 0 means none. */
  cancellationFeeUsd?: number;
}

/* --------- Initials helper --------- */

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function monogramOf(name: string): string {
  return initialsOf(name);
}

/* --------- Time helpers (relative to NOW) --------- */

function atTime(daysFromToday: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Prototype action-time anchor for the booking CTA demo state. Keeps Maya
// inside the start window while later same-day bookings render "Starts in …".
export function bookingButtonDemoCurrentTime(): Date {
  return atTime(0, 10, 20);
}

function inHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function mk(b: Omit<Booking, "clientInitial"> & { clientInitial?: string }): Booking {
  return { ...b, clientInitial: b.clientInitial ?? initialsOf(b.clientName) };
}

/* --------- Seed: confirmed + pending bookings --------- */

export const ALL_BOOKINGS: Booking[] = [
  // ------- TODAY -------
  mk({
    id: "b1",
    clientName: "Maya Okafor",
    service: "Silk press",
    startsAt: atTime(0, 10, 30),
    durationMin: 90,
    priceUsd: 180,
    status: "confirmed",
    neighborhood: "Fort Greene, Brooklyn",
    address: "212 Lafayette Ave, Brooklyn, NY",
    distance: "2.4 mi",
    avatarHue: "peach",
    priorBookingsWithPro: 2,
  }),
  mk({
    id: "b2",
    clientName: "Tasha Bellamy",
    service: "Knotless braids",
    startsAt: atTime(0, 13, 0),
    durationMin: 240,
    priceUsd: 280,
    status: "confirmed",
    isNewClient: true,
    neighborhood: "Bed-Stuy, Brooklyn",
    address: "488 Halsey St, Brooklyn, NY",
    distance: "3.1 mi",
    avatarHue: "blue",
    priorBookingsWithPro: 0,
    note: "First time — looking forward to it!",
  }),
  mk({
    id: "b3",
    clientName: "Renée Adeyemi",
    service: "Retwist",
    startsAt: atTime(0, 17, 30),
    durationMin: 75,
    priceUsd: 95,
    status: "confirmed",
    neighborhood: "Clinton Hill, Brooklyn",
    address: "70 Greene Ave, Brooklyn, NY",
    distance: "1.8 mi",
    avatarHue: "green",
    priorBookingsWithPro: 5,
  }),

  // ------- THIS WEEK -------
  mk({
    id: "p1",
    clientName: "Simone Carter",
    service: "Silk press",
    startsAt: atTime(2, 11, 0),
    durationMin: 90,
    priceUsd: 160,
    status: "pending",
    neighborhood: "Prospect Heights, Brooklyn",
    address: "655 Vanderbilt Ave, Brooklyn, NY",
    distance: "1.8 mi",
    avatarHue: "amber",
    expiresAt: inHours(6),
    note: "Have a wedding tomorrow morning — could really use you.",
  }),
  mk({
    id: "b4",
    clientName: "Jordan Lee",
    service: "Box braids",
    startsAt: atTime(3, 9, 30),
    durationMin: 360,
    priceUsd: 320,
    status: "confirmed",
    neighborhood: "Crown Heights, Brooklyn",
    address: "1100 Bedford Ave, Brooklyn, NY",
    distance: "3.1 mi",
    avatarHue: "violet",
    priorBookingsWithPro: 1,
  }),
  mk({
    id: "p2",
    clientName: "Devon Morris",
    service: "Cornrows",
    startsAt: atTime(5, 14, 0),
    durationMin: 75,
    priceUsd: 110,
    status: "pending",
    neighborhood: "Park Slope, Brooklyn",
    address: "320 5th Ave, Brooklyn, NY",
    distance: "2.4 mi",
    avatarHue: "blue",
    expiresAt: new Date(Date.now() + 23 * 60 * 1000),
  }),

  // ------- THIS MONTH -------
  mk({
    id: "b5",
    clientName: "Aaliyah Khan",
    service: "Box braids",
    startsAt: atTime(14, 10, 0),
    durationMin: 360,
    priceUsd: 320,
    status: "confirmed",
    neighborhood: "Harlem, Manhattan",
    address: "240 Lenox Ave, New York, NY",
    distance: "5.8 mi",
    avatarHue: "green",
    priorBookingsWithPro: 3,
  }),
  mk({
    id: "b6",
    clientName: "Imani Olatunji",
    service: "Wash and go",
    startsAt: atTime(20, 16, 30),
    durationMin: 60,
    priceUsd: 75,
    status: "confirmed",
    neighborhood: "Crown Heights, Brooklyn",
    address: "1100 Bedford Ave, Brooklyn, NY",
    distance: "2.7 mi",
    avatarHue: "amber",
    priorBookingsWithPro: 0,
    isNewClient: true,
  }),

  // ------- NEXT MONTH -------
  mk({
    id: "b7",
    clientName: "Zara Petit",
    service: "Crochet",
    startsAt: atTime(38, 11, 0),
    durationMin: 180,
    priceUsd: 220,
    status: "confirmed",
    neighborhood: "Bed-Stuy, Brooklyn",
    address: "320 Tompkins Ave, Brooklyn, NY",
    distance: "3.6 mi",
    avatarHue: "violet",
    priorBookingsWithPro: 0,
    isNewClient: true,
  }),

  // ------- LATER -------
  mk({
    id: "b8",
    clientName: "Nia Roberts",
    service: "Color touch-up",
    startsAt: atTime(75, 13, 0),
    durationMin: 120,
    priceUsd: 180,
    status: "confirmed",
    neighborhood: "Williamsburg, Brooklyn",
    address: "200 Bedford Ave, Brooklyn, NY",
    distance: "4.2 mi",
    avatarHue: "blue",
    priorBookingsWithPro: 4,
  }),
];

/* --------- History --------- */

export const HISTORY_BOOKINGS: Booking[] = [
  mk({
    id: "h1",
    clientName: "Maya Okafor",
    service: "Trim",
    startsAt: atTime(0, 9, 0),
    durationMin: 45,
    priceUsd: 65,
    status: "completed",
    neighborhood: "Fort Greene, Brooklyn",
    address: "212 Lafayette Ave, Brooklyn, NY",
    avatarHue: "peach",
    priorBookingsWithPro: 1,
    actualDurationMin: 52,
    tipUsd: 12,
    paidOutOn: undefined,
    proRatingOfClient: undefined,
  }),
  mk({
    id: "h2",
    clientName: "Jordan Lee",
    service: "Knotless braids",
    startsAt: atTime(-1, 11, 0),
    durationMin: 240,
    priceUsd: 220,
    status: "completed",
    neighborhood: "Crown Heights, Brooklyn",
    address: "1100 Bedford Ave, Brooklyn, NY",
    avatarHue: "blue",
    priorBookingsWithPro: 0,
    actualDurationMin: 240,
    tipUsd: 30,
    paidOutOn: "Apr 20",
    proRatingOfClient: 5,
  }),
  mk({
    id: "h3",
    clientName: "Devon Morris",
    service: "Silk press",
    startsAt: atTime(-3, 13, 0),
    durationMin: 75,
    priceUsd: 120,
    status: "completed",
    neighborhood: "Park Slope, Brooklyn",
    address: "320 5th Ave, Brooklyn, NY",
    avatarHue: "violet",
    priorBookingsWithPro: 1,
    actualDurationMin: 88,
    tipUsd: 15,
    paidOutOn: "Apr 18",
    proRatingOfClient: 4,
  }),
  mk({
    id: "h4",
    clientName: "Imani Olatunji",
    service: "Blowout",
    startsAt: atTime(-3, 18, 0),
    durationMin: 60,
    priceUsd: 0,
    status: "cancelled",
    neighborhood: "Crown Heights, Brooklyn",
    address: "1100 Bedford Ave, Brooklyn, NY",
    avatarHue: "amber",
    cancelledBy: "client",
    cancelledAt: "Apr 18 at 4:12 PM",
    cancellationReason: "Something came up — so sorry!",
    cancellationFeeUsd: 25,
  }),
  mk({
    id: "h5",
    clientName: "Aaliyah Khan",
    service: "Box braids",
    startsAt: atTime(-9, 10, 0),
    durationMin: 360,
    priceUsd: 320,
    status: "completed",
    neighborhood: "Harlem, Manhattan",
    address: "240 Lenox Ave, New York, NY",
    avatarHue: "green",
    priorBookingsWithPro: 2,
    actualDurationMin: 345,
    tipUsd: 50,
    paidOutOn: "Apr 12",
    proRatingOfClient: 5,
  }),
];

/* --------- Lookup --------- */

export function findBookingById(id: string): Booking | undefined {
  return (
    ALL_BOOKINGS.find((b) => b.id === id) ??
    HISTORY_BOOKINGS.find((b) => b.id === id)
  );
}

/* --------- Time-horizon grouping --------- */

export type TimeHorizon =
  | "today"
  | "this-week"
  | "this-month"
  | "next-month"
  | "later";

export function horizonOf(d: Date, now: Date = new Date()): TimeHorizon {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayPlus7 = new Date(startOfToday);
  startOfDayPlus7.setDate(startOfDayPlus7.getDate() + 7);

  if (d < startOfTomorrow) return "today";
  if (d < startOfDayPlus7) return "this-week";

  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
    return "this-month";
  }
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthAfter = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  if (d >= nextMonth && d < monthAfter) return "next-month";
  return "later";
}

/* --------- Date formatting (canonical) --------- */

/**
 *  - Within 24h: "Today 11:00 AM" / "Tomorrow 9:30 AM"
 *  - Within 7 days: "Sat 11 AM" / "Mon 2:30 PM"
 *  - Same year, beyond 7 days: "Apr 27 · 2:30 PM"
 *  - Different year: "Jan 12, 2027 · 2:30 PM"
 *
 * `mode = "date"` skips the time portion.
 */
export function formatBookingDate(
  d: Date,
  now: Date = new Date(),
  mode: "datetime" | "date" = "datetime",
): string {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfter = new Date(startOfTomorrow);
  startOfDayAfter.setDate(startOfDayAfter.getDate() + 1);
  const startOfDayPlus7 = new Date(startOfToday);
  startOfDayPlus7.setDate(startOfDayPlus7.getDate() + 7);

  const time = formatTime(d);

  if (d >= startOfToday && d < startOfTomorrow) {
    return mode === "date" ? "Today" : `Today ${time}`;
  }
  if (d >= startOfTomorrow && d < startOfDayAfter) {
    return mode === "date" ? "Tomorrow" : `Tomorrow ${time}`;
  }
  if (d >= startOfToday && d < startOfDayPlus7) {
    const wd = d.toLocaleDateString(undefined, { weekday: "short" });
    return mode === "date" ? wd : `${wd} ${time}`;
  }
  if (d.getFullYear() === now.getFullYear()) {
    const md = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return mode === "date" ? md : `${md} at ${time}`;
  }
  const full = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return mode === "date" ? full : `${full} at ${time}`;
}

function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  if (m === 0) return `${h} ${suffix}`;
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatTimeOnly(d: Date): string {
  return formatTime(d);
}

export function formatExpiresIn(expiresAt: Date, now: Date = new Date()): string {
  const ms = expiresAt.getTime() - now.getTime();
  if (ms <= 0) return "Expired";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `Expires in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `Expires in ${hours}h`;
}

/* --------- Money --------- */

export function formatUsd(n: number): string {
  if (n === 0) return "$0";
  return "$" + Math.round(n).toLocaleString("en-US");
}

/* --------- Status copy --------- */

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/* --------- Client relationship --------- */

/**
 * Tiered relationship label. Numbered counts ("47th booking") read like
 * surveillance — buckets read like a relationship. Optionally append the
 * last-booked date when it's recent enough to feel current (≤ 6 months).
 */
export function clientRelationshipLabel(
  booking: Pick<Booking, "priorBookingsWithPro" | "lastBookedAt">,
  now: Date = new Date(),
): string {
  const prior = booking.priorBookingsWithPro ?? 0;
  const tier =
    prior <= 0 ? "First-time client" : prior <= 3 ? "Returning client" : "Regular client";
  if (prior <= 0 || !booking.lastBookedAt) return tier;
  const sixMonthsMs = 1000 * 60 * 60 * 24 * 30 * 6;
  if (now.getTime() - booking.lastBookedAt.getTime() > sixMonthsMs) return tier;
  return `${tier} — Last booked ${formatLastBooked(booking.lastBookedAt)}`;
}

function formatLastBooked(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
