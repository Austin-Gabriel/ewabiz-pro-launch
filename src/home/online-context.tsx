import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { OnlineState } from "@/data/mock-data";

/**
 * Pro online-toggle state, hoisted so it persists across route changes
 * (Home → Calendar → Bookings → Earnings → Home keeps the same toggle
 * value) and so the OnlineStrip on non-home pages can read it.
 *
 * Persisted to localStorage so the toggle state survives reloads —
 * matches the dev-state pattern.
 */

const DEFAULT_STATE: OnlineState = { kind: "available" };
const STORAGE_KEY = "ewa.onlineState.v1";

interface Ctx {
  state: OnlineState;
  setState: (next: OnlineState) => void;
}

const OnlineContext = createContext<Ctx | null>(null);

function readPersisted(): OnlineState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<OnlineState>;
    if (parsed && typeof parsed.kind === "string") {
      return { ...DEFAULT_STATE, ...parsed };
    }
    return DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<OnlineState>(DEFAULT_STATE);

  useEffect(() => {
    setStateRaw(readPersisted());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const setState = useCallback((next: OnlineState) => setStateRaw(next), []);

  const value = useMemo<Ctx>(() => ({ state, setState }), [state, setState]);

  return <OnlineContext.Provider value={value}>{children}</OnlineContext.Provider>;
}

export function useOnline(): Ctx {
  const ctx = useContext(OnlineContext);
  if (!ctx) {
    return {
      state: DEFAULT_STATE,
      setState: () => {},
    };
  }
  return ctx;
}

/** True when the pro is in any "accepting requests" online sub-state. */
export function isOnlineKind(state: OnlineState): boolean {
  return (
    state.kind === "available" ||
    state.kind === "after-hours-online" ||
    state.kind === "protecting"
  );
}
