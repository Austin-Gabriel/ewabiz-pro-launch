/**
 * Profile draft storage. Phase 2 persistence is localStorage only — single
 * device, survives reload. The draft seeds from the canonical mock data
 * on first read; subsequent edits write back to localStorage.
 *
 * This is intentionally NOT a context. Each section reads what it needs and
 * subscribes via `useSyncExternalStore` so any update re-renders consumers
 * across the page (e.g. the completion checklist updates when About is saved).
 */

import { useSyncExternalStore } from "react";
import { PRO_PROFILE, type CertificateStatus, type VisibilityStatus } from "@/data/mock-pro-profile";
import { PORTFOLIO_PHOTOS, type PortfolioPhoto } from "@/data/mock-portfolio";
import { PRO_SERVICES, type ProService } from "@/data/mock-services";

const STORAGE_KEY = "ewabiz.profile.draft.v1";

export interface ProfileDraft {
  displayName: string;
  initials: string;
  avatarUrl?: string;
  headline: string;
  about: string;
  neighborhood: string;
  travelRadiusMi: number;
  baseAddress: string;
  specializations: string[];
  social: { instagram?: string; tiktok?: string };
  certificate: CertificateStatus;
  visibility: VisibilityStatus;
  availabilitySummary: string;
  services: ProService[];
  /** Editable copy of the canonical portfolio. Order is meaningful. */
  portfolio: PortfolioPhoto[];
}

function defaultDraft(): ProfileDraft {
  return {
    displayName: PRO_PROFILE.displayName,
    initials: PRO_PROFILE.initials,
    avatarUrl: PRO_PROFILE.avatarUrl,
    headline: PRO_PROFILE.headline,
    about: PRO_PROFILE.about ?? "",
    neighborhood: PRO_PROFILE.neighborhood,
    travelRadiusMi: PRO_PROFILE.travelRadiusMi,
    baseAddress: PRO_PROFILE.baseAddress,
    specializations: [...PRO_PROFILE.specializations],
    social: { ...PRO_PROFILE.social },
    certificate: PRO_PROFILE.certificate,
    visibility: PRO_PROFILE.visibility,
    availabilitySummary: PRO_PROFILE.availabilitySummary,
    services: PRO_SERVICES.map((s) => ({ ...s })),
    portfolio: PORTFOLIO_PHOTOS.map((p) => ({ ...p })),
  };
}

let memo: ProfileDraft | null = null;
const listeners = new Set<() => void>();

function read(): ProfileDraft {
  if (memo) return memo;
  if (typeof window === "undefined") {
    memo = defaultDraft();
    return memo;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileDraft>;
      // Merge over defaults so newly added fields are populated.
      memo = { ...defaultDraft(), ...parsed };
      return memo;
    }
  } catch {
    /* ignore parse errors, fall through to default */
  }
  memo = defaultDraft();
  return memo;
}

function write(next: ProfileDraft) {
  memo = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota or privacy mode — keep in-memory */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/* ---------- Public API ---------- */

export function useProfileDraft(): ProfileDraft {
  return useSyncExternalStore(subscribe, read, read);
}

export function updateProfileDraft(patch: Partial<ProfileDraft>): void {
  write({ ...read(), ...patch });
}

/** Reset to seed values — used by dev tools, not by the UI. */
export function resetProfileDraft(): void {
  write(defaultDraft());
}

/* Service helpers */

export function upsertService(service: ProService): void {
  const draft = read();
  const idx = draft.services.findIndex((s) => s.id === service.id);
  const services = [...draft.services];
  if (idx >= 0) services[idx] = service;
  else services.push(service);
  write({ ...draft, services });
}

export function removeService(id: string): void {
  const draft = read();
  write({ ...draft, services: draft.services.filter((s) => s.id !== id) });
}

/* Portfolio helpers */

export function setPortfolio(photos: PortfolioPhoto[]): void {
  // Re-stamp order based on array index so the canonical order field
  // matches the actual array position.
  const next = photos.map((p, i) => ({ ...p, order: i }));
  write({ ...read(), portfolio: next });
}

export function addPortfolioPhoto(input: { url: string; alt: string }): void {
  const draft = read();
  const id = `user-${Date.now()}`;
  const photo: PortfolioPhoto = {
    id,
    url: input.url,
    alt: input.alt,
    order: draft.portfolio.length,
  };
  write({ ...draft, portfolio: [...draft.portfolio, photo] });
}

export function removePortfolioPhoto(id: string): void {
  const draft = read();
  setPortfolio(draft.portfolio.filter((p) => p.id !== id));
}

export function movePortfolioPhoto(id: string, direction: "up" | "down"): void {
  const draft = read();
  const idx = draft.portfolio.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= draft.portfolio.length) return;
  const next = [...draft.portfolio];
  [next[idx], next[target]] = [next[target], next[idx]];
  setPortfolio(next);
}
