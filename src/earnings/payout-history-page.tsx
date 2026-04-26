import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PAYOUT_STATUS_LABEL, payoutsForDensity, type Payout, type PayoutStatus } from "@/data/mock-payouts";
import { formatMoney } from "@/data/mock-earnings";
import { useDevState } from "@/dev-state/dev-state-context";
import {
  EARNINGS_NAVY,
  EARNINGS_UI,
  EarningsCard,
  EarningsCardEyebrow,
  EarningsSubShell,
} from "./earnings-shell";

const NAVY = EARNINGS_NAVY;
const UI = EARNINGS_UI;

function densityFromDev(d: ReturnType<typeof useDevState>["state"]["dataDensity"]) {
  if (d === "empty") return "none" as const;
  if (d === "sparse") return "sparse" as const;
  return "rich" as const;
}

export function PayoutHistoryPage() {
  const { state: dev } = useDevState();
  const payouts = useMemo(() => payoutsForDensity(densityFromDev(dev.dataDensity)), [dev.dataDensity]);
  return (
    <EarningsSubShell title="Payout history">
      {payouts.length === 0 ? (
        <EmptyState />
      ) : (
        <EarningsCard>
          <div className="flex flex-col">
            {payouts.map((p, i) => (
              <PayoutRow key={p.id} payout={p} divider={i < payouts.length - 1} />
            ))}
          </div>
        </EarningsCard>
      )}
    </EarningsSubShell>
  );
}

function PayoutRow({ payout, divider }: { payout: Payout; divider: boolean }) {
  const navigate = useNavigate();
  const dateLabel = formatPayoutDate(payout.date);
  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/earnings/payouts/$id", params: { id: payout.id } })}
      className="flex items-center justify-between transition-colors active:bg-black/[0.03]"
      style={{
        padding: "14px 16px",
        borderBottom: divider ? "1px solid rgba(6,28,39,0.08)" : "none",
        fontFamily: UI,
        textAlign: "left",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14, fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
            {dateLabel}
          </span>
          <StatusPill status={payout.status} />
        </div>
        <div
          style={{
            marginTop: 3,
            fontSize: 12,
            color: NAVY,
            opacity: 0.6,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {payout.bankName} · ••{payout.bankLast4}
        </div>
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: NAVY,
          fontVariantNumeric: "tabular-nums",
          marginLeft: 12,
        }}
      >
        {formatMoney(payout.amount)}
      </div>
    </button>
  );
}

export function StatusPill({ status }: { status: PayoutStatus }) {
  const palette: Record<PayoutStatus, { bg: string; fg: string }> = {
    paid: { bg: "rgba(22,163,74,0.12)", fg: "#15803D" },
    "in-transit": { bg: "rgba(255,130,63,0.14)", fg: "#B8531C" },
    failed: { bg: "rgba(220,38,38,0.10)", fg: "#B91C1C" },
  };
  const c = palette[status];
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
        backgroundColor: c.bg,
        color: c.fg,
      }}
    >
      {PAYOUT_STATUS_LABEL[status]}
    </span>
  );
}

function formatPayoutDate(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const base = `${months[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base}, ${d.getFullYear()}`;
}

function EmptyState() {
  return (
    <EarningsCard>
      <div style={{ padding: "44px 16px", textAlign: "center", fontFamily: UI }}>
        <EarningsCardEyebrow>No payouts yet</EarningsCardEyebrow>
        <div style={{ marginTop: 8, fontSize: 14, color: NAVY, opacity: 0.7 }}>
          Once your first booking pays out, it'll appear here.
        </div>
      </div>
    </EarningsCard>
  );
}