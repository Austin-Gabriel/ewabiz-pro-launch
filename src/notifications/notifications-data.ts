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
  | "declined"
  | "on-the-way"
  | "arrived"
  | "completed"
  | "reschedule"
  | "portfolio"
  | "payout"
  | "payout-initiated"
  | "tip"
  | "message"
  | "rating"
  | "review-request"
  | "kyc";

/** Time bucket used to group activity rows on the Notifications screen. */
export type ActivityBucket = "today" | "yesterday" | "this-week" | "earlier";

/** Soft tinted pill rendered next to the time label (CONFIRMED, DECLINED…). */
export type PillTone = "orange" | "rose" | "navy" | "mint";

export interface ActivityActor {
  name: string;
  initials: string;
  /** Background tint for the avatar circle. */
  tint: "peach" | "lilac" | "sage" | "sand";
}

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  /** Short headline shown as the row title. */
  title: string;
  /** Optional supporting line beneath the title. */
  detail?: string;
  /** Relative time label, e.g. "2h ago", "Yesterday". */
  timeLabel: string;
  /** Time bucket for the grouped section header. */
  bucket: ActivityBucket;
  /** Person the event is about — drives the avatar circle. */
  actor?: ActivityActor;
  /** Status pill shown next to the time. */
  pill?: { label: string; tone: PillTone };
  /** Route target on tap. Omitted = non-routable row. */
  target?:
    | { to: "/bookings/$id"; params: { id: string } }
    | { to: "/earnings/payouts/$id"; params: { id: string } }
    | { to: "/earnings" };
}

