/**
 * Calendar-specific data layer. Reads canonical bookings from
 * /src/data/mock-bookings.ts and synthesizes additional density / blocks /
 * availability from the dev-state toggle. NEVER modifies the canonical source.
 */

import {
  ALL_BOOKINGS,
  HISTORY_BOOKINGS,
  CANONICAL_SERVICES,
  type Booking,
  type CanonicalService,
} from "@/data/mock-bookings";

/**
 * SINGLE SOURCE OF TRUTH for "what bookings exist on a given day" — used
 * by both the Calendar surface and the Bookings list. Mirrors the
 * Bookings/Upcoming filter (status === confirmed | pending). Completed
 * & cancelled live in Bookings/History only and are not surfaced on the
 * working calendar grid, so the two surfaces can never disagree.
 */
function activeCanonicalBookings(): Booking[] {
  return ALL_BOOKINGS.filter(
    (b) => b.status === "confirmed" || b.status === "pending",
  );
}
import type {
  DevWeekDensity,
  DevBlockedTime,
  DevAvailability,
} from "@/dev-state/dev-state-context";

/* ---------- Week math (Sun = 0 … Sat = 6) ---------- */

export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function weekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/* ---------- Format ---------- */

export function fmtTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const suf = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  if (m === 0) return `${h}:00 ${suf}`;
  return `${h}:${String(m).padStart(2, "0")} ${suf}`;
}

/** Compact time: drops :00 — "10 AM", "2:30 PM". */
export function fmtTimeShort(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const suf = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  if (m === 0) return `${h} ${suf}`;
  return `${h}:${String(m).padStart(2, "0")} ${suf}`;
}

export function fmtHourLabel(hour24: number): string {
  if (hour24 === 0) return "12 AM";
  if (hour24 === 12) return "12 PM";
  if (hour24 < 12) return `${hour24} AM`;
  return `${hour24 - 12} PM`;
}

export function fmtUsd(n: number): string {
  if (n === 0) return "$0";
  return "$" + Math.round(n).toLocaleString("en-US");
}

/* ---------- Travel buffer model ---------- */

export interface TravelBuffer {
  /** Stable key — bookingId of the *next* booking. */
  id: string;
  startsAt: Date;
  endsAt: Date;
  /** Auto-calculated minimum minutes (travel + min prep). */
  minMinutes: number;
  /** Currently-applied minutes (>= min). */
  minutes: number;
  /** Distance miles. */
  miles: number;
}

/* ---------- Blocked time model ---------- */

export interface BlockedSlot {
  id: string;
  startsAt: Date;
  endsAt: Date;
  reason?: string;
}

/* ---------- Availability model ---------- */

export interface AvailabilityRange {
  /** Minutes from midnight, inclusive start. */
  startMin: number;
  /** Minutes from midnight, exclusive end. */
  endMin: number;
}

/** dayOfWeek 0=Sun … 6=Sat → ranges */
export type AvailabilityWeek = Record<number, AvailabilityRange[]>;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];
export const FULL_DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function dayShort(idx: number): string {
  return DAY_LABELS[idx] ?? "";
}

export function dayInitial(idx: number): string {
  return DAY_INITIALS[idx] ?? "";
}

const range = (h1: number, h2: number): AvailabilityRange => ({
  startMin: h1 * 60,
  endMin: h2 * 60,
});

export function availabilityFor(preset: DevAvailability): AvailabilityWeek {
  // Defaults: Mon–Fri 10–6
  switch (preset) {
    case "split-days":
      return {
        0: [],
        1: [range(10, 14), range(16, 20)],
        2: [range(10, 14), range(16, 20)],
        3: [range(10, 14), range(16, 20)],
        4: [range(10, 14), range(16, 20)],
        5: [range(10, 14), range(16, 20)],
        6: [],
      };
    case "weekend-warrior":
      return {
        0: [range(10, 18)],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [range(15, 21)],
        6: [range(9, 19)],
      };
    case "limited":
      return {
        0: [],
        1: [range(11, 17)],
        2: [],
        3: [range(11, 17)],
        4: [],
        5: [range(11, 17)],
        6: [],
      };
    case "auto":
    case "standard":
    default:
      return {
        0: [],
        1: [range(10, 18)],
        2: [range(10, 18)],
        3: [range(10, 18)],
        4: [range(10, 18)],
        5: [range(10, 18)],
        6: [],
      };
  }
}

