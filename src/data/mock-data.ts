/**
 * Sample data for the LIVE dashboard. Real-looking names, services, prices,
 * and times — the kind of data a real pro would scan in 2 seconds.
 */

export interface Booking {
  id: string;
  clientName: string;
  clientInitial: string;
  service: string;
  startsAt: string; // "10:30"
  durationMin: number;
  priceUsd: number;
  isNewClient?: boolean;
  /** Short locality string shown in lists (e.g. "Bed-Stuy, Brooklyn"). */
  location?: string;
  /** Full street address used by the live state card / nav button. */
  address?: string;
  /** Short address shown on the Up Next card (e.g. "212 Lafayette Ave, Brooklyn"). */
  shortAddress?: string;
  /** Distance from the pro right now (e.g. "2.4 mi"). */
  distance?: string;
  /** Avatar tint for the stacked "more today" preview row. */
  avatarHue?: "blue" | "green" | "peach" | "violet" | "amber";
  /** Minutes until the booking starts. Drives the "Starts in X min" pill. */
  startsInMin?: number;
}

export interface BookingRequest {
  id: string;
  clientName: string;
  clientInitial: string;
  service: string;
  requestedFor: string; // "Sat, Apr 27 · 2:00 PM"
  priceUsd: number;
  message?: string;
  /** Where the appointment will happen (city or neighborhood). */
  location?: string;
  /** Distance from the pro right now, e.g. "2.4 mi". Optional. */
  distance?: string;
}

export type LiveStateKind =
  | "morning"      // start of day, first booking is hours away
  | "heads-up"     // next booking starts in <= 15 min — "head out in N min"
  | "en-route"     // pro is driving to the client
  | "in-progress"  // currently with a client
  | "wrap-up"      // last booking just ended — end-of-day summary
  | "idle";        // nothing scheduled, no active job

export interface LiveStatus {
  kind: LiveStateKind;
  /** When in-progress, minutes elapsed since start. */
  elapsedMin?: number;
  /** When en-route, ETA string. */
  etaMin?: number;
  /** When heads-up, minutes until pro should leave. */
  leaveInMin?: number;
  /** When wrap-up, count + total of bookings completed today. */
  completedCount?: number;
  completedTotalUsd?: number;
}

export interface IncomingRequest extends BookingRequest {
  /** Distance from current location. */
  distance: string;
  /** ETA to client in minutes. */
  etaMin: number;
  /** Estimated payout (after fees). */
  payoutUsd: number;
  /** Client photo URL. Optional — falls back to initial avatar. */
  photoUrl?: string;
}

/* --------- Three live-pro variants --------- */

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
      clientInitial: "J",
      service: "Knotless braids · medium",
      requestedFor: "Sat, Apr 27 · 11:00 AM",
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
  bookingsToday: [
    {
      id: "b1",
      clientName: "Maya Okafor",
      clientInitial: "M",
      service: "Silk press + trim",
      startsAt: "10:30",
      durationMin: 90,
      priceUsd: 180,
      location: "Fort Greene, Brooklyn",
      address: "212 Lafayette Ave, Brooklyn, NY",
      shortAddress: "212 Lafayette Ave, Brooklyn",
      distance: "2.4 mi",
      avatarHue: "peach",
      startsInMin: 47,
    },
    {
      id: "b2",
      clientName: "Tasha B.",
      clientInitial: "T",
      service: "Knotless braids · small",
      startsAt: "1:00",
      durationMin: 240,
      priceUsd: 280,
      isNewClient: true,
      location: "Bed-Stuy, Brooklyn",
      address: "488 Halsey St, Brooklyn, NY",
      shortAddress: "488 Halsey St, Brooklyn",
      distance: "3.1 mi",
      avatarHue: "blue",
    },
    {
      id: "b3",
      clientName: "Renée Adeyemi",
      clientInitial: "R",
      service: "Retwist + style",
      startsAt: "5:30",
      durationMin: 75,
      priceUsd: 95,
      location: "Clinton Hill, Brooklyn",
      address: "70 Greene Ave, Brooklyn, NY",
      shortAddress: "70 Greene Ave, Brooklyn",
      distance: "1.8 mi",
      avatarHue: "green",
    },
  ] as Booking[],
  pendingRequests: [
    {
      id: "r1",
      clientName: "Aaliyah K.",
      clientInitial: "A",
      service: "Box braids · waist length",
      requestedFor: "Sun, Apr 28 · 9:00 AM",
      priceUsd: 320,
      location: "Harlem, Manhattan",
      distance: "5.8 mi",
    },
    {
      id: "r2",
      clientName: "Devon M.",
      clientInitial: "D",
      service: "Silk press",
      requestedFor: "Mon, Apr 29 · 6:00 PM",
      priceUsd: 120,
      message: "Need it for an event Tuesday morning — flexible on time.",
      location: "Park Slope, Brooklyn",
      distance: "2.4 mi",
    },
  ] as BookingRequest[],
  ratingValue: 4.9,
  ratingCount: 142,
  completionPct: 98,
  todayEarningsUsd: 420,
  todayProjectedUsd: 540,
  /** Default to a "Up Next" framing — home.tsx can override via ?live=in-progress|en-route. */
  liveStatus: { kind: "morning" } as LiveStatus,
};

