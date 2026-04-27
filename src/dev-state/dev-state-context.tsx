import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Dev-only state toggle. Lets a designer/QA flip the app between
 * pro states, data densities, and themes without touching real data.
 *
 * Persisted in localStorage so the choice survives reloads, but only
 * surfaced when `import.meta.env.DEV` is true (Vite's dev flag) or
 * when ?dev=1 is in the URL (handy on preview builds).
 */

/**
 * Persona axis only. Day density is driven by DevDayContext; density of mock
 * data by DevDataDensity. Dispatch phase by DevLifecycle.
 */
export type DevProState = "auto" | "mid-onboarding" | "mid-pending" | "live";

export type DevDataDensity = "auto" | "empty" | "sparse" | "rich";
export type DevThemeOverride = "system" | "dark" | "light";

/** Pro is offline (showing day overview) or online (available for dispatch). */
export type DevMode = "auto" | "offline" | "online";

/** Used when DevMode = "offline" — how full is today's calendar. */
export type DevDayContext = "auto" | "none" | "one" | "multiple" | "full";

/**
 * Booking lifecycle takeover state. When set to anything other than "none",
 * Home is replaced by the corresponding lifecycle screen and the bottom tab
 * bar is hidden — the pro is focused on this one booking.
 */
export type DevLifecycle =
  | "none"
  | "incoming"
  | "get-ready"
  | "en-route"
  | "arrived"
  | "in-progress"
  | "complete";

/**
 * Booking source. Only meaningful when DevLifecycle === "get-ready" — controls
 * whether the Get Ready screen renders the on-demand prep countdown or the
 * scheduled "Leave by" framing. For every other lifecycle state, this field
 * has no effect.
 */
export type DevBookingSource = "auto" | "on-demand" | "scheduled";

/* ---- Earnings sub-axes ---- */

/**
 * Earnings sub-axes. Only meaningful when proState resolves to "live" — for
 * non-live pro states, Earnings is gated upstream (locked or empty waiting).
 * Each field maps to a downstream surface: payoutState → /earnings/payout-method,
 * pendingBalance → Earnings home pending card + in-transit payout amount,
 * taxDocs → /earnings/tax-documents.
 */
export type DevPayoutState =
  | "auto"
  | "none"
  | "active"
  | "pending"
  | "failed-recent";

export type DevPendingBalance = "auto" | "zero" | "small" | "large";

export type DevTaxDocs = "auto" | "none" | "current-year" | "multi-year";

/* ---- Calendar sub-axes ---- */

/**
 * Density of bookings to render across the visible calendar range.
 * Drives BOTH Week view block density and Month view heat tints — single
 * source of truth so the two views can never disagree.
 */
export type DevWeekDensity = "auto" | "empty" | "light" | "typical" | "packed";

/** How much blocked time to seed across the week. */
export type DevBlockedTime = "auto" | "none" | "one-today" | "multiple-week" | "vacation";

/** Which availability shape the pro is keeping. */
export type DevAvailability =
  | "auto"
  | "standard"
  | "split-days"
  | "weekend-warrior"
  | "limited";

/**
 * Edited availability override. When present, completely supersedes the
 * `availability` preset. Shape mirrors `AvailabilityWeek` from
 * /src/calendar/calendar-data.ts (kept JSON-shaped here to avoid cross-domain
 * type imports — the calendar layer narrows it on read).
 *
 * Keys are 0=Sun … 6=Sat. Empty array = day off.
 */
export type DevAvailabilityOverride = Record<
  number,
  { startMin: number; endMin: number }[]
>;

/**
 * Reschedule render state. Drives what every reschedule-aware surface
 * shows for the focus booking (calendar grid block, booking detail page,
 * bookings list row). Setting this seeds or clears proposals on the
 * focus booking so all surfaces re-render in sync.
 */
export type DevRescheduleState =
  | "none"
  | "pending-out"
  | "pending-in"
  | "approved"
  | "declined"
  | "expired";

export interface DevState {
  proState: DevProState;
  dataDensity: DevDataDensity;
  theme: DevThemeOverride;
  mode: DevMode;
  dayContext: DevDayContext;
  lifecycle: DevLifecycle;
  bookingSource: DevBookingSource;
  payoutState: DevPayoutState;
  pendingBalance: DevPendingBalance;
  taxDocs: DevTaxDocs;
  weekDensity: DevWeekDensity;
  blockedTime: DevBlockedTime;
  availability: DevAvailability;
  availabilityOverride: DevAvailabilityOverride | null;
  rescheduleState: DevRescheduleState;
}

const DEFAULT_STATE: DevState = {
  proState: "auto",
  dataDensity: "auto",
  theme: "system",
  mode: "auto",
  dayContext: "auto",
  lifecycle: "none",
  bookingSource: "auto",
  payoutState: "auto",
  pendingBalance: "auto",
  taxDocs: "auto",
  weekDensity: "auto",
  blockedTime: "auto",
  availability: "auto",
  availabilityOverride: null,
  rescheduleState: "none",
};

const STORAGE_KEY = "ewa.devState.v1";

interface Ctx {
  enabled: boolean;
  state: DevState;
  setProState: (v: DevProState) => void;
  setDataDensity: (v: DevDataDensity) => void;
  setTheme: (v: DevThemeOverride) => void;
  setMode: (v: DevMode) => void;
  setDayContext: (v: DevDayContext) => void;
  setLifecycle: (v: DevLifecycle) => void;
  setBookingSource: (v: DevBookingSource) => void;
  setPayoutState: (v: DevPayoutState) => void;
  setPendingBalance: (v: DevPendingBalance) => void;
  setTaxDocs: (v: DevTaxDocs) => void;
  setWeekDensity: (v: DevWeekDensity) => void;
  setBlockedTime: (v: DevBlockedTime) => void;
  setAvailability: (v: DevAvailability) => void;
  setAvailabilityOverride: (v: DevAvailabilityOverride | null) => void;
  setRescheduleState: (v: DevRescheduleState) => void;
  reset: () => void;
}

const DevStateContext = createContext<Ctx | null>(null);

function readEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("dev") === "0") return false;
    if (window.localStorage.getItem("ewa.devTools") === "0") return false;
  } catch {
    /* ignore */
  }
  return true;
}

