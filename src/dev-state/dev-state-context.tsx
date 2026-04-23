import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Dev-only state toggle. Lets a designer/QA flip the app between
 * pro states, data densities, and themes without touching real data.
 *
 * Persisted in localStorage so the choice survives reloads, but only
 * surfaced when `import.meta.env.DEV` is true (Vite's dev flag) or
 * when ?dev=1 is in the URL (handy on preview builds).
 */

export type DevProState =
  | "auto"
  | "new"
  | "mid-onboarding"
  | "mid-pending"
  | "live-first"
  | "live-quiet"
  | "live-active";

export type DevDataDensity = "auto" | "empty" | "sparse" | "rich";
export type DevThemeOverride = "system" | "dark" | "light";

/** Pro is offline (showing day overview) or online (available for dispatch). */
export type DevMode = "auto" | "offline" | "online";

/** Used when DevMode = "offline" — how full is today's calendar. */
export type DevDayContext = "auto" | "none" | "one" | "multiple" | "full";

/** Used when DevMode = "online" — current dispatch lifecycle phase. */
export type DevOnlineStatus = "auto" | "idle" | "incoming" | "active";

export interface DevState {
  proState: DevProState;
  dataDensity: DevDataDensity;
  theme: DevThemeOverride;
  mode: DevMode;
  dayContext: DevDayContext;
  onlineStatus: DevOnlineStatus;
}

const DEFAULT_STATE: DevState = {
  proState: "auto",
  dataDensity: "auto",
  theme: "system",
  mode: "auto",
  dayContext: "auto",
  onlineStatus: "auto",
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
  setOnlineStatus: (v: DevOnlineStatus) => void;
  reset: () => void;
}

const DevStateContext = createContext<Ctx | null>(null);

function readEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (import.meta.env.DEV) return true;
  } catch {
    /* ignore */
  }
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("dev") === "1") return true;
    if (window.localStorage.getItem("ewa.devTools") === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
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
  const setOnlineStatus = useCallback((v: DevOnlineStatus) => setState((s) => ({ ...s, onlineStatus: v })), []);
  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  const value = useMemo<Ctx>(
    () => ({ enabled, state, setProState, setDataDensity, setTheme, setMode, setDayContext, setOnlineStatus, reset }),
    [enabled, state, setProState, setDataDensity, setTheme, setMode, setDayContext, setOnlineStatus, reset],
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
      setOnlineStatus: () => {},
      reset: () => {},
    };
  }
  return ctx;
}