/**
 * Resolve effective availability: an explicit edited override always wins;
 * otherwise fall back to the dev-state preset shape. Multi-range supported
 * via the override path — the preset shapes already support multi-range.
 */
export function resolveAvailability(
  preset: DevAvailability,
  override: Record<number, { startMin: number; endMin: number }[]> | null,
): AvailabilityWeek {
  if (override) {
    const out: AvailabilityWeek = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (let i = 0; i < 7; i++) {
      const ranges = override[i] ?? [];
      out[i] = ranges
        .filter((r) => r.endMin > r.startMin)
        .map((r) => ({ startMin: r.startMin, endMin: r.endMin }))
        .sort((a, b) => a.startMin - b.startMin);
    }
    return out;
  }
  return availabilityFor(preset);
}

export function todayHoursLabel(av: AvailabilityWeek, today: Date): string {
  const ranges = av[today.getDay()] ?? [];
  if (ranges.length === 0) return "Today · No work";
  const fmt = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return fmtTime(d);
  };
  const parts = ranges.map((r) => `${fmt(r.startMin)} – ${fmt(r.endMin)}`);
  return `Today · ${parts.join(", ")}`;
}

/* ---------- Density seeding ---------- */

const FIRST_NAMES = [
  "Maya",
  "Tasha",
  "Renée",
  "Simone",
  "Jordan",
  "Devon",
  "Aaliyah",
  "Imani",
  "Zara",
  "Nia",
  "Asha",
  "Kemi",
  "Ife",
  "Omari",
  "Sade",
];
const NEIGHBORHOODS = [
  "Fort Greene, Brooklyn",
  "Bed-Stuy, Brooklyn",
  "Crown Heights, Brooklyn",
  "Park Slope, Brooklyn",
  "Clinton Hill, Brooklyn",
  "Harlem, Manhattan",
  "Williamsburg, Brooklyn",
];

const SERVICE_PRICES: Record<CanonicalService, number> = {
  "Silk press": 175,
  Trim: 65,
  Retwist: 95,
  "Knotless braids": 280,
  "Box braids": 320,
  Cornrows: 110,
  Crochet: 220,
  "Wash and go": 75,
  Blowout: 90,
  "Color touch-up": 180,
};

const SERVICE_DURATIONS: Record<CanonicalService, number> = {
  "Silk press": 90,
  Trim: 45,
  Retwist: 75,
  "Knotless braids": 240,
  "Box braids": 360,
  Cornrows: 75,
  Crochet: 180,
  "Wash and go": 60,
  Blowout: 60,
  "Color touch-up": 120,
};

