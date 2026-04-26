/**
 * CANONICAL payout mock-data source. A payout is a bundle of paid earning
 * events that hit the bank on a single date. Each payout references the
 * earning IDs it includes; the Payout Detail surface re-derives line items
 * from `mock-earnings.ts` so totals always reconcile.
 *
 * Voice: industrial, factual. Status pills speak in plain banking terms:
 * "Paid", "In transit", "Failed".
 */

import { ALL_EARNINGS, earningsForDensity, type EarningEvent, type EarningsDensity } from "./mock-earnings";

export type PayoutStatus = "paid" | "in-transit" | "failed";

export interface Payout {
  id: string;
  /** Date the funds left Ewà (or attempted to). */
  date: Date;
  /** Net deposit amount. Reconciles with sum of included earnings. */
  amount: number;
  status: PayoutStatus;
  /** Last 4 of bank account. Always shown in secondary text. */
  bankLast4: string;
  /** Bank label, e.g. "Chase". */
  bankName: string;
  /** Earning event IDs bundled into this payout. */
  includedEarningIds: string[];
  /** Expected arrival, formatted ("Apr 28"). */
  expectedArrival: string;
  /** Failure detail, only set when status === "failed". */
  failureReason?: string;
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/* ---------- Build payouts from paid earnings ----------
 *
 * Group paid earning events by ISO week. Each group becomes one Payout that
 * "lands" on the Friday of that week. The most recent group becomes
 * "in-transit" (still en route to the bank); one historical group is forced
 * "failed" so dev state can demo the failure UI.
 */

function startOfIsoWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function fridayOfWeek(monday: Date): Date {
  const f = new Date(monday);
  f.setDate(f.getDate() + 4);
  return f;
}

function buildPayouts(source: EarningEvent[] = ALL_EARNINGS): Payout[] {
  const paidEvents = source.filter((e) => e.status === "paid");
  const groups = new Map<string, EarningEvent[]>();
  for (const e of paidEvents) {
    const wk = startOfIsoWeek(e.date).toISOString();
    if (!groups.has(wk)) groups.set(wk, []);
    groups.get(wk)!.push(e);
  }
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));
  const out: Payout[] = [];
  let idx = 0;
  for (const key of sortedKeys) {
    const events = groups.get(key)!;
    const monday = new Date(key);
    const fri = fridayOfWeek(monday);
    const amount = events.reduce((s, e) => s + e.net, 0);
    if (amount <= 0) continue;
    // Force one historical payout to "failed" for dev state — pick the
    // 4th-most-recent payout if it exists; otherwise leave all paid.
    const isFailed = idx === 3;
    out.push({
      id: `po-${idx + 1}`,
      date: fri,
      amount: Math.round(amount),
      status: isFailed ? "failed" : "paid",
      bankLast4: "4821",
      bankName: "Chase",
      includedEarningIds: events.map((e) => e.id),
      expectedArrival: fmtDate(fri),
      failureReason: isFailed ? "Bank account verification expired. Re-verify to retry." : undefined,
    });
    idx++;
  }

  // In-transit: bundle pending events into a single upcoming payout that
  // lands next Friday. Only show one in-transit payout at a time.
  const pending = source.filter((e) => e.status === "pending");
  if (pending.length > 0) {
    const now = new Date();
    const upcoming = new Date(now);
    const dow = upcoming.getDay();
    const daysToFri = (5 - dow + 7) % 7 || 7;
    upcoming.setDate(upcoming.getDate() + daysToFri);
    upcoming.setHours(0, 0, 0, 0);
    const amount = pending.reduce((s, e) => s + e.net, 0);
    out.unshift({
      id: "po-pending",
      date: upcoming,
      amount: Math.round(amount),
      status: "in-transit",
      bankLast4: "4821",
      bankName: "Chase",
      includedEarningIds: pending.map((e) => e.id),
      expectedArrival: fmtDate(upcoming),
    });
  }

  return out;
}

export const ALL_PAYOUTS: Payout[] = buildPayouts();

/**
 * Density-gated payouts. Mirrors `earningsForDensity` so dev-state empty /
 * sparse / rich applies consistently across earnings AND payout surfaces.
 */
export function payoutsForDensity(d: EarningsDensity): Payout[] {
  if (d === "none") return [];
  return buildPayouts(earningsForDensity(d));
}

export function findPayoutById(id: string): Payout | undefined {
  return ALL_PAYOUTS.find((p) => p.id === id);
}

export function earningsForPayout(p: Payout): EarningEvent[] {
  const set = new Set(p.includedEarningIds);
  return ALL_EARNINGS.filter((e) => set.has(e.id));
}

/* ---------- Status copy ---------- */

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  paid: "Paid",
  "in-transit": "In transit",
  failed: "Failed",
};