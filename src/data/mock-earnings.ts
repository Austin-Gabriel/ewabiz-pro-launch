/**
 * CANONICAL earnings mock-data source. Phase 1 derives a year of synthetic
 * completed bookings (so the Year view chart has shape) plus the historical
 * completed bookings declared in mock-bookings.ts. Every earnings event has a
 * stable `bookingId` so tapping a Recent Earnings row can route directly to
 * the existing /bookings/$id detail page.
 *
 * Voice: industrial, factual, Stripe-flavored. No motivational copy lives
 * here — this is just numbers.
 */

import { HISTORY_BOOKINGS, type Booking } from "./mock-bookings";

/** Platform fee. Single source of truth for the transparency card. */
export const FEE_PERCENT = 15;

export type EarningStatus = "pending" | "paid";

export interface EarningEvent {
  id: string;
  /** Links back to a booking (real or synthetic) for routing. */
  bookingId: string;
  date: Date;
  /** Pre-fee, pre-tip service price. */
  gross: number;
  /** Tip amount, if any. */
  tip: number;
  /** Platform fee deducted from gross (tips pass through 100%). */
  fee: number;
  /** What hits the bank: gross - fee + tip. */
  net: number;
  /** Service label (matches CANONICAL_SERVICES). */
  service: string;
  /** Client first name + last initial — for Recent Earnings rows. */
  clientLabel: string;
  status: EarningStatus;
}

/* ---------- Helpers ---------- */

function feeOn(gross: number): number {
  return Math.round(gross * (FEE_PERCENT / 100));
}

function netOf(gross: number, tip: number): number {
  return gross - feeOn(gross) + tip;
}

function clientLabelOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/* ---------- Build from canonical history ---------- */

function fromHistory(b: Booking): EarningEvent | null {
  if (b.status !== "completed") return null;
  const gross = b.priceUsd;
  const tip = b.tipUsd ?? 0;
  return {
    id: `e-${b.id}`,
    bookingId: b.id,
    date: b.startsAt,
    gross,
    tip,
    fee: feeOn(gross),
    net: netOf(gross, tip),
    service: b.service,
    clientLabel: clientLabelOf(b.clientName),
    // Anything paid out already → paid; otherwise pending.
    status: b.paidOutOn ? "paid" : "pending",
  };
}

/* ---------- Synthetic backfill (gives Year view shape) ----------
 *
 * We seed deterministic synthetic events across the trailing 365 days so the
 * chart looks lived-in. IDs prefixed with `syn-` route to a 404 booking, but
 * Phase 1 only renders the chart/aggregates so this is safe. Phase 2 (Recent
 * Earnings) can map these to real bookings or a synthetic booking pool.
 */

const SERVICE_POOL: { service: string; price: number; clients: string[] }[] = [
  { service: "Silk press", price: 180, clients: ["Maya O.", "Renée A.", "Simone C."] },
  { service: "Knotless braids", price: 280, clients: ["Tasha B.", "Jordan L."] },
  { service: "Box braids", price: 320, clients: ["Aaliyah K.", "Jordan L."] },
  { service: "Retwist", price: 95, clients: ["Renée A.", "Devon M."] },
  { service: "Wash and go", price: 75, clients: ["Imani O."] },
  { service: "Trim", price: 65, clients: ["Maya O."] },
  { service: "Cornrows", price: 110, clients: ["Devon M."] },
  { service: "Crochet", price: 220, clients: ["Zara P."] },
  { service: "Color touch-up", price: 180, clients: ["Nia R."] },
  { service: "Blowout", price: 95, clients: ["Imani O."] },
];

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function buildSynthetic(): EarningEvent[] {
  const rand = seededRandom(20260101);
  const now = new Date();
  const events: EarningEvent[] = [];
  // ~3.2 bookings/week on average, distributed across 52 weeks.
  for (let daysAgo = 365; daysAgo > 7; daysAgo--) {
    // Gaussian-ish density: more bookings on Fri/Sat, fewer Mon/Tue.
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(11 + Math.floor(rand() * 7), 0, 0, 0);
    const weekday = date.getDay(); // 0 Sun – 6 Sat
    const weight = [0.25, 0.18, 0.22, 0.32, 0.45, 0.7, 0.6][weekday];
    if (rand() > weight) continue;
    const pool = SERVICE_POOL[Math.floor(rand() * SERVICE_POOL.length)];
    const gross = pool.price + (rand() < 0.25 ? Math.floor(rand() * 40) - 10 : 0);
    const tip = rand() < 0.42 ? Math.round(gross * (0.08 + rand() * 0.14)) : 0;
    const id = `syn-${daysAgo}-${events.length}`;
    events.push({
      id,
      bookingId: id, // Phase 2: map to real booking pool
      date,
      gross,
      tip,
      fee: feeOn(gross),
      net: netOf(gross, tip),
      service: pool.service,
      clientLabel: pool.clients[Math.floor(rand() * pool.clients.length)],
      status: daysAgo > 14 ? "paid" : "pending",
    });
  }
  return events;
}

