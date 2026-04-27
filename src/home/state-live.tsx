import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HOME_SANS, useHomeTheme } from "./home-shell";
import { EwaMark } from "@/components/ewa-logo";
import {
  type Booking,
  type BookingRequest,
  type IncomingRequest,
  type LiveStatus,
  type OnlineState,
  type PendingOnDemand,
  formatUsd,
} from "@/data/mock-data";
import { useReschedule, formatTimeLeft } from "@/calendar/reschedule-context";

/**
 * Native-mobile working surface for a beauty pro who travels to clients.
 *
 * Hierarchy (top → bottom), tuned for one-handed scanning under 2 seconds:
 *
 *   1. Header           — bagel logomark (left), notifications bell (right) with badge
 *   2. Auto-offline ban — dismissible, only when work hours just ended
 *   3. Status (toggle)  — Smart Online toggle + Calendar glyph button
 *   4. Up Next          — hero card with the next confirmed booking
 *                         (or pending on-demand request, with countdown)
 *   5. Waiting on you   — pending scheduled requests (hidden if empty)
 *   6. Today summary    — "N more jobs · $X projected" one-liner
 *   7. Earnings         — Today / This week / weekly goal progress
 *   8. Notifications    — last 2 unread (hidden if empty)
 *   9. Portfolio prompt — only when there's a reason to act
 *
 * Inter only. No serif. No exclamation. Times "2:30 PM".
 */

const UI = `Inter, ${HOME_SANS}`;
const ORANGE = "#FF823F";
const ON_PACE = "#7FB996";

export interface StateLiveProps {
  greetingName: string;
  weekToDateUsd: number;
  monthToDateUsd: number;
  bookingsToday: Booking[];
  pendingRequests: BookingRequest[];
  bookingLink?: string;
  nextOpenSlot?: string;
  ratingValue?: number;
  ratingCount?: number;
  completionPct?: number;
  todayEarningsUsd?: number;
  todayProjectedUsd?: number;
  /** Live work status — drives the hero card. */
  liveStatus?: LiveStatus;
  /** When set, full-screen incoming-request modal renders over the surface. */
  incomingRequest?: IncomingRequest;
  /** When set, hero card becomes a pending on-demand request with countdown. */
  pendingOnDemand?: PendingOnDemand;
  /** Smart Online toggle state — defaults to "available". */
  onlineState?: OnlineState;
  /** Weekly earnings goal (USD). */
  weeklyGoalUsd?: number;
}

export function StateLive({
  bookingsToday,
  pendingRequests,
  nextOpenSlot,
  weekToDateUsd = 0,
  todayEarningsUsd = 0,
  todayProjectedUsd = 0,
  liveStatus = { kind: "idle" },
  incomingRequest,
  pendingOnDemand,
  onlineState = { kind: "available" },
  weeklyGoalUsd = 1500,
}: StateLiveProps) {
  const navigate = useNavigate();

  // Local toggle state — initialised from server-provided onlineState
  const [state, setState] = useState<OnlineState>(onlineState);
  // re-sync if parent changes (e.g. ?toggle=… preview overrides)
  useEffect(() => setState(onlineState), [onlineState]);

  const [blocked, setBlocked] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const isOnline =
    state.kind === "available" || state.kind === "after-hours-online" || state.kind === "protecting";
  const isLocked = state.kind === "outside-hours" || state.kind === "on-booking";

  // If pro is offline (any reason), the incoming on-demand modal must not appear.
  const incoming = isOnline ? incomingRequest : undefined;
  const onDemand = isOnline ? pendingOnDemand : undefined;

  const nextBooking = bookingsToday[0];
  const remainingCount = Math.max(0, bookingsToday.length - 1);
  const projectedRemaining = Math.max(0, todayProjectedUsd - todayEarningsUsd);

  const handleToggle = () => {
    if (isLocked) return;
    if (!isOnline) {
      // Trying to come online while a near-term booking would conflict
      if (state.kind === "manual-offline" && nextBooking?.startsAt === "1:30") {
        setBlocked(true);
        return;
      }
      setState({ kind: "available" });
      return;
    }
    setState({ kind: "manual-offline" });
  };

  const showAutoOfflineBanner =
    !bannerDismissed && state.autoOfflineBanner && state.kind === "manual-offline";

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-4 pb-2 pt-1">
      <Header unreadCount={pendingRequests.length} />

      {showAutoOfflineBanner ? (
        <AutoOfflineBanner
          endedAt={state.workHoursEndedAt ?? "7 PM"}
          onAccept={() => {
            setState({ kind: "after-hours-online" });
            setBannerDismissed(true);
          }}
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}

      <StatusBar
        state={state}
        onToggle={handleToggle}
        onCalendar={() => navigate({ to: "/bookings" })}
      />

      {blocked ? (
        <BlockedExplain
          time={nextBooking?.startsAt ? `${nextBooking.startsAt} ${nextBooking.startsAtMeridiem ?? "PM"}` : "1:30 PM"}
          onOpenCalendar={() => navigate({ to: "/bookings" })}
          onDismiss={() => setBlocked(false)}
        />
      ) : null}

      {onDemand ? (
        <PendingOnDemandHero request={onDemand} />
      ) : nextBooking ? (
        <UpNextCard booking={nextBooking} liveStatus={liveStatus} />
      ) : (
        <QuietHero
          isOnline={isOnline}
          nextOpenSlot={nextOpenSlot}
        />
      )}

      {pendingRequests.length > 0 ? (
        <PendingRequests requests={pendingRequests} />
      ) : null}

      {bookingsToday.length > 0 ? (
        <TodaySummary
          remainingCount={remainingCount}
          projectedRemainingUsd={projectedRemaining}
          onOpen={() => navigate({ to: "/bookings" })}
        />
      ) : null}

      <EarningsSnapshot
        todayUsd={todayEarningsUsd}
        weekUsd={weekToDateUsd}
        weeklyGoalUsd={weeklyGoalUsd}
        onOpen={() => navigate({ to: "/home", search: { state: "live" } })}
      />

      <NotificationsPreview />

      <PortfolioPrompt />

      {incoming ? <IncomingRequestModal request={incoming} /> : null}
    </div>
  );
}

