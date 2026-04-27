import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HomeShell } from "@/home/home-shell";
import { BottomTabs, type TabKey } from "@/home/bottom-tabs";
import { StateMidOnboarding } from "@/home/state-mid-onboarding";
import { StatePending } from "@/home/state-pending";
import { StateHome } from "@/home/state-home";
import {
  LIVE_FIRST_TIME,
  LIVE_QUIET_DAY,
  LIVE_ACTIVE_DAY,
  LIVE_DAY_MORNING,
  LIVE_DAY_HEADS_UP,
  LIVE_DAY_IN_PROGRESS,
  LIVE_DAY_WRAP_UP,
  DAY_NONE,
  DAY_ONE,
  DAY_MULTIPLE,
  DAY_FULL,
} from "@/data/mock-data";
import { useAuth } from "@/auth/auth-context";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";
import { useOnboarding, TOTAL_STEPS } from "@/onboarding/onboarding-context";
import {
  useDevState,
  type DevDataDensity,
  type DevProState,
  type DevMode,
  type DevDayContext,
} from "@/dev-state/dev-state-context";
import { RequireAuth } from "@/auth/require-auth";
import { ProfileSheet } from "@/home/profile-sheet";
import { LifecycleSurface } from "@/bookings/lifecycle/lifecycle-surface";
import { ActiveBookingStrip } from "@/components/active-booking-strip";
import { useNavigate } from "@tanstack/react-router";

/**
 * Home is state-aware. The same URL renders one of three surfaces:
 *
 *   1. mid-onboarding — pro hasn't finished signup or KYC. Hard gate, no tabs.
 *   2. pending        — KYC submitted, waiting on verifier. Hard gate, no tabs.
 *   3. live           — verified. Tabs visible. Day density driven by Day Context.
 *
 * `?state=` query param overrides the auto-detected state for design preview.
 */