const HISTORICAL = HISTORY_BOOKINGS.map(fromHistory).filter(
  (e): e is EarningEvent => e !== null,
);
const SYNTHETIC = buildSynthetic();

export const ALL_EARNINGS: EarningEvent[] = [...HISTORICAL, ...SYNTHETIC].sort(
  (a, b) => b.date.getTime() - a.date.getTime(),
);

/* ---------- Density gating ---------- */

/**
 * Apply a dev-state density filter so the Earnings surface can be tested
 * empty / sparse / rich. Phase 4 wires this to the dev toggle UI; Phase 1
 * exposes it now so the Earnings page can already react.
 */
export type EarningsDensity = "none" | "sparse" | "rich";

export function earningsForDensity(d: EarningsDensity): EarningEvent[] {
  if (d === "none") return [];
  if (d === "sparse") {
    // Last 21 days only, no synthetics older than that.
    const cutoff = Date.now() - 21 * 24 * 60 * 60 * 1000;
    return ALL_EARNINGS.filter((e) => e.date.getTime() >= cutoff).slice(0, 6);
  }
  return ALL_EARNINGS;
}

/* ---------- Period bucketing ---------- */

export type EarningsPeriod = "today" | "week" | "month" | "year";

export interface ChartBucket {
  /** Short label rendered under the bar ("Mon", "W2", "Apr"). */
  label: string;
  /** Long label used in the tap tooltip ("Mon, Apr 22"). */
  fullLabel: string;
  amount: number;
  bookings: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function bucketsFor(events: EarningEvent[], period: EarningsPeriod, now: Date = new Date()): ChartBucket[] {
  if (period === "today") {
    // 6 four-hour buckets across the day: 12a, 4a, 8a, 12p, 4p, 8p
    const buckets: ChartBucket[] = Array.from({ length: 6 }, (_, i) => ({
      label: ["12a", "4a", "8a", "12p", "4p", "8p"][i],
      fullLabel: ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"][i],
      amount: 0,
      bookings: 0,
    }));
    const today = startOfDay(now).getTime();
    const tomorrow = today + 24 * 60 * 60 * 1000;
    for (const e of events) {
      const t = e.date.getTime();
      if (t < today || t >= tomorrow) continue;
      const idx = Math.min(5, Math.floor(e.date.getHours() / 4));
      buckets[idx].amount += e.net;
      buckets[idx].bookings += 1;
    }
    return buckets;
  }

  if (period === "week") {
    // 7 days ending today (oldest left, today right).
    const buckets: ChartBucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      buckets.push({
        label: WEEKDAY_SHORT[day.getDay()][0],
        fullLabel: `${WEEKDAY_SHORT[day.getDay()]}, ${MONTH_SHORT[day.getMonth()]} ${day.getDate()}`,
        amount: 0,
        bookings: 0,
      });
    }
    const earliest = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)).getTime();
    for (const e of events) {
      const t = e.date.getTime();
      if (t < earliest) continue;
      if (t > now.getTime()) continue;
      const dayDiff = Math.floor((startOfDay(e.date).getTime() - earliest) / (24 * 60 * 60 * 1000));
      if (dayDiff < 0 || dayDiff > 6) continue;
      buckets[dayDiff].amount += e.net;
      buckets[dayDiff].bookings += 1;
    }
    return buckets;
  }

  if (period === "month") {
    // 4 weekly buckets ending today.
    const buckets: ChartBucket[] = [];
    for (let i = 3; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      buckets.push({
        label: `W${4 - i}`,
        fullLabel: `Week of ${MONTH_SHORT[end.getMonth()]} ${end.getDate() - 6 < 1 ? 1 : end.getDate() - 6}`,
        amount: 0,
        bookings: 0,
      });
    }
    const earliest = now.getTime() - 28 * 24 * 60 * 60 * 1000;
    for (const e of events) {
      const t = e.date.getTime();
      if (t < earliest || t > now.getTime()) continue;
      const weeksAgo = Math.min(3, Math.floor((now.getTime() - t) / (7 * 24 * 60 * 60 * 1000)));
      const idx = 3 - weeksAgo;
      if (idx < 0 || idx > 3) continue;
      buckets[idx].amount += e.net;
      buckets[idx].bookings += 1;
    }
    return buckets;
  }

  // year — 12 month buckets ending current month.
  const buckets: ChartBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      label: MONTH_SHORT[m.getMonth()][0],
      fullLabel: `${MONTH_SHORT[m.getMonth()]} ${m.getFullYear()}`,
      amount: 0,
      bookings: 0,
    });
  }
  const earliestMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();
  for (const e of events) {
    const t = e.date.getTime();
    if (t < earliestMonth || t > now.getTime()) continue;
    const monthsAgo = (now.getFullYear() - e.date.getFullYear()) * 12 + (now.getMonth() - e.date.getMonth());
    const idx = 11 - monthsAgo;
    if (idx < 0 || idx > 11) continue;
    buckets[idx].amount += e.net;
    buckets[idx].bookings += 1;
  }
  return buckets;
}