/* ---------------- Header ---------------- */

function Header({ unreadCount }: { unreadCount: number }) {
  const { text, borderCol, bg } = useHomeTheme();
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
          backgroundColor: "rgba(240,235,216,0.04)",
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

/* ---------------- Auto-offline banner ---------------- */

function AutoOfflineBanner({
  endedAt,
  onAccept,
  onDismiss,
}: {
  endedAt: string;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { text, borderCol } = useHomeTheme();
  return (
    <div
      className="mt-2 flex items-center gap-3 rounded-2xl px-3.5 py-2.5"
      style={{
        backgroundColor: "rgba(240,235,216,0.04)",
        border: `1px solid ${borderCol}`,
      }}
      role="status"
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: 22, height: 22, backgroundColor: "rgba(240,235,216,0.06)", color: text, opacity: 0.85 }}
      >
        <ClockIcon size={12} />
      </span>
      <div className="min-w-0 flex-1">
        <div style={{ fontFamily: UI, fontSize: 12.5, color: text, fontWeight: 600, lineHeight: 1.3 }}>
          Your work hours ended at {endedAt}.
        </div>
        <div style={{ fontFamily: UI, fontSize: 11.5, color: text, opacity: 0.6, marginTop: 1 }}>
          You're offline. Tap to keep accepting requests.
        </div>
      </div>
      <button
        type="button"
        onClick={onAccept}
        className="rounded-full px-3 py-1.5 transition-transform active:scale-95"
        style={{
          backgroundColor: ORANGE,
          color: "#061C27",
          fontFamily: UI,
          fontSize: 11.5,
          fontWeight: 700,
        }}
      >
        Stay on
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex shrink-0 items-center justify-center rounded-full transition-opacity active:opacity-60"
        style={{ width: 22, height: 22, color: text, opacity: 0.5 }}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

/* ---------------- Status bar (Smart Online toggle) ---------------- */

function StatusBar({
  state,
  onToggle,
  onCalendar,
}: {
  state: OnlineState;
  onToggle: () => void;
  onCalendar: () => void;
}) {
  const { text, borderCol } = useHomeTheme();

  const meta = describeOnlineState(state);
  const showHandle = meta.toggleOn;

  return (
    <div
      className="mt-2 flex items-center justify-between rounded-full pl-2 pr-2 py-1.5"
      style={{
        backgroundColor: "rgba(240,235,216,0.04)",
        border: `1px solid ${meta.borderColor ?? borderCol}`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={meta.locked}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full pl-1 pr-2 py-1 transition-opacity active:opacity-70"
        style={{
          opacity: meta.locked ? 0.85 : 1,
          cursor: meta.locked ? "not-allowed" : "pointer",
        }}
        aria-pressed={meta.toggleOn}
        aria-disabled={meta.locked}
      >
        <span
          className="flex shrink-0 items-center rounded-full"
          style={{
            width: 34,
            height: 20,
            padding: 2,
            backgroundColor: meta.toggleOn ? ORANGE : "rgba(240,235,216,0.18)",
            transition: "background-color 200ms ease",
            opacity: meta.throttled ? 0.55 : 1,
          }}
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 16,
              height: 16,
              backgroundColor: "#061C27",
              transform: showHandle ? "translateX(14px)" : "translateX(0)",
              transition: "transform 200ms ease",
              color: ORANGE,
            }}
          >
            {meta.glyph === "shield" ? <ShieldGlyph /> : null}
            {meta.glyph === "lock" ? <LockGlyph /> : null}
            {meta.glyph === "clock" ? <ClockGlyph /> : null}
          </span>
        </span>
        <span className="flex min-w-0 flex-col items-start text-left">
          <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: text, lineHeight: 1.2 }}>
            {meta.title}
          </span>
          <span
            className="truncate"
            style={{ fontFamily: UI, fontSize: 11, color: text, opacity: 0.6, lineHeight: 1.2, marginTop: 2, maxWidth: 220 }}
          >
            {meta.subtitle}
          </span>
        </span>
      </button>

      <button
        type="button"
        aria-label="Open calendar"
        onClick={onCalendar}
        className="flex shrink-0 items-center justify-center rounded-full transition-opacity active:opacity-70"
        style={{
          width: 34,
          height: 34,
          border: `1px solid ${borderCol}`,
          color: text,
        }}
      >
        <CalendarIcon size={15} />
      </button>
    </div>
  );
}

