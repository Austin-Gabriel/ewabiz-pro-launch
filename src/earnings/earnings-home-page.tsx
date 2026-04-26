import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HomeShell, useHomeTheme, HOME_SANS, CardTheme } from "@/home/home-shell";
import { BottomTabs, type TabKey } from "@/home/bottom-tabs";
import { ActiveBookingStrip } from "@/components/active-booking-strip";
import {
  ALL_EARNINGS,
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
import { useAuth } from "@/auth/auth-context";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";
import {
  resolveProState,
  pendingBalanceOverride,
  type ResolvedProState,
} from "./earnings-state";
import { payoutsForDensity, type Payout } from "@/data/mock-payouts";
import { ALL_BOOKINGS } from "@/data/mock-bookings";
import {
  serviceSparkline,
  thisWeekStats,
  upcomingStats,
  nextPayoutStats,
} from "./earnings-aggregates";

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
  const auth = useAuth();
  const { data: kyc } = useKyc();
  const proState: ResolvedProState = resolveProState(dev.proState, auth, kyc);

  // Upstream PRO STATE wins. Earnings is gated when not live.
  if (proState === "mid-onboarding") return <LockedState />;
  if (proState === "mid-pending") return <PendingApprovalState />;

  const density = densityFromDev(dev.dataDensity);
  const [period, setPeriod] = useState<EarningsPeriod>("week");

  const events = useMemo(() => earningsForDensity(density), [density]);
  const payouts = useMemo(
    () => payoutsForDensity(density === "none" ? "none" : density === "sparse" ? "sparse" : "rich"),
    [density],
  );

  return (
    <HomeShell>
      <ActiveBookingStrip />
      <PageHeader />

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-2">
        <Hero events={events} period={period} />
        <ContextSummaryCard events={events} payouts={payouts} />
        <PeriodToggle value={period} onChange={setPeriod} />
        <ChartCard events={events} period={period} />
        <TopServicesCard events={events} period={period} />
        <TipSummaryCard events={events} period={period} />
        <PayoutsCard events={events} payouts={payouts} />
        <DocsBankingCard payoutState={dev.payoutState} taxDocs={dev.taxDocs} />
        <FeesTransparencyCard />
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
        {totals.bookings} {totals.bookings === 1 ? "booking" : "bookings"}
      </div>
      <div
        style={{
          fontFamily: UI,
          fontSize: 12,
          color: text,
          opacity: 0.45,
          marginTop: 2,
        }}
      >
        Net of fees
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
      <div style={{ opacity: 0.85 }}>{formatMoney(b.amount)}</div>
      <div style={{ opacity: 0.65, marginTop: 2 }}>
        {b.bookings} {b.bookings === 1 ? "booking" : "bookings"}
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

/* ---------- Context summary (This week / Upcoming / Next payout) ---------- */

function ContextSummaryCard({
  events,
  payouts,
}: {
  events: ReturnType<typeof earningsForDensity>;
  payouts: Payout[];
}) {
  const week = useMemo(() => thisWeekStats(events), [events]);
  const upcoming = useMemo(() => upcomingStats(ALL_BOOKINGS), []);
  const next = useMemo(() => nextPayoutStats(payouts), [payouts]);

  // If everything is empty (new pro), render nothing — keeps the surface quiet.
  if (week.earned === 0 && upcoming.revenue === 0 && !next) return null;

  return (
    <Card>
      <div style={{ padding: 18, fontFamily: UI, display: "flex", flexDirection: "column", gap: 18 }}>
        <SummarySection eyebrow="This week">
          <SummaryHeadline>{formatMoney(week.earned)} earned</SummaryHeadline>
          {week.deltaPct !== null ? (
            <SummaryLine
              tone={week.trend === "up" ? "good" : week.trend === "down" ? "bad" : "neutral"}
            >
              {week.trend === "up" ? "↑" : week.trend === "down" ? "↓" : "→"}{" "}
              {Math.abs(week.deltaPct)}% vs last week
            </SummaryLine>
          ) : (
            <SummaryLine tone="neutral">First week of activity</SummaryLine>
          )}
          <SummaryLine>
            {week.bookings} {week.bookings === 1 ? "booking" : "bookings"}
          </SummaryLine>
          {week.bookings > 0 ? (
            <SummaryLine>Avg {formatMoney(week.averagePerBooking)}</SummaryLine>
          ) : null}
        </SummarySection>

        {upcoming.revenue > 0 ? (
          <>
            <Divider />
            <SummarySection eyebrow="Upcoming">
              <SummaryHeadline>{formatMoney(upcoming.revenue)} booked</SummaryHeadline>
              <SummaryLine>Next 7 days</SummaryLine>
              <SummaryLine>
                {upcoming.appointments}{" "}
                {upcoming.appointments === 1 ? "appointment" : "appointments"}
              </SummaryLine>
            </SummarySection>
          </>
        ) : null}

        {next ? (
          <>
            <Divider />
            <SummarySection eyebrow="Next payout">
              <SummaryHeadline>{next.weekdayLabel}</SummaryHeadline>
              <SummaryLine strong>{formatMoney(next.amount)}</SummaryLine>
              <SummaryLine>Arrives {next.shortDate}</SummaryLine>
            </SummarySection>
          </>
        ) : null}
      </div>
    </Card>
  );
}

function SummarySection({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <CardEyebrow>{eyebrow}</CardEyebrow>
      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
        {children}
      </div>
    </div>
  );
}

function SummaryHeadline({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: 22,
        fontWeight: 600,
        color: NAVY,
        letterSpacing: "-0.015em",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1.2,
      }}
    >
      {children}
    </div>
  );
}