/* ---------- Aggregates ---------- */

export interface PeriodTotals {
  net: number;
  bookings: number;
}

export function totalsFor(events: EarningEvent[], period: EarningsPeriod, now: Date = new Date()): PeriodTotals {
  const start = (() => {
    if (period === "today") return startOfDay(now).getTime();
    if (period === "week") return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    if (period === "month") return now.getTime() - 30 * 24 * 60 * 60 * 1000;
    return new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();
  })();
  let net = 0;
  let bookings = 0;
  for (const e of events) {
    const t = e.date.getTime();
    if (t < start || t > now.getTime()) continue;
    net += e.net;
    bookings += 1;
  }
  return { net, bookings };
}

/* ---------- Pending payout ---------- */

export interface PendingPayout {
  amount: number;
  arrivesOn: string; // pre-formatted, e.g. "Apr 28"
  bookingCount: number;
}

export function pendingPayoutFor(events: EarningEvent[], now: Date = new Date()): PendingPayout {
  let amount = 0;
  let bookingCount = 0;
  for (const e of events) {
    if (e.status === "pending") {
      amount += e.net;
      bookingCount += 1;
    }
  }
  // Next Friday.
  const arrives = new Date(now);
  const dow = arrives.getDay();
  const daysToFri = (5 - dow + 7) % 7 || 7;
  arrives.setDate(arrives.getDate() + daysToFri);
  return {
    amount,
    arrivesOn: `${MONTH_SHORT[arrives.getMonth()]} ${arrives.getDate()}`,
    bookingCount,
  };
}

/* ---------- Top services ---------- */

export interface TopService {
  service: string;
  amount: number;
  bookings: number;
}

export function topServicesFor(events: EarningEvent[], period: EarningsPeriod, now: Date = new Date()): TopService[] {
  const start = (() => {
    if (period === "today") return startOfDay(now).getTime();
    if (period === "week") return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    if (period === "month") return now.getTime() - 30 * 24 * 60 * 60 * 1000;
    return new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();
  })();
  const map = new Map<string, TopService>();
  for (const e of events) {
    const t = e.date.getTime();
    if (t < start || t > now.getTime()) continue;
    const cur = map.get(e.service) ?? { service: e.service, amount: 0, bookings: 0 };
    cur.amount += e.net;
    cur.bookings += 1;
    map.set(e.service, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount).slice(0, 3);
}

/* ---------- Tip summary ---------- */

export interface TipSummary {
  total: number;
  tippedRatio: number; // 0–1
  averageTip: number;
}

export function tipSummaryFor(events: EarningEvent[], period: EarningsPeriod, now: Date = new Date()): TipSummary {
  const start = (() => {
    if (period === "today") return startOfDay(now).getTime();
    if (period === "week") return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    if (period === "month") return now.getTime() - 30 * 24 * 60 * 60 * 1000;
    return new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();
  })();
  let total = 0;
  let tipped = 0;
  let count = 0;
  for (const e of events) {
    const t = e.date.getTime();
    if (t < start || t > now.getTime()) continue;
    count += 1;
    if (e.tip > 0) {
      tipped += 1;
      total += e.tip;
    }
  }
  return {
    total,
    tippedRatio: count === 0 ? 0 : tipped / count,
    averageTip: tipped === 0 ? 0 : Math.round(total / tipped),
  };
}

/* ---------- Money formatter (cents-aware-ish) ---------- */

export function formatMoney(n: number, opts: { showCents?: boolean } = {}): string {
  if (opts.showCents) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (n === 0) return "$0";
  return "$" + Math.round(n).toLocaleString("en-US");
}