function describeOnlineState(state: OnlineState): {
  title: string;
  subtitle: string;
  toggleOn: boolean;
  locked: boolean;
  throttled: boolean;
  glyph?: "shield" | "lock" | "clock";
  borderColor?: string;
} {
  switch (state.kind) {
    case "available":
      return {
        title: "Online",
        subtitle: "Accepting requests",
        toggleOn: true,
        locked: false,
        throttled: false,
      };
    case "protecting":
      return {
        title: "Protecting your " + (state.protectingTime ?? "next booking"),
        subtitle: "Holding intake until you head out",
        toggleOn: true,
        locked: false,
        throttled: true,
        glyph: "shield",
        borderColor: "rgba(255,130,63,0.35)",
      };
    case "outside-hours":
      return {
        title: "Outside work hours",
        subtitle: state.resumesAt ? `Resumes ${state.resumesAt}` : "Locked until your next shift",
        toggleOn: false,
        locked: true,
        throttled: false,
        glyph: "lock",
      };
    case "on-booking":
      return {
        title: "On a booking",
        subtitle: "Auto-resumes when complete",
        toggleOn: false,
        locked: true,
        throttled: false,
        glyph: "lock",
      };
    case "manual-offline":
      return {
        title: "Offline",
        subtitle: "Not accepting requests",
        toggleOn: false,
        locked: false,
        throttled: false,
      };
    case "after-hours-online":
      return {
        title: "Online · past hours",
        subtitle: "Accepting requests",
        toggleOn: true,
        locked: false,
        throttled: false,
        glyph: "clock",
      };
  }
}

/* ---------------- Blocked attempt explain ---------------- */

