import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HomeShell, useHomeTheme, HOME_SANS, CardTheme } from "@/home/home-shell";

const UI = HOME_SANS;
const NAVY = "#061C27";

/**
 * Shared chrome for Earnings sub-surfaces (Recent Earnings, Payout History,
 * Payout Detail, Tax Documents, Payout Method). Keeps the industrial,
 * Stripe-flavored tone consistent: same back chevron, same title weight,
 * same content gutter, no bottom tab bar (drilled-in surface).
 */
export function EarningsSubShell({
  title,
  backTo,
  rightAction,
  children,
}: {
  title: string;
  /** Where the back chevron routes. Defaults to /earnings. */
  backTo?: string;
  rightAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <HomeShell noTabBarSpacing>
      <SubHeader title={title} backTo={backTo ?? "/earnings"} rightAction={rightAction} />
      <div className="flex flex-1 flex-col gap-3 px-4 pb-10 pt-1">{children}</div>
    </HomeShell>
  );
}

function SubHeader({ title, backTo, rightAction }: { title: string; backTo: string; rightAction?: ReactNode }) {
  const { text } = useHomeTheme();
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between px-2 pt-2" style={{ height: 52 }}>
      <button
        type="button"
        aria-label="Back"
        onClick={() => navigate({ to: backTo as "/earnings" })}
        className="flex items-center justify-center transition-opacity active:opacity-50"
        style={{ width: 44, height: 44, color: text }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h1
        style={{
          fontFamily: UI,
          fontSize: 16,
          fontWeight: 600,
          color: text,
          letterSpacing: "-0.005em",
        }}
      >
        {title}
      </h1>
      <div style={{ width: 44, display: "flex", justifyContent: "flex-end" }}>{rightAction}</div>
    </div>
  );
}

/* ---------- Card primitives shared across sub-surfaces ---------- */

export function EarningsCard({ children }: { children: ReactNode }) {
  return (
    <CardTheme>
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(6,28,39,0.10)",
          borderRadius: 16,
          boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </CardTheme>
  );
}

export function EarningsCardEyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: NAVY,
        opacity: 0.5,
      }}
    >
      {children}
    </div>
  );
}

export const EARNINGS_UI = UI;
export const EARNINGS_NAVY = NAVY;