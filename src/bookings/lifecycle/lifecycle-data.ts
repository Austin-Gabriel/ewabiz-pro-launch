/**
 * Mock data for the booking lifecycle takeover screens. One realistic example
 * is enough — the dev-state toggle picks which lifecycle state to render and
 * all states share the same client/booking metadata so the transitions feel
 * continuous.
 */

export interface LifecycleBooking {
  clientName: string;
  clientInitial: string;
  service: string;
  /** Total scheduled service duration (minutes). */
  durationMin: number;
  /** Quoted price the client is paying. */
  priceUsd: number;
  /** Estimated payout to pro after fees. */
  payoutUsd: number;
  address: string;
  /** Distance from pro's current location, e.g. "2.3 mi". */
  distance: string;
  /** ETA in minutes from current location. */
  etaMin: number;
  /** Scheduled arrival time, e.g. "11:00 AM". */
  arrivalAt: string;
  /** Prep window the pro reserves before leaving (minutes). */
  prepMin: number;
  /** Computed "leave by" time (display string). */
  leaveByAt: string;
  /** PIN the client received. Used to validate arrival entry. */
  pin: string;
  /** Tip the client added (set when complete). */
  tipUsd: number;
}

export const LIFECYCLE_BOOKING: LifecycleBooking = {
  clientName: "Maya Okafor",
  clientInitial: "M",
  service: "Silk press + trim",
  durationMin: 90,
  priceUsd: 180,
  payoutUsd: 162,
  address: "212 Lafayette Ave, Brooklyn, NY",
  distance: "2.3 mi",
  etaMin: 12,
  arrivalAt: "11:00 AM",
  prepMin: 20,
  leaveByAt: "10:48 AM",
  pin: "4729",
  tipUsd: 25,
};