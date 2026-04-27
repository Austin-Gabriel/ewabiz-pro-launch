import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CardTheme, HOME_SANS, useHomeTheme } from "./home-shell";
import { EwaMark } from "@/components/ewa-logo";
import { type Booking, formatUsd } from "@/data/mock-data";
import type { DevDayContext, DevMode } from "@/dev-state/dev-state-context";
import { useDevState } from "@/dev-state/dev-state-context";
import { LIFECYCLE_BOOKING } from "@/bookings/lifecycle/lifecycle-data";

/**
 * Home as two distinct top-level variants — Offline and Online — driven by
 * the online/offline toggle and dev-state sub-state pickers.
 *
 * Offline → working surface that surfaces the day. Sub-state varies by
 *           dayContext (none / one / multiple / full).
 * Online  → ready surface for immediate dispatch. Dispatch phase itself is
 *           rendered by the Lifecycle takeover, not here.
 *
 * Industrial Uncut Sans typography. White cards on dark, cream-elevated on
 * light. No greetings, no "waiting on you" copy.
 */

const UI = HOME_SANS;
const ORANGE = "#FF823F";
const SUCCESS = "#16A34A";
const ORANGE_SOFT = "rgba(255,130,63,0.14)";

/** Avatar tint palette for "more today" stack + hero avatar. */
const AVATAR_HUES: Record<string, { bg: string; fg: string; border: string }> = {
  peach:  { bg: "rgba(255,130,63,0.18)", fg: "#7A2E0E", border: "rgba(255,130,63,0.35)" },
  blue:   { bg: "rgba(59,130,246,0.16)", fg: "#1E3A8A", border: "rgba(59,130,246,0.30)" },
  green:  { bg: "rgba(34,197,94,0.18)",  fg: "#14532D", border: "rgba(34,197,94,0.30)" },
  violet: { bg: "rgba(139,92,246,0.16)", fg: "#3B1F70", border: "rgba(139,92,246,0.30)" },
  amber:  { bg: "rgba(234,179,8,0.18)",  fg: "#5B3A06", border: "rgba(234,179,8,0.30)" },
};

export interface StateHomeProps {
  /** Dev-state controls. "auto" is treated as the default for the chosen mode. */
  mode: DevMode;
  dayContext: DevDayContext;

  // Offline data
  bookingsToday: Booking[];
  /** Human label for the next future booking when today is empty. */
  nextFutureBookingLabel?: string;

  // Earnings glance (shown on every offline sub-state and online idle)
  todayEarningsUsd: number;
  weekToDateUsd: number;
  weekProjectedUsd?: number;
  /** Optional weekly target. Drives the goal progress bar. */
  weekGoalUsd?: number;

  /** Unread notification count (drives bell badge). */
  unreadCount?: number;
}

