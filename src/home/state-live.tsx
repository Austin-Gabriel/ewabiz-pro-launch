import { useEffect, useRef, useState } from "react";
import { CardTheme, HOME_SANS, useHomeTheme } from "./home-shell";
import { EwaMark } from "@/components/ewa-logo";
import {
  type Booking,
  type BookingRequest,
  type IncomingRequest,
  type LiveStatus,
  formatUsd,
} from "@/data/mock-data";

/**
 * Native-mobile working surface for a beauty pro who travels to clients.
 *
 * Hierarchy (top → bottom), tuned for one-handed scanning under 2 seconds:
 *
 *   1. Header  — logo (left), notifications bell (right)
 *   2. Status  — Online/Offline toggle + Schedule shortcut
 *   3. Live    — In Progress / En Route / Up Next / quiet empty state
 *   4. Waiting — pending requests (Accept = primary, Decline = quiet)
 *   5. Glance  — "N more jobs · $X projected"
 *   6. Stats   — Rating · Completion · Today's earnings (with cash-tip edit)
 *
 * Industrial type discipline: Inter only, no serif, no italics. Flat cards
 * with subtle borders — no ambient glows, no decorative gradients.
 */

const UI = `Inter, ${HOME_SANS}`;
const ORANGE = "#FF823F";

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
}

export function StateLive({
  bookingsToday,
  pendingRequests,
  nextOpenSlot,
  ratingValue = 0,
  ratingCount = 0,
  completionPct = 100,
  todayEarningsUsd = 0,
  todayProjectedUsd = 0,
  liveStatus = { kind: "idle" },
  incomingRequest,
}: StateLiveProps) {
  const [online, setOnline] = useState(true);
  const [tipsLogged, setTipsLogged] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);

  // If pro toggled offline, the incoming-request modal must not appear.
  const incoming = online ? incomingRequest : undefined;

  const nextBooking = bookingsToday[0];
  const remainingCount = Math.max(0, bookingsToday.length - 1);
  const projectedRemaining = Math.max(0, todayProjectedUsd - todayEarningsUsd);

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-4 pb-2 pt-1">
      <Header unreadCount={pendingRequests.length} />

      <StatusBar online={online} onToggle={() => setOnline((v) => !v)} />

      <LiveStateCard
        online={online}
        liveStatus={liveStatus}
        nextBooking={nextBooking}
        nextOpenSlot={nextOpenSlot}
      />

      {online && pendingRequests.length > 0 ? (
        <PendingRequests requests={pendingRequests} />
      ) : null}

      {bookingsToday.length > 0 ? (
        <TodayGlance
          remainingCount={remainingCount}
          projectedRemainingUsd={projectedRemaining}
        />
      ) : null}

      <QuickStats
        ratingValue={ratingValue}
        ratingCount={ratingCount}
        completionPct={completionPct}
        todayEarningsUsd={todayEarningsUsd + tipsLogged}
        onEditTip={() => setShowTipModal(true)}
      />

      {showTipModal ? (
        <TipSheet
          onClose={() => setShowTipModal(false)}
          onSave={(amount) => {
            setTipsLogged((v) => v + amount);
            setShowTipModal(false);
          }}
        />
      ) : null}

      {incoming ? <IncomingRequestModal request={incoming} /> : null}
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

/* ---------------- Status bar ---------------- */

function StatusBar({ online, onToggle }: { online: boolean; onToggle: () => void }) {
  const { text, borderCol, surface, isDark } = useHomeTheme();
  // Off-state track must be visible against BOTH cream (light) and navy (dark)
  // page backgrounds. Use a tint of the inverse-of-surface color so the track
  // always reads as a filled pill, never blends into the page.
  const offTrackBg = isDark ? "rgba(240,235,216,0.22)" : "rgba(6,28,39,0.28)";
  const thumbColor = isDark ? "#061C27" : "#F0EBD8";
  return (
    <div
      className="mt-2 flex items-center justify-between rounded-2xl px-3 py-2.5"
      style={{
        backgroundColor: surface,
        border: `1px solid ${borderCol}`,
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
            width: 34,
            height: 20,
            padding: 2,
            backgroundColor: online ? ORANGE : offTrackBg,
            transition: "background-color 200ms ease",
          }}
        >
          <span
            className="rounded-full"
            style={{
              width: 16,
              height: 16,
              // When ON: navy thumb on orange — high contrast in both modes.
              // When OFF: thumb is the page-bg color so it reads as the
              // "knob" cut out of the filled track on either background.
              backgroundColor: online ? "#061C27" : thumbColor,
              transform: online ? "translateX(14px)" : "translateX(0)",
              transition: "transform 200ms ease, background-color 200ms ease",
              boxShadow: "0 1px 2px rgba(6,28,39,0.25)",
            }}
          />
        </span>
        <span className="flex min-w-0 flex-col items-start text-left">
          <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: text, lineHeight: 1.2 }}>
            {online ? "Online" : "Offline"}
          </span>
          <span style={{ fontFamily: UI, fontSize: 11, color: text, opacity: 0.55, lineHeight: 1.2, marginTop: 2 }}>
            {online ? "Accepting requests" : "Scheduled bookings only"}
          </span>
        </span>
      </button>

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
    </div>
  );
}

