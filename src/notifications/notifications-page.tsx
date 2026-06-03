import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HomeShell, useHomeTheme, HOME_SANS, HOME_SERIF, CardTheme } from "@/home/home-shell";
import { useNotifications, type PromoKind } from "./use-notifications";
import {
  BUCKET_LABEL,
  BUCKET_ORDER,
  type ActivityActor,
  type ActivityBucket,
  type ActivityEvent,
  type PillTone,
} from "./notifications-data";

const UI = HOME_SANS;
const DISPLAY = HOME_SERIF;
const NAVY = "#061C27";
const ORANGE = "#FF823F";
const ORANGE_SOFT = "rgba(255,130,63,0.14)";
const ORANGE_DEEP = "#B8531C";
const UNREAD_BG = "#FBEADD";
const UNREAD_BORDER = "rgba(255,130,63,0.22)";

const AVATAR_TINTS: Record<ActivityActor["tint"], { bg: string; fg: string }> = {
  peach: { bg: "#F8D7C2", fg: "#7A3B1A" },
  lilac: { bg: "#D9DCF2", fg: "#3D3E76" },
  sage: { bg: "#CFE3D3", fg: "#2E5A3A" },
  sand: { bg: "#EADFC8", fg: "#6B4F22" },
};

const PILL_TONES: Record<PillTone, { bg: string; fg: string }> = {
  orange: { bg: "rgba(255,130,63,0.14)", fg: "#B8531C" },
  rose: { bg: "rgba(214,68,68,0.12)", fg: "#9A2E2E" },
  navy: { bg: "rgba(6,28,39,0.08)", fg: NAVY },
  mint: { bg: "rgba(46,138,86,0.14)", fg: "#226B43" },
};

/**
 * Notifications screen. Reachable from the bell icon on Home and Calendar.
 * Two stacked sections: Promotions (bonus / loyalty / welcome card) and
 * Recent activity (booking requests, cancellations, payouts, ratings, KYC).
 * Visit auto-marks the bell as read.
 */
export function NotificationsPage() {
  const view = useNotifications();
  useEffect(() => {
    view.markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HomeShell noTabBarSpacing>
      <SubHeader title="Notifications" />
      <div className="flex flex-1 flex-col gap-3 px-4 pb-10 pt-1">
        <SectionLabel>Promotions</SectionLabel>
        <PromoCard
          kind={view.promo}
          count={view.loyaltyCount}
          target={view.loyaltyTarget}
          bonusAmount={view.bonusAmount}
        />

        <ActivityHeader />
        {view.activity.length === 0 ? <EmptyActivity /> : <ActivityGroups events={view.activity} />}
      </div>
    </HomeShell>
  );
}

/* ---------------- Header ---------------- */

function SubHeader({ title }: { title: string }) {
  const { text } = useHomeTheme();
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between px-2 pt-2" style={{ height: 52 }}>
      <button
        type="button"
        aria-label="Back"
        onClick={() => navigate({ to: "/home" })}
        className="flex items-center justify-center transition-opacity active:opacity-50"
        style={{ width: 44, height: 44, color: text }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h1 style={{ fontFamily: UI, fontSize: 16, fontWeight: 600, color: text, letterSpacing: "-0.005em" }}>
        {title}
      </h1>
      <div style={{ width: 44 }} />
    </div>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { text } = useHomeTheme();
  return (
    <div
      className={className}
      style={{
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: text,
        opacity: 0.55,
        paddingLeft: 4,
      }}
    >
      {children}
    </div>
  );
}

function ActivitySubcopy({ children }: { children: React.ReactNode }) {
  const { text } = useHomeTheme();
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: 12.5,
        color: text,
        opacity: 0.55,
        paddingLeft: 4,
        marginTop: -4,
      }}
    >
      {children}
    </div>
  );
}

function BucketLabel({ children }: { children: React.ReactNode }) {
  const { text } = useHomeTheme();
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: text,
        opacity: 0.45,
        paddingLeft: 4,
        marginTop: 6,
        marginBottom: 2,
      }}
    >
      {children}
    </div>
  );
}

