/**
 * Mock recent-activity events for the Notifications screen. Density is
 * driven by DevRecentActivity; the page reads via `useNotifications()` so
 * dev-state toggles flip the list without touching real bookings or
 * earnings data.
 */

export type ActivityKind =
  | "booking-request"
  | "booking-confirmed"
  | "booking-reminder"
  | "cancellation"
  | "payout"
  | "payout-initiated"
  | "tip"
  | "message"
  | "rating"
  | "review-request"
  | "kyc";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  /** Short headline shown as the row title. */
  title: string;
  /** Optional supporting line beneath the title. */
  detail?: string;
  /** Relative time label, e.g. "2h ago", "Yesterday". */
  timeLabel: string;
  /** Route target on tap. Omitted = non-routable row. */
  target?:
    | { to: "/bookings/$id"; params: { id: string } }
    | { to: "/earnings/payouts/$id"; params: { id: string } }
    | { to: "/earnings" };
}

const ALL: ActivityEvent[] = [
  {
    id: "n1",
    kind: "booking-request",
    title: "New booking request",
    detail: "Maya O. · Silk press · Tomorrow 10:00 AM",
    timeLabel: "12m ago",
    target: { to: "/bookings/$id", params: { id: "b1" } },
  },
  {
    id: "n1b",
    kind: "booking-confirmed",
    title: "Booking confirmed",
    detail: "Imani K. · Knotless braids · Sat 9:00 AM",
    timeLabel: "38m ago",
    target: { to: "/bookings/$id", params: { id: "b5" } },
  },
  {
    id: "n1c",
    kind: "booking-reminder",
    title: "Upcoming appointment in 2 hours",
    detail: "Tasha B. · Silk press · 2:00 PM",
    timeLabel: "1h ago",
    target: { to: "/bookings/$id", params: { id: "b2" } },
  },
  {
    id: "n1d",
    kind: "message",
    title: "New message from Maya O.",
    detail: "“Can I bring my daughter along?”",
    timeLabel: "1h ago",
    target: { to: "/bookings/$id", params: { id: "b1" } },
  },
  {
    id: "n2",
    kind: "rating",
    title: "5-star rating from Tasha B.",
    detail: "“Loved every minute. Booking again.”",
    timeLabel: "2h ago",
    target: { to: "/bookings/$id", params: { id: "b2" } },
  },
  {
    id: "n2b",
    kind: "tip",
    title: "$20 tip from Tasha B.",
    detail: "Added to your next payout",
    timeLabel: "2h ago",
    target: { to: "/earnings" },
  },
  {
    id: "n3a",
    kind: "payout-initiated",
    title: "Payout on the way",
    detail: "$486.50 to Chase ••4821 · Arrives in 1–2 days",
    timeLabel: "5h ago",
    target: { to: "/earnings" },
  },
  {
    id: "n3",
    kind: "payout",
    title: "$486.50 paid out to Chase ••4821",
    detail: "Includes 4 bookings from last week",
    timeLabel: "Yesterday",
    target: { to: "/earnings" },
  },
  {
    id: "n4",
    kind: "cancellation",
    title: "Renée G. cancelled",
    detail: "Box braids · Thu 2:00 PM · Cancellation fee applied",
    timeLabel: "Yesterday",
    target: { to: "/bookings/$id", params: { id: "b3" } },
  },
  {
    id: "n4b",
    kind: "review-request",
    title: "Leave a review for Zara M.",
    detail: "Help future clients know what to expect",
    timeLabel: "2d ago",
    target: { to: "/bookings/$id", params: { id: "b7" } },
  },
  {
    id: "n5",
    kind: "kyc",
    title: "Identity verification approved",
    detail: "You're cleared to take bookings",
    timeLabel: "3d ago",
  },
  {
    id: "n6",
    kind: "rating",
    title: "4-star rating from Imani K.",
    timeLabel: "4d ago",
    target: { to: "/bookings/$id", params: { id: "b5" } },
  },
  {
    id: "n7",
    kind: "payout",
    title: "$312.00 paid out to Chase ••4821",
    detail: "Includes 3 bookings",
    timeLabel: "1w ago",
    target: { to: "/earnings" },
  },
];

export function activityForDensity(density: "empty" | "few" | "lots"): ActivityEvent[] {
  if (density === "empty") return [];
  if (density === "few") return ALL.slice(0, 4);
  return ALL;
}