import { useEffect, useState } from "react";
import { CardTheme, HOME_SANS, useHomeTheme } from "./home-shell";
import { EwaMark } from "@/components/ewa-logo";
import { type Booking, formatUsd } from "@/data/mock-data";
import type { DevDayContext, DevMode, DevOnlineStatus } from "@/dev-state/dev-state-context";

/**
 * Home as two distinct top-level variants — Offline and Online — driven by
 * the online/offline toggle and dev-state sub-state pickers.
 *
 * Offline → working surface that surfaces the day. Sub-state varies by
 *           dayContext (none / one / multiple / full).
 * Online  → ready surface for immediate dispatch. Sub-state varies by
 *           onlineStatus (idle / incoming / active). Idle is fully built;
 *           incoming + active are placeholder until the lifecycle pass.
 *
 * Industrial Inter-only typography. White cards on dark, cream-elevated on
 * light. No greetings, no "waiting on you" copy.
 */

const UI = `Inter, ${HOME_SANS}`;
const ORANGE = "#FF823F";

export interface StateHomeProps {
  /** Dev-state controls. "auto" is treated as the default for the chosen mode. */
  mode: DevMode;
  dayContext: DevDayContext;
  onlineStatus: DevOnlineStatus;

  // Offline data
  bookingsToday: Booking[];
  /** Human label for the next future booking when today is empty. */
  nextFutureBookingLabel?: string;

  // Earnings glance (shown on every offline sub-state and online idle)
  todayEarningsUsd: number;
  weekToDateUsd: number;
  weekProjectedUsd?: number;

  /** Unread notification count (drives bell badge). */
  unreadCount?: number;
}

