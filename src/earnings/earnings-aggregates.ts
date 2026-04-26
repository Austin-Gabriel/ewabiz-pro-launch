/**
 * Derived aggregates for the Earnings surfaces. Pure functions that take
 * EarningEvent[] / Payout[] and return the shapes the UI needs. Keeping these
 * out of the page components so the JSX stays readable and the math is
 * unit-testable later.
 */

import type { EarningEvent } from "@/data/mock-earnings";
import type { Payout } from "@/data/mock-payouts";
import type { Booking } from "@/data/mock-bookings";

/* ---------- Earnings home: balance trio ---------- */

export interface BalanceSplit {
  /** Already paid out — money in the bank. */
  available: number;
  /** Bundled into the next payout (in transit). */
  inTransit: number;
  /** Completed bookings not yet bundled. */
  pending: number;
}

export function balanceSplit(events: EarningEvent[], payouts: Payout[]): BalanceSplit {
  // "Available" = sum of paid earnings (what hit the bank historically).
  const available = events
    .filter((e) => e.status === "paid")
    .reduce((s, e) => s + e.net, 0);
  // "In transit" = the single in-transit payout, if any.
  const inTransit = payouts
    .filter((p) => p.status === "in-transit")
    .reduce((s, p) => s + p.amount, 0);
  // "Pending" = pending earning events NOT yet in the in-transit bundle.
  const inTransitIds = new Set(
    payouts.filter((p) => p.status === "in-transit").flatMap((p) => p.includedEarningIds),
  );
  const pending = events
    .filter((e) => e.status === "pending" && !inTransitIds.has(e.id))
    .reduce((s, e) => s + e.net, 0);
  return { available, inTransit, pending };
}

/** ID of the in-transit payout, if one exists — used to deep-link the tile. */
export function inTransitPayoutId(payouts: Payout[]): string | null {
  const p = payouts.find((p) => p.status === "in-transit");
  return p?.id ?? null;
}

/* ---------- Payout history: yearly summary + monthly grouping ---------- */

export interface PayoutYearSummary {
  paidThisYear: number;
  paidBookingCount: number;
  averagePayout: number;
  mostRecentAmount: number | null;
  mostRecentLabel: string | null;
  /** Last 12 amounts (oldest → newest) for sparkline. */
  recentBars: number[];
}

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function payoutYearSummary(payouts: Payout[]): PayoutYearSummary {
  const year = new Date().getFullYear();
  const paid = payouts.filter((p) => p.status === "paid" && p.date.getFullYear() === year);
  const sorted = [...payouts]
    .filter((p) => p.status === "paid")
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const recent = sorted.slice(0, 12).reverse();
  return {
    paidThisYear: paid.reduce((s, p) => s + p.amount, 0),
    paidBookingCount: paid.reduce((s, p) => s + p.includedEarningIds.length, 0),
    averagePayout: paid.length === 0 ? 0 : Math.round(paid.reduce((s, p) => s + p.amount, 0) / paid.length),
    mostRecentAmount: sorted[0]?.amount ?? null,
    mostRecentLabel: sorted[0]
      ? `${MONTHS_SHORT[sorted[0].date.getMonth()]} ${sorted[0].date.getDate()}`
      : null,
    recentBars: recent.map((p) => p.amount),
  };
}

export interface PayoutMonthGroup {
  /** "April 2026" */
  label: string;
  /** "Apr · 4 payouts" short form for the sticky header. */
  shortLabel: string;
  total: number;
  payouts: Payout[];
}

export function groupPayoutsByMonth(payouts: Payout[]): PayoutMonthGroup[] {
  const map = new Map<string, PayoutMonthGroup>();
  for (const p of payouts) {
    const key = `${p.date.getFullYear()}-${p.date.getMonth()}`;
    if (!map.has(key)) {
      map.set(key, {
        label: `${MONTHS_LONG[p.date.getMonth()]} ${p.date.getFullYear()}`,
        shortLabel: `${MONTHS_SHORT[p.date.getMonth()]} ${p.date.getFullYear()}`,
        total: 0,
        payouts: [],
      });
    }
    const g = map.get(key)!;
    g.total += p.amount;
    g.payouts.push(p);
  }
  // Sort groups newest first; payouts within already arrive newest-first from caller.
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([, g]) => g);
}

