import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HomeShell } from "@/components/home/home-shell";
import { BottomTabs, type TabKey } from "@/components/home/bottom-tabs";
import { StateMidOnboarding } from "@/components/home/state-mid-onboarding";
import { StatePending } from "@/components/home/state-pending";
import { StateLive } from "@/components/home/state-live";
import {
  LIVE_FIRST_TIME,
  LIVE_QUIET_DAY,
  LIVE_ACTIVE_DAY,
  INCOMING_REQUEST_EXAMPLE,
} from "@/components/home/mock-data";
import type { LiveStatus } from "@/components/home/mock-data";
import { useAuth } from "@/lib/auth-context";
import { useKyc } from "@/lib/kyc-context";
import { useOnboarding, TOTAL_STEPS } from "@/lib/onboarding-context";
import { RequireAuth } from "@/components/require-auth";

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
type LivePreview = "default" | "in-progress" | "en-route" | "incoming";

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
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  // Resolve which surface to render
  const resolved = resolveState({ forcedState, auth, kyc, onboarding });

  const isHardGate = resolved.kind === "mid-onboarding" || resolved.kind === "pending";

  // Derive live-state overrides from the ?live= query param so designers can
  // preview In Progress / En Route / Incoming Request screens.
  const liveStatus: LiveStatus | undefined =
    livePreview === "in-progress"
      ? { kind: "in-progress", elapsedMin: 24 }
      : livePreview === "en-route"
        ? { kind: "en-route", etaMin: 12 }
        : undefined;
  const incomingRequest = livePreview === "incoming" ? INCOMING_REQUEST_EXAMPLE : undefined;

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
          {...LIVE_FIRST_TIME}
          greetingName={firstNameOf(auth.displayName, onboarding.firstName, LIVE_FIRST_TIME.greetingName)}
          liveStatus={liveStatus ?? LIVE_FIRST_TIME.liveStatus}
          incomingRequest={incomingRequest}
        />
      ) : null}
      {resolved.kind === "live-quiet" ? (
        <StateLive
          {...LIVE_QUIET_DAY}
          greetingName={firstNameOf(auth.displayName, onboarding.firstName, LIVE_QUIET_DAY.greetingName)}
          liveStatus={liveStatus ?? LIVE_QUIET_DAY.liveStatus}
          incomingRequest={incomingRequest}
        />
      ) : null}
      {resolved.kind === "live-active" ? (
        <StateLive
          {...LIVE_ACTIVE_DAY}
          greetingName={firstNameOf(auth.displayName, onboarding.firstName, LIVE_ACTIVE_DAY.greetingName)}
          liveStatus={liveStatus ?? LIVE_ACTIVE_DAY.liveStatus}
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