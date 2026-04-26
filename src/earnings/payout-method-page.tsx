import { useState } from "react";
import {
  EARNINGS_NAVY,
  EARNINGS_UI,
  EarningsCard,
  EarningsCardEyebrow,
  EarningsSubShell,
} from "./earnings-shell";

const NAVY = EARNINGS_NAVY;
const UI = EARNINGS_UI;

/**
 * Payout Method — banking surface. Shows the connected bank account, payout
 * cadence, and verification state. Tone is private-banking calm: no warnings
 * unless something actually needs attention. "Change account" opens a sheet
 * placeholder; in production this would step through Stripe Connect.
 */
export function PayoutMethodPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <EarningsSubShell title="Payout method">
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
            <VerifiedPill />
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
    </EarningsSubShell>
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