const ALL: ActivityEvent[] = [
  /* ---------------- Today ---------------- */
  {
    id: "n-today-1",
    kind: "on-the-way",
    title: "Tasha is on her way to your salon",
    detail: "Estimated arrival: 12 min — Silk press at 2:00 PM",
    timeLabel: "2 min ago",
    bucket: "today",
    actor: { name: "Tasha Brooks", initials: "TB", tint: "peach" },
    pill: { label: "ON THE WAY", tone: "orange" },
    target: { to: "/bookings/$id", params: { id: "b2" } },
  },
  {
    id: "n-today-2",
    kind: "booking-request",
    title: "New booking request from Maya O.",
    detail: "Silk press · Tomorrow 10:00 AM",
    timeLabel: "12 min ago",
    bucket: "today",
    actor: { name: "Maya Okonkwo", initials: "MO", tint: "lilac" },
    pill: { label: "NEW REQUEST", tone: "orange" },
    target: { to: "/bookings/$id", params: { id: "b1" } },
  },
  {
    id: "n-today-3",
    kind: "booking-confirmed",
    title: "Imani K. confirmed her knotless braids appointment",
    detail: "Saturday at 9:00 AM — 6 hour service",
    timeLabel: "38 min ago",
    bucket: "today",
    actor: { name: "Imani Kone", initials: "IK", tint: "sage" },
    pill: { label: "CONFIRMED", tone: "mint" },
    target: { to: "/bookings/$id", params: { id: "b5" } },
  },
  {
    id: "n-today-4",
    kind: "message",
    title: "Maya O. sent you a message",
    detail: "“Can I bring my daughter along to the appointment?”",
    timeLabel: "1 hr ago",
    bucket: "today",
    actor: { name: "Maya Okonkwo", initials: "MO", tint: "lilac" },
    target: { to: "/bookings/$id", params: { id: "b1" } },
  },
  {
    id: "n-today-5",
    kind: "booking-reminder",
    title: "Upcoming appointment in 2 hours",
    detail: "Tasha B. · Silk press · 2:00 PM at her place",
    timeLabel: "1 hr ago",
    bucket: "today",
    actor: { name: "Tasha Brooks", initials: "TB", tint: "peach" },
    pill: { label: "STARTS SOON", tone: "orange" },
    target: { to: "/bookings/$id", params: { id: "b2" } },
  },
  {
    id: "n-today-6",
    kind: "tip",
    title: "Tasha B. left you a $20 tip",
    detail: "Added to your next payout",
    timeLabel: "2 hr ago",
    bucket: "today",
    actor: { name: "Tasha Brooks", initials: "TB", tint: "peach" },
    pill: { label: "+$20 TIP", tone: "mint" },
    target: { to: "/earnings" },
  },
  {
    id: "n-today-7",
    kind: "rating",
    title: "Tasha B. left you a 5-star rating",
    detail: "“Loved every minute. Booking again.”",
    timeLabel: "2 hr ago",
    bucket: "today",
    actor: { name: "Tasha Brooks", initials: "TB", tint: "peach" },
    pill: { label: "★ 5.0", tone: "navy" },
    target: { to: "/bookings/$id", params: { id: "b2" } },
  },

  /* ---------------- Yesterday ---------------- */
  {
    id: "n-yest-1",
    kind: "declined",
    title: "Renée G.'s booking couldn't be accepted",
    detail: "Box braids · Thu 2:00 PM — your schedule was full",
    timeLabel: "Yesterday · 4:12 PM",
    bucket: "yesterday",
    actor: { name: "Renée Garcia", initials: "RG", tint: "sand" },
    pill: { label: "DECLINED", tone: "rose" },
    target: { to: "/bookings/$id", params: { id: "b3" } },
  },
  {
    id: "n-yest-2",
    kind: "payout-initiated",
    title: "Payout on the way to Chase ••4821",
    detail: "$486.50 — arrives in 1–2 business days",
    timeLabel: "Yesterday · 9:30 AM",
    bucket: "yesterday",
    pill: { label: "IN TRANSIT", tone: "orange" },
    target: { to: "/earnings" },
  },
  {
    id: "n-yest-3",
    kind: "completed",
    title: "You wrapped Jada L.'s silk press",
    detail: "Marked complete · $185 earned",
    timeLabel: "Yesterday · 6:45 PM",
    bucket: "yesterday",
    actor: { name: "Jada Lewis", initials: "JL", tint: "sage" },
    pill: { label: "COMPLETED", tone: "mint" },
    target: { to: "/bookings/$id", params: { id: "b6" } },
  },
  {
    id: "n-yest-4",
    kind: "reschedule",
    title: "Aaliyah J. requested to reschedule",
    detail: "Wig install — moving from Wed 11 AM → Fri 1 PM",
    timeLabel: "Yesterday · 3:18 PM",
    bucket: "yesterday",
    actor: { name: "Aaliyah Johnson", initials: "AJ", tint: "lilac" },
    pill: { label: "ACTION NEEDED", tone: "orange" },
    target: { to: "/bookings/$id", params: { id: "b4" } },
  },

  /* ---------------- This week ---------------- */
  {
    id: "n-week-1",
    kind: "cancellation",
    title: "Renée G. cancelled her appointment",
    detail: "Box braids · Thu 2:00 PM — cancellation fee applied",
    timeLabel: "2 days ago",
    bucket: "this-week",
    actor: { name: "Renée Garcia", initials: "RG", tint: "sand" },
    pill: { label: "CANCELLED", tone: "rose" },
    target: { to: "/bookings/$id", params: { id: "b3" } },
  },
  {
    id: "n-week-2",
    kind: "arrived",
    title: "You arrived at Zara M.'s home",
    detail: "Service timer started automatically",
    timeLabel: "2 days ago",
    bucket: "this-week",
    actor: { name: "Zara Mensah", initials: "ZM", tint: "peach" },
    pill: { label: "ARRIVED", tone: "navy" },
    target: { to: "/bookings/$id", params: { id: "b7" } },
  },
  {
    id: "n-week-3",
    kind: "review-request",
    title: "Leave a review for Zara M.",
    detail: "Help future clients know what to expect from the appointment",
    timeLabel: "3 days ago",
    bucket: "this-week",
    actor: { name: "Zara Mensah", initials: "ZM", tint: "peach" },
    pill: { label: "REMINDER", tone: "navy" },
    target: { to: "/bookings/$id", params: { id: "b7" } },
  },
  {
    id: "n-week-4",
    kind: "payout",
    title: "$486.50 paid out to Chase ••4821",
    detail: "Includes 4 bookings from last week",
    timeLabel: "3 days ago",
    bucket: "this-week",
    pill: { label: "PAID", tone: "mint" },
    target: { to: "/earnings" },
  },

  /* ---------------- Earlier ---------------- */
  {
    id: "n-old-1",
    kind: "rating",
    title: "Imani K. left you a 4-star rating",
    detail: "“Great work, ran a little over but worth it.”",
    timeLabel: "1 week ago",
    bucket: "earlier",
    actor: { name: "Imani Kone", initials: "IK", tint: "sage" },
    pill: { label: "★ 4.0", tone: "navy" },
    target: { to: "/bookings/$id", params: { id: "b5" } },
  },
  {
    id: "n-old-2",
    kind: "portfolio",
    title: "Your portfolio has 142 views this week",
    detail: "Up 28% from last week — clients are noticing",
    timeLabel: "1 week ago",
    bucket: "earlier",
    pill: { label: "+28%", tone: "mint" },
  },
  {
    id: "n-old-3",
    kind: "payout",
    title: "$312.00 paid out to Chase ••4821",
    detail: "Includes 3 bookings",
    timeLabel: "2 weeks ago",
    bucket: "earlier",
    pill: { label: "PAID", tone: "mint" },
    target: { to: "/earnings" },
  },
  {
    id: "n-old-4",
    kind: "kyc",
    title: "Identity verification approved",
    detail: "You're cleared to take bookings",
    timeLabel: "3 weeks ago",
    bucket: "earlier",
    pill: { label: "VERIFIED", tone: "mint" },
  },
];

export function activityForDensity(density: "empty" | "few" | "lots"): ActivityEvent[] {
  if (density === "empty") return [];
  if (density === "few") return ALL.slice(0, 5);
  return ALL;
}

/** Order in which bucket sections render on the Notifications screen. */
export const BUCKET_ORDER: ActivityBucket[] = [
  "today",
  "yesterday",
  "this-week",
  "earlier",
];

export const BUCKET_LABEL: Record<ActivityBucket, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "this-week": "This week",
  earlier: "Earlier",
};