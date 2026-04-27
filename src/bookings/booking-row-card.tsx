import { type ReactNode } from "react";
import { CardTheme, HOME_SANS, useHomeTheme } from "@/home/home-shell";
import { type Booking, formatUsd } from "@/data/mock-data";

/**
 * Canonical booking row card. Used across:
 *   - /bookings (Upcoming, History)
 *   - /home today preview
 *   - /calendar day entries
 *
 * Visual rules:
 *   - White surface (always — see mem://design/card-surfaces)
 *   - Circular monogram avatar in cream/bagel with bagel initials
 *   - Name + service · location in the body
 *   - Right-aligned price in tabular figures
 *   - Optional NEXT pill that notches over the top-right corner; when
 *     present the card itself gets a bagel border to echo the pill.
 *   - Optional "Cancelled" muted text replaces price for cancelled bookings.
 */

const UI = HOME_SANS;
const BAGEL = "#FF823F";
const BAGEL_SOFT = "rgba(255,130,63,0.16)";
const BAGEL_BORDER = "rgba(255,130,63,0.55)";
const MIDNIGHT = "#061C27";

export interface BookingRowCardProps {
  booking: Booking;
  /** Show the bagel NEXT pill notched over the corner. Implies bagel border. */
  isNext?: boolean;
  /** Render "Cancelled" in muted text where the price would be. */
  cancelled?: boolean;
  onSelect?: () => void;
  /**
   * Pending scheduled booking — client requested an appointment, pro hasn't
   * accepted yet. Renders a small bagel dot top-left, an expiry status line,
   * and inline Accept / Decline buttons stacked under the row content.
   * Tapping the card body still routes to detail (via onSelect).
   */
  pending?: {
    /** Time-left label, e.g. "expires in 6h" or "expires in 23 min". */
    expiresLabel: string;
    onAccept: () => void;
    onDecline: () => void;
  };
  /** Pending reschedule proposal — shows a small pill on the row. */
  pendingReschedule?: { timeLeftLabel: string };
}

export function BookingRowCard(props: BookingRowCardProps) {
  return (
    <CardTheme>
      <BookingRowCardInner {...props} />
    </CardTheme>
  );
}

function BookingRowCardInner({ booking, isNext, cancelled, onSelect, pending, pendingReschedule }: BookingRowCardProps) {
  const { cardSurface, cardBorder } = useHomeTheme();
  const borderCol = pendingReschedule ? "rgba(255,130,63,0.55)" : isNext ? BAGEL_BORDER : cardBorder;
  // Pending cards always behave as a button (taps the body to view detail)
  // even if no onSelect was passed — the inline action buttons below stop
  // propagation so they don't double-fire.
  const isInteractive = Boolean(onSelect) || Boolean(pending);
  // If pending actions are shown, the outer cannot be a <button> (nested
  // buttons are invalid). Use a div with onClick in that case.
  const useButton = isInteractive && !pending;
  const Wrapper: any = useButton ? "button" : "div";

  return (
    <div className="relative">
      <Wrapper
        type={useButton ? "button" : undefined}
        role={!useButton && isInteractive ? "button" : undefined}
        tabIndex={!useButton && isInteractive ? 0 : undefined}
        onClick={isInteractive ? onSelect : undefined}
        className={
          "flex w-full flex-col gap-3 rounded-2xl px-4 py-3.5 text-left transition-opacity active:opacity-80"
        }
        style={{
          backgroundColor: isNext ? "#FFF4EC" : cardSurface,
          border: `1px solid ${borderCol}`,
          boxShadow: isNext
            ? "0 1px 2px rgba(6,28,39,0.06), 0 12px 28px -16px rgba(255,130,63,0.35)"
            : "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
        }}
      >
        <div className="flex w-full items-start gap-3.5">
          <Monogram initial={booking.clientInitial} />
          <Body
            name={booking.clientName}
            service={booking.service}
            location={booking.location}
            pendingStatus={pending ? pending.expiresLabel : undefined}
          />
          <Price priceUsd={booking.priceUsd} cancelled={cancelled} />
        </div>
        {pending ? (
          <PendingActions onAccept={pending.onAccept} onDecline={pending.onDecline} />
        ) : null}
        {pendingReschedule ? (
          <PendingReschedulePill timeLeftLabel={pendingReschedule.timeLeftLabel} />
        ) : null}
      </Wrapper>
      {isNext ? <NextPill /> : null}
      {pending ? <PendingDot /> : null}
    </div>
  );
}

function Monogram({ initial }: { initial: string }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: 44,
        height: 44,
        backgroundColor: BAGEL_SOFT,
        color: "#7A2E0E",
        fontFamily: UI,
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "-0.01em",
      }}
    >
      {initial}
    </div>
  );
}