function SummaryLine({
  children,
  tone = "neutral",
  strong,
}: {
  children: ReactNode;
  tone?: "good" | "bad" | "neutral";
  strong?: boolean;
}) {
  const color = tone === "good" ? "#15803D" : tone === "bad" ? "#B91C1C" : NAVY;
  const opacity = tone === "neutral" ? (strong ? 0.85 : 0.6) : 0.95;
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: 13,
        fontWeight: strong ? 600 : 500,
        color,
        opacity,
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1.4,
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div
      aria-hidden
      style={{ height: 1, backgroundColor: "rgba(6,28,39,0.08)", margin: "0 -2px" }}
    />
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
            <ServiceRow key={t.service} service={t.service} amount={t.amount} bookings={t.bookings} events={events} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function ServiceRow({
  service,
  amount,
  bookings,
  events,
}: {
  service: string;
  amount: number;
  bookings: number;
  events: ReturnType<typeof earningsForDensity>;
}) {
  const spark = useMemo(() => serviceSparkline(events, service), [events, service]);
  return (
    <div className="flex items-center justify-between">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: NAVY }}>{service}</div>
      </div>
      <Sparkline values={spark} />
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: NAVY,
          fontVariantNumeric: "tabular-nums",
          marginLeft: 12,
          textAlign: "right",
          minWidth: 76,
        }}
      >
        {formatMoney(amount)}{" "}
        <span style={{ fontWeight: 400, opacity: 0.55, fontSize: 12 }}>· {bookings}</span>
      </div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-0.5" style={{ height: 18, marginRight: 4 }}>
      {values.map((v, i) => {
        const h = Math.max(2, Math.round((v / max) * 18));
        return (
          <span
            key={i}
            aria-hidden
            style={{
              display: "inline-block",
              width: 4,
              height: h,
              borderRadius: 1,
              backgroundColor: v > 0 ? NAVY : "rgba(6,28,39,0.18)",
              opacity: v > 0 ? 0.7 : 1,
            }}
          />
        );
      })}
    </div>
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

/* ---------- Earnings breakdown (pro-takeaway framing) ---------- */

