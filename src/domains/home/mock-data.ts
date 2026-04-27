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
  /** Distance from the pro right now, e.g. "2.4 mi". */
  distance?: string;
  /** "PM" / "AM" suffix when not already in startsAt. */
  startsAtMeridiem?: "AM" | "PM";
  /** When the pro should leave to arrive on time (clock string, e.g. "12:38 PM"). */
  scheduledDepartureAt?: string;
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

export type LiveStateKind = "in-progress" | "en-route" | "idle";

/**
 * Smart Online toggle state. Drives the StatusBar and gates request intake.
 */
export type OnlineToggleKind =
  | "available"            // online, accepting on-demand
  | "protecting"           // online, throttled because upcoming booking is close
  | "outside-hours"        // off, locked — outside work hours
  | "on-booking"           // off, locked — currently on a booking
  | "manual-offline"       // off, unlocked — pro chose to go offline
  | "after-hours-online";  // online past work-hours end, voluntary

export interface OnlineState {
  kind: OnlineToggleKind;
  /** For "protecting": the upcoming booking time (e.g. "1:30"). */
  protectingTime?: string;
  /** For "outside-hours": when intake resumes (e.g. "Tue 10 AM"). */
  resumesAt?: string;
  /** True after auto-offline fired and pro hasn't dismissed banner. */
  autoOfflineBanner?: boolean;
  /** When work hours ended (e.g. "7 PM"). */
  workHoursEndedAt?: string;
}

/** A pending on-demand request that hijacks the Up Next slot. */
export interface PendingOnDemand extends BookingRequest {
  /** Seconds remaining for the pro to accept. */
  secondsLeft: number;
  distance: string;
  etaMin: number;
  payoutUsd: number;
}

export interface LiveStatus {
  kind: LiveStateKind;
  /** When in-progress, minutes elapsed since start. */
  elapsedMin?: number;
  /** When en-route, ETA string. */
  etaMin?: number;
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
  bookingsToday: [] as Booking[],
  pendingRequests: [] as BookingRequest[],
  bookingLink: "ewa.app/amara",
  ratingValue: 0,
  ratingCount: 0,
  completionPct: 100,
  todayEarningsUsd: 0,
  todayProjectedUsd: 0,
  liveStatus: { kind: "idle" } as LiveStatus,
  weeklyGoalUsd: 1500,
  onlineState: { kind: "available" } as OnlineState,
};

export const LIVE_QUIET_DAY = {
  greetingName: "Amara",
  weekToDateUsd: 480,
  monthToDateUsd: 2140,
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
  weeklyGoalUsd: 1500,
  onlineState: { kind: "available" } as OnlineState,
};

export const LIVE_ACTIVE_DAY = {
  greetingName: "Amara",
  weekToDateUsd: 1240,
  monthToDateUsd: 4680,
  bookingsToday: [
    {
      id: "b1",
      clientName: "Maya Okafor",
      clientInitial: "M",
      service: "Silk press + trim",
      startsAt: "1:30",
      startsAtMeridiem: "PM",
      durationMin: 90,
      priceUsd: 140,
      location: "Fort Greene, Brooklyn",
      address: "212 Lafayette Ave, Brooklyn, NY",
      distance: "4.1 mi",
      scheduledDepartureAt: "1:08 PM",
    },
    {
      id: "b2",
      clientName: "Tasha B.",
      clientInitial: "T",
      service: "Knotless braids · small",
      startsAt: "4:00",
      startsAtMeridiem: "PM",
      durationMin: 240,
      priceUsd: 280,
      isNewClient: true,
      location: "Bed-Stuy, Brooklyn",
      address: "488 Halsey St, Brooklyn, NY",
      distance: "5.6 mi",
    },
    {
      id: "b3",
      clientName: "Renée Adeyemi",
      clientInitial: "R",
      service: "Retwist + style",
      startsAt: "5:30",
      startsAtMeridiem: "PM",
      durationMin: 75,
      priceUsd: 95,
      location: "Clinton Hill, Brooklyn",
      address: "70 Greene Ave, Brooklyn, NY",
      distance: "3.2 mi",
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
  liveStatus: { kind: "idle" } as LiveStatus,
  weeklyGoalUsd: 1500,
  onlineState: { kind: "available" } as OnlineState,
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