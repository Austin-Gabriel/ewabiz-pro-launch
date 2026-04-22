import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Persona-aware auth state, now backed by Lovable Cloud (Supabase) for real
 * sessions that persist across reloads and rebuilds.
 *
 *   - "guest"      : no session
 *   - "onboarding" : signed in, profile not yet marked complete
 *   - "active"     : signed in + onboarding complete (user_metadata.onboarding_complete === true)
 *
 * The local-only fields (identifier, onboardingStep, biometric) live in
 * localStorage so the existing splash / onboarding UI keeps working
 * unchanged, but the canonical "is this person signed in" answer comes
 * from Supabase.
 */
export type ProState = "guest" | "onboarding" | "active";

export interface AuthSnapshot {
  state: ProState;
  identifier?: string;
  displayName?: string;
  email?: string;
  userId?: string;
  biometricEnrolled: boolean;
  onboardingStep: number;
}

interface AuthContextValue extends AuthSnapshot {
  loading: boolean;
  setIdentifier: (id: string) => void;
  /** Move the local persona to "onboarding" after first sign-up. */
  completeRegistration: (id: string) => void;
  completeSignIn: (id: string) => void;
  /** Mark KYC done — flips state to "active". */
  completeOnboarding: (displayName?: string) => Promise<void>;
  /** Sign out and clear local persona. */
  reset: () => Promise<void>;
  /* --- new real-auth helpers --- */
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (args: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    services?: string[];
  }) => Promise<{ error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  signInDemo: () => Promise<{ error?: string }>;
}

const LOCAL_KEY = "ewa.auth.local.v2";

interface LocalSnapshot {
  identifier?: string;
  biometricEnrolled: boolean;
  onboardingStep: number;
}

const defaultLocal: LocalSnapshot = { biometricEnrolled: false, onboardingStep: 0 };

function readLocal(): LocalSnapshot {
  if (typeof window === "undefined") return defaultLocal;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return defaultLocal;
    return { ...defaultLocal, ...(JSON.parse(raw) as Partial<LocalSnapshot>) };
  } catch {
    return defaultLocal;
  }
}

function writeLocal(s: LocalSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function deriveState(user: User | null): ProState {
  if (!user) return "guest";
  const complete = Boolean(user.user_metadata?.onboarding_complete);
  return complete ? "active" : "onboarding";
}

function deriveDisplayName(user: User | null): string | undefined {
  if (!user) return undefined;
  const meta = user.user_metadata ?? {};
  return (
    (meta.display_name as string | undefined) ||
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    undefined
  );
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------ snapshot for synchronous reads (router beforeLoad) ------------ */

let lastSnapshot: AuthSnapshot = {
  state: "guest",
  biometricEnrolled: false,
  onboardingStep: 0,
};

function setLastSnapshot(s: AuthSnapshot) {
  lastSnapshot = s;
}

/** Synchronous best-effort snapshot for splash routing. */
export function getAuthSnapshot(): AuthSnapshot {
  return lastSnapshot;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [local, setLocalState] = useState<LocalSnapshot>(defaultLocal);
  const seededRef = useRef(false);

  // Hydrate local + subscribe to Supabase session.
  useEffect(() => {
    setLocalState(readLocal());

    // CRITICAL: subscribe BEFORE getSession so we never miss the first event.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Auto-seed the demo account once per browser, fire-and-forget.
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    fetch("/api/public/seed-demo", { method: "POST" }).catch(() => {
      /* network failure is fine — Skip-to-demo button still creates it on click */
    });
  }, []);

  const user = session?.user ?? null;
  const state = deriveState(user);
  const displayName = deriveDisplayName(user);

  const updateLocal = useCallback((patch: Partial<LocalSnapshot>) => {
    setLocalState((prev) => {
      const next = { ...prev, ...patch };
      writeLocal(next);
      return next;
    });
  }, []);

  const setIdentifier = useCallback(
    (identifier: string) => updateLocal({ identifier }),
    [updateLocal],
  );

  const completeRegistration = useCallback(
    (identifier: string) => updateLocal({ identifier, onboardingStep: 1 }),
    [updateLocal],
  );

  const completeSignIn = useCallback(
    (identifier: string) => updateLocal({ identifier }),
    [updateLocal],
  );

  const completeOnboarding = useCallback(
    async (name?: string) => {
      updateLocal({ onboardingStep: 4, biometricEnrolled: true });
      // Mark the user complete in Supabase metadata so state derives to "active".
      const meta: Record<string, unknown> = { onboarding_complete: true };
      if (name) meta.display_name = name;
      await supabase.auth.updateUser({ data: meta }).catch(() => undefined);
    },
    [updateLocal],
  );

  const reset = useCallback(async () => {
    writeLocal(defaultLocal);
    setLocalState(defaultLocal);
    await supabase.auth.signOut().catch(() => undefined);
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      updateLocal({ identifier: email });
      return {};
    },
    [updateLocal],
  );

  const signUpWithPassword = useCallback(
    async ({
      email,
      password,
      fullName,
      phone,
      services,
    }: {
      email: string;
      password: string;
      fullName?: string;
      phone?: string;
      services?: string[];
    }) => {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/splash` : undefined;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
            display_name: fullName,
            phone,
            services,
            onboarding_complete: false,
          },
        },
      });
      if (error) return { error: error.message };
      updateLocal({ identifier: email, onboardingStep: 1 });
      return {};
    },
    [updateLocal],
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signInDemo = useCallback(async () => {
    // Try sign-in first; if the seed hasn't run yet, ask the API to seed then retry.
    const tryIt = () =>
      supabase.auth.signInWithPassword({
        email: "test@ewa.app",
        password: "test1234",
      });
    let { error } = await tryIt();
    if (error) {
      try {
        await fetch("/api/public/seed-demo", { method: "POST" });
      } catch {
        /* ignore */
      }
      ({ error } = await tryIt());
    }
    if (error) return { error: error.message };
    updateLocal({ identifier: "test@ewa.app", onboardingStep: 4, biometricEnrolled: true });
    return {};
  }, [updateLocal]);

  const snapshot: AuthSnapshot = useMemo(
    () => ({
      state,
      identifier: local.identifier,
      displayName,
      email: user?.email ?? undefined,
      userId: user?.id,
      biometricEnrolled: local.biometricEnrolled,
      onboardingStep: local.onboardingStep,
    }),
    [state, displayName, user?.email, user?.id, local],
  );

  // Keep the synchronous snapshot mirror up to date.
  useEffect(() => {
    setLastSnapshot(snapshot);
  }, [snapshot]);

  const value: AuthContextValue = {
    ...snapshot,
    loading,
    setIdentifier,
    completeRegistration,
    completeSignIn,
    completeOnboarding,
    reset,
    signInWithPassword,
    signUpWithPassword,
    sendPasswordReset,
    signInDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}