function BlockedExplain({
  time,
  onOpenCalendar,
  onDismiss,
}: {
  time: string;
  onOpenCalendar: () => void;
  onDismiss: () => void;
}) {
  const { text } = useHomeTheme();
  return (
    <div
      className="mt-2 rounded-2xl px-3.5 py-3"
      style={{
        backgroundColor: "rgba(255,130,63,0.08)",
        border: "1px solid rgba(255,130,63,0.40)",
      }}
      role="alert"
    >
      <div style={{ fontFamily: UI, fontSize: 12.5, color: text, fontWeight: 600, lineHeight: 1.4 }}>
        You have an upcoming appointment at {time}.
      </div>
      <div style={{ fontFamily: UI, fontSize: 12, color: text, opacity: 0.7, marginTop: 4, lineHeight: 1.4 }}>
        Going online now would conflict. Edit the appointment or wait.
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenCalendar}
          style={{ fontFamily: UI, fontSize: 12.5, fontWeight: 600, color: ORANGE, background: "none", border: "none" }}
        >
          Open calendar →
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={{ fontFamily: UI, fontSize: 12.5, fontWeight: 500, color: text, opacity: 0.55, background: "none", border: "none" }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/* ---------------- Up Next card ---------------- */

function UpNextCard({ booking, liveStatus }: { booking: Booking; liveStatus: LiveStatus }) {
  const { text, borderCol } = useHomeTheme();
  const { proposalFor, tick } = useReschedule();
  const proposal = proposalFor(booking.id);
  const pendingReschedule =
    proposal && proposal.status === "pending"
      ? { timeLeftLabel: formatTimeLeft(proposal.expiresAt.getTime() - Date.now()) }
      : null;
  // tick consumed for re-render
  void tick;
  const [earlyOpen, setEarlyOpen] = useState(false);
  const [earlyState, setEarlyState] = useState<
    "idle" | "asking" | "confirmed" | "client-prefers-original" | "expired"
  >("idle");

  // EN-ROUTE override
  if (liveStatus.kind === "en-route") {
    return (
      <Card emphasis="primary">
        <Eyebrow color={ORANGE}>
          <PulseDot /> En route · ETA {liveStatus.etaMin ?? 0} min
        </Eyebrow>
        <ClientLine booking={booking} />
        <AddressRow booking={booking} />
        <PrimaryAction label="Open navigation" icon="map" />
        <SecondaryStrip
          actions={[
            { label: "Message", icon: "msg" },
            { label: "Call", icon: "call" },
          ]}
        />
      </Card>
    );
  }

  // IN-PROGRESS override
  if (liveStatus.kind === "in-progress") {
    return (
      <Card emphasis="primary">
        <Eyebrow color={ORANGE}>
          <PulseDot /> In progress · {liveStatus.elapsedMin ?? 0} min
        </Eyebrow>
        <ClientLine booking={booking} />
        <AddressRow booking={booking} />
        <PrimaryAction label="Mark complete" icon="check" />
        <SecondaryStrip
          actions={[
            { label: "Message", icon: "msg" },
            { label: "Call", icon: "call" },
          ]}
        />
      </Card>
    );
  }

  // UP NEXT (default)
  return (
    <Card>
      <div className="flex items-center justify-between">
        <Eyebrow>Up Next</Eyebrow>
        <span style={{ fontFamily: UI, fontSize: 12, color: text, opacity: 0.6, fontWeight: 600 }}>
          {booking.startsAt} {booking.startsAtMeridiem ?? ""} · {booking.durationMin} min
        </span>
      </div>
      {pendingReschedule ? (
        <div
          className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full"
          style={{
            backgroundColor: "rgba(255,130,63,0.16)",
            color: "#FF823F",
            padding: "4px 10px",
            fontFamily: UI,
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            border: "1px solid rgba(255,130,63,0.55)",
            width: "fit-content",
          }}
        >
          <span
            aria-hidden
            className="rounded-full"
            style={{ width: 6, height: 6, backgroundColor: ORANGE }}
          />
          Pending reschedule · {pendingReschedule.timeLeftLabel}
        </div>
      ) : null}
      <ClientLine booking={booking} />
      <AddressRow booking={booking} />
      <PrimaryAction label="Start navigation" icon="map" />
      <SecondaryStrip
        actions={[
          { label: "Message", icon: "msg" },
          { label: "Call", icon: "call" },
        ]}
      />

      {/* Early-departure inline flow */}
      {booking.scheduledDepartureAt ? (
        <div
          className="mt-3 rounded-xl px-3 py-2.5"
          style={{
            backgroundColor: "rgba(240,235,216,0.035)",
            border: `1px dashed ${borderCol}`,
          }}
        >
          {earlyState === "idle" && !earlyOpen ? (
            <button
              type="button"
              onClick={() => setEarlyOpen(true)}
              className="flex w-full items-center justify-between text-left"
            >
              <span style={{ fontFamily: UI, fontSize: 12.5, color: text, fontWeight: 600 }}>
                Ready early? Head out now.
              </span>
              <ChevronIcon />
            </button>
          ) : null}

          {earlyState === "idle" && earlyOpen ? (
            <div>
              <div style={{ fontFamily: UI, fontSize: 12, color: text, opacity: 0.7, lineHeight: 1.45 }}>
                We'll ask {firstName(booking.clientName)} if an early arrival works. Departure {booking.scheduledDepartureAt} → now.
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEarlyState("asking")}
                  className="flex-1 rounded-lg py-2 transition-transform active:scale-[0.99]"
                  style={{
                    backgroundColor: ORANGE,
                    color: "#061C27",
                    fontFamily: UI,
                    fontSize: 12.5,
                    fontWeight: 700,
                  }}
                >
                  Ask client
                </button>
                <button
                  type="button"
                  onClick={() => setEarlyOpen(false)}
                  style={{
                    fontFamily: UI,
                    fontSize: 12,
                    color: text,
                    opacity: 0.55,
                    background: "none",
                    border: "none",
                    padding: "8px 6px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {earlyState === "asking" ? (
            <div>
              <div style={{ fontFamily: UI, fontSize: 12, color: text, opacity: 0.75, lineHeight: 1.45 }}>
                Asked {firstName(booking.clientName)} — waiting on reply. We'll hold for 5 min before reverting to {booking.scheduledDepartureAt}.
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEarlyState("confirmed")}
                  style={{
                    fontFamily: UI,
                    fontSize: 12,
                    color: ON_PACE,
                    background: "none",
                    border: "none",
                    padding: "4px 0",
                    fontWeight: 600,
                  }}
                >
                  · client confirms
                </button>
                <button
                  type="button"
                  onClick={() => setEarlyState("client-prefers-original")}
                  style={{
                    fontFamily: UI,
                    fontSize: 12,
                    color: text,
                    opacity: 0.6,
                    background: "none",
                    border: "none",
                    padding: "4px 0",
                  }}
                >
                  · client prefers original
                </button>
                <button
                  type="button"
                  onClick={() => setEarlyState("expired")}
                  style={{
                    fontFamily: UI,
                    fontSize: 12,
                    color: text,
                    opacity: 0.5,
                    background: "none",
                    border: "none",
                    padding: "4px 0",
                  }}
                >
                  · no reply
                </button>
              </div>
            </div>
          ) : null}

          {earlyState === "confirmed" ? (
            <div style={{ fontFamily: UI, fontSize: 12.5, color: ON_PACE, fontWeight: 600, lineHeight: 1.4 }}>
              Confirmed. Head out — new ETA shared with {firstName(booking.clientName)}.
            </div>
          ) : null}

          {earlyState === "client-prefers-original" ? (
            <div style={{ fontFamily: UI, fontSize: 12.5, color: text, opacity: 0.8, lineHeight: 1.4 }}>
              {firstName(booking.clientName)} prefers {booking.startsAt} {booking.startsAtMeridiem ?? ""} — slow down or wait nearby.
            </div>
          ) : null}

          {earlyState === "expired" ? (
            <div style={{ fontFamily: UI, fontSize: 12.5, color: text, opacity: 0.7, lineHeight: 1.4 }}>
              No reply yet — head out at {booking.scheduledDepartureAt} as scheduled.
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function ClientLine({ booking }: { booking: Booking }) {
  const { text } = useHomeTheme();
  return (
    <div className="mt-2 flex items-center gap-3">
      <Avatar initial={booking.clientInitial} />
      <div className="min-w-0 flex-1">
        <div className="truncate" style={{ fontFamily: UI, fontSize: 17, fontWeight: 600, color: text, letterSpacing: "-0.01em" }}>
          {firstName(booking.clientName)}
          {booking.isNewClient ? <NewBadge /> : null}
        </div>
        <div className="truncate" style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.7, marginTop: 2 }}>
          {booking.service}
        </div>
      </div>
    </div>
  );
}

function AddressRow({ booking }: { booking: Booking }) {
  const { text } = useHomeTheme();
  if (!booking.address) return null;
  return (
    <div className="mt-2.5 flex items-start gap-1.5" style={{ color: text, opacity: 0.75 }}>
      <span style={{ marginTop: 2 }}>
        <PinIcon size={12} />
      </span>
      <span style={{ fontFamily: UI, fontSize: 12, lineHeight: 1.4 }}>
        {booking.address}
        {booking.distance ? <span style={{ opacity: 0.65 }}> · {booking.distance}</span> : null}
      </span>
    </div>
  );
}

function firstName(full: string): string {
  return full.split(/\s+/)[0];
}

/* ---------------- Pending on-demand hero (replaces Up Next) ---------------- */

function PendingOnDemandHero({ request }: { request: PendingOnDemand }) {
  const { text, borderCol } = useHomeTheme();
  const [secondsLeft, setSecondsLeft] = useState(request.secondsLeft);
  const startedAt = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      setSecondsLeft(Math.max(0, request.secondsLeft - elapsed));
    }, 250);
    return () => clearInterval(id);
  }, [request.secondsLeft]);

  const pct = Math.max(0, (secondsLeft / request.secondsLeft) * 100);

  return (
    <Card emphasis="primary">
      <div className="flex items-center justify-between">
        <Eyebrow color={ORANGE}>
          <PulseDot /> On-demand request
        </Eyebrow>
        <span style={{ fontFamily: UI, fontSize: 12, fontWeight: 700, color: ORANGE }}>
          {secondsLeft}s
        </span>
      </div>

      <div
        className="mt-2 h-1 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "rgba(255,130,63,0.18)" }}
      >
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            backgroundColor: ORANGE,
            transition: "width 250ms linear",
          }}
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Avatar initial={request.clientInitial} />
        <div className="min-w-0 flex-1">
          <div className="truncate" style={{ fontFamily: UI, fontSize: 17, fontWeight: 600, color: text, letterSpacing: "-0.01em" }}>
            {firstName(request.clientName)}
          </div>
          <div className="truncate" style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.7, marginTop: 2 }}>
            {request.service}
          </div>
        </div>
        <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 700, color: text }}>
          {formatUsd(request.payoutUsd)}
        </span>
      </div>

      <div
        className="mt-2.5 flex items-center gap-3"
        style={{ fontFamily: UI, fontSize: 12, color: text, opacity: 0.75 }}
      >
        <span><PinIcon size={12} /> {request.distance}</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>ETA {request.etaMin} min</span>
      </div>

      <div className="mt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${borderCol}`, marginInline: -16, paddingTop: 12, paddingInline: 12 }}>
        <button
          type="button"
          className="flex-1 rounded-xl py-3 transition-transform active:scale-[0.99]"
          style={{
            backgroundColor: ORANGE,
            color: "#061C27",
            fontFamily: UI,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Accept
        </button>
        <button
          type="button"
          className="rounded-xl px-4 py-3 transition-opacity active:opacity-60"
          style={{
            color: text,
            opacity: 0.55,
            fontFamily: UI,
            fontSize: 13,
            fontWeight: 500,
            background: "transparent",
            border: "none",
          }}
        >
          Decline
        </button>
      </div>
    </Card>
  );
}

