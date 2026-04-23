import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HomeShell } from "@/home/home-shell";
import { BottomTabs, type TabKey } from "@/home/bottom-tabs";
import { StateMidOnboarding } from "@/home/state-mid-onboarding";
import { StatePending } from "@/home/state-pending";
import { StateLive } from "@/home/state-live";
import {
  LIVE_FIRST_TIME,
  LIVE_QUIET_DAY,
  LIVE_ACTIVE_DAY,
  LIVE_DAY_MORNING,
  LIVE_DAY_HEADS_UP,
  LIVE_DAY_IN_PROGRESS,
  LIVE_DAY_WRAP_UP,
  INCOMING_REQUEST_EXAMPLE,
} from "@/data/mock-data";
import type { LiveStatus } from "@/data/mock-data";
import { useAuth } from "@/auth/auth-context";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";
import { useOnboarding, TOTAL_STEPS } from "@/onboarding/onboarding-context";
import { useDevState, type DevDataDensity, type DevProState } from "@/dev-state/dev-state-context";
import { RequireAuth } from "@/auth/require-auth";
import { ProfileSheet } from "@/home/profile-sheet";

/**
 * Home is state-aware. The same URL renders one of five surfaces:
 *
 *   1. mid-onboarding — pro hasn't finished signup or KYC. Hard gate, no tabs.
 *   2. pending        — KYC submitted, waiting on verifier. Hard gate, no tabs.
 *   3. live-first     — verified, no bookings yet. Tabs visible.
 *   4. live-quiet     — verified, no bookings today, some pending requests.
 *   5. live-active    — verified, full day, multiple requests.
 *
 * `?state=` query param overrides the auto-detected state for design preview.
 */

type PreviewState = "auto" | "mid-onboarding" | "pending" | "live-first" | "live-quiet" | "live-active";
type LivePreview =
  | "default"
  | "morning"
  | "heads-up"
  | "in-progress"
  | "en-route"
  | "wrap-up"
  | "incoming";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — Ewà Biz" }] }),
  validateSearch: (search: Record<string, unknown>): { state?: PreviewState; live?: LivePreview } => {
    const s = search.state;
    const live = search.live;
    const out: { state?: PreviewState; live?: LivePreview } = {};
    if (
      s === "mid-onboarding" ||
      s === "pending" ||
      s === "live-first" ||
      s === "live-quiet" ||
      s === "live-active"
    ) {
      out.state = s;
    }
    if (live === "in-progress" || live === "en-route" || live === "incoming") {
      out.live = live;
    }
    if (live === "morning" || live === "heads-up" || live === "wrap-up") {
      out.live = live;
    }
    return out;
  },
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <RequireAuth>
      <HomePage />
    </RequireAuth>
  );
}

function HomePage() {
  const { state: forcedState, live: livePreview } = Route.useSearch();
  const auth = useAuth();
  const { data: kyc } = useKyc();
  const { data: onboarding } = useOnboarding();
  const { state: dev } = useDevState();
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  // Dev toggle wins over ?state= which wins over auto-detection.
  const devForced = mapDevProState(dev.proState);
  const resolved = resolveState({
    forcedState: devForced ?? forcedState,
    auth,
    kyc,
    onboarding,
  });

  const isHardGate = resolved.kind === "mid-onboarding" || resolved.kind === "pending";

  // Derive live-state overrides from the ?live= query param so designers can
  // preview In Progress / En Route / Incoming Request screens.
  const liveStatus: LiveStatus | undefined =
    livePreview === "in-progress"
      ? { kind: "in-progress", elapsedMin: 24 }
      : livePreview === "en-route"
        ? { kind: "en-route", etaMin: 12 }
        : livePreview === "heads-up"
          ? { kind: "heads-up", leaveInMin: 5 }
          : livePreview === "morning"
            ? { kind: "morning" }
            : livePreview === "wrap-up"
              ? { kind: "wrap-up", completedCount: 3, completedTotalUsd: 515 }
              : undefined;
  const incomingRequest = livePreview === "incoming" ? INCOMING_REQUEST_EXAMPLE : undefined;

  // Apply data-density override by remapping which mock dataset feeds StateLive.
  const liveData = pickLiveData(resolved.kind, dev.dataDensity, livePreview);

  return (
    <HomeShell noTabBarSpacing={isHardGate}>
      {resolved.kind === "mid-onboarding" ? (
        <StateMidOnboarding
          firstName={firstNameOf(auth.displayName, onboarding.firstName)}
          resumeStep={resolved.resumeStep}
          totalSteps={TOTAL_STEPS}
          resumeTo={resolved.resumeTo}
        />
      ) : null}

      {resolved.kind === "pending" ? (
        <StatePending
          firstName={firstNameOf(auth.displayName, onboarding.firstName)}
          submittedAtIso={kyc.submittedAt}
        />
      ) : null}

      {resolved.kind === "live-first" ? (
        <StateLive
          {...liveData}
          greetingName={firstNameOf(auth.displayName, onboarding.firstName, liveData.greetingName)}
          liveStatus={liveStatus ?? liveData.liveStatus}
          incomingRequest={incomingRequest}
        />
      ) : null}
      {resolved.kind === "live-quiet" ? (
        <StateLive
          {...liveData}
          greetingName={firstNameOf(auth.displayName, onboarding.firstName, liveData.greetingName)}
          liveStatus={liveStatus ?? liveData.liveStatus}
          incomingRequest={incomingRequest}
        />
      ) : null}
      {resolved.kind === "live-active" ? (
        <StateLive
          {...liveData}
          greetingName={firstNameOf(auth.displayName, onboarding.firstName, liveData.greetingName)}
          liveStatus={liveStatus ?? liveData.liveStatus}
          incomingRequest={incomingRequest}
        />
      ) : null}

      {!isHardGate ? (
        <BottomTabs
          active={activeTab}
          onSelect={setActiveTab}
          badge={resolved.kind === "live-active" ? { tab: "calendar", count: 2 } : resolved.kind === "live-quiet" ? { tab: "calendar", count: 1 } : undefined}
        />
      ) : null}
      <ProfileSheet
        open={!isHardGate && activeTab === "profile"}
        onClose={() => setActiveTab("home")}
      />
    </HomeShell>
  );
}

