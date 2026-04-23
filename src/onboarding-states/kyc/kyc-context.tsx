import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Phase-2 KYC state. Mirrors the onboarding context pattern: persisted to
 * localStorage so a pro can step away mid-verification (e.g. they need to
 * grab their ID) and resume exactly where they left off. In production this
 * would sync to Lovable Cloud + the real verification provider.
 */

export type KycStatus = "not_started" | "in_progress" | "pending" | "approved" | "rejected";

export interface KycData {
  // Tax / legal info (mocked, never logged)
  legalFirstName?: string;
  legalLastName?: string;
  dob?: string; // ISO yyyy-mm-dd
  ssnLast4?: string;

  // Capture artefacts — data URLs in mock mode; in prod these would be
  // upload tokens to a verified-document store.
  idFront?: string;
  idBack?: string;
  selfie?: string;

  // Final state
  status: KycStatus;
  submittedAt?: string;
  rejectionReason?: string;

  // Furthest reached step slug for resume-on-reload
  furthest?: KycStep;
}

export type KycStep =
  | "intro"
  | "tax"
  | "id-front"
  | "id-back"
  | "selfie"
  | "submit";

export const KYC_STEP_ORDER: KycStep[] = [
  "intro",
  "tax",
  "id-front",
  "id-back",
  "selfie",
  "submit",
];

export const KYC_TOTAL_STEPS = KYC_STEP_ORDER.length;

interface Ctx {
  data: KycData;
  patch: (next: Partial<KycData>) => void;
  markFurthest: (step: KycStep) => void;
  setStatus: (status: KycStatus, reason?: string) => void;
  reset: () => void;
}

const STORAGE_KEY = "ewa.kyc.v1";
const defaults: KycData = { status: "not_started", furthest: "intro" };

function read(): KycData {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as KycData) };
  } catch {
    return defaults;
  }
}

function write(d: KycData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // ignore
  }
}

const Context = createContext<Ctx | null>(null);

export function KycProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<KycData>(defaults);

  useEffect(() => {
    setData(read());
  }, []);

  const patch = useCallback((next: Partial<KycData>) => {
    setData((prev) => {
      const merged = { ...prev, ...next };
      write(merged);
      return merged;
    });
  }, []);

  const markFurthest = useCallback((step: KycStep) => {
    setData((prev) => {
      const prevIdx = KYC_STEP_ORDER.indexOf(prev.furthest ?? "intro");
      const nextIdx = KYC_STEP_ORDER.indexOf(step);
      if (nextIdx <= prevIdx) return prev;
      const merged = { ...prev, furthest: step };
      write(merged);
      return merged;
    });
  }, []);

  const setStatus = useCallback((status: KycStatus, reason?: string) => {
    setData((prev) => {
      const merged: KycData = {
        ...prev,
        status,
        submittedAt: status === "pending" || status === "approved" ? new Date().toISOString() : prev.submittedAt,
        rejectionReason: status === "rejected" ? reason ?? "We couldn't match your selfie to your ID. Try again in good light." : undefined,
      };
      write(merged);
      return merged;
    });
  }, []);

  const reset = useCallback(() => {
    write(defaults);
    setData(defaults);
  }, []);

  return (
    <Context.Provider value={{ data, patch, markFurthest, setStatus, reset }}>
      {children}
    </Context.Provider>
  );
}

export function useKyc() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useKyc must be used inside <KycProvider>");
  return ctx;
}

export function getKycSnapshot(): KycData {
  return read();
}

export function kycStepIndex(step: KycStep): number {
  return KYC_STEP_ORDER.indexOf(step);
}