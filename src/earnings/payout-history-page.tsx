import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PAYOUT_STATUS_LABEL, payoutsForDensity, type Payout, type PayoutStatus } from "@/data/mock-payouts";
import { formatMoney } from "@/data/mock-earnings";
import { useDevState } from "@/dev-state/dev-state-context";
import { useHomeTheme } from "@/home/home-shell";
import {
  EARNINGS_NAVY,
  EARNINGS_UI,
  EarningsCard,
  EarningsCardEyebrow,
  EarningsSubShell,
} from "./earnings-shell";
import { groupPayoutsByMonth, payoutYearSummary } from "./earnings-aggregates";
import { downloadCsv } from "./csv-export";

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
  const summary = useMemo(() => payoutYearSummary(payouts), [payouts]);
  const groups = useMemo(
    () => groupPayoutsByMonth(payouts.filter((p) => p.status !== "in-transit")),
    [payouts],
  );
  const inTransit = payouts.filter((p) => p.status === "in-transit");

  return (
    <EarningsSubShell title="Payout history">
      {payouts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <SummaryCard summary={summary} />
          {inTransit.length > 0 ? (
            <EarningsCard>
              <div className="flex flex-col">
                {inTransit.map((p, i) => (
                  <PayoutRow key={p.id} payout={p} divider={i < inTransit.length - 1} />
                ))}
              </div>
            </EarningsCard>
          ) : null}
          {groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-2">
              <MonthHeader group={g} />
              <EarningsCard>
                <div className="flex flex-col">
                  {g.payouts.map((p, i) => (
                    <PayoutRow key={p.id} payout={p} divider={i < g.payouts.length - 1} />
                  ))}
                </div>
              </EarningsCard>
            </div>
          ))}
          <ExportButton payouts={payouts} />
        </>
      )}
    </EarningsSubShell>
  );
}

function SummaryCard({ summary }: { summary: ReturnType<typeof payoutYearSummary> }) {
  return (
    <EarningsCard>
      <div style={{ padding: 16, fontFamily: UI }}>
        <EarningsCardEyebrow>Paid this year</EarningsCardEyebrow>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              color: NAVY,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {formatMoney(summary.paidThisYear)}
          </div>
          <Sparkline values={summary.recentBars} />
        </div>
        <div
          className="mt-3 grid grid-cols-2 gap-2"
          style={{ fontSize: 12, color: NAVY, fontFamily: UI }}
        >
          <SummaryStat label="Avg payout" value={formatMoney(summary.averagePayout)} />
          <SummaryStat
            label="Most recent"
            value={
              summary.mostRecentAmount !== null
                ? formatMoney(summary.mostRecentAmount)
                : "—"
            }
            sub={summary.mostRecentLabel ?? undefined}
          />
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: NAVY,
            opacity: 0.55,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {summary.paidBookingCount} {summary.paidBookingCount === 1 ? "booking" : "bookings"} paid out
        </div>
      </div>
    </EarningsCard>
  );
}

function SummaryStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        backgroundColor: "rgba(6,28,39,0.04)",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.55, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ marginTop: 2, fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub ? (
        <div style={{ marginTop: 1, fontSize: 11, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-0.5" style={{ height: 28 }}>
      {values.map((v, i) => {
        const h = Math.max(3, Math.round((v / max) * 28));
        return (
          <span
            key={i}
            aria-hidden
            style={{
              display: "inline-block",
              width: 4,
              height: h,
              borderRadius: 1,
              backgroundColor: NAVY,
              opacity: 0.65,
            }}
          />
        );
      })}
    </div>
  );
}

function MonthHeader({ group }: { group: { shortLabel: string; total: number; payouts: Payout[] } }) {
  // Sits on the page bg (not inside a white card), so use theme text — NAVY
  // would vanish on dark mode's navy page bg.
  const { text } = useHomeTheme();
  return (
    <div
      className="flex items-baseline justify-between px-1"
      style={{ fontFamily: UI, fontSize: 12, color: text }}
    >
      <span style={{ fontWeight: 700, opacity: 0.7, letterSpacing: "0.02em" }}>
        {group.shortLabel}
      </span>
      <span
        style={{
          fontVariantNumeric: "tabular-nums",
          opacity: 0.6,
          textAlign: "right",
          display: "flex",
          flexDirection: "column",
          lineHeight: 1.3,
        }}
      >
        <span>{formatMoney(group.total)}</span>
        <span style={{ fontSize: 11, opacity: 0.85 }}>
          {group.payouts.length} {group.payouts.length === 1 ? "payout" : "payouts"}
        </span>
      </span>
    </div>
  );
}

function ExportButton({ payouts }: { payouts: Payout[] }) {
  // Sits on the page bg, outlined button. Both color and border-tint must
  // come from the theme so the button reads on cream and on navy.
  const { text, borderCol } = useHomeTheme();
  const handleExport = () => {
    const rows: (string | number)[][] = [
      ["Date", "Status", "Amount (USD)", "Bank", "Bookings included"],
      ...payouts.map((p) => [
        p.date.toISOString().slice(0, 10),
        PAYOUT_STATUS_LABEL[p.status],
        p.amount,
        `${p.bankName} ••${p.bankLast4}`,
        p.includedEarningIds.length,
      ]),
    ];
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`Ewa-payouts-${stamp}.csv`, rows);
  };
  return (
    <button
      type="button"
      onClick={handleExport}
      className="mx-auto mt-2 transition-opacity active:opacity-50"
      style={{
        fontFamily: UI,
        fontSize: 13,
        fontWeight: 600,
        color: text,
        opacity: 0.85,
        padding: "10px 14px",
        border: `1px solid ${borderCol}`,
        borderRadius: 10,
        backgroundColor: "transparent",
      }}
    >
      Export CSV
    </button>
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
          {payout.bankName} ••{payout.bankLast4}
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