function ActivityGroups({ events }: { events: ActivityEvent[] }) {
  const grouped = new Map<ActivityBucket, ActivityEvent[]>();
  for (const e of events) {
    const list = grouped.get(e.bucket) ?? [];
    list.push(e);
    grouped.set(e.bucket, list);
  }
  return (
    <CardTheme>
      <div className="flex flex-col gap-1">
        {BUCKET_ORDER.map((bucket) => {
          const rows = grouped.get(bucket);
          if (!rows || rows.length === 0) return null;
          return (
            <div key={bucket} className="flex flex-col gap-2">
              <BucketLabel>{BUCKET_LABEL[bucket]}</BucketLabel>
              {rows.map((e) => (
                <ActivityRow key={e.id} event={e} />
              ))}
            </div>
          );
        })}
      </div>
    </CardTheme>
  );
}

/* ---------------- Promo cards ---------------- */

function PromoCard({
  kind,
  count,
  target,
  bonusAmount,
}: {
  kind: PromoKind;
  count: number;
  target: number;
  bonusAmount: number;
}) {
  if (kind === "none") return null;
  if (kind === "welcome") return <WelcomeCard />;
  if (kind === "bonus-earned") return <BonusEarnedCard amount={bonusAmount} />;
  return <LoyaltyCard count={count} target={target} bonusAmount={bonusAmount} />;
}

function WelcomeCard() {
  return (
    <div
      style={{
        backgroundColor: ORANGE,
        color: NAVY,
        borderRadius: 18,
        padding: 18,
        fontFamily: UI,
        boxShadow: "0 8px 24px -12px rgba(255,130,63,0.55)",
      }}
    >
      <Eyebrow tone="navy">Welcome bonus</Eyebrow>
      <div
        style={{
          marginTop: 6,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          lineHeight: 1.15,
        }}
      >
        10% bonus on your first booking
      </div>
      <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, opacity: 0.78 }}>
        Welcome to Ewà. Earn an extra 10% on top of your first booking earnings.
      </div>
      <div
        style={{
          marginTop: 12,
          textAlign: "right",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          opacity: 0.65,
        }}
      >
        Auto-applied
      </div>
    </div>
  );
}

function LoyaltyCard({ count, target, bonusAmount }: { count: number; target: number; bonusAmount: number }) {
  const pct = Math.min(100, Math.round((count / target) * 100));
  return (
    <CardTheme>
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(6,28,39,0.10)",
          borderRadius: 18,
          padding: 18,
          fontFamily: UI,
          color: NAVY,
          boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
        }}
      >
        <Eyebrow tone="muted">Earn a bonus</Eyebrow>
        <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
          ${bonusAmount} bonus this week
        </div>
        <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, opacity: 0.65 }}>
          Complete {target} bookings this week to earn a ${bonusAmount} bonus.
        </div>
        <div style={{ marginTop: 14 }}>
          <div
            aria-hidden
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: "rgba(6,28,39,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                backgroundColor: ORANGE,
                transition: "width 320ms ease",
              }}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span style={{ fontSize: 11, opacity: 0.55 }}>Resets Monday</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.005em",
              }}
            >
              {count} of {target} this week
            </span>
          </div>
        </div>
      </div>
    </CardTheme>
  );
}

function BonusEarnedCard({ amount }: { amount: number }) {
  return (
    <CardTheme>
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(6,28,39,0.10)",
          borderRadius: 18,
          padding: 18,
          fontFamily: UI,
          color: NAVY,
          boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            aria-hidden
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: ORANGE_SOFT,
              color: ORANGE_DEEP,
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Eyebrow tone="muted">Bonus earned</Eyebrow>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              ${amount} bonus added to your next payout
            </div>
            <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, opacity: 0.65 }}>
              You completed 20 bookings this week. Bonus paid out with your next earnings cycle.
            </div>
          </div>
        </div>
      </div>
    </CardTheme>
  );
}