function rng(seed: number) {
  let s = seed >>> 0;
  if (s === 0) s = 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export interface CalendarBooking {
  id: string;
  clientFirst: string;
  /** Capital initial of the last name (e.g. "U" for "Evans Udo"). Empty string if unknown. */
  clientLastInitial: string;
  service: CanonicalService;
  startsAt: Date;
  durationMin: number;
  neighborhood: string;
  isOnDemand: boolean;
  priceUsd: number;
}

/**
 * Per-day target booking counts for each density preset.
 * Empty = 0 across the whole week.
 * Light = 3–4 bookings spread across 3–4 weekdays.
 * Typical = 12–14 bookings, 2–3/day Tue–Sat.
 * Packed = 25–28 bookings, 4–5/day Tue–Sat, 2–3 on Mon/Sun.
 *
 * Index 0 = Sun … 6 = Sat.
 */
function densityShape(density: DevWeekDensity): number[] {
  switch (density) {
    case "empty":
      return [0, 0, 0, 0, 0, 0, 0];
    case "light":
      // 3–4 bookings, spread across 3–4 weekdays. Weekends free.
      return [0, 1, 0, 1, 1, 1, 0]; // Mon, Wed, Thu, Fri = 4 total
    case "typical":
      // 2–3 on Tue–Sat, lighter Mon/Sun. Total ~12–14.
      return [0, 1, 3, 2, 3, 3, 2]; // = 14
    case "packed":
      // 4–5 every Tue–Sat, 2–3 Mon/Sun. Total ~25–28.
      return [2, 3, 5, 4, 5, 5, 3]; // = 27
    case "auto":
    default:
      return [0, 1, 2, 2, 3, 3, 1]; // ~12, balanced default
  }
}

/**
 * CANONICAL booking source for Calendar surfaces. Reads ONLY from
 * /src/data/mock-bookings.ts so Calendar and Bookings can never disagree.
 *
 * The dev-state density preset does NOT add bookings here. To get extra
 * "ghost" bookings for Month heatmap padding, use `densityPaddingForWeek`
 * separately and combine ONLY for tint computation — never for stats.
 */
export function realBookingsForWeek(weekStart: Date): CalendarBooking[] {
  const weekEnd = addDays(weekStart, 7);
  return activeCanonicalBookings()
    .filter((b) => b.startsAt >= weekStart && b.startsAt < weekEnd)
    .map((b) => {
      const parts = b.clientName.trim().split(/\s+/);
      const first = parts[0] ?? b.clientName;
      const lastInitial = parts.length > 1 ? (parts[parts.length - 1][0] ?? "").toUpperCase() : "";
      return {
        id: b.id,
        clientFirst: first,
        clientLastInitial: lastInitial,
        service: b.service,
        startsAt: b.startsAt,
        durationMin: b.durationMin,
        neighborhood: b.neighborhood,
        isOnDemand: false,
        priceUsd: b.priceUsd,
      };
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * Synthesized "ghost" bookings used ONLY for Month view density tints.
 * Never rendered, never counted in stats, never bookable. Lets a designer
 * preview a denser heatmap without polluting the canonical mock data.
 */
export function densityPaddingForWeek(
  weekStart: Date,
  density: DevWeekDensity,
): CalendarBooking[] {
  if (density === "empty" || density === "auto") return [];

  const real = realBookingsForWeek(weekStart);
  const shape = densityShape(density);
  const r = rng(Math.floor(weekStart.getTime() / 86400000));
  const synthesized: CalendarBooking[] = [];

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const day = addDays(weekStart, dayIdx);
    const target = shape[dayIdx];
    if (target === 0) continue;

    const realOnDay = real.filter((b) => isSameDay(b.startsAt, day)).length;
    const need = Math.max(0, target - realOnDay);

    let cursorMin = 9 * 60 + Math.floor(r() * 45);
    for (let i = 0; i < need; i++) {
      const svcIdx = Math.floor(r() * CANONICAL_SERVICES.length);
      const svc = CANONICAL_SERVICES[svcIdx];
      const baseDur = SERVICE_DURATIONS[svc];
      const dur = density === "packed" ? Math.min(baseDur, 90) : baseDur;
      if (cursorMin + dur > 21 * 60) break;
      const startsAt = new Date(day);
      startsAt.setHours(0, Math.round(cursorMin / 15) * 15, 0, 0);
      synthesized.push({
        id: `synth-${weekStart.getTime()}-${dayIdx}-${i}`,
        clientFirst: FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)],
        clientLastInitial: "",
        service: svc,
        startsAt,
        durationMin: dur,
        neighborhood: NEIGHBORHOODS[Math.floor(r() * NEIGHBORHOODS.length)],
        isOnDemand: r() < 0.18,
        priceUsd: SERVICE_PRICES[svc],
      });
      const travelGap = density === "packed"
        ? 20 + Math.floor(r() * 15)
        : 30 + Math.floor(r() * 30);
      cursorMin += dur + travelGap;
    }
  }
  return synthesized;
}

/**
 * @deprecated Use `realBookingsForWeek` for stats/rendering and
 * `densityPaddingForWeek` for Month tints. Kept temporarily as alias to
 * the canonical source so callers that haven't migrated still render
 * correct numbers.
 */
export function bookingsForWeek(
  weekStart: Date,
  _density: DevWeekDensity,
): CalendarBooking[] {
  void _density;
  return realBookingsForWeek(weekStart);
}

/* ---------- Aggregates for stat strips ---------- */

export interface DayStats {
  count: number;
  earnedUsd: number;
  /** First upcoming booking's start time, or null. */
  nextUpAt: Date | null;
}

export function statsForDay(items: CalendarBooking[], now: Date): DayStats {
  const onDay = items.filter((b) => isSameDay(b.startsAt, now));
  const earned = onDay.reduce((sum, b) => sum + b.priceUsd, 0);
  const upcoming = onDay
    .filter((b) => b.startsAt.getTime() >= now.getTime())
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return {
    count: onDay.length,
    earnedUsd: earned,
    nextUpAt: upcoming[0]?.startsAt ?? null,
  };
}

export interface RangeStats {
  count: number;
  earnedUsd: number;
  /** Booked % of available work hours in the range. */
  bookedPct: number;
}

export function statsForRange(
  items: CalendarBooking[],
  rangeStart: Date,
  rangeEnd: Date,
  availability: AvailabilityWeek,
): RangeStats {
  const inRange = items.filter(
    (b) => b.startsAt >= rangeStart && b.startsAt < rangeEnd,
  );
  const earned = inRange.reduce((sum, b) => sum + b.priceUsd, 0);
  const bookedMin = inRange.reduce((sum, b) => sum + b.durationMin, 0);

  // Available minutes across the range.
  let availMin = 0;
  const days = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000);
  for (let i = 0; i < days; i++) {
    const day = addDays(rangeStart, i);
    const ranges = availability[day.getDay()] ?? [];
    for (const r of ranges) availMin += r.endMin - r.startMin;
  }

  const pct = availMin > 0 ? Math.min(100, Math.round((bookedMin / availMin) * 100)) : 0;
  return { count: inRange.length, earnedUsd: earned, bookedPct: pct };
}