function FeesTransparencyCard() {
  const [open, setOpen] = useState(false);
  // Illustrative example — keeps numbers small + memorable so the math is
  // legible at a glance. Not tied to a real booking.
  const clientPays = 77;
  const youEarn = 70;
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
        style={{ padding: 16, fontFamily: UI, textAlign: "left", color: NAVY }}
      >
        <div>
          <CardEyebrow>How earnings work</CardEyebrow>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, color: NAVY }}>
            See what you keep per booking
          </div>
        </div>
        <Chevron open={open} />
      </button>
      {open ? (
        <div style={{ padding: "0 16px 16px", fontFamily: UI }}>
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: "rgba(6,28,39,0.04)",
            }}
          >
            <div className="flex items-baseline justify-between">
              <span style={{ fontSize: 13, color: NAVY, opacity: 0.7 }}>Client pays</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: NAVY, fontVariantNumeric: "tabular-nums" }}>
                {formatMoney(clientPays, { showCents: true })}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Your earnings</span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: NAVY,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.01em",
                }}
              >
                {formatMoney(youEarn, { showCents: true })}
              </span>
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: NAVY,
              opacity: 0.6,
              lineHeight: 1.5,
            }}
          >
            Includes payment processing, identity verification, and customer support.
            Tips always pass through to you in full.
          </div>
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

/* ---------- Payouts card (rich) ---------- */