/* ---------------- Resolution ---------------- */

type Resolved =
  | { kind: "mid-onboarding"; resumeStep: number; resumeTo: "onboarding" | "kyc" }
  | { kind: "pending" }
  | { kind: "live-first" }
  | { kind: "live-quiet" }
  | { kind: "live-active" };

function resolveState({
  forcedState,
  auth,
  kyc,
  onboarding,
}: {
  forcedState?: PreviewState;
  auth: ReturnType<typeof useAuth>;
  kyc: ReturnType<typeof useKyc>["data"];
  onboarding: ReturnType<typeof useOnboarding>["data"];
}): Resolved {
  if (forcedState && forcedState !== "auto") {
    if (forcedState === "mid-onboarding") {
      return { kind: "mid-onboarding", resumeStep: onboarding.furthestStep ?? 4, resumeTo: "onboarding" };
    }
    if (forcedState === "pending") return { kind: "pending" };
    if (forcedState === "live-first") return { kind: "live-first" };
    if (forcedState === "live-quiet") return { kind: "live-quiet" };
    if (forcedState === "live-active") return { kind: "live-active" };
  }

  // Auto-detect from real state
  if (kyc.status === "pending") return { kind: "pending" };

  if (auth.state !== "active" || kyc.status !== "approved") {
    // Decide whether to send back to onboarding or KYC based on furthest progress
    const onboardingDone = (onboarding.furthestStep ?? 1) >= TOTAL_STEPS;
    return {
      kind: "mid-onboarding",
      resumeStep: onboardingDone ? TOTAL_STEPS : onboarding.furthestStep ?? 1,
      resumeTo: onboardingDone ? "kyc" : "onboarding",
    };
  }

  // Active + approved — pick the richest live preview by default
  return { kind: "live-active" };
}

function firstNameOf(...candidates: (string | undefined)[]): string {
  for (const c of candidates) {
    if (c && c.trim().length > 0) {
      return c.trim().split(/\s+/)[0];
    }
  }
  return "friend";
}

/**
 * Translate the dev "Pro state" radio into the existing PreviewState
 * vocabulary that resolveState() already understands.
 */
function mapDevProState(p: DevProState): PreviewState | undefined {
  switch (p) {
    case "auto":
      return undefined;
    case "new":
      // "No signup yet" surfaces the mid-onboarding gate at step 1.
      return "mid-onboarding";
    case "mid-onboarding":
      return "mid-onboarding";
    case "mid-pending":
      return "pending";
    case "live-first":
      return "live-first";
    case "live-quiet":
      return "live-quiet";
    case "live-active":
      return "live-active";
  }
}

/**
 * Pick which mock dataset feeds StateLive based on the dev data-density
 * override. "auto" keeps whichever dataset matches the resolved pro state.
 */
function pickLiveData(
  kind: "mid-onboarding" | "pending" | "live-first" | "live-quiet" | "live-active",
  density: DevDataDensity,
  livePreview?: LivePreview,
) {
  // When previewing a specific time-of-day live state, pin to its dataset.
  if (livePreview === "morning") return LIVE_DAY_MORNING;
  if (livePreview === "heads-up") return LIVE_DAY_HEADS_UP;
  if (livePreview === "in-progress") return LIVE_DAY_IN_PROGRESS;
  if (livePreview === "wrap-up") return LIVE_DAY_WRAP_UP;

  const base =
    kind === "live-active"
      ? LIVE_ACTIVE_DAY
      : kind === "live-quiet"
        ? LIVE_QUIET_DAY
        : LIVE_FIRST_TIME;

  if (density === "auto") return base;
  if (density === "empty") return LIVE_FIRST_TIME;
  if (density === "sparse") return LIVE_QUIET_DAY;
  return LIVE_ACTIVE_DAY; // rich
}