/* ---------- Compute travel buffers between consecutive bookings same day ---------- */

export function travelBuffersFor(items: CalendarBooking[]): TravelBuffer[] {
  const out: TravelBuffer[] = [];
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const curr = items[i];
    if (!isSameDay(prev.startsAt, curr.startsAt)) continue;
    const prevEnd = new Date(prev.startsAt.getTime() + prev.durationMin * 60_000);
    const gap = (curr.startsAt.getTime() - prevEnd.getTime()) / 60_000;
    if (gap < 10 || gap > 120) continue;
    out.push({
      id: curr.id,
      startsAt: prevEnd,
      endsAt: curr.startsAt,
      minMinutes: 18,
      minutes: Math.min(gap, Math.max(22, Math.round(gap * 0.7))),
      miles: Number((1.5 + ((i * 1.7) % 4)).toFixed(1)),
    });
  }
  return out;
}

/* ---------- Blocked time seeding ---------- */

export function seedBlocks(
  weekStart: Date,
  preset: DevBlockedTime,
): BlockedSlot[] {
  if (preset === "auto" || preset === "none") return [];
  const today = new Date();
  if (preset === "one-today") {
    const start = new Date(today);
    start.setHours(15, 0, 0, 0);
    const end = new Date(today);
    end.setHours(16, 30, 0, 0);
    return [{ id: "blk-1", startsAt: start, endsAt: end, reason: "Personal" }];
  }
  if (preset === "multiple-week") {
    return [
      block(addDays(weekStart, 1), 12, 0, 13, 30, "Lunch"),
      block(addDays(weekStart, 3), 9, 0, 10, 0, "School run"),
      block(addDays(weekStart, 5), 16, 0, 18, 0, "Studio time"),
    ];
  }
  // vacation
  return Array.from({ length: 7 }, (_, i) =>
    block(addDays(weekStart, i), 0, 0, 23, 59, "Vacation"),
  );
}