function readPersisted(): DevState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<DevState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function DevStateProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<DevState>(DEFAULT_STATE);

  useEffect(() => {
    setEnabled(readEnabled());
    setState(readPersisted());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const setProState = useCallback((v: DevProState) => setState((s) => ({ ...s, proState: v })), []);
  const setDataDensity = useCallback((v: DevDataDensity) => setState((s) => ({ ...s, dataDensity: v })), []);
  const setTheme = useCallback((v: DevThemeOverride) => setState((s) => ({ ...s, theme: v })), []);
  const setMode = useCallback((v: DevMode) => setState((s) => ({ ...s, mode: v })), []);
  const setDayContext = useCallback((v: DevDayContext) => setState((s) => ({ ...s, dayContext: v })), []);
  const setLifecycle = useCallback((v: DevLifecycle) => setState((s) => ({ ...s, lifecycle: v })), []);
  const setBookingSource = useCallback((v: DevBookingSource) => setState((s) => ({ ...s, bookingSource: v })), []);
  const setPayoutState = useCallback((v: DevPayoutState) => setState((s) => ({ ...s, payoutState: v })), []);
  const setPendingBalance = useCallback((v: DevPendingBalance) => setState((s) => ({ ...s, pendingBalance: v })), []);
  const setTaxDocs = useCallback((v: DevTaxDocs) => setState((s) => ({ ...s, taxDocs: v })), []);
  const setWeekDensity = useCallback((v: DevWeekDensity) => setState((s) => ({ ...s, weekDensity: v })), []);
  const setBlockedTime = useCallback((v: DevBlockedTime) => setState((s) => ({ ...s, blockedTime: v })), []);
  const setAvailability = useCallback((v: DevAvailability) => setState((s) => ({ ...s, availability: v })), []);
  const setAvailabilityOverride = useCallback(
    (v: DevAvailabilityOverride | null) => setState((s) => ({ ...s, availabilityOverride: v })),
    [],
  );
  const setRescheduleState = useCallback(
    (v: DevRescheduleState) => setState((s) => ({ ...s, rescheduleState: v })),
    [],
  );
  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  const value = useMemo<Ctx>(
    () => ({
      enabled,
      state,
      setProState,
      setDataDensity,
      setTheme,
      setMode,
      setDayContext,
      setLifecycle,
      setBookingSource,
      setPayoutState,
      setPendingBalance,
      setTaxDocs,
      setWeekDensity,
      setBlockedTime,
      setAvailability,
      setAvailabilityOverride,
      setRescheduleState,
      reset,
    }),
    [
      enabled,
      state,
      setProState,
      setDataDensity,
      setTheme,
      setMode,
      setDayContext,
      setLifecycle,
      setBookingSource,
      setPayoutState,
      setPendingBalance,
      setTaxDocs,
      setWeekDensity,
      setBlockedTime,
      setAvailability,
      setAvailabilityOverride,
      setRescheduleState,
      reset,
    ],
  );

  return <DevStateContext.Provider value={value}>{children}</DevStateContext.Provider>;
}

export function useDevState(): Ctx {
  const ctx = useContext(DevStateContext);
  if (!ctx) {
    return {
      enabled: false,
      state: DEFAULT_STATE,
      setProState: () => {},
      setDataDensity: () => {},
      setTheme: () => {},
      setMode: () => {},
      setDayContext: () => {},
      setLifecycle: () => {},
      setBookingSource: () => {},
      setPayoutState: () => {},
      setPendingBalance: () => {},
      setTaxDocs: () => {},
      setWeekDensity: () => {},
      setBlockedTime: () => {},
      setAvailability: () => {},
      setAvailabilityOverride: () => {},
      setRescheduleState: () => {},
      reset: () => {},
    };
  }
  return ctx;
}
