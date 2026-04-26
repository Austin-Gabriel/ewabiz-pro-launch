import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HomeShell, useHomeTheme, HOME_SANS, CardTheme } from "@/home/home-shell";
import { BottomTabs, type TabKey } from "@/home/bottom-tabs";
import { ActiveBookingStrip } from "@/components/active-booking-strip";
import {
  ALL_EARNINGS,
  FEE_PERCENT,
  bucketsFor,
  earningsForDensity,
  formatMoney,
  pendingPayoutFor,
  tipSummaryFor,
  topServicesFor,
  totalsFor,
  type ChartBucket,
  type EarningsDensity,
  type EarningsPeriod,
} from "@/data/mock-earnings";
import { useDevState } from "@/dev-state/dev-state-context";

const UI = HOME_SANS;
const ORANGE = "#FF823F";
const NAVY = "#061C27";

const PERIODS: { key: EarningsPeriod; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

const PERIOD_HERO_COPY: Record<EarningsPeriod, string> = {
  today: "Today",
  week: "This week",
  month: "Last 30 days",
  year: "Last 12 months",
};

/* ---------- Density mapping ---------- */

function densityFromDev(d: ReturnType<typeof useDevState>["state"]["dataDensity"]): EarningsDensity {
  if (d === "empty") return "none";
  if (d === "sparse") return "sparse";
  return "rich";
}

/* ---------- Page ---------- */

export function EarningsHomePage() {
  const { state: dev } = useDevState();
  const density = densityFromDev(dev.dataDensity);
  const [period, setPeriod] = useState<EarningsPeriod>("week");

  const events = useMemo(() => earningsForDensity(density), [density]);

  return (
    <HomeShell>
      <ActiveBookingStrip />
      <PageHeader />

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-2">
        <Hero events={events} period={period} />
        <PeriodToggle value={period} onChange={setPeriod} />
        <ChartCard events={events} period={period} />
        <PendingBalanceCard events={events} />
        <TopServicesCard events={events} period={period} />
        <TipSummaryCard events={events} period={period} />
        <FeesTransparencyCard />
        <LinkRows />
      </div>

      <EarningsBottomTabs />
    </HomeShell>
  );
}

/* ---------- Header ---------- */

function PageHeader() {
  const { text } = useHomeTheme();
  return (
    <div className="flex items-center justify-between px-4 pt-2" style={{ height: 48 }}>
      <h1
        style={{
          fontFamily: UI,
          color: text,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        Earnings
      </h1>
    </div>
  );
}

/* ---------- Hero ---------- */

function Hero({ events, period }: { events: ReturnType<typeof earningsForDensity>; period: EarningsPeriod }) {
  const { text } = useHomeTheme();
  const totals = useMemo(() => totalsFor(events, period), [events, period]);
  return (
    <div className="px-1">
      <div
        style={{
          fontFamily: UI,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: text,
          opacity: 0.55,
          marginBottom: 6,
        }}
      >
        {PERIOD_HERO_COPY[period]}
      </div>
      <div
        style={{
          fontFamily: UI,
          fontSize: 44,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          color: text,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.05,
        }}
      >
        {formatMoney(totals.net)}
      </div>
      <div
        style={{
          fontFamily: UI,
          fontSize: 13,
          color: text,
          opacity: 0.6,
          marginTop: 4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {totals.bookings} {totals.bookings === 1 ? "booking" : "bookings"} · net of fees
      </div>
    </div>
  );
}

/* ---------- Period toggle ---------- */

function PeriodToggle({ value, onChange }: { value: EarningsPeriod; onChange: (p: EarningsPeriod) => void }) {
  const { text, surface, borderCol } = useHomeTheme();
  return (
    <div
      role="tablist"
      aria-label="Period"
      className="flex w-full items-stretch"
      style={{
        backgroundColor: surface,
        border: `1px solid ${borderCol}`,
        borderRadius: 10,
        padding: 3,
        fontFamily: UI,
      }}
    >
      {PERIODS.map((p) => {
        const active = p.key === value;
        return (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p.key)}
            className="flex-1 transition-colors"
            style={{
              padding: "7px 0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: text,
              opacity: active ? 1 : 0.55,
              backgroundColor: active ? "#FFFFFF" : "transparent",
              border: active ? `1px solid ${borderCol}` : "1px solid transparent",
              boxShadow: active ? "0 1px 2px rgba(6,28,39,0.06)" : "none",
            }}
          >
            <span style={{ color: active ? NAVY : undefined }}>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Chart ---------- */

function ChartCard({ events, period }: { events: ReturnType<typeof earningsForDensity>; period: EarningsPeriod }) {
  const buckets = useMemo(() => bucketsFor(events, period), [events, period]);
  return (
    <Card>
      <CardBodyForChart buckets={buckets} period={period} />
    </Card>
  );
}

function CardBodyForChart({ buckets, period }: { buckets: ChartBucket[]; period: EarningsPeriod }) {
  const max = Math.max(1, ...buckets.map((b) => b.amount));
  const hasData = buckets.some((b) => b.amount > 0);
  return (
    <div style={{ padding: 14 }}>
      <CardEyebrow>{labelFor(period)}</CardEyebrow>
      <div style={{ height: 168, marginTop: 10 }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="22%">
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: NAVY, opacity: 0.55, fontFamily: UI }}
              />
              <YAxis hide domain={[0, max * 1.15]} />
              <Tooltip
                cursor={{ fill: "rgba(6,28,39,0.04)" }}
                content={<ChartTooltip />}
              />
              <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                {buckets.map((b, i) => (
                  <Cell key={i} fill={b.amount > 0 ? NAVY : "rgba(6,28,39,0.10)"} fillOpacity={b.amount > 0 ? 0.85 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartBucket }[] }) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: NAVY,
        color: "#F0EBD8",
        padding: "8px 10px",
        borderRadius: 8,
        fontFamily: UI,
        fontSize: 12,
        fontVariantNumeric: "tabular-nums",
        boxShadow: "0 8px 24px -10px rgba(6,28,39,0.4)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{b.fullLabel}</div>
      <div style={{ opacity: 0.85 }}>
        {formatMoney(b.amount)} · {b.bookings} {b.bookings === 1 ? "booking" : "bookings"}
      </div>
    </div>
  );
}

function labelFor(period: EarningsPeriod): string {
  if (period === "today") return "Today by hour";
  if (period === "week") return "Last 7 days";
  if (period === "month") return "Last 4 weeks";
  return "Last 12 months";
}

function EmptyChart() {
  return (
    <div
      className="flex h-full items-center justify-center"
      style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.45 }}
    >
      No earnings yet
    </div>
  );
}

/* ---------- Pending balance ---------- */

function PendingBalanceCard({ events }: { events: ReturnType<typeof earningsForDensity> }) {
  const pending = useMemo(() => pendingPayoutFor(events), [events]);
  const hasPending = pending.amount > 0;
  return (
    <Card>
      <div style={{ padding: 16, fontFamily: UI }}>
        <CardEyebrow>Pending payout</CardEyebrow>
        <div className="mt-1 flex items-baseline justify-between">
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: hasPending ? ORANGE : NAVY,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {formatMoney(pending.amount)}
          </div>
          <div
            style={{
              fontSize: 12,
              color: NAVY,
              opacity: 0.6,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pending.bookingCount} {pending.bookingCount === 1 ? "booking" : "bookings"}
          </div>
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: NAVY,
            opacity: 0.7,
          }}
        >
          {hasPending
            ? <>Arriving <span style={{ fontWeight: 600 }}>{pending.arrivesOn}</span> · direct deposit</>
            : "Nothing pending right now."}
        </div>
      </div>
    </Card>
  );
}

/* ---------- Top services ---------- */

function TopServicesCard({ events, period }: { events: ReturnType<typeof earningsForDensity>; period: EarningsPeriod }) {
  const top = useMemo(() => topServicesFor(events, period), [events, period]);
  if (top.length === 0) return null;
  return (
    <Card>
      <div style={{ padding: 16, fontFamily: UI }}>
        <CardEyebrow>Top services</CardEyebrow>
        <div className="mt-3 flex flex-col" style={{ gap: 10 }}>
          {top.map((t) => (
            <div key={t.service} className="flex items-baseline justify-between">
              <div style={{ fontSize: 14, fontWeight: 500, color: NAVY }}>{t.service}</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: NAVY,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatMoney(t.amount)}{" "}
                <span style={{ fontWeight: 400, opacity: 0.55, fontSize: 12 }}>
                  · {t.bookings}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ---------- Tip summary ---------- */

function TipSummaryCard({ events, period }: { events: ReturnType<typeof earningsForDensity>; period: EarningsPeriod }) {
  const tips = useMemo(() => tipSummaryFor(events, period), [events, period]);
  if (tips.total === 0) return null;
  const pct = Math.round(tips.tippedRatio * 100);
  return (
    <Card>
      <div style={{ padding: 16, fontFamily: UI }}>
        <CardEyebrow>Tips</CardEyebrow>
        <div className="mt-2 flex items-baseline justify-between">
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: NAVY,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.015em",
            }}
          >
            {formatMoney(tips.total)}
          </div>
          <div style={{ fontSize: 12, color: NAVY, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
            {pct}% tipped · avg {formatMoney(tips.averageTip)}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Fees transparency ---------- */

function FeesTransparencyCard() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
        style={{ padding: 16, fontFamily: UI, textAlign: "left", color: NAVY }}
      >
        <div>
          <CardEyebrow>Platform fee</CardEyebrow>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, color: NAVY }}>
            Ewà takes <span style={{ fontWeight: 600 }}>{FEE_PERCENT}%</span> per booking
          </div>
        </div>
        <Chevron open={open} />
      </button>
      {open ? (
        <div
          style={{
            padding: "0 16px 16px",
            fontFamily: UI,
            fontSize: 13,
            color: NAVY,
            opacity: 0.75,
            lineHeight: 1.55,
          }}
        >
          Covers payment processing, identity verification, fraud protection, and customer support.
          Tips pass through to you 100%.
        </div>
      ) : null}
    </Card>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 180ms ease",
        opacity: 0.6,
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ---------- Link rows ---------- */

function LinkRows() {
  const navigate = useNavigate();
  const rows: { label: string; onClick: () => void }[] = [
    { label: "Recent earnings", onClick: () => navigate({ to: "/earnings/recent" }) },
    { label: "Payout history", onClick: () => navigate({ to: "/earnings/payouts" }) },
    { label: "Tax documents", onClick: () => navigate({ to: "/earnings/tax-documents" }) },
    { label: "Payout method", onClick: () => navigate({ to: "/earnings/payout-method" }) },
  ];
  return (
    <Card>
      <div className="flex flex-col">
        {rows.map((r, i) => (
          <LinkRow key={r.label} label={r.label} onClick={r.onClick} divider={i < rows.length - 1} />
        ))}
      </div>
    </Card>
  );
}

function LinkRow({ label, onClick, divider }: { label: string; onClick: () => void; divider: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between transition-colors active:bg-black/[0.03]"
      style={{
        padding: "14px 16px",
        borderBottom: divider ? "1px solid rgba(6,28,39,0.08)" : "none",
        fontFamily: UI,
        fontSize: 14,
        fontWeight: 500,
        color: NAVY,
        textAlign: "left",
      }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.4, fontSize: 16 }}>→</span>
    </button>
  );
}

/* ---------- Card primitive ---------- */

function Card({ children }: { children: ReactNode }) {
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

function CardEyebrow({ children }: { children: ReactNode }) {
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

/* ---------- Bottom tabs ---------- */

function EarningsBottomTabs() {
  const navigate = useNavigate();
  return (
    <BottomTabs
      active="earnings"
      onSelect={(k: TabKey) => {
        if (k === "home") navigate({ to: "/home" });
        if (k === "bookings") navigate({ to: "/bookings" });
        if (k === "earnings") navigate({ to: "/earnings" });
      }}
    />
  );
}