/* ---------------- Quiet hero ---------------- */

function QuietHero({ isOnline, nextOpenSlot }: { isOnline: boolean; nextOpenSlot?: string }) {
  const { text } = useHomeTheme();
  return (
    <Card>
      <Eyebrow>Today</Eyebrow>
      <p style={{ fontFamily: UI, fontSize: 17, fontWeight: 500, color: text, marginTop: 8, letterSpacing: "-0.01em" }}>
        {isOnline ? "No bookings today." : "You're offline."}
      </p>
      <p style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.6, marginTop: 4 }}>
        {isOnline
          ? nextOpenSlot
            ? `Your next open slot is ${nextOpenSlot}.`
            : "Open more availability to fill the day."
          : "Toggle online to start accepting new requests."}
      </p>
      {isOnline ? <PrimaryAction label="Open more availability" subtle /> : null}
    </Card>
  );
}

/* ---------------- Card primitives ---------------- */

function Card({ children, emphasis }: { children: React.ReactNode; emphasis?: "primary" }) {
  const { borderCol } = useHomeTheme();
  return (
    <div
      className="mt-3 rounded-2xl px-4 py-4"
      style={{
        backgroundColor: "rgba(240,235,216,0.05)",
        border: `1px solid ${emphasis === "primary" ? "rgba(255,130,63,0.45)" : borderCol}`,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  const { text } = useHomeTheme();
  return (
    <div
      className="flex items-center gap-1.5"
      style={{
        fontFamily: UI,
        fontSize: 10.5,
        letterSpacing: "1.4px",
        textTransform: "uppercase",
        color: color ?? text,
        opacity: color ? 1 : 0.55,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}

function PulseDot() {
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: 6,
        height: 6,
        backgroundColor: ORANGE,
        marginRight: 4,
        animation: "ewa-pulse 1600ms ease-in-out infinite",
      }}
    />
  );
}

function NewBadge() {
  return (
    <span
      className="ml-2 inline-block rounded-full px-1.5 py-px align-middle"
      style={{
        fontFamily: UI,
        fontSize: 9,
        letterSpacing: "1.2px",
        textTransform: "uppercase",
        color: ORANGE,
        backgroundColor: "rgba(255,130,63,0.12)",
        border: "1px solid rgba(255,130,63,0.35)",
        fontWeight: 700,
      }}
    >
      New
    </span>
  );
}

function PrimaryAction({
  label,
  icon,
  subtle,
}: {
  label: string;
  icon?: "map" | "check";
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 transition-transform active:scale-[0.99]"
      style={{
        backgroundColor: subtle ? "transparent" : ORANGE,
        color: subtle ? ORANGE : "#061C27",
        border: subtle ? `1px solid ${ORANGE}` : "none",
        fontFamily: UI,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "-0.005em",
      }}
    >
      {icon === "map" ? <NavIcon size={14} /> : null}
      {icon === "check" ? <CheckIcon size={14} /> : null}
      {label}
    </button>
  );
}

function SecondaryStrip({
  actions,
}: {
  actions: { label: string; icon: "msg" | "map" | "check" | "call" }[];
}) {
  const { text, borderCol } = useHomeTheme();
  return (
    <div
      className="mt-3 flex divide-x"
      style={{
        borderTop: `1px solid ${borderCol}`,
        marginInline: -16,
        paddingInline: 0,
        marginBottom: -16,
      }}
    >
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 py-3 transition-opacity active:opacity-60"
          style={{ fontFamily: UI, fontSize: 12.5, fontWeight: 500, color: text, opacity: 0.85 }}
        >
          {a.icon === "msg" ? <MessageIcon /> : null}
          {a.icon === "map" ? <NavIcon size={14} /> : null}
          {a.icon === "check" ? <CheckIcon size={14} /> : null}
          {a.icon === "call" ? <PhoneIcon /> : null}
          {a.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Pending requests (scheduled) ---------------- */

function PendingRequests({ requests }: { requests: BookingRequest[] }) {
  const { text, borderCol } = useHomeTheme();
  const [resolved, setResolved] = useState<Record<string, "accept" | "decline">>({});

  return (
    <section className="mt-5">
      <SectionHeader label="Waiting on you" count={requests.length} />
      <div className="mt-2 flex flex-col gap-2">
        {requests.map((r) => {
          const state = resolved[r.id];
          return (
            <div
              key={r.id}
              className="rounded-2xl px-3.5 py-3"
              style={{
                backgroundColor: "rgba(240,235,216,0.045)",
                border: `1px solid ${borderCol}`,
                opacity: state ? 0.55 : 1,
                transition: "opacity 250ms ease",
              }}
            >
              <div className="flex items-start gap-3">
                <Avatar initial={r.clientInitial} small />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="truncate"
                      style={{ fontFamily: UI, fontSize: 14, color: text, fontWeight: 600 }}
                    >
                      {r.clientName}
                    </span>
                    <span style={{ fontFamily: UI, fontSize: 14, color: text, fontWeight: 700 }}>
                      {formatUsd(r.priceUsd)}
                    </span>
                  </div>
                  <div
                    className="truncate"
                    style={{ fontFamily: UI, fontSize: 12.5, color: text, opacity: 0.7, marginTop: 1 }}
                  >
                    {r.service}
                  </div>
                  <div
                    className="flex flex-wrap items-center gap-x-2"
                    style={{ fontFamily: UI, fontSize: 11.5, color: text, opacity: 0.6, marginTop: 4 }}
                  >
                    <span style={{ color: ORANGE, opacity: 1, fontWeight: 600 }}>{r.requestedFor}</span>
                    {r.location ? <span aria-hidden>·</span> : null}
                    {r.location ? <span>{r.location}</span> : null}
                  </div>
                </div>
              </div>

              {!state ? (
                <div className="mt-3 flex items-center gap-2" style={{ paddingLeft: 44 }}>
                  <button
                    type="button"
                    onClick={() => setResolved((s) => ({ ...s, [r.id]: "accept" }))}
                    className="flex-1 rounded-xl py-2 transition-transform active:scale-[0.98]"
                    style={{
                      backgroundColor: ORANGE,
                      color: "#061C27",
                      fontFamily: UI,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolved((s) => ({ ...s, [r.id]: "decline" }))}
                    className="rounded-xl px-3 py-2 transition-opacity active:opacity-60"
                    style={{
                      backgroundColor: "transparent",
                      color: text,
                      opacity: 0.6,
                      fontFamily: UI,
                      fontSize: 12.5,
                      fontWeight: 500,
                    }}
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: UI,
                    fontSize: 11.5,
                    color: state === "accept" ? ORANGE : text,
                    opacity: state === "accept" ? 1 : 0.5,
                    marginTop: 8,
                    paddingLeft: 44,
                    fontWeight: 600,
                  }}
                >
                  {state === "accept" ? "Accepted — client notified." : "Declined."}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Today summary one-liner ---------------- */

function TodaySummary({
  remainingCount,
  projectedRemainingUsd,
  onOpen,
}: {
  remainingCount: number;
  projectedRemainingUsd: number;
  onOpen: () => void;
}) {
  const { text, borderCol } = useHomeTheme();
  if (remainingCount === 0 && projectedRemainingUsd === 0) return null;

  const label =
    remainingCount === 0
      ? "All wrapped for today"
      : `${remainingCount} more ${remainingCount === 1 ? "job" : "jobs"} today`;
  const right =
    projectedRemainingUsd > 0 ? ` · ${formatUsd(projectedRemainingUsd)} projected` : "";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-3 flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-opacity active:opacity-70"
      style={{
        backgroundColor: "rgba(240,235,216,0.035)",
        border: `1px solid ${borderCol}`,
      }}
      aria-label="Open today's calendar"
    >
      <span style={{ fontFamily: UI, fontSize: 12.5, color: text, fontWeight: 500 }}>
        {label}<span style={{ opacity: 0.6 }}>{right}</span>
      </span>
      <ChevronIcon />
    </button>
  );
}

/* ---------------- Earnings snapshot (with goal) ---------------- */

function EarningsSnapshot({
  todayUsd,
  weekUsd,
  weeklyGoalUsd,
  onOpen,
}: {
  todayUsd: number;
  weekUsd: number;
  weeklyGoalUsd: number;
  onOpen: () => void;
}) {
  const { text, borderCol } = useHomeTheme();
  const pct = weeklyGoalUsd > 0 ? Math.min(100, Math.round((weekUsd / weeklyGoalUsd) * 100)) : 0;
  // Naive on-pace check: weekUsd / dayOfWeek*7 >= weeklyGoalUsd
  const dayOfWeek = Math.max(1, new Date().getDay() || 7);
  const projection = Math.round((weekUsd / dayOfWeek) * 7);
  const onPace = projection >= weeklyGoalUsd;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-3 flex w-full flex-col rounded-2xl px-3.5 py-3 text-left transition-opacity active:opacity-70"
      style={{
        backgroundColor: "rgba(240,235,216,0.04)",
        border: `1px solid ${borderCol}`,
      }}
      aria-label="Open earnings"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <div className="flex flex-col">
            <span style={{ fontFamily: UI, fontSize: 9.5, letterSpacing: "1.2px", textTransform: "uppercase", color: text, opacity: 0.5, fontWeight: 700 }}>
              Today
            </span>
            <span style={{ fontFamily: UI, fontSize: 20, fontWeight: 700, color: text, letterSpacing: "-0.02em", marginTop: 2, lineHeight: 1 }}>
              {formatUsd(todayUsd)}
            </span>
          </div>
          <div className="flex flex-col">
            <span style={{ fontFamily: UI, fontSize: 9.5, letterSpacing: "1.2px", textTransform: "uppercase", color: text, opacity: 0.5, fontWeight: 700 }}>
              This week
            </span>
            <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 600, color: text, opacity: 0.85, letterSpacing: "-0.01em", marginTop: 2, lineHeight: 1 }}>
              {formatUsd(weekUsd)}
            </span>
          </div>
        </div>
        <ChevronIcon />
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <div className="relative flex-1 overflow-hidden rounded-full" style={{ height: 4, backgroundColor: "rgba(240,235,216,0.10)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              backgroundColor: onPace ? ON_PACE : ORANGE,
              transition: "width 400ms ease",
            }}
          />
        </div>
        <span style={{ fontFamily: UI, fontSize: 11, color: text, opacity: 0.6, fontWeight: 600, whiteSpace: "nowrap" }}>
          {pct}% of {formatUsd(weeklyGoalUsd)}
        </span>
      </div>

      {weekUsd > 0 ? (
        <span style={{ fontFamily: UI, fontSize: 11, color: onPace ? ON_PACE : text, opacity: onPace ? 0.95 : 0.55, fontWeight: 600, marginTop: 6 }}>
          {onPace ? `On pace · ${formatUsd(projection)} projected` : `Projected ${formatUsd(projection)}`}
        </span>
      ) : null}
    </button>
  );
}

/* ---------------- Notifications preview ---------------- */

interface NotifRow {
  id: string;
  icon: "msg" | "calendar" | "star";
  text: string;
  ago: string;
}

const NOTIF_PREVIEW: NotifRow[] = [
  { id: "n1", icon: "msg", text: "Maya replied to your message", ago: "12m" },
  { id: "n2", icon: "calendar", text: "Booking confirmed · Imani · 4:57 PM", ago: "1h" },
];

function NotificationsPreview() {
  const { text, borderCol } = useHomeTheme();
  if (NOTIF_PREVIEW.length === 0) return null;
  return (
    <section className="mt-3">
      <div
        className="rounded-2xl"
        style={{
          backgroundColor: "rgba(240,235,216,0.035)",
          border: `1px solid ${borderCol}`,
        }}
      >
        {NOTIF_PREVIEW.map((n, i) => (
          <button
            key={n.id}
            type="button"
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-opacity active:opacity-70"
            style={{
              borderTop: i === 0 ? "none" : `1px solid ${borderCol}`,
            }}
          >
            <span
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{
                width: 22,
                height: 22,
                backgroundColor: "rgba(240,235,216,0.06)",
                color: text,
              }}
            >
              {n.icon === "msg" ? <MessageIcon /> : n.icon === "calendar" ? <CalendarIcon size={11} /> : <span style={{ color: ORANGE, fontSize: 11 }}>★</span>}
            </span>
            <span
              className="flex-1 truncate"
              style={{ fontFamily: UI, fontSize: 12.5, color: text, fontWeight: 500 }}
            >
              {n.text}
            </span>
            <span style={{ fontFamily: UI, fontSize: 11, color: text, opacity: 0.5, fontWeight: 500 }}>
              {n.ago}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Portfolio prompt (conditional) ---------------- */

interface PortfolioPromptData {
  clientFirst: string;
  service: string;
  ago: string;
}

const PORTFOLIO_PROMPT: PortfolioPromptData | null = {
  clientFirst: "Maya",
  service: "silk press",
  ago: "2 days ago",
};

function PortfolioPrompt() {
  const { text, borderCol } = useHomeTheme();
  if (!PORTFOLIO_PROMPT) return null;
  const { clientFirst, service, ago } = PORTFOLIO_PROMPT;
  return (
    <button
      type="button"
      className="mt-3 flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left transition-opacity active:opacity-70"
      style={{
        backgroundColor: "rgba(240,235,216,0.035)",
        border: `1px dashed ${borderCol}`,
      }}
      aria-label="Add portfolio photos"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: 26,
            height: 26,
            backgroundColor: "rgba(255,130,63,0.14)",
            border: "1px solid rgba(255,130,63,0.40)",
            color: ORANGE,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="m3 17 5-4 4 3 4-5 5 6" />
          </svg>
        </span>
        <div className="min-w-0 flex flex-col">
          <span className="truncate" style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: text }}>
            Add photos from {clientFirst}'s {service}
          </span>
          <span style={{ fontFamily: UI, fontSize: 11, color: text, opacity: 0.55, marginTop: 1, fontWeight: 500 }}>
            {ago}
          </span>
        </div>
      </div>
      <ChevronIcon />
    </button>
  );
}

/* ---------------- Section header ---------------- */

function SectionHeader({ label, count }: { label: string; count?: number }) {
  const { text } = useHomeTheme();
  return (
    <div className="flex items-baseline justify-between">
      <h2
        style={{
          fontFamily: UI,
          fontSize: 11,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: text,
          opacity: 0.6,
          fontWeight: 700,
          margin: 0,
        }}
      >
        {label}
        {typeof count === "number" ? (
          <span style={{ color: ORANGE, opacity: 1, marginLeft: 6 }}>{count}</span>
        ) : null}
      </h2>
    </div>
  );
}

/* ---------------- Avatar ---------------- */

function Avatar({
  initial,
  small,
  large,
}: {
  initial: string;
  small?: boolean;
  large?: boolean;
}) {
  const size = large ? 84 : small ? 32 : 44;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: "rgba(255,130,63,0.14)",
        border: "1px solid rgba(255,130,63,0.40)",
        color: "#F0EBD8",
        fontFamily: UI,
        fontSize: large ? 32 : small ? 13 : 17,
        fontWeight: 600,
      }}
    >
      {initial}
    </div>
  );
}

/* ---------------- Incoming request modal (legacy full-screen) ---------------- */

function IncomingRequestModal({ request }: { request: IncomingRequest }) {
  const { text, bg, borderCol } = useHomeTheme();
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [dismissed, setDismissed] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      setSecondsLeft(Math.max(0, 60 - elapsed));
    }, 250);
    return () => clearInterval(id);
  }, []);

  if (dismissed || secondsLeft === 0) return null;

  const pct = (secondsLeft / 60) * 100;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{ backgroundColor: bg }}
      role="dialog"
      aria-label="Incoming booking request"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: "rgba(240,235,216,0.08)" }}>
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            backgroundColor: ORANGE,
            transition: "width 250ms linear",
          }}
        />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-6 pt-6">
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: UI,
              fontSize: 11,
              letterSpacing: "1.6px",
              textTransform: "uppercase",
              color: ORANGE,
              fontWeight: 700,
            }}
          >
            <PulseDot /> New request
          </span>
          <span style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.7, fontWeight: 600 }}>
            {secondsLeft}s
          </span>
        </div>

        <div className="mt-8 flex flex-col items-center text-center">
          <Avatar initial={request.clientInitial} large />
          <h2
            style={{
              fontFamily: UI,
              fontSize: 26,
              fontWeight: 600,
              color: text,
              letterSpacing: "-0.02em",
              margin: "16px 0 0",
            }}
          >
            {request.clientName}
          </h2>
          <p style={{ fontFamily: UI, fontSize: 15, color: text, opacity: 0.7, marginTop: 6 }}>
            {request.service}
          </p>
          <p style={{ fontFamily: UI, fontSize: 13, color: ORANGE, marginTop: 8, fontWeight: 600 }}>
            {request.requestedFor}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2" style={{ marginInline: 4 }}>
          <Stat label="Distance" value={request.distance} />
          <Stat label="ETA" value={`${request.etaMin} min`} />
          <Stat label="Payout" value={formatUsd(request.payoutUsd)} accent />
        </div>

        {request.message ? (
          <div
            className="mt-5 rounded-xl px-4 py-3"
            style={{
              backgroundColor: "rgba(240,235,216,0.04)",
              border: `1px solid ${borderCol}`,
            }}
          >
            <p style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.8, lineHeight: 1.5 }}>
              "{request.message}"
            </p>
          </div>
        ) : null}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="w-full rounded-2xl transition-transform active:scale-[0.99]"
          style={{
            height: 64,
            backgroundColor: ORANGE,
            color: "#061C27",
            fontFamily: UI,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          Accept booking
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-3 w-full py-3 transition-opacity active:opacity-60"
          style={{
            color: text,
            opacity: 0.55,
            fontFamily: UI,
            fontSize: 13,
            fontWeight: 500,
            background: "transparent",
            border: "none",
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { text, borderCol } = useHomeTheme();
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl py-3"
      style={{
        border: `1px solid ${accent ? "rgba(255,130,63,0.45)" : borderCol}`,
        backgroundColor: "rgba(240,235,216,0.035)",
      }}
    >
      <span
        style={{
          fontFamily: UI,
          fontSize: 9.5,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          color: text,
          opacity: 0.55,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: UI,
          fontSize: 17,
          fontWeight: 700,
          color: accent ? ORANGE : text,
          letterSpacing: "-0.02em",
          marginTop: 4,
        }}
      >
        {value}
      </span>
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
function NavIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-7-7 18-2-8-9-3z" />
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function ClockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function ShieldGlyph() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 4 5v6c0 5 3.5 9.4 8 11 4.5-1.6 8-6 8-11V5l-8-3z" />
    </svg>
  );
}
function LockGlyph() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
function ClockGlyph() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