type PreviewState = "auto" | "mid-onboarding" | "pending" | "live";
type LivePreview =
  | "default"
  | "morning"
  | "heads-up"
  | "in-progress"
  | "en-route"
  | "wrap-up"
  | "incoming"
  | "on-demand";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — Ewà Biz" }] }),
  validateSearch: (search: Record<string, unknown>): { state?: PreviewState; live?: LivePreview } => {
    const s = search.state;
    const live = search.live;
    const out: { state?: PreviewState; live?: LivePreview } = {};
    if (s === "mid-onboarding" || s === "pending" || s === "live") {
      out.state = s;
    }
    if (live === "in-progress" || live === "en-route" || live === "incoming" || live === "on-demand") {
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
  const navigate = useNavigate();

  // Dev toggle wins over ?state= which wins over auto-detection.
  const devForced = mapDevProState(dev.proState);
  const resolved = resolveState({
    forcedState: devForced ?? forcedState,
    auth,
    kyc,
    onboarding,
  });

  const isHardGate = resolved.kind === "mid-onboarding" || resolved.kind === "pending";
  // Only the Incoming Request state takes over Home — it's a focused 60s
  // decision moment that must hide the tab bar. All other lifecycle states
  // live inside /bookings (In Progress tab), and Home stays a normal
  // dashboard. A persistent strip surfaces the active booking up top.
  const incomingTakeover = dev.lifecycle === "incoming";
  const otherLifecycleActive =
    dev.lifecycle !== "none" && dev.lifecycle !== "incoming";

  // Apply data-density override by remapping which mock dataset feeds Home.
  const liveData = pickLiveData(
    resolved.kind,
    dev.dataDensity,
    livePreview,
    dev.mode,
    dev.dayContext,
  );

  // Resolve the on-screen Mode. Dev "auto" defaults to offline (the working-day
  // surface). When dev forces online, we render the dispatch surface.
  const homeMode = dev.mode === "online" ? "online" : dev.mode === "offline" ? "offline" : "offline";
  // Pending requests count drives the bell badge. Hidden when online (no
  // scheduled-list pending in dispatch mode).
  const unreadCount =
    homeMode === "offline" ? (("pendingRequests" in liveData) ? (liveData as { pendingRequests: unknown[] }).pendingRequests.length : 0) : 0;

  return (
    <HomeShell noTabBarSpacing={isHardGate || incomingTakeover}>
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

      {!isHardGate && !incomingTakeover ? (
        <>
          <ActiveBookingStrip />
          <StateHome
            mode={homeMode}
            dayContext={dev.dayContext}
            bookingsToday={liveData.bookingsToday ?? []}
            nextFutureBookingLabel={
              "nextFutureBookingLabel" in liveData
                ? (liveData as { nextFutureBookingLabel?: string }).nextFutureBookingLabel
                : undefined
            }
            todayEarningsUsd={liveData.todayEarningsUsd ?? 0}
            weekToDateUsd={liveData.weekToDateUsd ?? 0}
            weekProjectedUsd={liveData.weekProjectedUsd}
            weekGoalUsd={"weekGoalUsd" in liveData ? (liveData as { weekGoalUsd?: number }).weekGoalUsd : undefined}
            unreadCount={unreadCount}
          />
        </>
      ) : null}

      {!isHardGate && !incomingTakeover ? (
        <BottomTabs
          active={activeTab}
          onSelect={(k) => {
            if (k === "bookings") {
              navigate({
                to: "/bookings",
                search: otherLifecycleActive ? { tab: "in-progress" } : { tab: "upcoming" },
              });
              return;
            }
            if (k === "calendar") {
              navigate({ to: "/calendar" });
              return;
            }
            if (k === "earnings") {
              navigate({ to: "/earnings" });
              return;
            }
            setActiveTab(k);
          }}
          badge={
            resolved.kind === "live" && dev.dayContext === "full"
              ? { tab: "calendar", count: 2 }
              : resolved.kind === "live" && (dev.dayContext === "multiple" || dev.dayContext === "one")
                ? { tab: "calendar", count: 1 }
                : undefined
          }
        />
      ) : null}
      <ProfileSheet
        open={!isHardGate && !incomingTakeover && activeTab === "profile"}
        onClose={() => setActiveTab("home")}
      />

      {incomingTakeover ? <LifecycleSurface /> : null}
    </HomeShell>
  );
}

/* ---------------- Resolution ---------------- */

type Resolved =
  | { kind: "mid-onboarding"; resumeStep: number; resumeTo: "onboarding" | "kyc" }
  | { kind: "pending" }
  | { kind: "live" };

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
    if (forcedState === "live") return { kind: "live" };
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

  return { kind: "live" };
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
    case "mid-onboarding":
      return "mid-onboarding";
    case "mid-pending":
      return "pending";
    case "live":
      return "live";
  }
}

/**
 * Pick which mock dataset feeds Home. Day Context and the ?live= preview
 * take priority; Data Density falls back to a sensible default.
 */
function pickLiveData(
  kind: "mid-onboarding" | "pending" | "live",
  density: DevDataDensity,
  livePreview?: LivePreview,
  mode: DevMode = "auto",
  dayContext: DevDayContext = "auto",
) {
  void kind;
  // Day Context drives offline density when explicitly set.
  if (mode !== "online") {
    if (dayContext === "none") return DAY_NONE;
    if (dayContext === "one") return DAY_ONE;
    if (dayContext === "multiple") return DAY_MULTIPLE;
    if (dayContext === "full") return DAY_FULL;
  }

  // When previewing a specific time-of-day live state, pin to its dataset.
  if (livePreview === "morning") return LIVE_DAY_MORNING;
  if (livePreview === "heads-up") return LIVE_DAY_HEADS_UP;
  if (livePreview === "in-progress") return LIVE_DAY_IN_PROGRESS;
  if (livePreview === "wrap-up") return LIVE_DAY_WRAP_UP;

  if (density === "empty") return LIVE_FIRST_TIME;
  if (density === "sparse") return LIVE_QUIET_DAY;
  if (density === "rich") return LIVE_ACTIVE_DAY;
  return LIVE_ACTIVE_DAY; // auto default
}
