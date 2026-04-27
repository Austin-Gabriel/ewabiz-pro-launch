/**
 * LEGACY ADAPTER over the canonical /src/data/mock-bookings.ts.
 *
 * Older surfaces (Home offline dashboard, the state-live experiments) still
 * consume a `Booking` shape with `startsAt: string` and a few dashboard-only
 * fields. This file:
 *   - Re-exports `formatUsd` from the canonical module.
 *   - Provides a thin `Booking` type compatible with the old call sites.
 *   - Builds the LIVE_* and DAY_* dashboard datasets by adapting from the
 *     canonical ALL_BOOKINGS list.
 *
 * NEW work should import directly from `@/data/mock-bookings`. This adapter
 * exists only to keep the Home / state-live render paths stable. There is no
 * compound service here either — every adapted booking carries exactly one
 * service from the canonical list.
 */

import {
  ALL_BOOKINGS,
  formatTimeOnly,
  formatUsd as canonicalFormatUsd,
  type Booking as CanonicalBooking,
  type CanonicalService,
} from "./mock-bookings";

export const formatUsd = canonicalFormatUsd;

export interface Booking {
  id: string;
  clientName: string;
  clientInitial: string;
  service: CanonicalService;
  /** "10:30" or "10:30 AM" — display-friendly start. */
  startsAt: string;
  durationMin: number;
  priceUsd: number;
  isNewClient?: boolean;
  location?: string;
  address?: string;
  shortAddress?: string;
  distance?: string;
  avatarHue?: "blue" | "green" | "peach" | "violet" | "amber";
  startsInMin?: number;
  /** "AM"/"PM" suffix when not embedded in startsAt. */
  startsAtMeridiem?: "AM" | "PM";
  /** Clock string for when the pro should leave (e.g. "12:38 PM"). */
  scheduledDepartureAt?: string;
}

export interface BookingRequest {
  id: string;
  clientName: string;
  clientInitial: string;
  service: CanonicalService;
  requestedFor: string;
  priceUsd: number;
  message?: string;
  location?: string;
  distance?: string;
}

export type LiveStateKind =
  | "morning"
  | "heads-up"
  | "en-route"
  | "in-progress"
  | "wrap-up"
  | "idle";

export interface LiveStatus {
  kind: LiveStateKind;
  elapsedMin?: number;
  etaMin?: number;
  leaveInMin?: number;
  completedCount?: number;
  completedTotalUsd?: number;
}

export interface IncomingRequest extends BookingRequest {
  distance: string;
  etaMin: number;
  payoutUsd: number;
  photoUrl?: string;
}

/** Smart Online toggle state. Drives StatusBar and gates intake. */
export type OnlineToggleKind =
  | "available"
  | "protecting"
  | "outside-hours"
  | "on-booking"
  | "manual-offline"
  | "after-hours-online";

export interface OnlineState {
  kind: OnlineToggleKind;
  protectingTime?: string;
  resumesAt?: string;
  autoOfflineBanner?: boolean;
  workHoursEndedAt?: string;
}

/** Pending on-demand request that hijacks the Up Next slot. */
export interface PendingOnDemand extends BookingRequest {
  secondsLeft: number;
  distance: string;
  etaMin: number;
  payoutUsd: number;
}

/* --------- Adapter --------- */

function adapt(b: CanonicalBooking, startsInMin?: number): Booking {
  return {
    id: b.id,
    clientName: b.clientName,
    clientInitial: b.clientInitial,
    service: b.service,
    startsAt: formatTimeOnly(b.startsAt),
    durationMin: b.durationMin,
    priceUsd: b.priceUsd,
    isNewClient: b.isNewClient,
    location: b.neighborhood,
    address: b.address,
    shortAddress: b.address.split(",").slice(0, 2).join(",").trim(),
    distance: b.distance,
    avatarHue: b.avatarHue,
    startsInMin,
  };
}

const todayConfirmed = ALL_BOOKINGS.filter((b) => {
  const d = b.startsAt;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return d >= start && d < end && b.status === "confirmed";
});

const TODAY_BOOKINGS: Booking[] = todayConfirmed
  .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
  .map((b, i) => adapt(b, i === 0 ? 47 : undefined));

/* --------- Datasets used by Home --------- */

export const LIVE_FIRST_TIME = {
  greetingName: "Amara",
  weekToDateUsd: 0,
  monthToDateUsd: 0,
  weekProjectedUsd: 0,
  bookingsToday: [] as Booking[],
  pendingRequests: [] as BookingRequest[],
  bookingLink: "ewa.app/amara",
  ratingValue: 0,
  ratingCount: 0,
  completionPct: 100,
  todayEarningsUsd: 0,
  todayProjectedUsd: 0,
  liveStatus: { kind: "idle" } as LiveStatus,
};

export const LIVE_QUIET_DAY = {
  greetingName: "Amara",
  weekToDateUsd: 480,
  monthToDateUsd: 2140,
  weekProjectedUsd: 720,
  bookingsToday: [] as Booking[],
  pendingRequests: [
    {
      id: "r1",
      clientName: "Jordan Lee",
      clientInitial: "JL",
      service: "Knotless braids" as CanonicalService,
      requestedFor: "Sat 11 AM",
      priceUsd: 220,
      message: "Hi! Saw you on a friend's reel — would love to book.",
      location: "Crown Heights, Brooklyn",
      distance: "3.1 mi",
    },
  ] as BookingRequest[],
  nextOpenSlot: "Tomorrow, 10:30 AM",
  ratingValue: 4.9,
  ratingCount: 38,
  completionPct: 100,
  todayEarningsUsd: 0,
  todayProjectedUsd: 0,
  liveStatus: { kind: "idle" } as LiveStatus,
};