function Body({
  name,
  service,
  location,
  pendingStatus,
}: {
  name: string;
  service: string;
  location?: string;
  pendingStatus?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div
        className="truncate"
        style={{
          fontFamily: UI,
          fontSize: 15,
          fontWeight: 600,
          color: MIDNIGHT,
          letterSpacing: "-0.005em",
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: UI,
          fontSize: 13,
          color: MIDNIGHT,
          opacity: 0.7,
          lineHeight: 1.35,
          marginTop: 3,
          wordBreak: "break-word",
        }}
      >
        {service}
      </div>
      {location ? (
        <div
          style={{
            fontFamily: UI,
            fontSize: 12,
            color: MIDNIGHT,
            opacity: 0.5,
            lineHeight: 1.3,
            marginTop: 2,
            wordBreak: "break-word",
          }}
        >
          {shortLocality(location)}
        </div>
      ) : null}
      {pendingStatus ? (
        <div
          style={{
            fontFamily: UI,
            fontSize: 11.5,
            color: "#FF823F",
            fontWeight: 600,
            letterSpacing: "-0.005em",
            marginTop: 6,
            lineHeight: 1.3,
          }}
        >
          {pendingStatus}
        </div>
      ) : null}
    </div>
  );
}

function Price({ priceUsd, cancelled }: { priceUsd: number; cancelled?: boolean }) {
  if (cancelled) {
    return (
      <span className="mb-0 mt-[12px]"
        style={{
          fontFamily: UI,
          fontSize: 13,
          color: MIDNIGHT,
          opacity: 0.45,
          fontWeight: 500,
          letterSpacing: "-0.005em",
        }}
      >
        Cancelled
      </span>
    );
  }
  return (
    <span
      className="mt-[22px] text-lg"
      style={{
        fontFamily: UI,
        fontWeight: 700,
        color: MIDNIGHT,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.01em",
      }}
    >
      {formatUsd(priceUsd)}
    </span>
  );
}

function NextPill() {
  return (
    <span
      aria-label="Next up"
      className="absolute"
      style={{
        top: -10,
        right: 16,
        backgroundColor: BAGEL,
        color: MIDNIGHT,
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "1.2px",
        textTransform: "uppercase",
        padding: "4px 9px",
        borderRadius: 9999,
        boxShadow: "0 4px 10px -4px rgba(255,130,63,0.45)",
      }}
    >
      Next
    </span>
  );
}

/**
 * Bagel dot pinned top-left of a pending booking card. Same visual
 * vocabulary as the In Progress tab indicator dot — flags an unreviewed
 * scheduled request waiting on the pro's decision.
 */
function PendingDot() {
  return (
    <span
      aria-label="Pending approval"
      className="absolute rounded-full"
      style={{
        top: -5,
        left: -5,
        width: 12,
        height: 12,
        backgroundColor: BAGEL,
        border: "2px solid #FFFFFF",
        boxShadow: "0 0 8px rgba(255,130,63,0.55)",
      }}
    />
  );
}

/**
 * Inline Accept / Decline buttons rendered at the bottom of a pending
 * scheduled booking card. The pro can act directly from the list — they
 * don't need to open detail to make a call. Both buttons stop propagation
 * so the parent card's tap-to-view-detail doesn't fire alongside.
 */
function PendingActions({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecline();
        }}
        className="rounded-xl py-2.5 transition-opacity active:opacity-70"
        style={{
          border: "1px solid rgba(6,28,39,0.18)",
          backgroundColor: "transparent",
          color: MIDNIGHT,
          opacity: 0.75,
          fontFamily: UI,
          fontSize: 13.5,
          fontWeight: 600,
          letterSpacing: "-0.005em",
        }}
      >
        Decline
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAccept();
        }}
        className="rounded-xl py-2.5 transition-transform active:scale-[0.99]"
        style={{
          backgroundColor: BAGEL,
          color: MIDNIGHT,
          fontFamily: UI,
          fontSize: 13.5,
          fontWeight: 700,
          letterSpacing: "-0.005em",
          boxShadow: "0 4px 12px -6px rgba(255,130,63,0.5)",
        }}
      >
        Accept
      </button>
    </div>
  );
}

/**
 * Compact pill rendered inline beneath the row body when the booking has a
 * pending reschedule proposal. Surfaces the same "Pending reschedule" intent
 * across Bookings > Upcoming so the pro spots it without opening detail.
 */
function PendingReschedulePill({ timeLeftLabel }: { timeLeftLabel: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 self-start rounded-full"
      style={{
        backgroundColor: BAGEL_SOFT,
        color: "#7A2E0E",
        padding: "4px 10px",
        fontFamily: UI,
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: "-0.005em",
        border: `1px solid ${BAGEL_BORDER}`,
      }}
    >
      <span
        aria-hidden
        className="rounded-full"
        style={{ width: 6, height: 6, backgroundColor: BAGEL }}
      />
      Pending reschedule · {timeLeftLabel}
    </div>
  );
}

function shortLocality(loc: string): string {
  // "Fort Greene, Brooklyn" → "Fort Greene"
  return loc.split(",")[0].trim();
}

/* ---------------- Timeline rail (Today on Upcoming) ---------------- */

