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
}

export function BookingRowCard(props: BookingRowCardProps) {
  return (
    <CardTheme>
      <BookingRowCardInner {...props} />
    </CardTheme>
  );
}

function BookingRowCardInner({ booking, isNext, cancelled, onSelect }: BookingRowCardProps) {
  const { cardSurface, cardBorder } = useHomeTheme();
  const borderCol = isNext ? BAGEL_BORDER : cardBorder;
  const Wrapper: any = onSelect ? "button" : "div";

  return (
    <div className="relative">
      <Wrapper
        type={onSelect ? "button" : undefined}
        onClick={onSelect}
        className={
          "flex w-full items-start gap-3.5 rounded-2xl px-4 py-3.5 text-left transition-opacity active:opacity-80"
        }
        style={{
          backgroundColor: isNext ? "#FFF4EC" : cardSurface,
          border: `1px solid ${borderCol}`,
          boxShadow: isNext
            ? "0 1px 2px rgba(6,28,39,0.06), 0 12px 28px -16px rgba(255,130,63,0.35)"
            : "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
        }}
      >
        <Monogram initial={booking.clientInitial} />
        <Body
          name={booking.clientName}
          service={booking.service}
          location={booking.location}
        />
        <Price priceUsd={booking.priceUsd} cancelled={cancelled} />
      </Wrapper>
      {isNext ? <NextPill /> : null}
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
}: {
  name: string;
  service: string;
  location?: string;
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
      style={{
        fontFamily: UI,
        fontSize: 15,
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
        <BookingRowCard booking={entry.booking} isNext={entry.isNext} />
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
        className="rounded-full"
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