/* ---------------- Live state card ---------------- */

function LiveStateCard({
  online,
  liveStatus,
  nextBooking,
  nextOpenSlot,
}: {
  online: boolean;
  liveStatus: LiveStatus;
  nextBooking?: Booking;
  nextOpenSlot?: string;
}) {
  // 1) IN-PROGRESS — orange-accented hero with timer + Go to Appointment
  if (liveStatus.kind === "in-progress" && nextBooking) {
    return (
      <Card emphasis="primary">
        <Eyebrow color={ORANGE}>
          <PulseDot /> In Progress · {liveStatus.elapsedMin ?? 0} min
        </Eyebrow>
        <Headline>{nextBooking.clientName}</Headline>
        <SubLine>{nextBooking.service}</SubLine>
        {nextBooking.address ? <AddressRow address={nextBooking.address} /> : null}
        <PrimaryAction label="Go to Appointment" />
        <SecondaryStrip
          actions={[
            { label: "Message", icon: "msg" },
            { label: "Mark done", icon: "check" },
          ]}
        />
      </Card>
    );
  }

  // 2) EN-ROUTE — driving to client
  if (liveStatus.kind === "en-route" && nextBooking) {
    return (
      <Card emphasis="primary">
        <Eyebrow color={ORANGE}>
          <PulseDot /> En Route · {liveStatus.etaMin ?? 0} min ETA
        </Eyebrow>
        <Headline>{nextBooking.clientName}</Headline>
        <SubLine>{nextBooking.service}</SubLine>
        {nextBooking.address ? <AddressRow address={nextBooking.address} /> : null}
        <PrimaryAction label="Open Navigation" />
        <SecondaryStrip
          actions={[
            { label: "Message", icon: "msg" },
            { label: "I've arrived", icon: "check" },
          ]}
        />
      </Card>
    );
  }

  // 3) UP NEXT — there's something on the books
  if (nextBooking) {
    return (
      <Card>
        <UpNextBody nextBooking={nextBooking} />
      </Card>
    );
  }

  // 4) Quiet empty state — no fake content
  return (
    <Card>
      <EmptyTodayBody online={online} nextOpenSlot={nextOpenSlot} />
    </Card>
  );
}

/**
 * Body components for LiveStateCard branches. They live inside <Card> →
 * <CardTheme>, so useHomeTheme() resolves to navy-on-white card palette.
 * Without this indirection, the parent's useHomeTheme() captures the page
 * palette (cream text in dark mode) and the copy disappears against white.
 */
function UpNextBody({ nextBooking }: { nextBooking: Booking }) {
  const { text } = useHomeTheme();
  return (
    <>
      <div className="flex items-center justify-between">
        <Eyebrow>Up Next</Eyebrow>
        <span style={{ fontFamily: UI, fontSize: 12, color: text, opacity: 0.65, fontWeight: 500 }}>
          {nextBooking.startsAt} · {nextBooking.durationMin} min
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Avatar initial={nextBooking.clientInitial} />
        <div className="min-w-0 flex-1">
          <div className="truncate" style={{ fontFamily: UI, fontSize: 16, fontWeight: 600, color: text }}>
            {nextBooking.clientName}
            {nextBooking.isNewClient ? <NewBadge /> : null}
          </div>
          <div className="truncate" style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.7, marginTop: 2 }}>
            {nextBooking.service}
          </div>
        </div>
      </div>
      {nextBooking.address ? <AddressRow address={nextBooking.address} /> : null}
      <PrimaryAction label="Navigate" icon="map" />
      <SecondaryStrip
        actions={[
          { label: "Message", icon: "msg" },
          { label: "Mark done", icon: "check" },
        ]}
      />
    </>
  );
}

