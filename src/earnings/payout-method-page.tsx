import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useDevState } from "@/dev-state/dev-state-context";
import {
  EARNINGS_NAVY,
  EARNINGS_UI,
  EarningsCard,
  EarningsCardEyebrow,
  EarningsSubShell,
} from "./earnings-shell";
import { payoutsForDensity } from "@/data/mock-payouts";
import { formatMoney } from "@/data/mock-earnings";
import { recentPayoutsForAccount } from "./earnings-aggregates";

const NAVY = EARNINGS_NAVY;
const UI = EARNINGS_UI;
const ORANGE = "#FF823F";

/**
 * Payout Method — banking surface. Shows the connected bank account, payout
 * cadence, and verification state. Tone is private-banking calm: no warnings
 * unless something actually needs attention. "Change account" opens a sheet
 * placeholder; in production this would step through Stripe Connect.
 *
 * Driven by dev-state `payoutState`:
 *   - none           → no connected account, primary CTA is "Connect bank"
 *   - active / auto  → verified Chase account, normal surface
 *   - pending        → bank shown with "Pending" pill + verification banner
 *   - failed-recent  → verified bank + retry banner referencing the bounce
 */
export function PayoutMethodPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const { state: dev } = useDevState();
  const payoutState = dev.payoutState;
  const density = dev.dataDensity === "empty" ? "none" : dev.dataDensity === "sparse" ? "sparse" : "rich";
  const payouts = useMemo(() => payoutsForDensity(density), [density]);
  const recent = useMemo(() => recentPayoutsForAccount(payouts, "4821", 3), [payouts]);

  if (payoutState === "none") {
    return <NoMethodState onConnect={() => setSheetOpen(true)} sheetOpen={sheetOpen} onClose={() => setSheetOpen(false)} />;
  }

  return (
    <EarningsSubShell title="Payout method">
      {payoutState === "failed-recent" ? (
        <Banner
          tone="warning"
          title="Last payout failed"
          body="Bank verification expired before the last deposit landed. Retry to resume payouts."
          ctaLabel="Retry payout"
          onCta={() => setSheetOpen(true)}
        />
      ) : null}
      {payoutState === "pending" ? (
        <Banner
          tone="info"
          title="Verifying your account"
          body="Two small deposits will arrive in 1–2 business days. Confirm them to activate payouts."
        />
      ) : null}

      <EarningsCard>
        <div style={{ padding: 18, fontFamily: UI }}>
          <EarningsCardEyebrow>Connected account</EarningsCardEyebrow>
          <div className="mt-2 flex items-center gap-3">
            <BankGlyph />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>Chase</div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 13,
                  color: NAVY,
                  opacity: 0.6,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                Checking ••4821
              </div>
            </div>
            <StatusPill kind={payoutState === "pending" ? "pending" : payoutState === "failed-recent" ? "attention" : "verified"} />
          </div>
        </div>
      </EarningsCard>

      <EarningsCard>
        <div style={{ padding: 16, fontFamily: UI }}>
          <EarningsCardEyebrow>Schedule</EarningsCardEyebrow>
          <Row label="Cadence" value="Weekly" />
          <Row label="Payout day" value="Friday" />
          <Row label="Next payout" value="This Friday" />
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: NAVY,
              opacity: 0.55,
              lineHeight: 1.55,
            }}
          >
            Payouts include all completed bookings from the prior week. Tips and adjustments roll
            into the same deposit.
          </div>
        </div>
      </EarningsCard>

      {recent.length > 0 ? (
        <EarningsCard>
          <div style={{ padding: "16px 16px 4px", fontFamily: UI }}>
            <div className="flex items-baseline justify-between">
              <EarningsCardEyebrow>Recent to this account</EarningsCardEyebrow>
              <Link
                to="/earnings/payouts"
                style={{
                  fontFamily: UI,
                  fontSize: 12,
                  fontWeight: 600,
                  color: NAVY,
                  opacity: 0.6,
                  textDecoration: "none",
                }}
              >
                See all →
              </Link>
            </div>
          </div>
          <div className="flex flex-col">
            {recent.map((p, i) => (
              <Link
                key={p.id}
                to="/earnings/payouts/$id"
                params={{ id: p.id }}
                className="flex items-center justify-between transition-colors active:bg-black/[0.03]"
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid rgba(6,28,39,0.06)",
                  fontFamily: UI,
                  textDecoration: "none",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: p.status === "failed" ? "#B91C1C" : "#15803D",
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, color: NAVY }}>
                    {p.expectedArrival}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontVariantNumeric: "tabular-nums" }}>
                  {formatMoney(p.amount)}
                </span>
              </Link>
            ))}
          </div>
        </EarningsCard>
      ) : null}

      <EarningsCard>
        <Link
          to="/earnings/tax-documents"
          className="flex items-center justify-between transition-colors active:bg-black/[0.03]"
          style={{
            padding: "14px 16px",
            fontFamily: UI,
            textDecoration: "none",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>Tax info</div>
            <div style={{ marginTop: 2, fontSize: 12, color: NAVY, opacity: 0.6 }}>
              View 1099-K and annual reports
            </div>
          </div>
          <span style={{ opacity: 0.4, fontSize: 16, color: NAVY }}>→</span>
        </Link>
      </EarningsCard>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="mt-1 transition-opacity active:opacity-60"
        style={{
          fontFamily: UI,
          fontSize: 15,
          fontWeight: 600,
          color: NAVY,
          backgroundColor: "#FF823F",
          padding: "14px 0",
          borderRadius: 12,
          width: "100%",
        }}
      >
        Change account
      </button>

      <button
        type="button"
        onClick={() => setPauseOpen(true)}
        className="transition-opacity active:opacity-60"
        style={{
          fontFamily: UI,
          fontSize: 14,
          fontWeight: 500,
          color: NAVY,
          opacity: 0.7,
          padding: "10px 0",
        }}
      >
        Pause payouts
      </button>

      {sheetOpen ? <Sheet onClose={() => setSheetOpen(false)} /> : null}
      {pauseOpen ? <PauseSheet onClose={() => setPauseOpen(false)} /> : null}
    </EarningsSubShell>
  );
}

