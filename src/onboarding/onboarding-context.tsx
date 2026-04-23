import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Onboarding state — persisted to localStorage so a pro can drop off at any
 * step and resume exactly where they left off. No server roundtrip in mock
 * mode; in production this would sync to Lovable Cloud on every patch.
 */
export interface OnboardingData {
  // Collected at signup
  studioName?: string;
  // Step 2 — phone (already captured pre-onboarding via /join)
  phone?: string;
  // Step 4 — personal info
  firstName?: string;
  lastName?: string;
  dob?: string; // ISO yyyy-mm-dd
  // Step 5 — craft description
  craft?: string;
  // Step 6 — services (slugs)
  services?: string[];
  // Step 7 — experience bracket
  experience?: "u1" | "1to3" | "3to5" | "5to10" | "10plus";
  // Step 8 — specializations (slugs scoped to picked services)
  specializations?: string[];
  // Step 8 — pro-suggested specialty (free text, stored for future curation, doesn't affect chip selection)
  customSpecialty?: string;
  // Step 9 — service area
  area?: { lat: number; lng: number; radiusMi: number; label?: string };
  // Step 9 — formatted address text (Google Places-style autocomplete)
  addressLine?: string;
  // Step 11 — weekly availability
  availability?: WeeklyAvailability;
  // Step 12 — service menu
  menu?: ServiceMenuItem[];
  // Step 13 — portfolio (data URLs in mock; would be Storage paths in prod)
  portfolio?: string[];
  // Furthest step reached (1-based, matches step path)
  furthestStep?: number;
}

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface DayAvailability {
  enabled: boolean;
  start: string; // "HH:mm"
  end: string;
}
export type WeeklyAvailability = Record<WeekDay, DayAvailability>;

export const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  mon: { enabled: false, start: "10:00", end: "19:00" },
  tue: { enabled: true, start: "10:00", end: "19:00" },
  wed: { enabled: true, start: "10:00", end: "19:00" },
  thu: { enabled: true, start: "10:00", end: "19:00" },
  fri: { enabled: true, start: "10:00", end: "19:00" },
  sat: { enabled: true, start: "10:00", end: "19:00" },
  sun: { enabled: false, start: "10:00", end: "19:00" },
};

export interface ServiceMenuItem {
  id: string;
  name: string;
  durationMin: number;
  priceUsd: number;
  description?: string;
}

interface OnboardingContextValue {
  data: OnboardingData;
  patch: (next: Partial<OnboardingData>) => void;
  markFurthest: (step: number) => void;
  clear: () => void;
}

const STORAGE_KEY = "ewa.onboarding.v1";
const defaults: OnboardingData = { furthestStep: 1 };

function read(): OnboardingData {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as OnboardingData) };
  } catch {
    return defaults;
  }
}
function write(d: OnboardingData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // ignore
  }
}

const Ctx = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaults);

  useEffect(() => {
    setData(read());
  }, []);

  const patch = useCallback((next: Partial<OnboardingData>) => {
    setData((prev) => {
      const merged = { ...prev, ...next };
      write(merged);
      return merged;
    });
  }, []);

  const markFurthest = useCallback((step: number) => {
    setData((prev) => {
      if ((prev.furthestStep ?? 1) >= step) return prev;
      const merged = { ...prev, furthestStep: step };
      write(merged);
      return merged;
    });
  }, []);

  const clear = useCallback(() => {
    write(defaults);
    setData(defaults);
  }, []);

  return <Ctx.Provider value={{ data, patch, markFurthest, clear }}>{children}</Ctx.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOnboarding must be used inside <OnboardingProvider>");
  return ctx;
}

export function getOnboardingSnapshot(): OnboardingData {
  return read();
}

/* ---------- Static catalogs ---------- */

export const SERVICE_CATALOG = [
  { slug: "barbering", label: "Barbering" },
  { slug: "hair-styling", label: "Hair Styling" },
  { slug: "braiding", label: "Braiding" },
  { slug: "locs", label: "Locs" },
  { slug: "nails", label: "Nails" },
  { slug: "beard-grooming", label: "Beard Grooming" },
  { slug: "facial", label: "Facial" },
  { slug: "makeup", label: "Makeup" },
  { slug: "waxing", label: "Waxing" },
] as const;

export const SPECIALIZATIONS: Record<string, string[]> = {
  barbering: ["Fades", "Tapers", "Textured hair", "Design work", "Kids cuts", "Line-ups"],
  "hair-styling": ["Silk press", "Blowouts", "Curls", "Color", "Updos", "Extensions"],
  braiding: ["Box braids", "Knotless", "Cornrows", "Feed-ins", "Stitch braids", "Tribal"],
  locs: ["Starter locs", "Retwist", "Loc styling", "Loc repair", "Interlocking"],
  nails: ["Gel-X", "Acrylic", "Gel polish", "Nail art", "Manicure", "Pedicure"],
  "beard-grooming": ["Beard sculpt", "Hot towel shave", "Beard color", "Trim & line"],
  facial: ["Acne care", "Anti-aging", "Hydrating", "Dermaplaning", "Microdermabrasion"],
  makeup: ["Bridal", "Editorial", "Special occasion", "Natural glam", "SFX"],
  waxing: ["Brazilian", "Brow", "Lip", "Full body", "Underarm"],
};

export const EXPERIENCE_OPTIONS: { value: NonNullable<OnboardingData["experience"]>; label: string }[] = [
  { value: "u1", label: "Under 1 year" },
  { value: "1to3", label: "1 – 3 years" },
  { value: "3to5", label: "3 – 5 years" },
  { value: "5to10", label: "5 – 10 years" },
  { value: "10plus", label: "10+ years" },
];

// Phone & OTP & legal name are collected at signup, so the in-app onboarding
// covers 10 questions: name+DOB review, craft, services, experience,
// specializations, area, availability, menu, portfolio, review.
export const TOTAL_STEPS = 10;
