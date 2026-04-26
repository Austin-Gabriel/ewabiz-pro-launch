import type { useAuth } from "@/auth/auth-context";
import type { useKyc } from "@/onboarding-states/kyc/kyc-context";
import type {
  DevPendingBalance,
  DevProState,
} from "@/dev-state/dev-state-context";

/**
 * Upstream PRO STATE resolver for Earnings surfaces. Mirrors home.tsx's
 * resolveState so Earnings reflects the same gate decisions: a pro who
 * isn't approved sees a locked surface; a pending pro sees a quiet
 * "waiting on approval" empty state. Only when LIVE do the Earnings
 * sub-axes (payout state, pending balance, tax docs) apply.
 */
export type ResolvedProState = "mid-onboarding" | "mid-pending" | "live";

export function resolveProState(
  dev: DevProState,
  auth: ReturnType<typeof useAuth>,
  kyc: ReturnType<typeof useKyc>["data"],
): ResolvedProState {
  if (dev === "mid-onboarding") return "mid-onboarding";
  if (dev === "mid-pending") return "mid-pending";
  if (dev === "live") return "live";
  // auto: derive from real auth + kyc
  if (kyc.status === "pending") return "mid-pending";
  if (auth.state !== "active" || kyc.status !== "approved") return "mid-onboarding";
  return "live";
}

/**
 * Map the dev "pending balance" axis to a fixed dollar override. Returning
 * null means "use the computed value from mock earnings".
 */
export function pendingBalanceOverride(p: DevPendingBalance): number | null {
  switch (p) {
    case "auto":
      return null;
    case "zero":
      return 0;
    case "small":
      return 142; // mid of $50–200
    case "large":
      return 1248;
  }
}