function PayoutsCard({
  events,
  payouts,
}: {
  events: ReturnType<typeof earningsForDensity>;
  payouts: Payout[];
}) {
  const inTransit = payouts.find((p) => p.status === "in-transit");
  const recent = useMemo(
    () => payouts.filter((p) => p.status !== "in-transit").slice(0, 3),
    [payouts],
  );
  const computedPending = useMemo(() => pendingPayoutFor(events), [events]);

  return (
    <Card>
      <div style={{ padding: 16, fontFamily: UI }}>
        <div className="flex items-baseline justify-between">
          <CardEyebrow>Payouts</CardEyebrow>
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

        {/* Next payout strip */}
        <div
          className="mt-3"
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: "rgba(255,130,63,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#7A3A12",
              opacity: 0.85,
            }}
          >
            Next payout
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: NAVY,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.015em",
              }}
            >
              {formatMoney(inTransit?.amount ?? computedPending.amount)}
            </div>
            <div style={{ fontSize: 12, color: NAVY, opacity: 0.65, fontVariantNumeric: "tabular-nums" }}>
              arrives {inTransit?.expectedArrival ?? computedPending.arrivesOn}
            </div>
          </div>
        </div>

        {recent.length > 0 ? (
          <div className="mt-2 flex flex-col">
            {recent.map((p, i) => (
              <Link
                key={p.id}
                to="/earnings/payouts/$id"
                params={{ id: p.id }}
                className="flex items-center justify-between transition-colors active:bg-black/[0.03]"
                style={{
                  padding: "10px 2px",
                  borderBottom:
                    i < recent.length - 1 ? "1px solid rgba(6,28,39,0.06)" : "none",
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
                    {formatPayoutDateShort(p.date)}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: NAVY,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatMoney(p.amount)}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function formatPayoutDateShort(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

/* ---------- Documents & banking card ---------- */

function DocsBankingCard({
  payoutState,
  taxDocs,
}: {
  payoutState: ReturnType<typeof useDevState>["state"]["payoutState"];
  taxDocs: ReturnType<typeof useDevState>["state"]["taxDocs"];
}) {
  const taxStatus =
    taxDocs === "none"
      ? "Not yet available"
      : taxDocs === "multi-year"
        ? "Multi-year history"
        : "Current year ready";

  const bankStatus =
    payoutState === "none"
      ? "Not connected"
      : payoutState === "pending"
        ? "Chase ••4821 · Verifying"
        : payoutState === "failed-recent"
          ? "Chase ••4821 · Needs attention"
          : "Chase ••4821 · Verified";

  const bankTone: "ok" | "warn" | "err" =
    payoutState === "failed-recent" || payoutState === "none"
      ? "err"
      : payoutState === "pending"
        ? "warn"
        : "ok";

  return (
    <Card>
      <div className="flex flex-col">
        <DocBankRow
          to="/earnings/tax-documents"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
              <path d="M14 3v5h5" />
              <path d="M9 13h6" />
              <path d="M9 17h4" />
            </svg>
          }
          title="Tax documents"
          subtitle={taxStatus}
          divider
        />
        <DocBankRow
          to="/earnings/payout-method"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10l9-6 9 6" />
              <path d="M5 10v8" />
              <path d="M12 10v8" />
              <path d="M19 10v8" />
              <path d="M3 20h18" />
            </svg>
          }
          title="Payout method"
          subtitle={bankStatus}
          tone={bankTone}
        />
      </div>
    </Card>
  );
}

function DocBankRow({
  to,
  icon,
  title,
  subtitle,
  divider,
  tone = "ok",
}: {
  to: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  divider?: boolean;
  tone?: "ok" | "warn" | "err";
}) {
  const subColor = tone === "err" ? "#B91C1C" : tone === "warn" ? "#B8531C" : NAVY;
  const subOpacity = tone === "ok" ? 0.6 : 0.95;
  return (
    <Link
      to={to as "/earnings/tax-documents"}
      className="flex items-center gap-3 transition-colors active:bg-black/[0.03]"
      style={{
        padding: "14px 16px",
        borderBottom: divider ? "1px solid rgba(6,28,39,0.08)" : "none",
        textDecoration: "none",
        fontFamily: UI,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          backgroundColor: "rgba(6,28,39,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
          {title}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            color: subColor,
            opacity: subOpacity,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {subtitle}
        </div>
      </div>
      <span style={{ opacity: 0.4, fontSize: 16, color: NAVY }}>→</span>
    </Link>
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

/* ---------- PRO STATE gates ---------- */

/**
 * Mid-onboarding lock. Pro hasn't completed setup yet. Earnings is a
 * locked surface — calm, explanatory, with a CTA back to /home where the
 * onboarding resume strip lives.
 */
function LockedState() {
  const navigate = useNavigate();
  return (
    <HomeShell>
      <PageHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24" style={{ fontFamily: UI }}>
        <div
          aria-hidden
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: "rgba(6,28,39,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 018 0v3" />
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: NAVY, letterSpacing: "-0.01em" }}>
          Earnings unlock at launch
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: NAVY, opacity: 0.7, textAlign: "center", lineHeight: 1.5, maxWidth: 280 }}>
          Complete your setup and verification to start taking bookings — your earnings surface
          activates the moment you're approved.
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/home" })}
          className="mt-6 transition-opacity active:opacity-70"
          style={{
            fontFamily: UI,
            fontSize: 14,
            fontWeight: 600,
            color: NAVY,
            backgroundColor: ORANGE,
            padding: "12px 22px",
            borderRadius: 999,
          }}
        >
          Continue setup
        </button>
      </div>
      <EarningsBottomTabs />
    </HomeShell>
  );
}

/**
 * Pending-approval empty state. Verification submitted, waiting on review.
 * Tab is reachable but shows a quiet placeholder — no fake numbers.
 */
function PendingApprovalState() {
  return (
    <HomeShell>
      <PageHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24" style={{ fontFamily: UI }}>
        <div
          aria-hidden
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: "rgba(255,130,63,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: NAVY, letterSpacing: "-0.01em" }}>
          Earnings will appear soon
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: NAVY, opacity: 0.7, textAlign: "center", lineHeight: 1.5, maxWidth: 300 }}>
          Once you're approved and start taking bookings, your earnings, payouts, and tax documents
          will live here.
        </div>
      </div>
      <EarningsBottomTabs />
    </HomeShell>
  );
}