function Eyebrow({ children, tone }: { children: React.ReactNode; tone: "navy" | "muted" }) {
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: NAVY,
        opacity: tone === "navy" ? 0.7 : 0.5,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- Activity ---------------- */

function ActivityRow({ event }: { event: ActivityEvent }) {
  const navigate = useNavigate();
  const routable = !!event.target;
  return (
    <button
      type="button"
      onClick={() => {
        if (!event.target) return;
        if (event.target.to === "/bookings/$id") {
          navigate({ to: "/bookings/$id", params: event.target.params });
        } else if (event.target.to === "/earnings/payouts/$id") {
          navigate({ to: "/earnings/payouts/$id", params: event.target.params });
        } else {
          navigate({ to: "/earnings" });
        }
      }}
      className="flex w-full items-start gap-3 text-left transition-colors active:bg-black/[0.03]"
      style={{
        padding: "14px 16px",
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(6,28,39,0.10)",
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
        fontFamily: UI,
        cursor: routable ? "pointer" : "default",
      }}
    >
      {event.actor ? <ActorAvatar actor={event.actor} /> : <ActivityIcon kind={event.kind} />}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, lineHeight: 1.35 }}>{event.title}</div>
        {event.detail ? (
          <div style={{ marginTop: 2, fontSize: 12.5, color: NAVY, opacity: 0.62, lineHeight: 1.45 }}>
            {event.detail}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 8 }}>
          {event.pill ? <Pill label={event.pill.label} tone={event.pill.tone} /> : null}
          <span
            style={{
              fontSize: 11,
              color: NAVY,
              opacity: 0.5,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {event.timeLabel}
          </span>
        </div>
      </div>
      {routable ? (
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={NAVY}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.3, marginTop: 4, flexShrink: 0 }}
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      ) : null}
    </button>
  );
}

function ActorAvatar({ actor }: { actor: ActivityActor }) {
  const palette = AVATAR_TINTS[actor.tint];
  return (
    <div
      aria-hidden
      className="flex items-center justify-center"
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        backgroundColor: palette.bg,
        color: palette.fg,
        flexShrink: 0,
        fontFamily: UI,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      {actor.initials}
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone: PillTone }) {
  const palette = PILL_TONES[tone];
  return (
    <span
      style={{
        backgroundColor: palette.bg,
        color: palette.fg,
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 999,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function ActivityIcon({ kind }: { kind: ActivityEvent["kind"] }) {
  const path = (() => {
    switch (kind) {
      case "booking-request":
        return (
          <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </>
        );
      case "booking-confirmed":
        return (
          <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" />
          </>
        );
      case "booking-reminder":
        return (
          <>
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l3 2M9 3l-3 2M15 3l3 2" />
          </>
        );
      case "cancellation":
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9 9l6 6M15 9l-6 6" />
          </>
        );
      case "payout":
        return (
          <>
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18M7 15h4" />
          </>
        );
      case "payout-initiated":
        return (
          <>
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18M14 15l3-2-3-2" />
          </>
        );
      case "tip":
        return (
          <>
            <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </>
        );
      case "message":
        return (
          <>
            <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.6A8 8 0 1 1 21 12z" />
          </>
        );
      case "rating":
        return <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.6 19.6l1-6L3.3 9.4l6-.9z" />;
      case "review-request":
        return (
          <>
            <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.6 19.6l1-6L3.3 9.4l6-.9z" />
          </>
        );
      case "kyc":
        return (
          <>
            <path d="M12 3l8 4v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
            <path d="M9 12l2 2 4-4" />
          </>
        );
      case "portfolio":
        return (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 15l5-5 4 4 3-3 6 6" />
            <circle cx="8.5" cy="9.5" r="1.2" />
          </>
        );
      default:
        return <circle cx="12" cy="12" r="9" />;
    }
  })();
  return (
    <div
      aria-hidden
      className="flex items-center justify-center"
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: "rgba(6,28,39,0.05)",
        color: NAVY,
        flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {path}
      </svg>
    </div>
  );
}

function EmptyActivity() {
  const { text } = useHomeTheme();
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        padding: "48px 24px",
        fontFamily: UI,
        color: text,
        opacity: 0.55,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600 }}>Nothing new</div>
      <div style={{ marginTop: 4, fontSize: 12.5, opacity: 0.8 }}>
        You're all caught up.
      </div>
    </div>
  );
}