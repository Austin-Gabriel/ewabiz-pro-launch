import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { earningsForPayout, findPayoutById } from "@/data/mock-payouts";
import { formatMoney, type EarningEvent } from "@/data/mock-earnings";
import { findBookingById } from "@/data/mock-bookings";
import {
  EARNINGS_NAVY,
  EARNINGS_UI,
  EarningsCard,
  EarningsCardEyebrow,
  EarningsSubShell,
} from "./earnings-shell";
import { StatusPill } from "./payout-history-page";

const NAVY = EARNINGS_NAVY;
const UI = EARNINGS_UI;

export function PayoutDetailPage({ payoutId }: { payoutId: string }) {
  const payout = findPayoutById(payoutId);
  if (!payout) {
    return (
      <EarningsSubShell title="Payout" backTo="/earnings/payouts">
        <EarningsCard>
          <div style={{ padding: 28, textAlign: "center", fontFamily: UI, color: NAVY }}>
            <EarningsCardEyebrow>Not found</EarningsCardEyebrow>
            <div style={{ marginTop: 8, fontSize: 14, opacity: 0.7 }}>
              We couldn't find this payout.
            </div>
          </div>
        </EarningsCard>
      </EarningsSubShell>
    );
  }

  const items = earningsForPayout(payout);
  const gross = items.reduce((s, e) => s + e.gross, 0);
  const tips = items.reduce((s, e) => s + e.tip, 0);
  const fees = items.reduce((s, e) => s + e.fee, 0);
  const clientPaid = gross + tips;

  return (
    <EarningsSubShell title="Payout" backTo="/earnings/payouts">
      <EarningsCard>
        <div style={{ padding: 18, fontFamily: UI }}>
          <div className="flex items-center gap-2">
            <EarningsCardEyebrow>Net payout</EarningsCardEyebrow>
            <StatusPill status={payout.status} />
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 36,
              fontWeight: 600,
              color: NAVY,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {formatMoney(payout.amount)}
          </div>
          <DetailRow
            label={
              payout.status === "paid"
                ? "Paid out"
                : payout.status === "in-transit"
                  ? "Sending"
                  : "Attempted"
            }
            value={formatLong(payout.date)}
          />
          <DetailRow label="Expected arrival" value={payout.expectedArrival} />
          <DetailRow label="To" value={`${payout.bankName} ••${payout.bankLast4}`} />
          {payout.failureReason ? (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                backgroundColor: "rgba(220,38,38,0.08)",
                color: "#991B1B",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {payout.failureReason}
            </div>
          ) : null}
        </div>
      </EarningsCard>

      <EarningsCard>
        <div style={{ padding: 16, fontFamily: UI }}>
          <EarningsCardEyebrow>Breakdown</EarningsCardEyebrow>
          <div className="mt-3 flex flex-col" style={{ gap: 8 }}>
            <BreakdownLine label="Clients paid" value={formatMoney(clientPaid)} />
            <div style={{ height: 1, backgroundColor: "rgba(6,28,39,0.08)", margin: "6px 0" }} />
            <BreakdownLine label="Your earnings" value={formatMoney(payout.amount)} bold />
            {tips > 0 ? (
              <div style={{ fontSize: 12, color: NAVY, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
                Includes {formatMoney(tips)} in tips
              </div>
            ) : null}
          </div>
          <DetailsToggle gross={gross} tips={tips} fees={fees} net={payout.amount} />
        </div>
      </EarningsCard>

      <EarningsCard>
        <div style={{ padding: 16, paddingBottom: 6, fontFamily: UI }}>
          <EarningsCardEyebrow>
            {items.length} {items.length === 1 ? "booking" : "bookings"} included
          </EarningsCardEyebrow>
        </div>
        <div className="flex flex-col">
          {items.map((e, i) => (
            <BookingLine key={e.id} event={e} divider={i < items.length - 1} />
          ))}
        </div>
      </EarningsCard>

      {payout.status === "failed" ? (
        <button
          type="button"
          onClick={() => {
            // Phase 3 hook: re-trigger payout via Stripe rails behind the scenes.
          }}
          className="mt-2 transition-opacity active:opacity-60"
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
          Retry payout
        </button>
      ) : null}
    </EarningsSubShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2 flex items-baseline justify-between" style={{ fontSize: 13, color: NAVY }}>
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function BreakdownLine({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between" style={{ fontSize: 14, color: NAVY }}>
      <span style={{ opacity: bold ? 1 : 0.7, fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function DetailsToggle({
  gross,
  tips,
  fees,
  net,
}: {
  gross: number;
  tips: number;
  fees: number;
  net: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-3 transition-opacity active:opacity-60"
        style={{
          fontFamily: UI,
          fontSize: 12,
          fontWeight: 600,
          color: NAVY,
          opacity: 0.6,
          background: "none",
          border: "none",
          padding: 0,
          textAlign: "left",
        }}
      >
        {open ? "Hide details" : "How is this calculated?"}
      </button>
      {open ? (
        <div
          className="mt-2 flex flex-col"
          style={{
            gap: 8,
            padding: 12,
            borderRadius: 10,
            backgroundColor: "rgba(6,28,39,0.04)",
          }}
        >
          <BreakdownLine label="Service totals" value={formatMoney(gross)} />
          <BreakdownLine label="Tips" value={`+ ${formatMoney(tips)}`} />
          <BreakdownLine label="Platform fee" value={`− ${formatMoney(fees)}`} />
          <div style={{ height: 1, backgroundColor: "rgba(6,28,39,0.08)", margin: "2px 0" }} />
          <BreakdownLine label="Your earnings" value={formatMoney(net)} bold />
          <div style={{ fontSize: 11, color: NAVY, opacity: 0.55, lineHeight: 1.5 }}>
            Platform fee covers payment processing, identity verification, and customer support.
          </div>
        </div>
      ) : null}
    </>
  );
}

function BookingLine({ event, divider }: { event: EarningEvent; divider: boolean }) {
  const navigate = useNavigate();
  const routable = !!findBookingById(event.bookingId);
  return (
    <button
      type="button"
      onClick={() => {
        if (routable) navigate({ to: "/bookings/$id", params: { id: event.bookingId } });
      }}
      className="flex items-center justify-between transition-colors active:bg-black/[0.03]"
      style={{
        padding: "12px 16px",
        borderBottom: divider ? "1px solid rgba(6,28,39,0.08)" : "none",
        fontFamily: UI,
        textAlign: "left",
        cursor: routable ? "pointer" : "default",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{event.clientLabel}</div>
        <div style={{ marginTop: 2, fontSize: 12, color: NAVY, opacity: 0.6 }}>
          {event.service} · {formatShort(event.date)}
        </div>
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: NAVY,
          fontVariantNumeric: "tabular-nums",
          marginLeft: 12,
        }}
      >
        {formatMoney(event.net)}
      </div>
    </button>
  );
}

function formatLong(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatShort(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