function EmptyTodayBody({ online, nextOpenSlot }: { online: boolean; nextOpenSlot?: string }) {
  const { text } = useHomeTheme();
  return (
    <>
      <Eyebrow>Today</Eyebrow>
      <p style={{ fontFamily: UI, fontSize: 17, fontWeight: 500, color: text, marginTop: 8, letterSpacing: "-0.01em" }}>
        {online ? "No bookings today." : "You're offline."}
      </p>
      <p style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.7, marginTop: 4 }}>
        {online
          ? nextOpenSlot
            ? `Your next open slot is ${nextOpenSlot}.`
            : "Open more availability to fill the day."
          : "Toggle online to start accepting new requests."}
      </p>
      {online ? <PrimaryAction label="Open more availability" subtle /> : null}
    </>
  );
}

/* ---------------- Live-card primitives ---------------- */

function Card({ children, emphasis }: { children: React.ReactNode; emphasis?: "primary" }) {
  return (
    <CardTheme>
      <CardInner emphasis={emphasis}>{children}</CardInner>
    </CardTheme>
  );
}

function CardInner({ children, emphasis }: { children: React.ReactNode; emphasis?: "primary" }) {
  const { cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="mt-3 rounded-2xl px-4 py-4"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${emphasis === "primary" ? "rgba(255,130,63,0.55)" : cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
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

function Headline({ children }: { children: React.ReactNode }) {
  const { text } = useHomeTheme();
  return (
    <h3
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
      {children}
    </h3>
  );
}

function SubLine({ children }: { children: React.ReactNode }) {
  const { text } = useHomeTheme();
  return (
    <div style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.65, marginTop: 4 }}>
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
        fontWeight: 600,
        letterSpacing: "-0.005em",
      }}
    >
      {icon === "map" ? <PinIcon size={14} /> : null}
      {icon === "check" ? <CheckIcon size={14} /> : null}
      {label}
    </button>
  );
}