/* ---------- Recent earnings: day grouping ---------- */

export interface DayGroup {
  /** "Apr 22" */
  label: string;
  /** "Tuesday" */
  weekday: string;
  total: number;
  events: EarningEvent[];
}

const WEEKDAY_LONG = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export function groupEarningsByDay(events: EarningEvent[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const e of events) {
    const d = e.date;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map.has(key)) {
      map.set(key, {
        label: `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`,
        weekday: WEEKDAY_LONG[d.getDay()],
        total: 0,
        events: [],
      });
    }
    const g = map.get(key)!;
    g.total += e.net;
    g.events.push(e);
  }
  // Newest day first.
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([, g]) => g);
}

/* ---------- Top services: 4-week sparkline ---------- */

/**
 * Build a 4-week mini sparkline (4 weekly buckets, oldest → newest) for a
 * single service, ending today. Used by Top services rows.
 */
export function serviceSparkline(events: EarningEvent[], service: string, now: Date = new Date()): number[] {
  const buckets = [0, 0, 0, 0];
  const dayMs = 24 * 60 * 60 * 1000;
  const earliest = now.getTime() - 28 * dayMs;
  for (const e of events) {
    if (e.service !== service) continue;
    const t = e.date.getTime();
    if (t < earliest || t > now.getTime()) continue;
    const weeksAgo = Math.min(3, Math.floor((now.getTime() - t) / (7 * dayMs)));
    buckets[3 - weeksAgo] += e.net;
  }
  return buckets;
}

/* ---------- Tax YTD ---------- */

export interface TaxYtd {
  year: number;
  gross: number;
  net: number;
  bookings: number;
  /** Which 1099 status tag to render. */
  status: "eligible" | "below-threshold" | "estimated";
}

const IRS_THRESHOLD = 600;

export function taxYearToDate(events: EarningEvent[]): TaxYtd {
  const year = new Date().getFullYear();
  const inYear = events.filter((e) => e.date.getFullYear() === year);
  const gross = inYear.reduce((s, e) => s + e.gross + e.tip, 0);
  const net = inYear.reduce((s, e) => s + e.net, 0);
  const bookings = inYear.length;
  const status: TaxYtd["status"] = gross >= IRS_THRESHOLD ? "estimated" : "below-threshold";
  return { year, gross, net, bookings, status };
}

/* ---------- Payout method: recent payouts to this account ---------- */

export function recentPayoutsForAccount(payouts: Payout[], last4: string, limit = 3): Payout[] {
  return payouts
    .filter((p) => p.bankLast4 === last4 && p.status !== "in-transit")
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

/* ---------- Earnings home: context summary ---------- */

const WEEKDAY_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export interface ThisWeekStats {
  earned: number;
  bookings: number;
  averagePerBooking: number;
  /** Percent change vs prior 7 days. null when prior week was $0. */
  deltaPct: number | null;
  /** "up" | "down" | "flat" */
  trend: "up" | "down" | "flat";
}

export function thisWeekStats(events: EarningEvent[], now: Date = new Date()): ThisWeekStats {
  const day = 24 * 60 * 60 * 1000;
  const startThis = now.getTime() - 7 * day;
  const startPrior = now.getTime() - 14 * day;
  let earned = 0;
  let bookings = 0;
  let prior = 0;
  for (const e of events) {
    const t = e.date.getTime();
    if (t > now.getTime()) continue;
    if (t >= startThis) {
      earned += e.net;
      bookings += 1;
    } else if (t >= startPrior) {
      prior += e.net;
    }
  }
  const deltaPct = prior === 0 ? null : Math.round(((earned - prior) / prior) * 100);
  const trend: ThisWeekStats["trend"] =
    deltaPct === null ? "flat" : deltaPct > 1 ? "up" : deltaPct < -1 ? "down" : "flat";
  return {
    earned,
    bookings,
    averagePerBooking: bookings === 0 ? 0 : Math.round(earned / bookings),
    deltaPct,
    trend,
  };
}

export interface UpcomingStats {
  /** Sum of priceUsd for confirmed/pending bookings landing in next 7 days. */
  revenue: number;
  appointments: number;
}

export function upcomingStats(bookings: Booking[], now: Date = new Date()): UpcomingStats {
  const day = 24 * 60 * 60 * 1000;
  const end = now.getTime() + 7 * day;
  let revenue = 0;
  let appointments = 0;
  for (const b of bookings) {
    if (b.status !== "confirmed" && b.status !== "pending") continue;
    const t = b.startsAt.getTime();
    if (t < now.getTime() || t > end) continue;
    revenue += b.priceUsd;
    appointments += 1;
  }
  return { revenue, appointments };
}

export interface NextPayoutStats {
  amount: number;
  /** "Friday", "Tomorrow", "Today" — weekday label of arrival date. */
  weekdayLabel: string;
  /** "Apr 28" — short date for sub line if needed. */
  shortDate: string;
}

export function nextPayoutStats(payouts: Payout[], now: Date = new Date()): NextPayoutStats | null {
  const inTransit = payouts.find((p) => p.status === "in-transit");
  if (!inTransit) return null;
  const d = inTransit.date;
  const day = 24 * 60 * 60 * 1000;
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - startToday.getTime()) / day);
  const weekdayLabel =
    diffDays === 0 ? "Today" : diffDays === 1 ? "Tomorrow" : WEEKDAY_FULL[d.getDay()];
  return {
    amount: inTransit.amount,
    weekdayLabel,
    shortDate: inTransit.expectedArrival,
  };
}