export function StateHome(props: StateHomeProps) {
  // Dev mode wins; "auto" defaults to offline so Home always renders something
  // sensible even with the dev panel untouched.
  const initialOnline = props.mode === "online";
  const [online, setOnline] = useState(initialOnline);
  const { state: dev, setMode } = useDevState();
  // Any active lifecycle (other than the incoming takeover, which is its own
  // full-screen surface) means the pro is committed to a booking — they
  // cannot accept new on-demand requests until Complete is acknowledged.
  const lifecycleActive =
    dev.lifecycle !== "none" && dev.lifecycle !== "incoming";

  // Re-sync when dev toggle flips between offline/online while we're on the
  // page. This is the moment the user expects a smooth crossfade.
  useEffect(() => {
    if (props.mode === "online") setOnline(true);
    else if (props.mode === "offline") setOnline(false);
  }, [props.mode]);

  // Persist the toggle so navigating to other tabs keeps the Online state.
  const handleToggle = () => {
    setOnline((v) => {
      const next = !v;
      setMode(next ? "online" : "offline");
      return next;
    });
  };

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-4 pb-2 pt-1">
      <Header unreadCount={props.unreadCount ?? 0} />
      <ModeToggle
        online={online}
        onToggle={handleToggle}
        lockedClientName={lifecycleActive ? LIFECYCLE_BOOKING.clientName.split(" ")[0] : undefined}
      />

      <div
        className="relative flex flex-1 flex-col"
        style={{
          // Smooth, intentional crossfade between modes.
          transition: "opacity 280ms ease",
        }}
      >
        {online ? (
          <OnlineBody todayEarningsUsd={props.todayEarningsUsd} />
        ) : (
          <OfflineBody
            dayContext={props.dayContext}
            bookingsToday={props.bookingsToday}
            nextFutureBookingLabel={props.nextFutureBookingLabel}
            todayEarningsUsd={props.todayEarningsUsd}
            weekToDateUsd={props.weekToDateUsd}
            weekProjectedUsd={props.weekProjectedUsd}
            weekGoalUsd={props.weekGoalUsd}
            onGoOnline={() => {
              setOnline(true);
              setMode("online");
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- Header ---------------- */

function Header({ unreadCount }: { unreadCount: number }) {
  const { text, borderCol, bg, surface } = useHomeTheme();
  return (
    <div className="flex items-center justify-between" style={{ height: 48 }}>
      <EwaMark size={26} />
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative flex items-center justify-center rounded-full transition-transform active:scale-95"
        style={{
          width: 36,
          height: 36,
          backgroundColor: surface,
          border: `1px solid ${borderCol}`,
          color: text,
        }}
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span
            aria-hidden
            className="absolute flex items-center justify-center rounded-full"
            style={{
              top: -2,
              right: -2,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              backgroundColor: ORANGE,
              color: "#061C27",
              fontFamily: UI,
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
              border: `2px solid ${bg}`,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}

/* ---------------- Mode toggle (Offline ↔ Online) ---------------- */

function ModeToggle({
  online,
  onToggle,
  lockedClientName,
}: {
  online: boolean;
  onToggle: () => void;
  /**
   * When set, the toggle is rendered in a locked state — the pro is
   * currently committed to this client. Tap is disabled, no orange/pulse
   * accents, and the copy explains the booking is in progress.
   */
  lockedClientName?: string;
}) {
  const { text, borderCol, surface, isDark } = useHomeTheme();
  const offTrackBg = isDark ? "rgba(240,235,216,0.22)" : "rgba(6,28,39,0.28)";
  const thumbColor = isDark ? "#061C27" : "#F0EBD8";
  const locked = Boolean(lockedClientName);
  // When locked we render the toggle in a neutral, off-looking state — never
  // the orange "online" accent, regardless of whether the pro had been online
  // before the lifecycle started.
  const showOnlineAccent = online && !locked;

  return (
    <div
      className="mt-2 flex items-center justify-between rounded-2xl px-3 py-2.5"
      style={{
        backgroundColor: surface,
        border: `1px solid ${borderCol}`,
        // Subtle background tint shift for the mode change
        transition: "background-color 280ms ease, border-color 280ms ease",
        opacity: locked ? 0.92 : 1,
      }}
    >
      <button
        type="button"
        onClick={locked ? undefined : onToggle}
        disabled={locked}
        className="flex min-w-0 flex-1 items-center gap-2.5 transition-opacity active:opacity-70 disabled:cursor-not-allowed disabled:active:opacity-100"
        aria-pressed={online}
        aria-disabled={locked}
      >
        <span
          className="flex shrink-0 items-center rounded-full"
          style={{
            width: 38,
            height: 22,
            padding: 2,
            backgroundColor: showOnlineAccent ? ORANGE : offTrackBg,
            transition: "background-color 280ms ease",
          }}
        >
          <span
            className="rounded-full"
            style={{
              width: 18,
              height: 18,
              backgroundColor: showOnlineAccent ? "#061C27" : thumbColor,
              transform: showOnlineAccent ? "translateX(16px)" : "translateX(0)",
              transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1), background-color 280ms ease",
              boxShadow: "0 1px 2px rgba(6,28,39,0.25)",
            }}
          />
        </span>
        <span className="flex min-w-0 flex-col items-start text-left">
          <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: text, lineHeight: 1.2 }}>
            {locked ? `Currently with ${lockedClientName}` : online ? "Online" : "Offline"}
          </span>
          <span style={{ fontFamily: UI, fontSize: 11, color: text, opacity: 0.6, lineHeight: 1.2, marginTop: 2 }}>
            {locked
              ? "Back online when complete"
              : online
                ? "Accepting new requests"
                : "Not accepting new requests"}
          </span>
        </span>
      </button>

      {/* Schedule button only shown in offline mode. */}
      {!online && !locked ? (
        <button
          type="button"
          aria-label="Open schedule"
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 transition-opacity active:opacity-70"
          style={{
            border: `1px solid ${borderCol}`,
            color: text,
            fontFamily: UI,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <CalendarIcon size={13} />
          Schedule
        </button>
      ) : null}
    </div>
  );
}

/* ---------------- OFFLINE body ---------------- */

function OfflineBody({
  dayContext,
  bookingsToday,
  nextFutureBookingLabel,
  todayEarningsUsd,
  weekToDateUsd,
  weekProjectedUsd,
  weekGoalUsd,
  onGoOnline,
}: {
  dayContext: DevDayContext;
  bookingsToday: Booking[];
  nextFutureBookingLabel?: string;
  todayEarningsUsd: number;
  weekToDateUsd: number;
  weekProjectedUsd?: number;
  weekGoalUsd?: number;
  onGoOnline: () => void;
}) {
  const count = bookingsToday.length;

  // None case: no bookings today
  if (count === 0) {
    return (
      <div className="flex flex-1 flex-col gap-3 pt-2">
        <NoBookingsHero nextFutureBookingLabel={nextFutureBookingLabel} />
        <EarningsGoalCard
          todayUsd={todayEarningsUsd}
          weekToDateUsd={weekToDateUsd}
          weekGoalUsd={weekGoalUsd}
          weekProjectedUsd={weekProjectedUsd}
        />
        <button
          type="button"
          onClick={onGoOnline}
          className="mt-2 self-start text-left transition-opacity active:opacity-60"
          style={{ fontFamily: UI, fontSize: 13, color: "inherit", fontWeight: 600, opacity: 0.85 }}
        >
          Go online to take immediate requests →
        </button>
      </div>
    );
  }

  // 1+ scheduled today — same hero treatment, only the "more today" row
  // appears when there are additional bookings on the books.
  const next = bookingsToday[0];
  const rest = bookingsToday.slice(1);
  return (
    <div className="flex flex-1 flex-col gap-3 pt-2">
      <UpNextCard booking={next} />
      {rest.length > 0 ? <TodayRestList bookings={rest} /> : null}
      <EarningsGoalCard
        todayUsd={todayEarningsUsd}
        weekToDateUsd={weekToDateUsd}
        weekGoalUsd={weekGoalUsd}
        weekProjectedUsd={weekProjectedUsd}
      />
    </div>
  );
}

/* ---------------- Offline hero variants ---------------- */

function NoBookingsHero({ nextFutureBookingLabel }: { nextFutureBookingLabel?: string }) {
  return (
    <Card>
      <NoBookingsBody nextFutureBookingLabel={nextFutureBookingLabel} />
    </Card>
  );
}

function NoBookingsBody({ nextFutureBookingLabel }: { nextFutureBookingLabel?: string }) {
  const { text } = useHomeTheme();
  return (
    <>
      <Eyebrow>Today</Eyebrow>
      <p
        style={{
          fontFamily: UI,
          fontSize: 22,
          fontWeight: 600,
          color: text,
          letterSpacing: "-0.02em",
          margin: "8px 0 0",
          lineHeight: 1.15,
        }}
      >
        No bookings today
      </p>
      <p style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.65, marginTop: 6 }}>
        {nextFutureBookingLabel
          ? `Your next booking is ${nextFutureBookingLabel}.`
          : "Nothing scheduled yet."}
      </p>
    </>
  );
}

/* ---------------- Up Next card (reference-matching) ---------------- */

function UpNextCard({ booking }: { booking: Booking }) {
  return (
    <CardTheme>
      <UpNextInner booking={booking} />
    </CardTheme>
  );
}

function UpNextInner({ booking }: { booking: Booking }) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  const navigate = useNavigate();
  const startsIn = booking.startsInMin;
  const goToDetail = () =>
    navigate({ to: "/bookings/$id", params: { id: booking.id }, search: { from: "home" } });
  return (
    <div
      className="rounded-3xl p-5"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 16px 32px -20px rgba(6,28,39,0.25)",
      }}
    >
      {/* Tappable top area — pill through location — opens booking detail.
          The bottom CTAs (Start navigation, Message, Call) stay separate so
          they don't accidentally trigger navigation to the detail page. */}
      <button
        type="button"
        onClick={goToDetail}
        aria-label={`View details for ${booking.clientName}`}
        className="block w-full text-left transition-opacity active:opacity-80"
        style={{ background: "transparent", padding: 0, border: "none" }}
      >
      {/* Header row: status pill + time */}
      <div className="flex items-start justify-between">
        {typeof startsIn === "number" ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              backgroundColor: ORANGE_SOFT,
              color: ORANGE,
              fontFamily: UI,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span
              aria-hidden
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: ORANGE,
                animation: "ewa-up-next-pulse 1800ms ease-in-out infinite",
              }}
            />
            Starts in {startsIn} min
          </span>
        ) : (
          <span
            className="inline-flex rounded-full px-2.5 py-1"
            style={{
              backgroundColor: "rgba(6,28,39,0.06)",
              color: text,
              opacity: 0.7,
              fontFamily: UI,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Up next
          </span>
        )}
        <div className="flex flex-col items-end leading-none">
          <span
            style={{
              fontFamily: UI,
              fontSize: 18,
              fontWeight: 700,
              color: text,
              letterSpacing: "-0.01em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTime12(booking.startsAt)}
          </span>
          <span
            style={{
              fontFamily: UI,
              fontSize: 12,
              color: text,
              opacity: 0.55,
              marginTop: 4,
            }}
          >
            {booking.durationMin} min session
          </span>
        </div>
      </div>

      {/* Client */}
      <div className="mt-5 flex items-center gap-3.5">
        <Avatar initial={booking.clientInitial} hue={booking.avatarHue} size={56} />
        <div className="min-w-0 flex-1">
          <div
            className="truncate"
            style={{
              fontFamily: UI,
              fontSize: 20,
              fontWeight: 700,
              color: text,
              letterSpacing: "-0.01em",
            }}
          >
            {booking.clientName}
          </div>
          <div
            className="truncate"
            style={{ fontFamily: UI, fontSize: 14, color: text, opacity: 0.6, marginTop: 2 }}
          >
            {booking.service}
          </div>
        </div>
      </div>

      {/* Inset location row — neighborhood only until the pro enters Get Ready.
          Full street address is revealed inside the lifecycle takeover. */}
      {booking.location ? (
        <div
          className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: "rgba(6,28,39,0.045)" }}
        >
          <span style={{ color: text, opacity: 0.55 }}>
            <PinIcon size={14} />
          </span>
          <span
            className="min-w-0 flex-1 truncate"
            style={{ fontFamily: UI, fontSize: 13.5, color: text, fontWeight: 500 }}
          >
            {booking.location}
          </span>
          {booking.distance ? (
            <span
              style={{
                fontFamily: UI,
                fontSize: 12.5,
                color: text,
                opacity: 0.55,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {booking.distance}
            </span>
          ) : null}
        </div>
      ) : null}
      </button>

      {/* Primary CTA: full-width orange */}
      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 transition-transform active:scale-[0.99]"
        style={{
          backgroundColor: ORANGE,
          color: "#061C27",
          fontFamily: UI,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "-0.005em",
        }}
      >
        <NavArrowIcon size={16} />
        Start navigation
      </button>

      {/* Secondary row: outlined Message + Call */}
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <SecondaryButton icon={<ChatIcon size={14} />} label="Message" />
        <SecondaryButton icon={<PhoneIcon size={14} />} label="Call" />
      </div>

      <style>{`
        @keyframes ewa-up-next-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

function SecondaryButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { text } = useHomeTheme();
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-1.5 rounded-2xl py-3 transition-opacity active:opacity-70"
      style={{
        border: `1px solid rgba(6,28,39,0.12)`,
        backgroundColor: "transparent",
        color: text,
        fontFamily: UI,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- "X more today" compact row ---------------- */

/* ---------------- Rest-of-today (canonical card list) ---------------- */

function TodayRestList({ bookings }: { bookings: Booking[] }) {
  const { cardText, cardSurface, cardBorder } = useHomeTheme();
  const navigate = useNavigate();
  const count = bookings.length;
  const next = bookings[0];
  const stack = bookings.slice(0, 3);
  const overflow = Math.max(0, count - stack.length);

  return (
    <CardTheme>
      <button
        type="button"
        onClick={() =>
          navigate({ to: "/bookings", search: { tab: "upcoming" } })
        }
        className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-opacity active:opacity-80"
        style={{
          backgroundColor: cardSurface,
          border: `1px solid ${cardBorder}`,
          boxShadow:
            "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -14px rgba(6,28,39,0.18)",
        }}
      >
        <AvatarStack bookings={stack} overflow={overflow} />
        <div className="min-w-0 flex-1">
          <div
            style={{
              fontFamily: UI,
              fontSize: 15,
              fontWeight: 700,
              color: cardText,
              letterSpacing: "-0.005em",
              lineHeight: 1.2,
            }}
          >
            {count} more today
          </div>
          <div
            className="mt-0.5"
            style={{
              fontFamily: UI,
              fontSize: 13,
              color: cardText,
              opacity: 0.6,
              lineHeight: 1.3,
            }}
          >
            Next at {formatStartTime(next.startsAt)}
          </div>
        </div>
        <Chevron color={cardText} />
      </button>
    </CardTheme>
  );
}

/**
 * Stacked avatar preview using the canonical bagel/cream monogram.
 * No per-client color variance — every monogram is the same cream fill with
 * deep-bagel initials, matching BookingRowCard's <Monogram>. Two-letter
 * initials always (we derive from clientName as a safety net for any data
 * that snuck in with a single letter). Up to 3 avatars + "+N" overflow chip.
 */
function AvatarStack({ bookings, overflow = 0 }: { bookings: Booking[]; overflow?: number }) {
  const { cardSurface } = useHomeTheme();
  const SIZE = 30;
  const OVERLAP = 10;
  const items = bookings.length + (overflow > 0 ? 1 : 0);
  return (
    <div
      className="flex shrink-0 items-center"
      style={{ width: SIZE + (items - 1) * (SIZE - OVERLAP) }}
    >
      {bookings.map((b, i) => (
        <div
          key={b.id}
          className="flex items-center justify-center rounded-full"
          style={{
            width: SIZE,
            height: SIZE,
            backgroundColor: "rgba(255,130,63,0.28)",
            color: "#5A1F05",
            border: `2px solid ${cardSurface}`,
            fontFamily: UI,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            marginLeft: i === 0 ? 0 : -OVERLAP,
            zIndex: items - i,
          }}
        >
          {twoInitials(b.clientName, b.clientInitial)}
        </div>
      ))}
      {overflow > 0 ? (
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: SIZE,
            height: SIZE,
            backgroundColor: "rgba(255,130,63,0.28)",
            color: "#5A1F05",
            border: `2px solid ${cardSurface}`,
            fontFamily: UI,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            marginLeft: -OVERLAP,
            zIndex: 0,
          }}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}

/** Always two letters. Falls back to deriving from the full name if the
 * provided initial is empty or single-letter. */
function twoInitials(name: string, fallback?: string): string {
  if (fallback && fallback.length >= 2) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Chevron({ color }: { color: string }) {
  return (
    <svg
      aria-hidden
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color, opacity: 0.45, flexShrink: 0 }}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Canonical app time format. Rules:
 *   - On the hour → "1 PM" (no ":00")
 *   - Off the hour → "1:30 PM"
 *   - No leading zero on the hour
 * Accepts any of: "13:00", "1:30 PM", "1 PM", "7:00".
 * Treats 1–6 (no meridiem) as PM to match salon afternoon mock data
 * (e.g. "1:00" → "1 PM", "7:00" → "7 AM").
 */
function formatStartTime(raw: string): string {
  // Already meridiem? Normalize and strip ":00" on the hour.
  const meridiemMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if (meridiemMatch) {
    const h = parseInt(meridiemMatch[1], 10);
    const mm = meridiemMatch[2] ?? "00";
    const sfx = meridiemMatch[3].toUpperCase();
    return mm === "00" ? `${h} ${sfx}` : `${h}:${mm} ${sfx}`;
  }
  // Bare 24h "HH:MM" or "H:MM".
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return raw;
  let h = parseInt(m[1], 10);
  const mm = m[2] ?? "00";
  let suffix: "AM" | "PM";
  if (h === 0) { h = 12; suffix = "AM"; }
  else if (h === 12) { suffix = "PM"; }
  else if (h > 12) { h -= 12; suffix = "PM"; }
  else if (h >= 1 && h <= 6) { suffix = "PM"; }
  else { suffix = "AM"; }
  return mm === "00" ? `${h} ${suffix}` : `${h}:${mm} ${suffix}`;
}

/* ---------------- Earnings + goal card ---------------- */

function EarningsGoalCard({
  todayUsd,
  weekToDateUsd,
  weekGoalUsd,
  weekProjectedUsd,
}: {
  todayUsd: number;
  weekToDateUsd: number;
  weekGoalUsd?: number;
  weekProjectedUsd?: number;
}) {
  return (
    <CardTheme>
      <EarningsGoalInner
        todayUsd={todayUsd}
        weekToDateUsd={weekToDateUsd}
        weekGoalUsd={weekGoalUsd}
        weekProjectedUsd={weekProjectedUsd}
      />
    </CardTheme>
  );
}

function EarningsGoalInner({
  todayUsd,
  weekToDateUsd,
  weekGoalUsd,
  weekProjectedUsd,
}: {
  todayUsd: number;
  weekToDateUsd: number;
  weekGoalUsd?: number;
  weekProjectedUsd?: number;
}) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  const goal = weekGoalUsd && weekGoalUsd > 0 ? weekGoalUsd : undefined;
  const pct = goal ? Math.min(1, weekToDateUsd / goal) : 0;
  const projected = weekProjectedUsd ?? weekToDateUsd;
  const aheadBy = goal && projected > goal ? projected - goal : 0;
  const onPace = goal ? projected >= goal : false;

  return (
    <div
      className="rounded-3xl p-5"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 16px 32px -20px rgba(6,28,39,0.25)",
      }}
    >
      <div className="flex items-start justify-between">
        <Eyebrow>Today</Eyebrow>
        <button
          type="button"
          aria-label="Edit weekly goal"
          className="flex items-center justify-center rounded-full transition-opacity active:opacity-60"
          style={{
            width: 32,
            height: 32,
            border: "1px solid rgba(6,28,39,0.12)",
            color: text,
            opacity: 0.7,
          }}
        >
          <EditIcon size={13} />
        </button>
      </div>

      <div
        className="mt-1"
        style={{
          fontFamily: UI,
          fontSize: 44,
          fontWeight: 700,
          color: text,
          letterSpacing: "-0.035em",
          lineHeight: 1.05,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatUsd(todayUsd)}
      </div>

      {goal ? (
        <>
          <div className="mt-4 flex items-baseline justify-between">
            <span
              style={{
                fontFamily: UI,
                fontSize: 13,
                color: text,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatUsd(weekToDateUsd)} <span style={{ opacity: 0.55, fontWeight: 500 }}>this week</span>
            </span>
            <span
              style={{
                fontFamily: UI,
                fontSize: 13,
                color: text,
                opacity: 0.65,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span style={{ opacity: 0.85, fontWeight: 500 }}>Goal</span>{" "}
              <span style={{ fontWeight: 700, opacity: 1 }}>{formatUsd(goal)}</span>
            </span>
          </div>
          <div
            className="mt-2.5 w-full rounded-full"
            style={{ height: 6, backgroundColor: "rgba(6,28,39,0.08)", overflow: "hidden" }}
          >
            <div
              style={{
                width: `${pct * 100}%`,
                height: "100%",
                backgroundColor: ORANGE,
                borderRadius: 999,
                transition: "width 400ms ease",
              }}
            />
          </div>
          {onPace ? (
            <div
              className="mt-3 flex items-center gap-1.5"
              style={{ color: SUCCESS, fontFamily: UI, fontSize: 13, fontWeight: 600 }}
            >
              <TrendUpIcon size={14} />
              {aheadBy > 0
                ? `On pace — ahead by ${formatUsd(aheadBy)}`
                : `On pace for ${formatUsd(projected)}`}
            </div>
          ) : (
            <div
              className="mt-3"
              style={{ color: text, opacity: 0.6, fontFamily: UI, fontSize: 13, fontWeight: 500 }}
            >
              {goal - projected > 0
                ? `${formatUsd(goal - projected)} to hit goal`
                : "Pace updates as bookings come in"}
            </div>
          )}
        </>
      ) : (
        <div
          className="mt-3"
          style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.65 }}
        >
          {formatUsd(weekToDateUsd)} this week
        </div>
      )}
    </div>
  );
}

/* ---------------- Local helpers ---------------- */

function formatTime12(t: string): string {
  // Accepts "10:30" or "13:00" → "10:30 AM" / "1:00 PM". Pass-through if
  // already formatted.
  if (/AM|PM/i.test(t)) return t;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const mm = m[2];
  // Treat 1:00–6:59 as PM (matches typical salon afternoon hours in our mocks).
  let suffix: "AM" | "PM";
  if (h === 0) { h = 12; suffix = "AM"; }
  else if (h === 12) { suffix = "PM"; }
  else if (h > 12) { h -= 12; suffix = "PM"; }
  else if (h >= 1 && h <= 6) { suffix = "PM"; }
  else { suffix = "AM"; }
  return `${h}:${mm} ${suffix}`;
}

function shortLocation(loc?: string): string {
  if (!loc) return "Brooklyn";
  // "Park Slope, Brooklyn" → "Park Slope"
  return loc.split(",")[0].trim();
}

/* ---------------- ONLINE body ---------------- */

function OnlineBody({ todayEarningsUsd }: { todayEarningsUsd: number }) {
  // Online ambient state. Dispatch phases (incoming / active) are rendered by
  // the Lifecycle takeover, not here — this body is always the idle surface.
  return <OnlineIdle todayEarningsUsd={todayEarningsUsd} />;
}

function OnlineIdle({ todayEarningsUsd }: { todayEarningsUsd: number }) {
  const { text } = useHomeTheme();
  return (
    <div className="flex flex-1 flex-col items-center justify-center pt-6 pb-10">
      {/* Pulsing listening indicator */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 120, height: 120 }}
      >
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: 120,
            height: 120,
            border: `2px solid ${ORANGE}`,
            opacity: 0.18,
            animation: "ewa-listen-pulse 2200ms ease-out infinite",
          }}
        />
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: 84,
            height: 84,
            border: `2px solid ${ORANGE}`,
            opacity: 0.32,
            animation: "ewa-listen-pulse 2200ms 600ms ease-out infinite",
          }}
        />
        <span
          aria-hidden
          className="rounded-full"
          style={{
            width: 36,
            height: 36,
            backgroundColor: ORANGE,
            boxShadow: "0 0 24px rgba(255,130,63,0.55)",
          }}
        />
      </div>

      <p
        style={{
          fontFamily: UI,
          fontSize: 22,
          fontWeight: 600,
          color: text,
          letterSpacing: "-0.02em",
          marginTop: 28,
        }}
      >
        You're online
      </p>
      <p style={{ fontFamily: UI, fontSize: 13.5, color: text, opacity: 0.65, marginTop: 8, textAlign: "center" }}>
        We'll notify you when a request comes in.
      </p>

      <div className="mt-10 w-full" style={{ maxWidth: 320 }}>
        <CardTheme>
          <OnlineEarningsLine todayUsd={todayEarningsUsd} />
        </CardTheme>
      </div>

      <p
        style={{
          fontFamily: UI,
          fontSize: 11.5,
          color: text,
          opacity: 0.5,
          marginTop: 18,
          letterSpacing: "0.01em",
        }}
      >
        Most requests come in under 10 min
      </p>

      <style>{`
        @keyframes ewa-listen-pulse {
          0%   { transform: scale(0.85); opacity: 0.45; }
          70%  { opacity: 0; }
          100% { transform: scale(1.25); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function OnlineEarningsLine({ todayUsd }: { todayUsd: number }) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="flex items-center justify-between rounded-2xl px-4 py-3"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
      }}
    >
      <span
        style={{
          fontFamily: UI,
          fontSize: 10,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          color: text,
          opacity: 0.55,
          fontWeight: 700,
        }}
      >
        Today
      </span>
      <span
        style={{ fontFamily: UI, fontSize: 17, fontWeight: 700, color: text, letterSpacing: "-0.02em" }}
      >
        {formatUsd(todayUsd)}
      </span>
    </div>
  );
}

/* ---------------- Shared card primitives ---------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <CardTheme>
      <CardInner>{children}</CardInner>
    </CardTheme>
  );
}

function CardInner({ children }: { children: React.ReactNode }) {
  const { cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="mt-3 rounded-2xl px-4 py-4"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  const { text } = useHomeTheme();
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: 10.5,
        letterSpacing: "1.4px",
        textTransform: "uppercase",
        color: text,
        opacity: 0.55,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}

function Avatar({
  initial,
  hue = "peach",
  size = 40,
  stackOffset = 0,
}: {
  initial: string;
  hue?: "blue" | "green" | "peach" | "violet" | "amber";
  size?: number;
  /** Negative left margin for stacking inside <AvatarStack>. */
  stackOffset?: number;
}) {
  const palette = AVATAR_HUES[hue] ?? AVATAR_HUES.peach;
  const fontSize = Math.max(11, Math.round(size * 0.36));
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        marginLeft: stackOffset,
        backgroundColor: palette.bg,
        border: `1.5px solid ${stackOffset ? "#FFFFFF" : palette.border}`,
        color: palette.fg,
        fontFamily: UI,
        fontSize,
        fontWeight: 700,
        letterSpacing: "-0.01em",
      }}
    >
      {initial}
    </div>
  );
}

/* ---------------- Icons ---------------- */

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
function CalendarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function PinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function NavArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M3.5 11.2 20 4l-7.2 16.5-2-7.3-7.3-2z" />
    </svg>
  );
}
function ChatIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5A8 8 0 1 1 21 12z" />
    </svg>
  );
}
function PhoneIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h3l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A18 18 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}
function EditIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
function TrendUpIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17 10 10l4 4 7-8" />
      <path d="M14 5h7v7" />
    </svg>
  );
}