export function StateHome(props: StateHomeProps) {
  // Dev mode wins; "auto" defaults to offline so Home always renders something
  // sensible even with the dev panel untouched.
  const initialOnline = props.mode === "online";
  const [online, setOnline] = useState(initialOnline);

  // Re-sync when dev toggle flips between offline/online while we're on the
  // page. This is the moment the user expects a smooth crossfade.
  useEffect(() => {
    if (props.mode === "online") setOnline(true);
    else if (props.mode === "offline") setOnline(false);
  }, [props.mode]);

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-4 pb-2 pt-1">
      <Header unreadCount={props.unreadCount ?? 0} />
      <ModeToggle online={online} onToggle={() => setOnline((v) => !v)} />

      <div
        className="relative flex flex-1 flex-col"
        style={{
          // Smooth, intentional crossfade between modes.
          transition: "opacity 280ms ease",
        }}
      >
        {online ? (
          <OnlineBody
            onlineStatus={props.onlineStatus}
            todayEarningsUsd={props.todayEarningsUsd}
          />
        ) : (
          <OfflineBody
            dayContext={props.dayContext}
            bookingsToday={props.bookingsToday}
            nextFutureBookingLabel={props.nextFutureBookingLabel}
            todayEarningsUsd={props.todayEarningsUsd}
            weekToDateUsd={props.weekToDateUsd}
            weekProjectedUsd={props.weekProjectedUsd}
            onGoOnline={() => setOnline(true)}
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

function ModeToggle({ online, onToggle }: { online: boolean; onToggle: () => void }) {
  const { text, borderCol, surface, isDark } = useHomeTheme();
  const offTrackBg = isDark ? "rgba(240,235,216,0.22)" : "rgba(6,28,39,0.28)";
  const thumbColor = isDark ? "#061C27" : "#F0EBD8";

  return (
    <div
      className="mt-2 flex items-center justify-between rounded-2xl px-3 py-2.5"
      style={{
        backgroundColor: surface,
        border: `1px solid ${borderCol}`,
        // Subtle background tint shift for the mode change
        transition: "background-color 280ms ease, border-color 280ms ease",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-2.5 transition-opacity active:opacity-70"
        aria-pressed={online}
      >
        <span
          className="flex shrink-0 items-center rounded-full"
          style={{
            width: 38,
            height: 22,
            padding: 2,
            backgroundColor: online ? ORANGE : offTrackBg,
            transition: "background-color 280ms ease",
          }}
        >
          <span
            className="rounded-full"
            style={{
              width: 18,
              height: 18,
              backgroundColor: online ? "#061C27" : thumbColor,
              transform: online ? "translateX(16px)" : "translateX(0)",
              transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1), background-color 280ms ease",
              boxShadow: "0 1px 2px rgba(6,28,39,0.25)",
            }}
          />
        </span>
        <span className="flex min-w-0 flex-col items-start text-left">
          <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: text, lineHeight: 1.2 }}>
            {online ? "Online" : "Offline"}
          </span>
          <span style={{ fontFamily: UI, fontSize: 11, color: text, opacity: 0.6, lineHeight: 1.2, marginTop: 2 }}>
            {online ? "Accepting new requests" : "Not accepting new requests"}
          </span>
        </span>
      </button>

      {/* Schedule button only shown in offline mode. */}
      {!online ? (
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
  onGoOnline,
}: {
  dayContext: DevDayContext;
  bookingsToday: Booking[];
  nextFutureBookingLabel?: string;
  todayEarningsUsd: number;
  weekToDateUsd: number;
  weekProjectedUsd?: number;
  onGoOnline: () => void;
}) {
  const count = bookingsToday.length;
  const isFull = dayContext === "full" || count >= 5;
  const isMulti = !isFull && (dayContext === "multiple" || count >= 2);
  const isSingle = !isFull && !isMulti && count === 1;

  // None case: no bookings today
  if (count === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <NoBookingsHero nextFutureBookingLabel={nextFutureBookingLabel} />
        <EarningsGlance
          todayUsd={todayEarningsUsd}
          weekToDateUsd={weekToDateUsd}
          weekProjectedUsd={weekProjectedUsd}
        />
        <button
          type="button"
          onClick={onGoOnline}
          className="mt-4 self-start text-left transition-opacity active:opacity-60"
          style={{ fontFamily: UI, fontSize: 13, color: ORANGE, fontWeight: 500 }}
        >
          Go online to take immediate requests →
        </button>
      </div>
    );
  }

  // 1 scheduled today
  if (isSingle) {
    return (
      <div className="flex flex-1 flex-col">
        <SingleBookingHero booking={bookingsToday[0]} />
        <EarningsGlance
          todayUsd={todayEarningsUsd}
          weekToDateUsd={weekToDateUsd}
          weekProjectedUsd={weekProjectedUsd}
        />
      </div>
    );
  }

  // Multiple (3-4) or Full (5+)
  return (
    <div className="flex flex-1 flex-col">
      <MultiBookingHero booking={bookingsToday[0]} totalToday={count} />
      <RemainingBookings bookings={bookingsToday.slice(1)} scrollable={isFull} />
      <EarningsGlance
        todayUsd={todayEarningsUsd}
        weekToDateUsd={weekToDateUsd}
        weekProjectedUsd={weekProjectedUsd}
        sticky={isFull}
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

function SingleBookingHero({ booking }: { booking: Booking }) {
  return (
    <Card>
      <SingleBookingBody booking={booking} />
    </Card>
  );
}

function SingleBookingBody({ booking }: { booking: Booking }) {
  const { text } = useHomeTheme();
  return (
    <>
      <div className="flex items-center justify-between">
        <Eyebrow>Today</Eyebrow>
        <span style={{ fontFamily: UI, fontSize: 12, color: text, opacity: 0.65, fontWeight: 500 }}>
          {booking.startsAt} · {booking.durationMin} min
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Avatar initial={booking.clientInitial} />
        <div className="min-w-0 flex-1">
          <div className="truncate" style={{ fontFamily: UI, fontSize: 16, fontWeight: 600, color: text }}>
            {booking.clientName}
          </div>
          <div className="truncate" style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.7, marginTop: 2 }}>
            {booking.service}
          </div>
        </div>
      </div>
      {booking.address ? <AddressRow address={booking.address} /> : null}
      <button
        type="button"
        className="mt-3 self-start text-left transition-opacity active:opacity-60"
        style={{ fontFamily: UI, fontSize: 13, color: ORANGE, fontWeight: 600 }}
      >
        Details →
      </button>
    </>
  );
}

function MultiBookingHero({ booking, totalToday }: { booking: Booking; totalToday: number }) {
  return (
    <Card>
      <MultiBookingBody booking={booking} totalToday={totalToday} />
    </Card>
  );
}

function MultiBookingBody({ booking, totalToday }: { booking: Booking; totalToday: number }) {
  const { text } = useHomeTheme();
  return (
    <>
      <div className="flex items-center justify-between">
        <Eyebrow>
          Today <span style={{ marginLeft: 6, opacity: 0.65 }}>· {totalToday} bookings</span>
        </Eyebrow>
        <span style={{ fontFamily: UI, fontSize: 12, color: text, opacity: 0.65, fontWeight: 500 }}>
          {booking.startsAt} · {booking.durationMin} min
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Avatar initial={booking.clientInitial} />
        <div className="min-w-0 flex-1">
          <div className="truncate" style={{ fontFamily: UI, fontSize: 16, fontWeight: 600, color: text }}>
            {booking.clientName}
          </div>
          <div className="truncate" style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.7, marginTop: 2 }}>
            {booking.service}
          </div>
        </div>
      </div>
      {booking.address ? <AddressRow address={booking.address} /> : null}
      <button
        type="button"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 transition-transform active:scale-[0.99]"
        style={{
          backgroundColor: ORANGE,
          color: "#061C27",
          fontFamily: UI,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <PinIcon size={14} />
        Navigate
      </button>
    </>
  );
}

function RemainingBookings({ bookings, scrollable }: { bookings: Booking[]; scrollable: boolean }) {
  if (bookings.length === 0) return null;
  return (
    <section className="mt-4">
      <div
        style={{
          fontFamily: UI,
          fontSize: 10.5,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          fontWeight: 700,
          opacity: 0.55,
          marginBottom: 6,
        }}
      >
        Later today
      </div>
      <div
        className={scrollable ? "flex flex-col gap-2 overflow-y-auto" : "flex flex-col gap-2"}
        style={scrollable ? { maxHeight: 280 } : undefined}
      >
        {bookings.map((b) => (
          <CardTheme key={b.id}>
            <RemainingBookingRow booking={b} />
          </CardTheme>
        ))}
      </div>
    </section>
  );
}

function RemainingBookingRow({ booking }: { booking: Booking }) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06)",
      }}
    >
      <span
        style={{
          fontFamily: UI,
          fontSize: 12,
          fontWeight: 700,
          color: text,
          width: 48,
          flexShrink: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {booking.startsAt}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate" style={{ fontFamily: UI, fontSize: 13.5, fontWeight: 600, color: text }}>
          {booking.clientName}
        </div>
        <div className="truncate" style={{ fontFamily: UI, fontSize: 12, color: text, opacity: 0.65, marginTop: 1 }}>
          {booking.service}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Earnings glance ---------------- */

function EarningsGlance({
  todayUsd,
  weekToDateUsd,
  weekProjectedUsd,
  sticky,
}: {
  todayUsd: number;
  weekToDateUsd: number;
  weekProjectedUsd?: number;
  sticky?: boolean;
}) {
  return (
    <div className={sticky ? "mt-auto" : ""}>
      <CardTheme>
        <EarningsGlanceInner
          todayUsd={todayUsd}
          weekToDateUsd={weekToDateUsd}
          weekProjectedUsd={weekProjectedUsd}
        />
      </CardTheme>
    </div>
  );
}

function EarningsGlanceInner({
  todayUsd,
  weekToDateUsd,
  weekProjectedUsd,
}: {
  todayUsd: number;
  weekToDateUsd: number;
  weekProjectedUsd?: number;
}) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  const showPace =
    typeof weekProjectedUsd === "number" && weekProjectedUsd > weekToDateUsd && weekToDateUsd > 0;
  return (
    <button
      type="button"
      aria-label="Open earnings"
      className="mt-3 flex w-full items-center gap-2 rounded-2xl text-left transition-opacity active:opacity-70"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
        padding: "12px 14px",
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            style={{
              fontFamily: UI,
              fontSize: 10,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              color: text,
              opacity: 0.5,
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
        <div
          className="truncate"
          style={{ fontFamily: UI, fontSize: 12, color: text, opacity: 0.65, fontWeight: 500, marginTop: 2 }}
        >
          This week: <span style={{ fontWeight: 600, opacity: 1 }}>{formatUsd(weekToDateUsd)}</span>
          {showPace ? (
            <>
              {" "}
              <span style={{ color: ORANGE, fontWeight: 600 }}>
                on pace for {formatUsd(weekProjectedUsd!)}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <ChevronIcon />
    </button>
  );
}

/* ---------------- ONLINE body ---------------- */

function OnlineBody({
  onlineStatus,
  todayEarningsUsd,
}: {
  onlineStatus: DevOnlineStatus;
  todayEarningsUsd: number;
}) {
  if (onlineStatus === "incoming") {
    return <OnlinePlaceholder label="Incoming request" />;
  }
  if (onlineStatus === "active") {
    return <OnlinePlaceholder label="Active booking" />;
  }
  // "auto" + "idle" both render the idle/listening surface.
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
        Average wait in your area: 8–12 min
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

function OnlinePlaceholder({ label }: { label: string }) {
  const { text } = useHomeTheme();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <span
        style={{
          fontFamily: UI,
          fontSize: 10,
          letterSpacing: "1.6px",
          textTransform: "uppercase",
          color: ORANGE,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <p
        style={{
          fontFamily: UI,
          fontSize: 18,
          fontWeight: 600,
          color: text,
          letterSpacing: "-0.01em",
          marginTop: 10,
        }}
      >
        Coming in lifecycle pass
      </p>
      <p style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.6, marginTop: 8, maxWidth: 260 }}>
        This screen will be built once the request lifecycle (incoming → accept → active → complete) is wired up.
      </p>
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

function AddressRow({ address }: { address: string }) {
  const { text } = useHomeTheme();
  return (
    <div className="mt-2 flex items-start gap-1.5" style={{ color: text, opacity: 0.7 }}>
      <span style={{ marginTop: 1 }}>
        <PinIcon size={12} />
      </span>
      <span style={{ fontFamily: UI, fontSize: 12, lineHeight: 1.35 }}>{address}</span>
    </div>
  );
}

function Avatar({ initial }: { initial: string }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: 40,
        height: 40,
        backgroundColor: "rgba(255,130,63,0.14)",
        border: "1px solid rgba(255,130,63,0.40)",
        color: "#061C27",
        fontFamily: UI,
        fontSize: 16,
        fontWeight: 700,
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