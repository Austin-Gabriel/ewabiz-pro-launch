import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HomeShell, useHomeTheme, HOME_SANS, CardTheme } from "@/home/home-shell";
import { BottomTabs } from "@/home/bottom-tabs";
import { useDevState } from "@/dev-state/dev-state-context";
import {
  findBookingById,
  formatBookingDate,
  formatExpiresIn,
  formatUsd,
  STATUS_LABEL,
  type Booking,
  type BookingStatus,
} from "@/data/mock-bookings";

/**
 * Canonical booking detail page. Reads from the canonical booking registry
 * by id and renders one industrial working surface per booking. Address is
 * privacy-gated: pending/confirmed bookings show neighborhood only — the
 * full street address only appears once the booking enters Get Ready
 * (handled at the lifecycle level, not here).
 */

const UI = HOME_SANS;
const ORANGE = "#FF823F";
const MIDNIGHT = "#061C27";
const PLATFORM_FEE_PCT = 0.1;

export function BookingDetailPage({ bookingId }: { bookingId: string }) {
  const navigate = useNavigate();
  const { state: dev, setLifecycle } = useDevState();
  const booking = findBookingById(bookingId);
  // Local optimistic status — accept/decline mutate this without leaving the
  // page so the pro sees the result immediately. Defaults safely when the
  // booking is missing; hooks must run unconditionally before any return.
  const [status, setStatus] = useState<BookingStatus>(
    booking?.status ?? "cancelled",
  );

  if (!booking) {
    return (
      <HomeShell>
        <DetailHeader title="Booking" onBack={() => navigate({ to: "/bookings" })} />
        <div className="flex flex-1 items-center justify-center px-6">
          <p style={{ fontFamily: UI, fontSize: 14, color: MIDNIGHT, opacity: 0.6 }}>
            We couldn't find that booking.
          </p>
        </div>
        <BottomTabsForDetail />
      </HomeShell>
    );
  }

  const lifecycleActive =
    dev.lifecycle !== "none" && dev.lifecycle !== "incoming";

  const handleAccept = () => setStatus("confirmed");
  const handleDecline = () => {
    setStatus("cancelled");
    setTimeout(() => navigate({ to: "/bookings", search: { tab: "upcoming" } }), 250);
  };
  const handleStartBooking = () => {
    setLifecycle("get-ready");
    navigate({ to: "/bookings", search: { tab: "in-progress" } });
  };
  const handleOpenActive = () =>
    navigate({ to: "/bookings", search: { tab: "in-progress" } });

  return (
    <HomeShell>
      <DetailHeader
        title="Booking"
        onBack={() => navigate({ to: "/bookings", search: { tab: tabForStatus(status) } })}
      />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-32 pt-2">
        <HeroBlock booking={booking} status={status} />
        <ServiceCard booking={booking} dimmed={status === "cancelled"} />
        <LocationCard booking={booking} revealAddress={false} />
        {status === "cancelled" ? (
          <CancellationCard booking={booking} />
        ) : (
          <PaymentCard booking={booking} status={status} />
        )}
        {status === "completed" ? <RatingCard booking={booking} /> : null}
        {booking.note ? <NotesCard note={booking.note} /> : null}
        <ClientCard booking={booking} status={status} />
        {status === "pending" || status === "confirmed" ? <PolicyLink /> : null}
      </div>

      <DetailActionBar
        booking={booking}
        status={status}
        lifecycleActive={lifecycleActive}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onStart={handleStartBooking}
        onOpenActive={handleOpenActive}
      />

      <BottomTabsForDetail />
    </HomeShell>
  );
}

function tabForStatus(s: BookingStatus): "upcoming" | "in-progress" | "history" {
  if (s === "in-progress") return "in-progress";
  if (s === "completed" || s === "cancelled") return "history";
  return "upcoming";
}

function BottomTabsForDetail() {
  const navigate = useNavigate();
  return (
    <BottomTabs
      active="bookings"
      onSelect={(k) => {
        if (k === "home") navigate({ to: "/home" });
        if (k === "bookings") navigate({ to: "/bookings" });
      }}
    />
  );
}

/* ---------------- Header ---------------- */

function DetailHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { text, borderCol } = useHomeTheme();
  return (
    <div
      className="flex items-center gap-2 px-2 pt-2"
      style={{ height: 52, borderBottom: `1px solid ${borderCol}` }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity active:opacity-60"
        style={{ color: text, backgroundColor: "transparent", border: "none" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h1
        style={{
          fontFamily: UI,
          fontSize: 16,
          fontWeight: 600,
          color: text,
          letterSpacing: "-0.01em",
          margin: 0,
        }}
      >
        {title}
      </h1>
    </div>
  );
}

/* ---------------- Hero ---------------- */

function HeroBlock({ booking, status }: { booking: Booking; status: BookingStatus }) {
  const { text } = useHomeTheme();
  return (
    <div className="flex items-start justify-between gap-3 pt-3">
      <div className="min-w-0 flex-1">
        <h2
          style={{
            fontFamily: UI,
            fontSize: 26,
            fontWeight: 700,
            color: text,
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {booking.clientName}
        </h2>
        <p
          style={{
            fontFamily: UI,
            fontSize: 13.5,
            color: text,
            opacity: 0.65,
            marginTop: 6,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatBookingDate(booking.startsAt)}
        </p>
      </div>
      <StatusPill status={status} />
    </div>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  const palette = pillPalette(status);
  return (
    <span
      style={{
        fontFamily: UI,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: palette.fg,
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        padding: "5px 10px",
        borderRadius: 9999,
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function pillPalette(status: BookingStatus) {
  switch (status) {
    case "pending":
      return { fg: "#7A2E0E", bg: "rgba(255,130,63,0.16)", border: "rgba(255,130,63,0.45)" };
    case "in-progress":
      return { fg: "#7A2E0E", bg: "rgba(255,130,63,0.16)", border: "rgba(255,130,63,0.55)" };
    case "completed":
      return { fg: "#0E5E2A", bg: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.35)" };
    case "cancelled":
      return { fg: MIDNIGHT, bg: "rgba(6,28,39,0.06)", border: "rgba(6,28,39,0.18)" };
    default:
      return { fg: MIDNIGHT, bg: "rgba(6,28,39,0.04)", border: "rgba(6,28,39,0.14)" };
  }
}

/* ---------------- Cards ---------------- */

function DetailCard({ children }: { children: React.ReactNode }) {
  return (
    <CardTheme>
      <DetailCardInner>{children}</DetailCardInner>
    </CardTheme>
  );
}

function DetailCardInner({ children }: { children: React.ReactNode }) {
  const { cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="rounded-2xl px-4 py-4"
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

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: 10.5,
        fontWeight: 700,
        color: MIDNIGHT,
        opacity: 0.5,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function ServiceCard({ booking }: { booking: Booking }) {
  return (
    <DetailCard>
      <CardLabel>Service</CardLabel>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div
            style={{
              fontFamily: UI,
              fontSize: 17,
              fontWeight: 600,
              color: MIDNIGHT,
              letterSpacing: "-0.01em",
            }}
          >
            {booking.service}
          </div>
          <div
            style={{
              fontFamily: UI,
              fontSize: 13,
              color: MIDNIGHT,
              opacity: 0.65,
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {booking.durationMin} min
          </div>
        </div>
        <span
          style={{
            fontFamily: UI,
            fontSize: 22,
            fontWeight: 700,
            color: MIDNIGHT,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatUsd(booking.priceUsd)}
        </span>
      </div>
    </DetailCard>
  );
}

function LocationCard({ booking, revealAddress }: { booking: Booking; revealAddress: boolean }) {
  return (
    <DetailCard>
      <CardLabel>Location</CardLabel>
      <div className="flex items-start gap-2.5">
        <span style={{ marginTop: 2, color: MIDNIGHT, opacity: 0.55 }}>
          <PinIcon size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <div
            style={{
              fontFamily: UI,
              fontSize: 14,
              fontWeight: 600,
              color: MIDNIGHT,
              letterSpacing: "-0.005em",
            }}
          >
            {booking.neighborhood}
          </div>
          {revealAddress ? (
            <>
              <div
                style={{
                  fontFamily: UI,
                  fontSize: 13,
                  color: MIDNIGHT,
                  opacity: 0.7,
                  marginTop: 3,
                }}
              >
                {booking.address}
              </div>
              {booking.distance ? (
                <div
                  style={{
                    fontFamily: UI,
                    fontSize: 12,
                    color: MIDNIGHT,
                    opacity: 0.5,
                    marginTop: 2,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {booking.distance} from your base
                </div>
              ) : null}
              <button
                type="button"
                className="mt-3 transition-opacity active:opacity-60"
                style={{
                  fontFamily: UI,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: ORANGE,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  letterSpacing: "-0.005em",
                }}
              >
                Open in maps →
              </button>
            </>
          ) : (
            <div
              style={{
                fontFamily: UI,
                fontSize: 11.5,
                color: MIDNIGHT,
                opacity: 0.5,
                marginTop: 6,
                lineHeight: 1.4,
              }}
            >
              Full address shared when it's time to head out.
            </div>
          )}
        </div>
      </div>
    </DetailCard>
  );
}

function PaymentCard({ booking }: { booking: Booking }) {
  const platformFee = Math.round(booking.priceUsd * PLATFORM_FEE_PCT);
  const earnings = booking.priceUsd - platformFee;
  return (
    <DetailCard>
      <CardLabel>Payment</CardLabel>
      <Row label="Service total" value={formatUsd(booking.priceUsd)} />
      <Row label="Platform fee" value={`− ${formatUsd(platformFee)}`} muted />
      <div
        className="my-3"
        style={{ height: 1, backgroundColor: "rgba(6,28,39,0.08)" }}
      />
      <Row label="Your earnings" value={formatUsd(earnings)} bold />
      <p
        style={{
          fontFamily: UI,
          fontSize: 11.5,
          color: MIDNIGHT,
          opacity: 0.5,
          marginTop: 12,
          lineHeight: 1.4,
        }}
      >
        Paid out within 24 hours of completion.
      </p>
    </DetailCard>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span
        style={{
          fontFamily: UI,
          fontSize: 13,
          color: MIDNIGHT,
          opacity: muted ? 0.55 : 0.7,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: UI,
          fontSize: bold ? 16 : 13.5,
          fontWeight: bold ? 700 : 500,
          color: MIDNIGHT,
          letterSpacing: bold ? "-0.01em" : "-0.005em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function NotesCard({ note }: { note: string }) {
  return (
    <DetailCard>
      <CardLabel>Note from client</CardLabel>
      <p
        style={{
          fontFamily: UI,
          fontSize: 14,
          color: MIDNIGHT,
          opacity: 0.85,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        “{note}”
      </p>
    </DetailCard>
  );
}

function ClientCard({ booking, status }: { booking: Booking; status: BookingStatus }) {
  const showFullName = status !== "pending";
  const displayName = showFullName
    ? booking.clientName
    : booking.clientName.split(" ")[0];
  const history = booking.priorBookingsWithPro ?? 0;
  const historyLabel =
    history === 0
      ? "First-time client"
      : `${ordinal(history + 1)} booking with you`;

  return (
    <DetailCard>
      <CardLabel>Client</CardLabel>
      <div className="flex items-center gap-3.5">
        <div
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: 44,
            height: 44,
            backgroundColor: "rgba(255,130,63,0.16)",
            color: "#7A2E0E",
            fontFamily: UI,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {booking.clientInitial}
        </div>
        <div className="min-w-0 flex-1">
          <div
            style={{
              fontFamily: UI,
              fontSize: 15,
              fontWeight: 600,
              color: MIDNIGHT,
              letterSpacing: "-0.005em",
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontFamily: UI,
              fontSize: 12,
              color: MIDNIGHT,
              opacity: 0.55,
              marginTop: 2,
            }}
          >
            {historyLabel}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <SecondaryButton label="Message" />
        <SecondaryButton label="Call" />
      </div>
    </DetailCard>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function SecondaryButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded-xl py-2.5 transition-opacity active:opacity-70"
      style={{
        border: "1px solid rgba(6,28,39,0.18)",
        backgroundColor: "transparent",
        color: MIDNIGHT,
        fontFamily: UI,
        fontSize: 13.5,
        fontWeight: 600,
        letterSpacing: "-0.005em",
      }}
    >
      {label}
    </button>
  );
}

function PolicyLink() {
  return (
    <button
      type="button"
      className="mt-1 self-center transition-opacity active:opacity-60"
      style={{
        fontFamily: UI,
        fontSize: 12,
        color: MIDNIGHT,
        opacity: 0.55,
        background: "transparent",
        border: "none",
        textDecoration: "underline",
      }}
    >
      Cancellation policy
    </button>
  );
}

/* ---------------- Action bar ---------------- */

function DetailActionBar({
  booking,
  status,
  lifecycleActive,
  onAccept,
  onDecline,
  onStart,
  onOpenActive,
}: {
  booking: Booking;
  status: BookingStatus;
  lifecycleActive: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onStart: () => void;
  onOpenActive: () => void;
}) {
  const { bg, borderCol } = useHomeTheme();
  const action = useMemo(
    () => deriveAction(booking, status, lifecycleActive),
    [booking, status, lifecycleActive],
  );

  if (!action) return null;

  return (
    <div
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 px-4 pt-3"
      style={{
        backgroundColor: bg,
        paddingBottom: "calc(72px + env(safe-area-inset-bottom))",
        borderTop: `1px solid ${borderCol}`,
      }}
    >
      {action.kind === "pending" ? (
        <>
          {booking.expiresAt ? (
            <p
              style={{
                fontFamily: UI,
                fontSize: 11.5,
                color: MIDNIGHT,
                opacity: 0.55,
                textAlign: "center",
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              {formatExpiresIn(booking.expiresAt)}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onDecline}
              className="rounded-2xl transition-opacity active:opacity-70"
              style={{
                height: 52,
                border: "1px solid rgba(6,28,39,0.22)",
                backgroundColor: "transparent",
                color: MIDNIGHT,
                opacity: 0.85,
                fontFamily: UI,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.005em",
              }}
            >
              Decline
            </button>
            <PrimaryButton label="Accept" onClick={onAccept} />
          </div>
        </>
      ) : action.kind === "start" ? (
        <PrimaryButton label="Start booking" onClick={onStart} />
      ) : action.kind === "start-disabled" ? (
        <PrimaryButton label={action.label} onClick={() => {}} disabled />
      ) : action.kind === "open-active" ? (
        <PrimaryButton label="Open active booking" onClick={onOpenActive} />
      ) : action.kind === "rate" ? (
        <PrimaryButton label="Rate client" onClick={() => {}} />
      ) : action.kind === "cancel" ? (
        <button
          type="button"
          className="w-full py-3 transition-opacity active:opacity-60"
          style={{
            fontFamily: UI,
            fontSize: 13,
            color: MIDNIGHT,
            opacity: 0.55,
            background: "transparent",
            border: "none",
            textDecoration: "underline",
          }}
        >
          Cancel booking
        </button>
      ) : null}
    </div>
  );
}

type DetailAction =
  | { kind: "pending" }
  | { kind: "start" }
  | { kind: "start-disabled"; label: string }
  | { kind: "open-active" }
  | { kind: "rate" }
  | { kind: "cancel" }
  | null;

function deriveAction(
  booking: Booking,
  status: BookingStatus,
  lifecycleActive: boolean,
): DetailAction {
  if (status === "pending") return { kind: "pending" };
  if (status === "in-progress") return { kind: "open-active" };
  if (status === "completed") return { kind: "rate" };
  if (status === "cancelled") return null;

  if (status === "confirmed") {
    if (lifecycleActive) return { kind: "open-active" };
    if (isSameDay(booking.startsAt)) {
      const minsUntil = Math.round(
        (booking.startsAt.getTime() - Date.now()) / 60000,
      );
      // Travel-window threshold — 60 min before start time the pro can start
      // the booking manually (matches the auto-trigger window in spec).
      if (minsUntil <= 60) return { kind: "start" };
      return { kind: "start-disabled", label: `Starts in ${formatLeadTime(minsUntil)}` };
    }
    return { kind: "cancel" };
  }
  return null;
}

function isSameDay(d: Date, now: Date = new Date()): boolean {
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatLeadTime(mins: number): string {
  if (mins <= 0) return "0m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function PrimaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="w-full rounded-2xl transition-transform active:scale-[0.99]"
      style={{
        height: 52,
        backgroundColor: ORANGE,
        color: MIDNIGHT,
        fontFamily: UI,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

function PinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
