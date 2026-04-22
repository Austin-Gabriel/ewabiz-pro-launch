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
}

export interface BookingRequest {
  id: string;
  clientName: string;
  clientInitial: string;
  service: string;
  requestedFor: string; // "Sat, Apr 27 · 2:00 PM"
  priceUsd: number;
  message?: string;
}

/* --------- Three live-pro variants --------- */

export const LIVE_FIRST_TIME = {
  greetingName: "Amara",
  weekToDateUsd: 0,
  monthToDateUsd: 0,
  bookingsToday: [] as Booking[],
  pendingRequests: [] as BookingRequest[],
  bookingLink: "ewa.app/amara",
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
    },
  ] as BookingRequest[],
  nextOpenSlot: "Tomorrow, 10:30 AM",
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
      startsAt: "10:30",
      durationMin: 90,
      priceUsd: 140,
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
    },
    {
      id: "b3",
      clientName: "Renée Adeyemi",
      clientInitial: "R",
      service: "Retwist + style",
      startsAt: "5:30",
      durationMin: 75,
      priceUsd: 95,
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
    },
    {
      id: "r2",
      clientName: "Devon M.",
      clientInitial: "D",
      service: "Silk press",
      requestedFor: "Mon, Apr 29 · 6:00 PM",
      priceUsd: 120,
      message: "Need it for an event Tuesday morning — flexible on time.",
    },
  ] as BookingRequest[],
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