function NoMethodState({
  onConnect,
  sheetOpen,
  onClose,
}: {
  onConnect: () => void;
  sheetOpen: boolean;
  onClose: () => void;
}) {
  return (
    <EarningsSubShell title="Payout method">
      <EarningsCard>
        <div style={{ padding: 22, fontFamily: UI, textAlign: "center" }}>
          <BankGlyph />
          <div style={{ marginTop: 14, fontSize: 16, fontWeight: 600, color: NAVY }}>
            No bank connected
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: NAVY,
              opacity: 0.7,
              lineHeight: 1.55,
              maxWidth: 280,
              margin: "6px auto 0",
            }}
          >
            Connect a checking account to receive your weekly payouts. Verification takes about a
            minute.
          </div>
        </div>
      </EarningsCard>
      <button
        type="button"
        onClick={onConnect}
        className="mt-1 transition-opacity active:opacity-60"
        style={{
          fontFamily: UI,
          fontSize: 15,
          fontWeight: 600,
          color: NAVY,
          backgroundColor: ORANGE,
          padding: "14px 0",
          borderRadius: 12,
          width: "100%",
        }}
      >
        Connect bank
      </button>
      {sheetOpen ? <Sheet onClose={onClose} /> : null}
    </EarningsSubShell>
  );
}

function Banner({
  tone,
  title,
  body,
  ctaLabel,
  onCta,
}: {
  tone: "warning" | "info";
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  const palette =
    tone === "warning"
      ? { bg: "rgba(220,38,38,0.08)", fg: "#991B1B", accent: "#B91C1C" }
      : { bg: "rgba(255,130,63,0.10)", fg: "#7A3A12", accent: ORANGE };
  return (
    <div
      style={{
        backgroundColor: palette.bg,
        borderRadius: 12,
        padding: 14,
        fontFamily: UI,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: palette.fg }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 12.5, color: palette.fg, opacity: 0.85, lineHeight: 1.5 }}>
        {body}
      </div>
      {ctaLabel ? (
        <button
          type="button"
          onClick={onCta}
          className="mt-2 transition-opacity active:opacity-70"
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: palette.accent,
          }}
        >
          {ctaLabel} →
        </button>
      ) : null}
    </div>
  );
}

function StatusPill({ kind }: { kind: "verified" | "pending" | "attention" }) {
  const palette = {
    verified: { bg: "rgba(22,163,74,0.12)", fg: "#15803D", label: "Verified" },
    pending: { bg: "rgba(255,130,63,0.14)", fg: "#B8531C", label: "Pending" },
    attention: { bg: "rgba(220,38,38,0.10)", fg: "#B91C1C", label: "Attention" },
  }[kind];
  return (
    <span
      style={{
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 999,
        backgroundColor: palette.bg,
        color: palette.fg,
      }}
    >
      {palette.label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="mt-2 flex items-baseline justify-between"
      style={{ fontSize: 13, color: NAVY, fontFamily: UI }}
    >
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function VerifiedPill() {
  return (
    <span
      style={{
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 999,
        backgroundColor: "rgba(22,163,74,0.12)",
        color: "#15803D",
      }}
    >
      Verified
    </span>
  );
}

function PauseSheet({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(6,28,39,0.45)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: "20px 20px 28px",
          width: "100%",
          fontFamily: UI,
          color: NAVY,
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(6,28,39,0.15)",
            margin: "0 auto 16px",
          }}
        />
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Pause payouts?
        </div>
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7, lineHeight: 1.55 }}>
          New earnings will keep accumulating, but no money will move to your bank until you resume.
          You can resume any time — earnings paid in the meantime will roll into the next payout.
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 transition-opacity active:opacity-60"
          style={{
            width: "100%",
            backgroundColor: "rgba(6,28,39,0.05)",
            color: NAVY,
            fontWeight: 600,
            fontSize: 15,
            padding: "13px 0",
            borderRadius: 12,
          }}
        >
          Pause payouts
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 transition-opacity active:opacity-60"
          style={{
            width: "100%",
            color: NAVY,
            opacity: 0.7,
            fontSize: 14,
            padding: "10px 0",
          }}
        >
          Keep payouts active
        </button>
      </div>
    </div>
  );
}

function BankGlyph() {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "rgba(6,28,39,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: NAVY,
        flexShrink: 0,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l9-6 9 6" />
        <path d="M5 10v8" />
        <path d="M12 10v8" />
        <path d="M19 10v8" />
        <path d="M3 20h18" />
      </svg>
    </div>
  );
}

function Sheet({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(6,28,39,0.45)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: "20px 20px 28px",
          width: "100%",
          fontFamily: UI,
          color: NAVY,
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(6,28,39,0.15)",
            margin: "0 auto 16px",
          }}
        />
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Change payout account
        </div>
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7, lineHeight: 1.55 }}>
          You'll re-verify with your bank in a secure flow. Your current account stays active until
          the new one is verified — payouts won't pause.
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 transition-opacity active:opacity-60"
          style={{
            width: "100%",
            backgroundColor: "#FF823F",
            color: NAVY,
            fontWeight: 600,
            fontSize: 15,
            padding: "13px 0",
            borderRadius: 12,
          }}
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 transition-opacity active:opacity-60"
          style={{
            width: "100%",
            color: NAVY,
            opacity: 0.7,
            fontSize: 14,
            padding: "10px 0",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}