export interface TimelineEntry {
  booking: Booking;
  /** "10:30 AM" — display time, stacked over its meridiem. */
  time: string;
  meridiem: "AM" | "PM";
  isNext?: boolean;
  /** Optional gap label rendered ABOVE this entry on the rail. */
  gapBefore?: string;
  /** Pending request props if this entry is awaiting pro approval. */
  pending?: BookingRowCardProps["pending"];
  /** Pending reschedule pill props, if a proposal is in flight. */
  pendingReschedule?: BookingRowCardProps["pendingReschedule"];
  /** Tap handler — routes to the booking detail page. */
  onOpen?: () => void;
}

export function BookingTimeline({ entries }: { entries: TimelineEntry[] }) {
  const { isDark } = useHomeTheme();
  const railColor = isDark ? "rgba(240,235,216,0.18)" : "rgba(6,28,39,0.18)";
  return (
    <div className="relative">
      {/* Rail line */}
      <div
        aria-hidden
        className="absolute"
        style={{
          // RAIL_COL starts at TIME_COL_WIDTH (48). Center of 24px rail column = 48 + 12 = 60.
          left: 60,
          width: 1,
          top: 18,
          bottom: 18,
          backgroundColor: railColor,
        }}
      />
      <ul className="flex flex-col gap-4">
        {entries.map((entry) => (
          <li key={entry.booking.id} className="relative">
            {entry.gapBefore ? <RailGap label={entry.gapBefore} /> : null}
            <RailRow entry={entry} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RailRow({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="relative flex items-center">
      <RailTime time={entry.time} meridiem={entry.meridiem} />
      <RailDot active={entry.isNext} />
      <div className="min-w-0 flex-1 pl-3">
        <BookingRowCard
          booking={entry.booking}
          isNext={entry.isNext}
          pending={entry.pending}
          pendingReschedule={entry.pendingReschedule}
          onSelect={entry.onOpen}
        />
      </div>
    </div>
  );
}

function RailTime({ time, meridiem }: { time: string; meridiem: "AM" | "PM" }) {
  const { text } = useHomeTheme();
  return (
    <div
      className="flex shrink-0 flex-col items-end justify-center"
      style={{ width: 48 }}
    >
      <span
        style={{
          fontFamily: UI,
          fontSize: 15,
          fontWeight: 700,
          color: text,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        {time}
      </span>
      <span
        style={{
          fontFamily: UI,
          fontSize: 10,
          fontWeight: 600,
          color: text,
          opacity: 0.55,
          letterSpacing: "1.2px",
          marginTop: 3,
        }}
      >
        {meridiem}
      </span>
    </div>
  );
}

function RailDot({ active }: { active?: boolean }) {
  const { isDark } = useHomeTheme();
  const dotIdle = isDark ? "rgba(240,235,216,0.55)" : "rgba(6,28,39,0.30)";
  const dotIdleBorder = isDark ? "rgba(240,235,216,0.65)" : "rgba(6,28,39,0.40)";
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: 24, alignSelf: "stretch" }}>
      <span
        aria-hidden
        className="rounded-full mt-0 mb-[15px]"
        style={{
          width: active ? 12 : 8,
          height: active ? 12 : 8,
          backgroundColor: active ? BAGEL : dotIdle,
          border: active ? `2px solid ${BAGEL}` : `1px solid ${dotIdleBorder}`,
          boxShadow: active ? "0 0 0 4px rgba(255,130,63,0.18)" : "none",
        }}
      />
    </div>
  );
}

function RailGap({ label }: { label: string }) {
  const { text } = useHomeTheme();
  const { isDark } = useHomeTheme();
  const dotCol = isDark ? "rgba(240,235,216,0.45)" : "rgba(6,28,39,0.30)";
  return (
    <div className="relative mb-2 mt-1 flex items-center" style={{ paddingLeft: 56 }}>
      <span
        aria-hidden
        className="rounded-full"
        style={{
          width: 4,
          height: 4,
          marginLeft: 2,
          backgroundColor: dotCol,
        }}
      />
      <span
        className="ml-3"
        style={{
          fontFamily: UI,
          fontSize: 12,
          fontStyle: "italic",
          color: text,
          opacity: 0.5,
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ---------------- Section primitives ---------------- */

export function BookingsSectionHeader({
  title,
  meta,
  date,
  serif = false,
}: {
  title: string;
  meta?: string;
  date?: string;
  serif?: boolean;
}) {
  const { text } = useHomeTheme();
  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          style={{
            fontFamily: serif ? '"Fraunces", "Times New Roman", serif' : UI,
            fontSize: serif ? 26 : 18,
            fontWeight: serif ? 500 : 700,
            color: text,
            letterSpacing: serif ? "-0.02em" : "-0.01em",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>
        {meta ? (
          <span
            style={{
              fontFamily: UI,
              fontSize: 13,
              fontWeight: 600,
              color: text,
              opacity: 0.65,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {meta}
          </span>
        ) : null}
      </div>
      {date ? (
        <div
          className="mt-1.5"
          style={{
            fontFamily: UI,
            fontSize: 11,
            fontWeight: 700,
            color: text,
            opacity: 0.55,
            letterSpacing: "1.6px",
            textTransform: "uppercase",
          }}
        >
          {date}
        </div>
      ) : null}
    </div>
  );
}

export function BookingsGroup({ children }: { children: ReactNode }) {
  return <section className="mb-7">{children}</section>;
}
