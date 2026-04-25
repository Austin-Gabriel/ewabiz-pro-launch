import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HomeShell, useHomeTheme, HOME_SANS, CardTheme } from "@/home/home-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BottomTabs } from "@/home/bottom-tabs";
import { useDevState } from "@/dev-state/dev-state-context";
import {
  findBookingById,
  formatBookingDate,
  bookingButtonDemoCurrentTime,
  formatExpiresIn,
  formatUsd,
  STATUS_LABEL,
  clientRelationshipLabel,
  type Booking,
  type BookingStatus,
} from "@/data/mock-bookings";
import {
  getBookingButtonState,
  type StartBookingButtonState,
} from "@/lib/booking-button-state";

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

  // Live "now" — ticks every 30s so the start-button copy recomputes as
  // real time advances. `new Date()` evaluated inline on every render is
  // not enough, because nothing else triggers a re-render with time alone.
  const [currentTime, setCurrentTime] = useState<Date>(() => bookingButtonDemoCurrentTime());
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(bookingButtonDemoCurrentTime()), 30_000);
    return () => clearInterval(id);
  }, []);

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
    // Scheduled bookings skip Get Ready entirely — the pro confirms and
    // heads straight into "On your way". Get Ready is reserved for the
    // on-demand flow where prep time matters.
    setLifecycle("en-route");
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
        <PolicyLink />
      </div>

      <DetailActionBar
        booking={booking}
        status={status}
        lifecycleActive={lifecycleActive}
        currentTime={currentTime}
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
  const { isDark, text } = useHomeTheme();
  // Pending hides last name (privacy). Otherwise show full name.
  const displayName =
    status === "pending" ? booking.clientName.split(" ")[0] : booking.clientName;
  // Relationship label (tiered, no numbered counts).
  const relationship = clientRelationshipLabel(booking);
  // Contact actions: available as soon as the request lands and through the
  // appointment. Hidden once the booking is closed (completed/cancelled),
  // since chats and calls happen elsewhere post-service.
  const showContact =
    status === "pending" || status === "confirmed" || status === "in-progress";
  // Theme-aware ring: cardBorder is tuned for white card surfaces and goes
  // invisible on the dark page background. Use a brighter cream stroke in
  // dark mode so the circle reads at the same weight as it does in light.
  const iconBtn: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 9999,
    border: `1px solid ${isDark ? "rgba(240,235,216,0.28)" : "rgba(6,28,39,0.18)"}`,
    backgroundColor: "transparent",
    color: text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
  return (
    <div className="flex flex-col gap-3 pt-3">
      {/* Top row: status pill aligned right, on its own line so the name
          can breathe at full width with the avatar. */}
      <div className="flex justify-end">
        <StatusPill status={status} />
      </div>
      {/* Identity row: avatar + (name, relationship · date) + contact icons. */}
      <div className="flex items-center gap-3.5">
        <div
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: 52,
            height: 52,
            // The hero avatar sits directly on the page background (not on a
            // white card like the list rows), so dark mode needs a brighter
            // fill + lighter monogram to stay legible on midnight.
            backgroundColor: isDark
              ? "rgba(255,130,63,0.22)"
              : "rgba(255,130,63,0.16)",
            color: isDark ? "#FFB387" : "#7A2E0E",
            fontFamily: UI,
            fontSize: 17,
            fontWeight: 600,
          }}
        >
          {booking.clientInitial}
        </div>
        <div className="min-w-0 flex-1">
          <h2
            style={{
              fontFamily: UI,
              fontSize: 22,
              fontWeight: 700,
              color: text,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            {displayName}
          </h2>
          <p
            style={{
              fontFamily: UI,
              fontSize: 12.5,
              color: text,
              opacity: 0.6,
              marginTop: 4,
              lineHeight: 1.3,
              fontVariantNumeric: "tabular-nums",
              textDecoration: status === "cancelled" ? "line-through" : "none",
            }}
          >
            {relationship} · {formatBookingDate(booking.startsAt)}
          </p>
        </div>
        {showContact ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Message ${displayName}`}
              className="transition-opacity active:opacity-60"
              style={iconBtn}
            >
              <ChatBubbleIcon size={15} />
            </button>
            <button
              type="button"
              aria-label={`Call ${displayName}`}
              className="transition-opacity active:opacity-60"
              style={iconBtn}
            >
              <PhoneIcon size={15} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  const { isDark } = useHomeTheme();
  const palette = pillPalette(status, isDark);
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

function pillPalette(status: BookingStatus, isDark: boolean) {
  switch (status) {
    case "pending":
    case "in-progress":
      return isDark
        ? { fg: "#FFB387", bg: "rgba(255,130,63,0.18)", border: "rgba(255,130,63,0.55)" }
        : { fg: "#7A2E0E", bg: "rgba(255,130,63,0.16)", border: "rgba(255,130,63,0.45)" };
    case "completed":
      return isDark
        ? { fg: "#7BD8A0", bg: "rgba(22,163,74,0.18)", border: "rgba(22,163,74,0.45)" }
        : { fg: "#0E5E2A", bg: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.35)" };
    case "cancelled":
      return isDark
        ? { fg: "rgba(240,235,216,0.55)", bg: "rgba(240,235,216,0.06)", border: "rgba(240,235,216,0.16)" }
        : { fg: "rgba(6,28,39,0.55)", bg: "rgba(6,28,39,0.05)", border: "rgba(6,28,39,0.14)" };
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

function ServiceCard({ booking, dimmed }: { booking: Booking; dimmed?: boolean }) {
  // Cancelled bookings dim the entire card to signal the service did not
  // actually take place. Completed bookings render an actual-duration sub-line
  // when it differs from the scheduled length.
  const showActual =
    booking.actualDurationMin != null &&
    booking.actualDurationMin !== booking.durationMin;
  return (
    <DetailCard>
      <div style={{ opacity: dimmed ? 0.55 : 1 }}>
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
              {showActual
                ? `${booking.durationMin} min scheduled · ${booking.actualDurationMin} min actual`
                : `${booking.durationMin} min`}
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
              textDecoration: dimmed ? "line-through" : "none",
            }}
          >
            {formatUsd(booking.priceUsd)}
          </span>
        </div>
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

function PaymentCard({
  booking,
  status,
}: {
  booking: Booking;
  status: BookingStatus;
}) {
  const platformFee = Math.round(booking.priceUsd * PLATFORM_FEE_PCT);
  const tip = booking.tipUsd ?? 0;
  const earnings = booking.priceUsd - platformFee + tip;
  const isCompleted = status === "completed";
  const payoutLine = isCompleted
    ? booking.paidOutOn
      ? `Paid out ${booking.paidOutOn}`
      : "Pending payout"
    : "Paid out within 24 hours of completion.";
  return (
    <DetailCard>
      <CardLabel>Payment</CardLabel>
      <Row label="Service total" value={formatUsd(booking.priceUsd)} />
      <Row label="Platform fee" value={`− ${formatUsd(platformFee)}`} muted />
      {tip > 0 ? <Row label="Tip" value={`+ ${formatUsd(tip)}`} /> : null}
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
        {payoutLine}
      </p>
    </DetailCard>
  );
}

/* ---- Cancellation card (replaces Payment when status === cancelled) ---- */

function CancellationCard({ booking }: { booking: Booking }) {
  const who = booking.cancelledBy ?? "client";
  const firstName = booking.clientName.split(" ")[0];
  const whoLabel =
    who === "client"
      ? `Cancelled by ${firstName}`
      : who === "pro"
        ? "Cancelled by you"
        : "Cancelled automatically (expired)";
  const fee = booking.cancellationFeeUsd ?? 0;
  return (
    <DetailCard>
      <CardLabel>Cancellation</CardLabel>
      <div
        style={{
          fontFamily: UI,
          fontSize: 15,
          fontWeight: 600,
          color: MIDNIGHT,
          letterSpacing: "-0.005em",
        }}
      >
        {whoLabel}
      </div>
      {booking.cancelledAt ? (
        <div
          style={{
            fontFamily: UI,
            fontSize: 12.5,
            color: MIDNIGHT,
            opacity: 0.6,
            marginTop: 3,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {booking.cancelledAt}
        </div>
      ) : null}
      {booking.cancellationReason ? (
        <p
          style={{
            fontFamily: UI,
            fontSize: 13,
            color: MIDNIGHT,
            opacity: 0.75,
            lineHeight: 1.45,
            marginTop: 10,
            fontStyle: "italic",
          }}
        >
          “{booking.cancellationReason}”
        </p>
      ) : null}
      {fee > 0 ? (
        <>
          <div
            className="my-3"
            style={{ height: 1, backgroundColor: "rgba(6,28,39,0.08)" }}
          />
          <Row label="Cancellation fee paid out" value={formatUsd(fee)} bold />
        </>
      ) : null}
    </DetailCard>
  );
}

/* ---- Rating card (Completed only) ---- */

function RatingCard({ booking }: { booking: Booking }) {
  const rating = booking.proRatingOfClient;
  return (
    <DetailCard>
      <CardLabel>Your rating</CardLabel>
      {rating != null ? (
        <div className="flex items-center gap-2">
          <Stars value={rating} />
          <span
            style={{
              fontFamily: UI,
              fontSize: 13,
              color: MIDNIGHT,
              opacity: 0.65,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {rating}.0 / 5
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="w-full rounded-xl py-2.5 transition-opacity active:opacity-70"
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
          Rate your experience
        </button>
      )}
    </DetailCard>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden
          style={{
            fontSize: 16,
            color: i <= value ? ORANGE : "rgba(6,28,39,0.18)",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
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

function ChatBubbleIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z" />
    </svg>
  );
}

function PhoneIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
    </svg>
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
  currentTime,
  onAccept,
  onDecline,
  onStart,
  onOpenActive,
}: {
  booking: Booking;
  status: BookingStatus;
  lifecycleActive: boolean;
  currentTime: Date;
  onAccept: () => void;
  onDecline: () => void;
  onStart: () => void;
  onOpenActive: () => void;
}) {
  const { bg, borderCol, text } = useHomeTheme();
  const buttonState = getBookingButtonState(
    { startsAt: booking.startsAt, status, lifecycleActive },
    currentTime,
  );

  const showActionBar =
    status === "pending" ||
    buttonState.state === "countdown" ||
    buttonState.state === "ready" ||
    buttonState.state === "in_progress";

  if (!showActionBar) return null;

  return (
    <div
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 px-4 pt-3"
      style={{
        backgroundColor: bg,
        paddingBottom: "calc(72px + env(safe-area-inset-bottom))",
        borderTop: `1px solid ${borderCol}`,
      }}
    >
      {status === "pending" ? (
        <>
          {booking.expiresAt ? (
            <p
              style={{
                fontFamily: UI,
                fontSize: 11.5,
                color: ORANGE,
                fontWeight: 600,
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
                border: `1px solid ${borderCol}`,
                backgroundColor: "transparent",
                color: text,
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
      ) : buttonState.state === "countdown" || buttonState.state === "ready" ? (
        <StartBookingButton
          buttonState={buttonState}
          firstName={booking.clientName.split(" ")[0]}
          neighborhood={booking.neighborhood}
          onConfirm={onStart}
        />
      ) : buttonState.state === "in_progress" ? (
        <PrimaryButton label="Open active booking" onClick={onOpenActive} />
      ) : null}
    </div>
  );
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

/**
 * "Start booking" CTA for same-day Confirmed bookings. Always renders as a
 * tappable bagel primary regardless of how far out the booking is — only
 * the label and confirmation copy change. On confirm the booking transitions
 * straight into "On your way" (scheduled bookings skip Get Ready).
 */
function StartBookingButton({
  buttonState,
  firstName,
  neighborhood,
  onConfirm,
}: {
  buttonState: StartBookingButtonState;
  firstName: string;
  neighborhood: string;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isEarlyStart = buttonState.state === "countdown";
  const title = isEarlyStart
    ? `Start ${firstName}'s booking early?`
    : `Start ${firstName}'s booking?`;
  const body = isEarlyStart
    ? `The booking ${buttonState.copy.toLowerCase()}. You'll head to ${neighborhood} now. The client will be notified.`
    : `You'll head to ${neighborhood} now. The client will be notified.`;
  return (
    <>
      <PrimaryButton label={buttonState.copy} onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-sm rounded-2xl"
          style={{ fontFamily: UI }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                fontFamily: UI,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </DialogTitle>
            <DialogDescription
              style={{
                fontFamily: UI,
                fontSize: 14,
                lineHeight: 1.45,
                marginTop: 4,
              }}
            >
              {body}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col sm:space-x-0">
            <PrimaryButton
              label="Yes, start now"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            />
            <SecondaryActionButton label="Cancel" onClick={() => setOpen(false)} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Outlined full-width secondary button — used for "Book again" and
 * "Book similar" on resolved bookings where the bagel primary fill would
 * imply more urgency than the action deserves.
 */
function SecondaryActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl transition-opacity active:opacity-70"
      style={{
        height: 52,
        border: "1px solid rgba(6,28,39,0.22)",
        backgroundColor: "transparent",
        color: MIDNIGHT,
        fontFamily: UI,
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "-0.005em",
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
