import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HomeShell, useHomeTheme, HOME_SANS, CardTheme } from "@/home/home-shell";
import { BottomTabs, type TabKey } from "@/home/bottom-tabs";
import { ActiveBookingStrip } from "@/components/active-booking-strip";
import { OnlineModeStrip } from "@/components/online-mode-strip";
import {
  ALL_EARNINGS,
  earningsForDensity,
  formatMoney,
  pendingPayoutFor,
  tipSummaryFor,
  topServicesFor,
  totalsFor,
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
  thisWeekStats,
  upcomingStats,
  nextPayoutStats,
  periodBuckets,
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

  const density = densityFromDev(dev.dataDensity);
  const [period, setPeriod] = useState<EarningsPeriod>("week");

  const events = useMemo(() => earningsForDensity(density), [density]);
  const payouts = useMemo(
    () => payoutsForDensity(density === "none" ? "none" : density === "sparse" ? "sparse" : "rich"),
    [density],
  );

  // Upstream PRO STATE wins. Earnings is gated when not live.
  // Gating happens AFTER hooks to keep hook order stable across renders.
  if (proState === "mid-onboarding") return <LockedState />;
  if (proState === "mid-pending") return <PendingApprovalState />;

  return (
    <HomeShell>
      <OnlineModeStrip />
      <ActiveBookingStrip />
      <PageHeader />

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-2">
        <Hero events={events} period={period} />
        <ContextSummaryCard events={events} payouts={payouts} />
        <PeriodToggle value={period} onChange={setPeriod} />
        <EarningsChartCard events={events} period={period} />
        <TopServicesCard events={events} period={period} />
        <TipSummaryCard events={events} period={period} />
        <PayoutsCard events={events} payouts={payouts} />
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

/* ---------- Context summary (KPI strip: This week / Upcoming / Next payout) ---------- */

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

  const trendArrow = week.trend === "up" ? "↑" : week.trend === "down" ? "↓" : "→";
  const trendTone: "good" | "bad" | "neutral" =
    week.trend === "up" ? "good" : week.trend === "down" ? "bad" : "neutral";

  return (
    <div className="grid grid-cols-3 gap-2">
      <KpiTile
        eyebrow="This week"
        headline={formatMoney(week.earned)}
        sub={
          week.deltaPct !== null
            ? `${trendArrow} ${Math.abs(week.deltaPct)}% vs last week`
            : "First week"
        }
        subTone={week.deltaPct !== null ? trendTone : "neutral"}
      />
      <KpiTile
        eyebrow="Upcoming"
        headline={upcoming.revenue > 0 ? formatMoney(upcoming.revenue) : "—"}
        sub={
          upcoming.revenue > 0
            ? [
                `${upcoming.appointments} ${upcoming.appointments === 1 ? "appt" : "appts"}`,
                "Next 7 days",
              ]
            : "No upcoming"
        }
        muted={upcoming.revenue === 0}
      />
      <KpiTile
        eyebrow="Next payout"
        headline={next ? next.weekdayLabel : "—"}
        sub={next ? [formatMoney(next.amount), next.shortDate] : "Nothing in transit"}
        muted={!next}
      />
    </div>
  );
}

function KpiTile({
  eyebrow,
  headline,
  sub,
  subTone = "neutral",
  muted,
}: {
  eyebrow: string;
  headline: string;
  sub: string | string[];
  subTone?: "good" | "bad" | "neutral";
  muted?: boolean;
}) {
  const subColor = subTone === "good" ? "#15803D" : subTone === "bad" ? "#B91C1C" : NAVY;
  const subOpacity = subTone === "neutral" ? 0.55 : 0.95;
  const subWeight = subTone === "neutral" ? 500 : 600;
  const subLines = Array.isArray(sub) ? sub : [sub];
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(6,28,39,0.10)",
        borderRadius: 12,
        padding: "10px 11px",
        fontFamily: UI,
        boxShadow: "0 1px 2px rgba(6,28,39,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 86,
        opacity: muted ? 0.7 : 1,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: NAVY,
          opacity: 0.6,
          lineHeight: 1.2,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: NAVY,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.015em",
          lineHeight: 1.1,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {subLines.map((line, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              color: subColor,
              opacity: i === 0 ? subOpacity : subOpacity * 0.85,
              fontWeight: i === 0 ? subWeight : 500,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.3,
            }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Top services ---------- */

function EarningsChartCard({
  events,
  period,
}: {
  events: ReturnType<typeof earningsForDensity>;
  period: EarningsPeriod;
}) {
  const buckets = useMemo(() => periodBuckets(events, period), [events, period]);
  const max = Math.max(1, ...buckets.map((b) => b.total));
  const total = buckets.reduce((s, b) => s + b.total, 0);
  const chartHeight = 96;

  // Nice y-axis scale: 3 gridlines (0, mid, top) rounded to a sensible step.
  const niceMax = useMemo(() => niceCeil(max), [max]);
  const gridValues = useMemo(() => [0, niceMax / 2, niceMax], [niceMax]);

  // Find tallest bar (first occurrence wins on ties).
  const peakIndex = useMemo(() => {
    let idx = -1;
    let best = 0;
    buckets.forEach((b, i) => {
      if (b.total > best) {
        best = b.total;
        idx = i;
      }
    });
    return idx;
  }, [buckets]);

  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);
  const handleBarTap = (i: number) => {
    setActiveIdx((prev) => (prev === i ? null : i));
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setActiveIdx(null), 3000);
  };

  const Y_AXIS_W = 32;
  const PEAK_LABEL_H = 16;

  return (
    <Card>
      <div style={{ padding: 16, fontFamily: UI }}>
        <div className="flex items-center justify-between">
          <CardEyebrow>Earnings</CardEyebrow>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: NAVY,
              opacity: 0.6,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatMoney(total)}
          </div>
        </div>
        {total === 0 ? (
          <div
            style={{
              marginTop: 16,
              fontSize: 13,
              color: NAVY,
              opacity: 0.55,
              textAlign: "center",
              padding: "24px 0",
            }}
          >
            No earnings in this period yet
          </div>
        ) : (
          <>
            <div
              role="img"
              aria-label="Earnings by period"
              className="mt-3"
              style={{
                position: "relative",
                display: "flex",
                paddingTop: PEAK_LABEL_H,
              }}
            >
              {/* Y-axis labels */}
              <div
                aria-hidden
                style={{
                  width: Y_AXIS_W,
                  height: chartHeight,
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                {gridValues
                  .slice()
                  .reverse()
                  .map((v, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        right: 6,
                        top: i === 0 ? 0 : i === gridValues.length - 1 ? undefined : "50%",
                        bottom: i === gridValues.length - 1 ? 0 : undefined,
                        transform:
                          i === 0
                            ? "translateY(-50%)"
                            : i === gridValues.length - 1
                              ? "translateY(50%)"
                              : "translateY(-50%)",
                        fontSize: 9,
                        fontWeight: 600,
                        color: NAVY,
                        opacity: 0.4,
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {formatAxisMoney(v)}
                    </div>
                  ))}
              </div>

              {/* Plot area */}
              <div style={{ flex: 1, position: "relative", height: chartHeight }}>
                {/* Gridlines */}
                {gridValues.map((v, i) => {
                  const top = chartHeight - (v / niceMax) * chartHeight;
                  return (
                    <div
                      key={i}
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top,
                        height: 1,
                        backgroundColor: "rgba(6,28,39,0.10)",
                      }}
                    />
                  );
                })}

                {/* Bars */}
                <div
                  className="flex items-end justify-between"
                  style={{ position: "absolute", inset: 0, gap: 6 }}
                >
                  {buckets.map((b, i) => {
                    const h = b.total === 0 ? 2 : Math.max(3, Math.round((b.total / niceMax) * chartHeight));
                    const isPeak = i === peakIndex && b.total > 0;
                    const isActive = i === activeIdx;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleBarTap(i)}
                        aria-label={`${b.label}: ${formatMoney(b.total)}`}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          height: chartHeight,
                          position: "relative",
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        {/* Peak label */}
                        {isPeak && !isActive && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: h + 4,
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: 10,
                              fontWeight: 700,
                              color: NAVY,
                              fontVariantNumeric: "tabular-nums",
                              whiteSpace: "nowrap",
                              lineHeight: 1,
                            }}
                          >
                            {formatMoney(b.total)}
                          </div>
                        )}
                        {/* Tap tooltip */}
                        {isActive && (
                          <div
                            role="tooltip"
                            style={{
                              position: "absolute",
                              bottom: h + 6,
                              left: "50%",
                              transform: "translateX(-50%)",
                              backgroundColor: NAVY,
                              color: "#FFFFFF",
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "5px 7px",
                              borderRadius: 6,
                              whiteSpace: "nowrap",
                              lineHeight: 1.2,
                              fontVariantNumeric: "tabular-nums",
                              boxShadow: "0 2px 6px rgba(6,28,39,0.18)",
                              zIndex: 2,
                              textAlign: "center",
                            }}
                          >
                            {formatMoney(b.total)}
                          </div>
                        )}
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 28,
                            height: h,
                            borderRadius: 6,
                            backgroundColor: b.total > 0 ? ORANGE : "rgba(6,28,39,0.08)",
                            opacity: isActive ? 0.85 : 1,
                            transition: "opacity 120ms ease",
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-axis labels */}
            <div className="mt-2 flex" style={{ gap: 6 }}>
              <div style={{ width: Y_AXIS_W, flexShrink: 0 }} />
              <div className="flex flex-1 justify-between" style={{ gap: 6 }}>
                {buckets.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontSize: 10,
                      fontWeight: 600,
                      color: NAVY,
                      opacity: 0.55,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------- Chart helpers ---------- */

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / exp;
  let nice: number;
  if (n <= 1) nice = 1;
  else if (n <= 2) nice = 2;
  else if (n <= 2.5) nice = 2.5;
  else if (n <= 5) nice = 5;
  else nice = 10;
  return nice * exp;
}

function formatAxisMoney(value: number): string {
  if (value === 0) return "$0";
  if (value >= 1000) {
    const k = value / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(0)}`;
}

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
  return (
    <div className="flex items-center justify-between">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: NAVY }}>{service}</div>
      </div>
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
        <div>{formatMoney(amount)}</div>
        <div style={{ fontWeight: 400, opacity: 0.55, fontSize: 11, marginTop: 2 }}>
          {bookings} {bookings === 1 ? "booking" : "bookings"}
        </div>
      </div>
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
        <div className="mt-2 flex items-end justify-between">
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
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 12, color: NAVY, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
              {pct}% tipped
            </div>
            <div style={{ fontSize: 12, color: NAVY, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
              Avg {formatMoney(tips.averageTip)}
            </div>
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
        if (k === "calendar") navigate({ to: "/calendar" });
        if (k === "earnings") return;
        if (k === "profile") navigate({ to: "/home" });
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