/* ---------- Earnings home: period bar chart buckets ---------- */

export interface PeriodBucket {
  label: string;
  total: number;
}

/**
 * Build bar-chart buckets for the Earnings home chart, sized to the
 * selected period:
 *   today  → 6 buckets of 4h ("12a", "4a", ...)
 *   week   → 7 buckets, one per day ("Mon", "Tue", ...)
 *   month  → 4 buckets, one per week ("W1", "W2", ...)
 *   year   → 12 buckets, one per month ("J", "F", ...)
 */
export function periodBuckets(
  events: EarningEvent[],
  period: "today" | "week" | "month" | "year",
  now: Date = new Date(),
): PeriodBucket[] {
  const day = 24 * 60 * 60 * 1000;
  // Realize-only: every period excludes events scheduled after "now". Without
  // this, the chart's total (sum of buckets) drifts above thisWeekStats.earned,
  // which the KPI tile + headline number both display.
  const nowMs = now.getTime();

  if (period === "today") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const labels = ["12a", "4a", "8a", "12p", "4p", "8p"];
    const buckets = labels.map((label) => ({ label, total: 0 }));
    for (const e of events) {
      const t = e.date.getTime();
      if (t < start.getTime() || t > nowMs) continue;
      const hour = e.date.getHours();
      const idx = Math.min(5, Math.floor(hour / 4));
      buckets[idx].total += e.net;
    }
    return buckets;
  }

  if (period === "week") {
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
    const startWeek = startToday.getTime() - 6 * day;
    const dayShort = ["Su", "M", "T", "W", "Th", "F", "Sa"];
    const buckets: PeriodBucket[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startWeek + i * day);
      buckets.push({ label: dayShort[d.getDay()], total: 0 });
    }
    for (const e of events) {
      const t = e.date.getTime();
      if (t < startWeek || t > nowMs) continue;
      const idx = Math.min(6, Math.max(0, Math.floor((t - startWeek) / day)));
      buckets[idx].total += e.net;
    }
    return buckets;
  }

  if (period === "month") {
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
    const start = startToday.getTime() - 27 * day;
    const buckets: PeriodBucket[] = [
      { label: "W1", total: 0 },
      { label: "W2", total: 0 },
      { label: "W3", total: 0 },
      { label: "W4", total: 0 },
    ];
    for (const e of events) {
      const t = e.date.getTime();
      if (t < start || t > nowMs) continue;
      const idx = Math.min(3, Math.floor((t - start) / (7 * day)));
      buckets[idx].total += e.net;
    }
    return buckets;
  }

  // year — last 12 months ending current month.
  const monthInitials = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const buckets: PeriodBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ label: monthInitials[d.getMonth()], total: 0 });
  }
  const earliest = new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();
  for (const e of events) {
    const t = e.date.getTime();
    if (t < earliest || t > now.getTime()) continue;
    const idx =
      (e.date.getFullYear() - now.getFullYear()) * 12 +
      (e.date.getMonth() - now.getMonth()) +
      11;
    if (idx < 0 || idx > 11) continue;
    buckets[idx].total += e.net;
  }
  return buckets;
}