export const LIVE_ACTIVE_DAY = {
  greetingName: "Amara",
  weekToDateUsd: 1240,
  monthToDateUsd: 4680,
  weekProjectedUsd: 1800,
  weekGoalUsd: 1800,
  bookingsToday: TODAY_BOOKINGS,
  pendingRequests: [
    {
      id: "r1",
      clientName: "Aaliyah Khan",
      clientInitial: "AK",
      service: "Box braids" as CanonicalService,
      requestedFor: "Sun 9 AM",
      priceUsd: 320,
      location: "Harlem, Manhattan",
      distance: "5.8 mi",
    },
  ] as BookingRequest[],
  ratingValue: 4.9,
  ratingCount: 142,
  completionPct: 98,
  todayEarningsUsd: 420,
  todayProjectedUsd: 540,
  liveStatus: { kind: "morning" } as LiveStatus,
};

/* --------- Incoming request example --------- */

export const INCOMING_REQUEST_EXAMPLE: IncomingRequest = {
  id: "inc1",
  clientName: "Simone Carter",
  clientInitial: "SC",
  service: "Silk press",
  requestedFor: "Today at 4:30 PM",
  priceUsd: 160,
  payoutUsd: 142,
  location: "Prospect Heights, Brooklyn",
  distance: "1.8 mi",
  etaMin: 12,
  message: "Have a wedding tomorrow morning — could really use you.",
};

/* --------- Greeting helpers --------- */

export function timeOfDayGreeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function formatToday(d: Date = new Date()): string {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

/* --------- Time-of-day variants --------- */

export const LIVE_DAY_MORNING = {
  ...LIVE_ACTIVE_DAY,
  todayEarningsUsd: 0,
  todayProjectedUsd: 540,
  liveStatus: { kind: "morning" } as LiveStatus,
};

export const LIVE_DAY_HEADS_UP = {
  ...LIVE_ACTIVE_DAY,
  todayEarningsUsd: 0,
  todayProjectedUsd: 540,
  liveStatus: { kind: "heads-up", leaveInMin: 5 } as LiveStatus,
};

export const LIVE_DAY_IN_PROGRESS = {
  ...LIVE_ACTIVE_DAY,
  todayEarningsUsd: 0,
  todayProjectedUsd: 540,
  liveStatus: { kind: "in-progress", elapsedMin: 32 } as LiveStatus,
};

export const LIVE_DAY_WRAP_UP = {
  ...LIVE_ACTIVE_DAY,
  bookingsToday: [] as Booking[],
  todayEarningsUsd: 515,
  todayProjectedUsd: 515,
  liveStatus: {
    kind: "wrap-up",
    completedCount: 3,
    completedTotalUsd: 515,
  } as LiveStatus,
};

/* --------- Day-context variants --------- */

export const DAY_NONE = {
  ...LIVE_QUIET_DAY,
  pendingRequests: [] as BookingRequest[],
  nextFutureBookingLabel: "Thursday at 2:00 PM",
  liveStatus: { kind: "idle" } as LiveStatus,
};

export const DAY_TRULY_EMPTY = {
  ...LIVE_FIRST_TIME,
  nextFutureBookingLabel: undefined as string | undefined,
};

export const DAY_ONE = {
  ...LIVE_ACTIVE_DAY,
  bookingsToday: TODAY_BOOKINGS.length > 0 ? [TODAY_BOOKINGS[0]] : [],
  pendingRequests: [] as BookingRequest[],
  todayEarningsUsd: 0,
  todayProjectedUsd: 140,
  liveStatus: { kind: "morning" } as LiveStatus,
};

export const DAY_MULTIPLE = {
  ...LIVE_ACTIVE_DAY,
  todayEarningsUsd: 0,
  todayProjectedUsd: 540,
  liveStatus: { kind: "morning" } as LiveStatus,
};

export const DAY_FULL = {
  ...LIVE_ACTIVE_DAY,
  bookingsToday: [
    ...TODAY_BOOKINGS,
    {
      id: "b-extra-1",
      clientName: "Imani Olatunji",
      clientInitial: "IO",
      service: "Wash and go" as CanonicalService,
      startsAt: "7:00",
      durationMin: 60,
      priceUsd: 75,
      location: "Crown Heights, Brooklyn",
      address: "1100 Bedford Ave, Brooklyn, NY",
      shortAddress: "1100 Bedford Ave, Brooklyn",
      distance: "2.7 mi",
      avatarHue: "violet",
    },
    {
      id: "b-extra-2",
      clientName: "Zara Petit",
      clientInitial: "ZP",
      service: "Cornrows" as CanonicalService,
      startsAt: "8:30",
      durationMin: 75,
      priceUsd: 110,
      isNewClient: true,
      location: "Bed-Stuy, Brooklyn",
      address: "320 Tompkins Ave, Brooklyn, NY",
      shortAddress: "320 Tompkins Ave, Brooklyn",
      distance: "3.6 mi",
      avatarHue: "amber",
    },
  ] as Booking[],
  todayEarningsUsd: 0,
  todayProjectedUsd: 725,
  liveStatus: { kind: "morning" } as LiveStatus,
};

/* --------- Online (dispatch) variant --------- */

export const ONLINE_IDLE = {
  ...LIVE_QUIET_DAY,
  bookingsToday: [] as Booking[],
  pendingRequests: [] as BookingRequest[],
  liveStatus: { kind: "idle" } as LiveStatus,
};