/* --------- Incoming request modal example --------- */

export const INCOMING_REQUEST_EXAMPLE: IncomingRequest = {
  id: "inc1",
  clientName: "Simone Carter",
  clientInitial: "S",
  service: "Silk press + trim",
  requestedFor: "Today · 4:30 PM",
  priceUsd: 160,
  payoutUsd: 142,
  location: "Prospect Heights, Brooklyn",
  distance: "1.8 mi",
  etaMin: 12,
  message: "Have a wedding tomorrow morning — could really use you.",
};

/* --------- Greeting helper --------- */

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

export function formatUsd(n: number): string {
  if (n === 0) return "$0";
  return "$" + n.toLocaleString("en-US");
}

/* --------- Time-of-day variants of the active day --------- */

/**
 * Fresh start of the day. First booking is at 10:30, three on the books.
 * No earnings yet. Used to demo the morning Up Next state.
 */
export const LIVE_DAY_MORNING = {
  ...LIVE_ACTIVE_DAY,
  todayEarningsUsd: 0,
  todayProjectedUsd: 540,
  liveStatus: { kind: "morning" } as LiveStatus,
};

/**
 * 10:25 AM — Maya's appointment is in 5 minutes. Pro should head out now.
 */
export const LIVE_DAY_HEADS_UP = {
  ...LIVE_ACTIVE_DAY,
  todayEarningsUsd: 0,
  todayProjectedUsd: 540,
  liveStatus: { kind: "heads-up", leaveInMin: 5 } as LiveStatus,
};

/**
 * 11:00 AM — pro is mid-appointment with Maya. Two more booked.
 */
export const LIVE_DAY_IN_PROGRESS = {
  ...LIVE_ACTIVE_DAY,
  todayEarningsUsd: 0,
  todayProjectedUsd: 540,
  liveStatus: { kind: "in-progress", elapsedMin: 32 } as LiveStatus,
};

/**
 * 7:15 PM — Renée's appointment just wrapped. Day is done.
 */
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

/* --------- Day-context variants (drives the Home dashboard density) --------- */

/**
 * Offline + 0 bookings today. Used when dev "Day context" = none.
 * Mirrors LIVE_QUIET_DAY shape but with no pending requests so the empty
 * state reads cleanly.
 */
export const DAY_NONE = {
  ...LIVE_QUIET_DAY,
  pendingRequests: [] as BookingRequest[],
  /** Used by Offline empty state: "Your next booking is Thursday at 2pm". */
  nextFutureBookingLabel: "Thursday at 2:00 PM",
  liveStatus: { kind: "idle" } as LiveStatus,
};

/** Truly empty — no future bookings on the books. Used as a fallback. */
export const DAY_TRULY_EMPTY = {
  ...LIVE_FIRST_TIME,
  nextFutureBookingLabel: undefined as string | undefined,
};

/** Offline + 1 booking today. */
export const DAY_ONE = {
  ...LIVE_ACTIVE_DAY,
  bookingsToday: [LIVE_ACTIVE_DAY.bookingsToday[0]] as Booking[],
  pendingRequests: [] as BookingRequest[],
  todayEarningsUsd: 0,
  todayProjectedUsd: 140,
  liveStatus: { kind: "morning" } as LiveStatus,
};

/** Offline + 3-4 bookings today (the existing active-day dataset has 3). */
export const DAY_MULTIPLE = {
  ...LIVE_ACTIVE_DAY,
  todayEarningsUsd: 0,
  todayProjectedUsd: 540,
  liveStatus: { kind: "morning" } as LiveStatus,
};

/** Offline + 5+ bookings today. Stacked back-to-back. */
export const DAY_FULL = {
  ...LIVE_ACTIVE_DAY,
  bookingsToday: [
    ...LIVE_ACTIVE_DAY.bookingsToday,
    {
      id: "b4",
      clientName: "Imani O.",
      clientInitial: "I",
      service: "Wash & blow-dry",
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
      id: "b5",
      clientName: "Zara P.",
      clientInitial: "Z",
      service: "Cornrows · 8",
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

/* --------- Online (dispatch) variants --------- */

/** Online + idle — waiting for dispatch. */
export const ONLINE_IDLE = {
  ...LIVE_QUIET_DAY,
  bookingsToday: [] as Booking[],
  pendingRequests: [] as BookingRequest[],
  liveStatus: { kind: "idle" } as LiveStatus,
};