function block(
  day: Date,
  h1: number,
  m1: number,
  h2: number,
  m2: number,
  reason: string,
): BlockedSlot {
  const s = new Date(day);
  s.setHours(h1, m1, 0, 0);
  const e = new Date(day);
  e.setHours(h2, m2, 0, 0);
  return { id: `blk-${day.getTime()}-${h1}`, startsAt: s, endsAt: e, reason };
}

/* ---------- Free-slot synthesis for Day view "Free" / "Lunch" pills ---------- */

export interface FreeSlot {
  id: string;
  startsAt: Date;
  endsAt: Date;
  /** "Free" or "Lunch · 30 min" — short label rendered inside the dashed pill. */
  label: string;
  kind: "free" | "lunch";
}

/**
 * Walk a day's availability and emit dashed "Free" / "Lunch" slots in the
 * gaps between bookings (and travel buffers). Only used in Day view.
 *
 * - Gaps ≥ 90 min → "Free"
 * - Gaps 25–60 min around midday → "Lunch · 30 min"
 */
export function freeSlotsFor(
  day: Date,
  items: CalendarBooking[],
  buffers: TravelBuffer[],
  blocks: BlockedSlot[],
  availability: AvailabilityRange[],
): FreeSlot[] {
  if (availability.length === 0) return [];
  const out: FreeSlot[] = [];
  // Build a list of "occupied" intervals (mins from midnight) on this day.
  type Iv = { s: number; e: number };
  const occupied: Iv[] = [];
  for (const it of items) {
    if (!isSameDay(it.startsAt, day)) continue;
    const s = it.startsAt.getHours() * 60 + it.startsAt.getMinutes();
    occupied.push({ s, e: s + it.durationMin });
  }
  for (const b of buffers) {
    if (!isSameDay(b.startsAt, day)) continue;
    const s = b.startsAt.getHours() * 60 + b.startsAt.getMinutes();
    occupied.push({ s, e: s + b.minutes });
  }
  for (const b of blocks) {
    if (!isSameDay(b.startsAt, day)) continue;
    const s = b.startsAt.getHours() * 60 + b.startsAt.getMinutes();
    const e = b.endsAt.getHours() * 60 + b.endsAt.getMinutes();
    occupied.push({ s, e });
  }
  occupied.sort((a, b) => a.s - b.s);

  // Walk each availability range and find gaps.
  for (const r of availability) {
    let cursor = r.startMin;
    for (const iv of occupied) {
      if (iv.e <= r.startMin || iv.s >= r.endMin) continue;
      if (iv.s > cursor) {
        emitGap(out, day, cursor, iv.s);
      }
      cursor = Math.max(cursor, iv.e);
    }
    if (cursor < r.endMin) emitGap(out, day, cursor, r.endMin);
  }
  return out;
}

function emitGap(out: FreeSlot[], day: Date, sMin: number, eMin: number) {
  const gap = eMin - sMin;
  if (gap < 25) return;
  const start = new Date(day);
  start.setHours(0, sMin, 0, 0);
  const end = new Date(day);
  end.setHours(0, eMin, 0, 0);
  // Lunch heuristic: short midday gap (≤ 60 min) crossing 12–2 PM.
  const isMidday = sMin >= 11 * 60 && eMin <= 14 * 60 + 30;
  if (gap >= 25 && gap <= 60 && isMidday) {
    out.push({
      id: `free-${day.getTime()}-${sMin}`,
      startsAt: start,
      endsAt: end,
      label: `Lunch · ${gap} min`,
      kind: "lunch",
    });
    return;
  }
  if (gap >= 90) {
    out.push({
      id: `free-${day.getTime()}-${sMin}`,
      startsAt: start,
      endsAt: end,
      label: "Free",
      kind: "free",
    });
  }
}

/** Find the canonical Booking by id so we can route to /bookings/$id. */
export function isRealBookingId(id: string): boolean {
  if (id.startsWith("synth-") || id.startsWith("blk-") || id.startsWith("free-")) return false;
  return Boolean(
    ALL_BOOKINGS.find((b) => b.id === id) ??
      HISTORY_BOOKINGS.find((b) => b.id === id),
  );
}

export type { Booking };
