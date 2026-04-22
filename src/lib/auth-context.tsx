import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Persona-aware auth state. In production this is wired to Lovable Cloud /
 * Supabase + secure storage; here we persist to localStorage so the splash
 * router can route correctly across reloads during design work.
 *
 * Three personas the gate must serve:
 *   - "guest"      : first-time pro, never signed up
 *   - "onboarding" : returning pro mid-KYC, profile incomplete
 *   - "active"     : verified pro, biometric likely enrolled
 */
export type ProState = "guest" | "onboarding" | "active";

export interface AuthSnapshot {
  state: ProState;
  /** Phone or email used to start the journey. */
  identifier?: string;
  /** Display name once captured. */
  displayName?: string;
  /** Whether device biometric is enrolled for this account. */
  biometricEnrolled: boolean;
  /** KYC step the pro left off at (0..4) for resume routing. */
  onboardingStep: number;
}

interface AuthContextValue extends AuthSnapshot {
  setIdentifier: (id: string) => void;
  /** Move from guest to onboarding after OTP verify. */
  completeRegistration: (id: string) => void;
  /** Sign in an existing pro and route by current state. */
  completeSignIn: (id: string) => void;
  /** Mark KYC done, pro becomes "active". */
  completeOnboarding: (displayName?: string) => void;
  /** Sign out, return to guest. */
  reset: () => void;
}

const STORAGE_KEY = "ewa.auth.v1";

const defaultSnapshot: AuthSnapshot = {
  state: "guest",
  biometricEnrolled: false,
  onboardingStep: 0,
};

function readSnapshot(): AuthSnapshot {
  if (typeof window === "undefined") return defaultSnapshot;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSnapshot;
    return { ...defaultSnapshot, ...(JSON.parse(raw) as Partial<AuthSnapshot>) };
  } catch {
    return defaultSnapshot;
  }
}

function writeSnapshot(snap: AuthSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // ignore quota/private-mode failures
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<AuthSnapshot>(defaultSnapshot);

  useEffect(() => {
    setSnap(readSnapshot());
  }, []);

  const update = (next: Partial<AuthSnapshot>) => {
    setSnap((prev) => {
      const merged = { ...prev, ...next };
      writeSnapshot(merged);
      return merged;
    });
  };

  const value: AuthContextValue = {
    ...snap,
    setIdentifier: (identifier) => update({ identifier }),
    completeRegistration: (identifier) =>
      update({ identifier, state: "onboarding", onboardingStep: 1 }),
    completeSignIn: (identifier) => update({ identifier }),
    completeOnboarding: (displayName) =>
      update({ displayName, state: "active", biometricEnrolled: true, onboardingStep: 4 }),
    reset: () => {
      writeSnapshot(defaultSnapshot);
      setSnap(defaultSnapshot);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Read snapshot synchronously, e.g. inside a router beforeLoad. */
export function getAuthSnapshot(): AuthSnapshot {
  return readSnapshot();
}