function SecondaryStrip({
  actions,
}: {
  actions: { label: string; icon: "msg" | "map" | "check" }[];
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
          style={{ fontFamily: UI, fontSize: 12.5, fontWeight: 500, color: text, opacity: 0.8 }}
        >
          {a.icon === "msg" ? <MessageIcon /> : null}
          {a.icon === "map" ? <PinIcon size={14} /> : null}
          {a.icon === "check" ? <CheckIcon size={14} /> : null}
          {a.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Pending requests ---------------- */

function PendingRequests({ requests }: { requests: BookingRequest[] }) {
  const [resolved, setResolved] = useState<Record<string, "accept" | "decline">>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="mt-5">
      <SectionHeader label="Waiting on you" count={requests.length} />
      <div className="mt-2 flex flex-col gap-2">
        {requests.map((r) => {
          const state = resolved[r.id];
          const isOpen = expanded === r.id;
          return (
            <CardTheme key={r.id}>
              <PendingRequestRow
                r={r}
                state={state}
                isOpen={isOpen}
                onToggle={() => setExpanded((v) => (v === r.id ? null : r.id))}
                onAccept={() => setResolved((s) => ({ ...s, [r.id]: "accept" }))}
                onDecline={() => setResolved((s) => ({ ...s, [r.id]: "decline" }))}
              />
            </CardTheme>
          );
        })}
      </div>
    </section>
  );
}

function PendingRequestRow({
  r,
  state,
  isOpen,
  onToggle,
  onAccept,
  onDecline,
}: {
  r: BookingRequest;
  state: "accept" | "decline" | undefined;
  isOpen: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="rounded-2xl px-3.5 py-3"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
        opacity: state ? 0.55 : 1,
        transition: "opacity 250ms ease",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 text-left"
      >
        <Avatar initial={r.clientInitial} small />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="truncate"
              style={{ fontFamily: UI, fontSize: 14, color: text, fontWeight: 600 }}
            >
              {r.clientName}
            </span>
            <span style={{ fontFamily: UI, fontSize: 14, color: text, fontWeight: 600 }}>
              {formatUsd(r.priceUsd)}
            </span>
          </div>
          <div
            className="truncate"
            style={{ fontFamily: UI, fontSize: 12.5, color: text, opacity: 0.65, marginTop: 1 }}
          >
            {r.service}
          </div>
          <div
            className="flex flex-wrap items-center gap-x-2"
            style={{ fontFamily: UI, fontSize: 11.5, color: text, opacity: 0.55, marginTop: 4 }}
          >
            <span style={{ color: ORANGE, opacity: 1, fontWeight: 600 }}>{r.requestedFor}</span>
            {r.location ? <span aria-hidden>·</span> : null}
            {r.location ? <span>{r.location}</span> : null}
          </div>
        </div>
      </button>

      {isOpen && r.message ? (
        <p
          style={{
            fontFamily: UI,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: text,
            opacity: 0.7,
            marginTop: 10,
            paddingLeft: 40,
          }}
        >
          "{r.message}"
        </p>
      ) : null}

      {!state ? (
        <div className="mt-3 flex items-center gap-2" style={{ paddingLeft: 40 }}>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-xl py-2 transition-transform active:scale-[0.98]"
            style={{
              backgroundColor: ORANGE,
              color: "#061C27",
              fontFamily: UI,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Accept
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="rounded-xl px-3 py-2 transition-opacity active:opacity-60"
            style={{
              backgroundColor: "transparent",
              color: text,
              opacity: 0.55,
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
            paddingLeft: 40,
            fontWeight: 600,
          }}
        >
          {state === "accept" ? "Accepted — client notified." : "Declined."}
        </div>
      )}
    </div>
  );
}

/* ---------------- Today at a glance ---------------- */

function TodayGlance({
  remainingCount,
  projectedRemainingUsd,
}: {
  remainingCount: number;
  projectedRemainingUsd: number;
}) {
  if (remainingCount === 0 && projectedRemainingUsd === 0) return null;
  return (
    <CardTheme>
      <TodayGlanceInner
        remainingCount={remainingCount}
        projectedRemainingUsd={projectedRemainingUsd}
      />
    </CardTheme>
  );
}

function TodayGlanceInner({
  remainingCount,
  projectedRemainingUsd,
}: {
  remainingCount: number;
  projectedRemainingUsd: number;
}) {
  const { text, cardSurface, cardBorder } = useHomeTheme();

  const label =
    remainingCount === 0
      ? "All wrapped for today"
      : `${remainingCount} more ${remainingCount === 1 ? "job" : "jobs"} today`;
  const right =
    projectedRemainingUsd > 0 ? `· ${formatUsd(projectedRemainingUsd)} projected` : "";

  return (
    <button
      type="button"
      className="mt-3 flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-opacity active:opacity-70"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
      }}
      aria-label="Open today's calendar"
    >
      <span style={{ fontFamily: UI, fontSize: 12.5, color: text, fontWeight: 500 }}>
        {label} <span style={{ opacity: 0.55 }}>{right}</span>
      </span>
      <ChevronIcon />
    </button>
  );
}

/* ---------------- Quick stats ---------------- */

function QuickStats({
  ratingValue,
  ratingCount,
  completionPct,
  todayEarningsUsd,
  onEditTip,
}: {
  ratingValue: number;
  ratingCount: number;
  completionPct: number;
  todayEarningsUsd: number;
  onEditTip: () => void;
}) {
  return (
    <CardTheme>
      <QuickStatsInner
        ratingValue={ratingValue}
        ratingCount={ratingCount}
        completionPct={completionPct}
        todayEarningsUsd={todayEarningsUsd}
        onEditTip={onEditTip}
      />
    </CardTheme>
  );
}

function QuickStatsInner({
  ratingValue,
  ratingCount,
  completionPct,
  todayEarningsUsd,
  onEditTip,
}: {
  ratingValue: number;
  ratingCount: number;
  completionPct: number;
  todayEarningsUsd: number;
  onEditTip: () => void;
}) {
  const { text, cardSurface, cardBorder } = useHomeTheme();

  const cardStyle: React.CSSProperties = {
    backgroundColor: cardSurface,
    border: `1px solid ${cardBorder}`,
    boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
    borderRadius: 14,
    padding: "10px 12px",
    minHeight: 70,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: UI,
    fontSize: 10,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: text,
    opacity: 0.5,
    fontWeight: 600,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: UI,
    fontSize: 18,
    fontWeight: 600,
    color: text,
    letterSpacing: "-0.02em",
    lineHeight: 1,
  };

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <div style={cardStyle}>
        <div style={labelStyle}>Rating</div>
        <div className="flex items-baseline gap-1">
          <span style={valueStyle}>
            {ratingValue > 0 ? ratingValue.toFixed(1) : "—"}
          </span>
          <span style={{ color: ORANGE, fontSize: 13, lineHeight: 1 }}>★</span>
        </div>
        <div style={{ fontFamily: UI, fontSize: 10.5, color: text, opacity: 0.5 }}>
          {ratingCount > 0 ? `${ratingCount} reviews` : "No reviews yet"}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Completion</div>
        <div style={valueStyle}>{completionPct}%</div>
        <div style={{ fontFamily: UI, fontSize: 10.5, color: text, opacity: 0.5 }}>
          Last 30 days
        </div>
      </div>

      <div style={cardStyle}>
        <div className="flex items-center justify-between">
          <span style={labelStyle}>Today</span>
          <button
            type="button"
            onClick={onEditTip}
            aria-label="Log cash tip"
            className="flex items-center justify-center rounded-full transition-opacity active:opacity-60"
            style={{
              width: 18,
              height: 18,
              border: `1px solid ${cardBorder}`,
              color: text,
              opacity: 0.7,
            }}
          >
            <PencilIcon />
          </button>
        </div>
        <div style={valueStyle}>{formatUsd(todayEarningsUsd)}</div>
        <div style={{ fontFamily: UI, fontSize: 10.5, color: text, opacity: 0.5 }}>
          Earnings
        </div>
      </div>
    </div>
  );
}

/* ---------------- Cash-tip sheet ---------------- */

function TipSheet({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const { text, bg, borderCol } = useHomeTheme();
  const [value, setValue] = useState("");
  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl px-5 pb-8 pt-5"
        style={{ backgroundColor: bg, border: `1px solid ${borderCol}`, borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="mx-auto mb-4 rounded-full"
          style={{ width: 36, height: 4, backgroundColor: text, opacity: 0.18 }}
        />
        <h3 style={{ fontFamily: UI, fontSize: 17, fontWeight: 600, color: text, margin: 0 }}>
          Log a cash tip
        </h3>
        <p style={{ fontFamily: UI, fontSize: 12.5, color: text, opacity: 0.6, marginTop: 4 }}>
          We'll add it to today's earnings — purely for your records.
        </p>
        <div
          className="mt-4 flex items-center rounded-xl px-3"
          style={{ border: `1px solid ${borderCol}`, height: 48 }}
        >
          <span style={{ fontFamily: UI, fontSize: 18, color: text, opacity: 0.55 }}>$</span>
          <input
            inputMode="decimal"
            placeholder="0"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: UI,
              fontSize: 18,
              fontWeight: 600,
              color: text,
              marginLeft: 6,
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const n = Math.max(0, Math.round(parseFloat(value || "0") || 0));
            onSave(n);
          }}
          className="mt-4 w-full rounded-xl py-3 transition-transform active:scale-[0.99]"
          style={{
            backgroundColor: ORANGE,
            color: "#061C27",
            fontFamily: UI,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Save tip
        </button>
      </div>
    </div>
  );
}

/* ---------------- Incoming request modal ---------------- */

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
      {/* Countdown bar */}
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

        <div
          className="mt-8 grid grid-cols-3 gap-2"
          style={{ marginInline: 4 }}
        >
          <Stat label="Distance" value={request.distance} />
          <Stat label="ETA" value={`${request.etaMin} min`} />
          <Stat label="Payout" value={formatUsd(request.payoutUsd)} accent />
        </div>

        {request.message ? (
          <CardTheme>
            <IncomingMessageBox message={request.message} />
          </CardTheme>
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
  return (
    <CardTheme>
      <StatInner label={label} value={value} accent={accent} />
    </CardTheme>
  );
}

function IncomingMessageBox({ message }: { message: string }) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="mt-5 rounded-xl px-4 py-3"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
      }}
    >
      <p style={{ fontFamily: UI, fontSize: 13, color: text, opacity: 0.8, lineHeight: 1.5 }}>
        "{message}"
      </p>
    </div>
  );
}

function StatInner({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl py-3"
      style={{
        border: `1px solid ${accent ? "rgba(255,130,63,0.55)" : cardBorder}`,
        backgroundColor: cardSurface,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
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
  const size = large ? 84 : small ? 32 : 40;
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
        fontSize: large ? 32 : small ? 13 : 16,
        fontWeight: 600,
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
function MessageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
function PencilIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}