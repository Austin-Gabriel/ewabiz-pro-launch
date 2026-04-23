import { useEffect, useMemo, useRef, useState } from "react";
import { CardTheme, HOME_SANS, useHomeTheme } from "@/home/home-shell";
import {
  useDevState,
  type DevLifecycle,
} from "@/dev-state/dev-state-context";
import { LIFECYCLE_BOOKING, type LifecycleBooking } from "./lifecycle-data";

/**
 * Booking lifecycle takeover. Replaces Home (and hides the bottom tab bar)
 * whenever dev.lifecycle is anything other than "none". Single working
 * surface, one primary CTA per state, industrial Inter typography, white
 * cards on dark / cream-elevated on light.
 *
 * State transitions slide horizontally 300ms — the screen tracks one focused
 * booking from dispatch to complete.
 */

const UI = `Inter, ${HOME_SANS}`;
const ORANGE = "#FF823F";
const SUCCESS = "#16A34A";

/** Inner kind that we *render*. Includes branches not present in DevLifecycle. */
type LifecycleKind =
  | "incoming"
  | "get-ready"
  | "en-route"
  | "arrived"
  | "in-progress"
  | "complete"
  | "decline-confirm"
  | "cancel-confirm"
  | "no-show";

export function LifecycleSurface() {
  const { state: dev, setLifecycle } = useDevState();

  // Internal "kind" tracks dev.lifecycle plus any branch screens (decline,
  // cancel-confirm, no-show) the user opens from inside a state.
  const [kind, setKind] = useState<LifecycleKind>(devToKind(dev.lifecycle));

  // Sync external dev-toggle changes into our local kind.
  useEffect(() => {
    setKind(devToKind(dev.lifecycle));
  }, [dev.lifecycle]);

  const booking = LIFECYCLE_BOOKING;
  const exitToHome = () => {
    setLifecycle("none");
  };

  return (
    <SurfaceRoot lifecycleKind={kind}>
      {kind === "incoming" ? (
        <IncomingRequest
          booking={booking}
          onAccept={() => setLifecycle("get-ready")}
          onDecline={() => setKind("decline-confirm")}
        />
      ) : null}

      {kind === "get-ready" ? (
        <GetReady
          booking={booking}
          onStartRoute={() => setLifecycle("en-route")}
          onCancel={() => setKind("cancel-confirm")}
        />
      ) : null}

      {kind === "en-route" ? (
        <EnRoute booking={booking} onArrived={() => setLifecycle("arrived")} />
      ) : null}

      {kind === "arrived" ? (
        <ArrivedPin
          booking={booking}
          onSuccess={() => setLifecycle("in-progress")}
          onClientNotHere={() => setKind("no-show")}
        />
      ) : null}

      {kind === "in-progress" ? (
        <InProgress booking={booking} onEnd={() => setLifecycle("complete")} />
      ) : null}

      {kind === "complete" ? (
        <Complete booking={booking} onDone={exitToHome} />
      ) : null}

      {kind === "decline-confirm" ? (
        <DeclineConfirmation onDone={exitToHome} />
      ) : null}

      {kind === "cancel-confirm" ? (
        <CancelConfirm
          onKeep={() => setKind(devToKind(dev.lifecycle))}
          onCancel={exitToHome}
        />
      ) : null}

      {kind === "no-show" ? (
        <NoShow booking={booking} onMarkNoShow={exitToHome} />
      ) : null}
    </SurfaceRoot>
  );
}

function devToKind(d: DevLifecycle): LifecycleKind {
  // "none" is filtered by the consumer; default to incoming defensively.
  return (d === "none" ? "incoming" : d) as LifecycleKind;
}

/* ---------------- Surface root (full-screen takeover w/ slide) ---------------- */

function SurfaceRoot({
  lifecycleKind,
  children,
}: {
  lifecycleKind: LifecycleKind;
  children: React.ReactNode;
}) {
  const { bg } = useHomeTheme();
  return (
    <div
      className="fixed inset-0 z-30 flex flex-col"
      style={{
        backgroundColor: bg,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        fontFamily: UI,
        // Smooth horizontal slide between states
        animation: "ewa-life-slide 300ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      key={lifecycleKind}
      role="region"
      aria-label="Booking lifecycle"
    >
      {children}
      <style>{`
        @keyframes ewa-life-slide {
          from { transform: translateX(24px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes ewa-life-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/* =================================================================
 * 1. INCOMING REQUEST
 * ================================================================= */

function IncomingRequest({
  booking,
  onAccept,
  onDecline,
}: {
  booking: LifecycleBooking;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { text } = useHomeTheme();
  const TOTAL = 90;
  const [secondsLeft, setSecondsLeft] = useState(TOTAL);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      setSecondsLeft(Math.max(0, TOTAL - elapsed));
    }, 200);
    return () => clearInterval(id);
  }, []);

  // Auto-decline at 0
  useEffect(() => {
    if (secondsLeft === 0) onDecline();
  }, [secondsLeft, onDecline]);

  return (
    <div className="flex flex-1 flex-col px-5 pt-8 pb-6">
      <div className="flex flex-col items-center">
        <CountdownRing secondsLeft={secondsLeft} total={TOTAL} />
        <Avatar initial={booking.clientInitial} size={68} />
        <h1 style={{ ...heading(text), marginTop: 16, fontSize: 24 }}>
          {booking.clientName}
        </h1>
        <p style={{ ...subline(text), marginTop: 6, fontSize: 14 }}>
          {booking.service} · {booking.durationMin} min
        </p>
        <p
          style={{
            ...subline(text),
            marginTop: 4,
            fontSize: 13,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {booking.distance} · {booking.etaMin} min away
        </p>
        <span
          style={{
            fontFamily: UI,
            fontSize: 36,
            fontWeight: 700,
            color: text,
            letterSpacing: "-0.02em",
            marginTop: 14,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${booking.priceUsd}
        </span>

        <CardTheme>
          <AddressBox address={booking.address} />
        </CardTheme>
      </div>

      <div className="flex-1" />

      <PrimaryCta label="Accept" onClick={onAccept} />
      <button
        type="button"
        onClick={onDecline}
        className="mt-3 w-full py-3 transition-opacity active:opacity-60"
        style={tertiaryLink(text)}
      >
        Decline
      </button>
      <p
        style={{
          fontFamily: UI,
          fontSize: 11,
          color: text,
          opacity: 0.45,
          textAlign: "center",
          marginTop: 8,
        }}
      >
        Dispatches next pro if no response
      </p>
    </div>
  );
}

function CountdownRing({ secondsLeft, total }: { secondsLeft: number; total: number }) {
  const { text } = useHomeTheme();
  const SIZE = 96;
  const STROKE = 5;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const pct = secondsLeft / total;
  const dashOffset = C * (1 - pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE, marginBottom: 14 }}>
      <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="currentColor" strokeOpacity="0.15" strokeWidth={STROKE} fill="none" style={{ color: text }} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={ORANGE}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={C}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 200ms linear" }}
        />
      </svg>
      <span
        className="absolute"
        style={{
          fontFamily: UI,
          fontSize: 26,
          fontWeight: 700,
          color: text,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
        }}
      >
        {secondsLeft}s
      </span>
    </div>
  );
}

/* =================================================================
 * 2. GET READY
 * ================================================================= */

function GetReady({
  booking,
  onStartRoute,
  onCancel,
}: {
  booking: LifecycleBooking;
  onStartRoute: () => void;
  onCancel: () => void;
}) {
  const { text } = useHomeTheme();
  // Prep timer: starts at prepMin and counts down. Kept in seconds.
  const [secondsLeft, setSecondsLeft] = useState(booking.prepMin * 60);
  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <LifecycleColumn>
      <Header title="Get ready" />
      <ClientCard booking={booking} />

      <div className="mt-8 flex flex-col items-center">
        <span
          style={{
            fontFamily: UI,
            fontSize: 56,
            fontWeight: 700,
            color: text,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {mm}:{ss}
        </span>
        <p style={{ ...subline(text), marginTop: 10, fontSize: 13 }}>
          Leave by {booking.leaveByAt}
        </p>
        <p style={{ ...subline(text), marginTop: 4, fontSize: 12, opacity: 0.55 }}>
          You set {booking.prepMin} min prep · client expects you by {booking.arrivalAt}
        </p>
      </div>

      <div className="flex-1" />

      <PrimaryCta label="Start Route" onClick={onStartRoute} />
      <button
        type="button"
        onClick={onCancel}
        className="mt-3 w-full py-2 transition-opacity active:opacity-60"
        style={{ ...tertiaryLink(text), fontSize: 12 }}
      >
        Cancel booking
      </button>
    </LifecycleColumn>
  );
}

/* =================================================================
 * 3. EN ROUTE
 * ================================================================= */

function EnRoute({
  booking,
  onArrived,
}: {
  booking: LifecycleBooking;
  onArrived: () => void;
}) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <LifecycleColumn>
      <Header title="On your way" />
      <ClientCard booking={booking} />

      <CardTheme>
        <div
          className="mt-5 rounded-2xl px-5 py-6"
          style={{
            backgroundColor: cardSurface,
            border: `1px solid ${cardBorder}`,
            boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
          }}
        >
          <DistanceHero booking={booking} />
          <button
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 transition-transform active:scale-[0.99]"
            style={{
              backgroundColor: ORANGE,
              color: "#061C27",
              fontFamily: UI,
              fontSize: 14,
              fontWeight: 600,
            }}
            onClick={() => {
              /* In production: opens native maps via geo: URI. */
            }}
          >
            <PinIcon />
            Navigate
          </button>
        </div>
      </CardTheme>

      <div className="flex-1" />

      <PrimaryCta label="I've arrived" onClick={onArrived} />
      <button
        type="button"
        className="mt-3 w-full py-2 transition-opacity active:opacity-60"
        style={{ ...tertiaryLink(text), fontSize: 13 }}
      >
        Message client
      </button>
    </LifecycleColumn>
  );
}

function DistanceHero({ booking }: { booking: LifecycleBooking }) {
  const { text } = useHomeTheme();
  return (
    <div className="flex flex-col items-center">
      <span
        style={{
          fontFamily: UI,
          fontSize: 48,
          fontWeight: 700,
          color: text,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {booking.distance}
      </span>
      <p style={{ ...subline(text), marginTop: 10, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
        Est. {booking.etaMin} min · arriving {booking.arrivalAt}
      </p>
    </div>
  );
}

/* =================================================================
 * 4. ARRIVED / PIN ENTRY
 * ================================================================= */

function ArrivedPin({
  booking,
  onSuccess,
  onClientNotHere,
}: {
  booking: LifecycleBooking;
  onSuccess: () => void;
  onClientNotHere: () => void;
}) {
  const { text } = useHomeTheme();
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const filled = digits.every((d) => d.length === 1);

  const handleChange = (i: number, v: string) => {
    const cleaned = v.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = cleaned;
      return next;
    });
    setError(null);
    if (cleaned && i < 3) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };

  const submit = () => {
    const entered = digits.join("");
    if (entered === booking.pin) {
      onSuccess();
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setError("That PIN doesn't match. Try again.");
    setDigits(["", "", "", ""]);
    refs[0].current?.focus();
    if (next >= 3) setHelpOpen(true);
  };

  return (
    <LifecycleColumn>
      <Header title="Enter client's PIN" />
      <p style={{ ...subline(text), marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
        Ask {booking.clientName.split(" ")[0]} for their 4-digit code. They received it when the booking confirmed.
      </p>

      <div className="mt-10 flex justify-center gap-3">
        {digits.map((d, i) => {
          const active = i === digits.findIndex((x) => x === "");
          const filledThis = d.length === 1;
          return (
            <input
              key={i}
              ref={refs[i]}
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              aria-label={`PIN digit ${i + 1}`}
              style={{
                width: 56,
                height: 64,
                borderRadius: 14,
                textAlign: "center",
                backgroundColor: "transparent",
                border: `1.5px solid ${active && !filledThis ? ORANGE : "rgba(240,235,216,0.18)"}`,
                color: text,
                fontFamily: UI,
                fontSize: 30,
                fontWeight: 700,
                outline: "none",
                fontVariantNumeric: "tabular-nums",
                transition: "border-color 150ms ease",
              }}
            />
          );
        })}
      </div>

      {error ? (
        <p
          style={{
            fontFamily: UI,
            fontSize: 12.5,
            color: ORANGE,
            textAlign: "center",
            marginTop: 14,
            fontWeight: 500,
          }}
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        className="mt-6 self-center transition-opacity active:opacity-60"
        style={{ ...tertiaryLink(text), fontSize: 12.5 }}
      >
        Can't get the PIN?
      </button>

      <div className="flex-1" />

      <PrimaryCta label="Start service" onClick={submit} disabled={!filled} />

      {helpOpen ? (
        <PinHelpSheet
          highlightRecovery={attempts >= 3}
          onClose={() => setHelpOpen(false)}
          onClientNotHere={() => {
            setHelpOpen(false);
            onClientNotHere();
          }}
        />
      ) : null}
    </LifecycleColumn>
  );
}

function PinHelpSheet({
  highlightRecovery,
  onClose,
  onClientNotHere,
}: {
  highlightRecovery: boolean;
  onClose: () => void;
  onClientNotHere: () => void;
}) {
  const { text, bg, borderCol } = useHomeTheme();
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl px-5 pb-8 pt-5"
        style={{ backgroundColor: bg, border: `1px solid ${borderCol}`, borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden className="mx-auto mb-4 rounded-full" style={{ width: 36, height: 4, backgroundColor: text, opacity: 0.18 }} />
        <h3 style={{ fontFamily: UI, fontSize: 17, fontWeight: 600, color: text, margin: 0 }}>
          Can't get the PIN?
        </h3>
        {highlightRecovery ? (
          <p style={{ fontFamily: UI, fontSize: 12.5, color: ORANGE, marginTop: 6, fontWeight: 500 }}>
            Three attempts didn't match. Try one of the options below.
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          <SheetAction label="Resend PIN to client" onClick={onClose} />
          <SheetAction label="Contact support" onClick={onClose} />
          <SheetAction
            label="Client isn't here"
            destructive
            onClick={onClientNotHere}
          />
        </div>
      </div>
    </div>
  );
}

function SheetAction({
  label,
  destructive,
  onClick,
}: {
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  const { text, borderCol } = useHomeTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl px-4 py-3 text-left transition-opacity active:opacity-70"
      style={{
        border: `1px solid ${borderCol}`,
        color: destructive ? "#E5604A" : text,
        fontFamily: UI,
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );
}

/* =================================================================
 * 5. IN PROGRESS
 * ================================================================= */

function InProgress({
  booking,
  onEnd,
}: {
  booking: LifecycleBooking;
  onEnd: () => void;
}) {
  const { text } = useHomeTheme();
  // Service timer running since mount. Real implementation would persist
  // start time so it survives re-renders / navigations.
  const startedAt = useRef(Date.now());
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <LifecycleColumn>
      <Header title="In session" />
      <ClientCard booking={booking} />

      <div className="mt-8 flex flex-col items-center">
        <span
          style={{
            fontFamily: UI,
            fontSize: 56,
            fontWeight: 700,
            color: text,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {hh}:{mm}:{ss}
        </span>
        <p style={{ ...subline(text), marginTop: 10, fontSize: 13 }}>
          Scheduled: {booking.durationMin} min
        </p>
      </div>

      <CardTheme>
        <ServiceLine booking={booking} />
      </CardTheme>

      <div className="flex-1" />

      <PrimaryCta label="End service" onClick={onEnd} />
    </LifecycleColumn>
  );
}

function ServiceLine({ booking }: { booking: LifecycleBooking }) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="mt-6 flex items-center justify-between rounded-2xl px-4 py-3"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06)",
      }}
    >
      <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 500, color: text }}>{booking.service}</span>
      <span
        style={{ fontFamily: UI, fontSize: 14, fontWeight: 700, color: text, fontVariantNumeric: "tabular-nums" }}
      >
        ${booking.priceUsd}
      </span>
    </div>
  );
}

/* =================================================================
 * 6. COMPLETE
 * ================================================================= */

function Complete({
  booking,
  onDone,
}: {
  booking: LifecycleBooking;
  onDone: () => void;
}) {
  const { text } = useHomeTheme();
  const [stars, setStars] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  return (
    <LifecycleColumn>
      <Header title="Service complete" />
      <ClientCard booking={booking} />

      <div className="mt-7 flex flex-col items-center">
        <span
          style={{
            fontFamily: UI,
            fontSize: 64,
            fontWeight: 700,
            color: SUCCESS,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          ${booking.payoutUsd}
        </span>
        <p style={{ ...subline(text), marginTop: 8, fontSize: 13 }}>Paid out Friday</p>
        {booking.tipUsd > 0 ? (
          <p
            style={{
              fontFamily: UI,
              fontSize: 13,
              color: SUCCESS,
              marginTop: 4,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            +${booking.tipUsd} tip · thank you
          </p>
        ) : null}
      </div>

      <CardTheme>
        <RatingBlock
          booking={booking}
          stars={stars}
          onStars={setStars}
          note={note}
          onNote={setNote}
        />
      </CardTheme>

      <div className="flex-1" />

      <PrimaryCta label="Done" onClick={onDone} />
    </LifecycleColumn>
  );
}

function RatingBlock({
  booking,
  stars,
  onStars,
  note,
  onNote,
}: {
  booking: LifecycleBooking;
  stars: number;
  onStars: (n: number) => void;
  note: string;
  onNote: (v: string) => void;
}) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="mt-7 rounded-2xl px-4 py-4"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
      }}
    >
      <p style={{ fontFamily: UI, fontSize: 13.5, fontWeight: 600, color: text, margin: 0 }}>
        Rate {booking.clientName.split(" ")[0]}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onStars(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className="transition-transform active:scale-95"
            style={{
              color: n <= stars ? ORANGE : text,
              opacity: n <= stars ? 1 : 0.25,
            }}
          >
            <StarIcon size={26} />
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Optional note · Great client, on time…"
        value={note}
        onChange={(e) => onNote(e.target.value)}
        style={{
          marginTop: 12,
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${cardBorder}`,
          outline: "none",
          padding: "8px 0",
          fontFamily: UI,
          fontSize: 13,
          color: text,
        }}
      />
    </div>
  );
}

/* =================================================================
 * BRANCHES — Decline / Cancel / No-show
 * ================================================================= */

function DeclineConfirmation({ onDone }: { onDone: () => void }) {
  const { text } = useHomeTheme();
  useEffect(() => {
    const id = setTimeout(onDone, 2000);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div
        className="rounded-full"
        style={{ width: 12, height: 12, backgroundColor: ORANGE, animation: "ewa-life-pulse 1400ms ease-in-out infinite" }}
      />
      <p
        style={{
          fontFamily: UI,
          fontSize: 22,
          fontWeight: 600,
          color: text,
          letterSpacing: "-0.02em",
          marginTop: 22,
        }}
      >
        Request declined
      </p>
      <p style={{ ...subline(text), marginTop: 8, fontSize: 13 }}>Routing to next pro.</p>
    </div>
  );
}

function CancelConfirm({
  onKeep,
  onCancel,
}: {
  onKeep: () => void;
  onCancel: () => void;
}) {
  const { text, bg, borderCol } = useHomeTheme();
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onKeep}
    >
      <div
        className="w-full max-w-md rounded-t-3xl px-5 pb-8 pt-5"
        style={{ backgroundColor: bg, border: `1px solid ${borderCol}`, borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden className="mx-auto mb-4 rounded-full" style={{ width: 36, height: 4, backgroundColor: text, opacity: 0.18 }} />
        <h3 style={{ fontFamily: UI, fontSize: 18, fontWeight: 600, color: text, margin: 0 }}>
          Cancel this booking?
        </h3>
        <p style={{ ...subline(text), marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
          Frequent cancellations affect your standing. Client will be refunded in full.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onKeep}
            className="flex-1 rounded-xl py-3 transition-transform active:scale-[0.99]"
            style={{
              backgroundColor: ORANGE,
              color: "#061C27",
              fontFamily: UI,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl py-3 transition-opacity active:opacity-70"
            style={{
              border: "1px solid rgba(229,96,74,0.55)",
              color: "#E5604A",
              backgroundColor: "transparent",
              fontFamily: UI,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function NoShow({
  booking,
  onMarkNoShow,
}: {
  booking: LifecycleBooking;
  onMarkNoShow: () => void;
}) {
  const { text } = useHomeTheme();
  const TOTAL = 10 * 60;
  const [secondsLeft, setSecondsLeft] = useState(TOTAL);
  const [pingsSent, setPingsSent] = useState<number[]>([]);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-ping the client at 3 and 6 minutes elapsed
  useEffect(() => {
    const elapsed = TOTAL - secondsLeft;
    if (elapsed >= 60 * 3 && !pingsSent.includes(3)) setPingsSent((p) => [...p, 3]);
    if (elapsed >= 60 * 6 && !pingsSent.includes(6)) setPingsSent((p) => [...p, 6]);
  }, [secondsLeft, pingsSent]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const canMark = secondsLeft === 0;

  return (
    <LifecycleColumn>
      <Header title="Waiting on client" />
      <ClientCard booking={booking} />

      <div className="mt-8 flex flex-col items-center">
        <span
          style={{
            fontFamily: UI,
            fontSize: 56,
            fontWeight: 700,
            color: text,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {mm}:{ss}
        </span>
        <p style={{ ...subline(text), marginTop: 10, fontSize: 13 }}>
          Auto-pinging {booking.clientName.split(" ")[0]} at 3 and 6 min
        </p>
        <ul style={{ marginTop: 14, padding: 0, listStyle: "none", textAlign: "center" }}>
          {[3, 6].map((m) => {
            const sent = pingsSent.includes(m);
            return (
              <li
                key={m}
                style={{
                  fontFamily: UI,
                  fontSize: 12,
                  color: text,
                  opacity: sent ? 1 : 0.45,
                  marginTop: 4,
                  fontWeight: sent ? 500 : 400,
                }}
              >
                {sent ? "✓" : "·"} Ping at {m} min{sent ? " · sent" : ""}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex-1" />

      <PrimaryCta label="Mark as no-show" onClick={onMarkNoShow} disabled={!canMark} />
      <p
        style={{
          fontFamily: UI,
          fontSize: 11,
          color: text,
          opacity: 0.45,
          textAlign: "center",
          marginTop: 8,
        }}
      >
        {canMark
          ? "Booking will close with partial payment per platform policy."
          : "Available after the 10-minute wait."}
      </p>
    </LifecycleColumn>
  );
}

/* =================================================================
 * Shared layout primitives
 * ================================================================= */

function LifecycleColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col px-5 pt-7 pb-6">{children}</div>;
}

function Header({ title }: { title: string }) {
  const { text } = useHomeTheme();
  return (
    <h1
      style={{
        fontFamily: UI,
        fontSize: 22,
        fontWeight: 700,
        color: text,
        letterSpacing: "-0.02em",
        margin: 0,
      }}
    >
      {title}
    </h1>
  );
}

function ClientCard({ booking }: { booking: LifecycleBooking }) {
  return (
    <CardTheme>
      <ClientCardInner booking={booking} />
    </CardTheme>
  );
}

function ClientCardInner({ booking }: { booking: LifecycleBooking }) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="mt-4 rounded-2xl px-4 py-4"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar initial={booking.clientInitial} size={44} />
        <div className="min-w-0 flex-1">
          <div
            className="truncate"
            style={{ fontFamily: UI, fontSize: 15, fontWeight: 600, color: text }}
          >
            {booking.clientName}
          </div>
          <div
            className="truncate"
            style={{ fontFamily: UI, fontSize: 12.5, color: text, opacity: 0.65, marginTop: 2 }}
          >
            {booking.service}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-1.5" style={{ color: text, opacity: 0.7 }}>
        <span style={{ marginTop: 2 }}>
          <PinIcon size={11} />
        </span>
        <span style={{ fontFamily: UI, fontSize: 12, lineHeight: 1.4 }}>{booking.address}</span>
      </div>
      <button
        type="button"
        className="mt-3 transition-opacity active:opacity-60"
        style={{ ...tertiaryLink(text), fontSize: 12.5 }}
      >
        Message client
      </button>
    </div>
  );
}

function AddressBox({ address }: { address: string }) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="mt-5 flex items-start gap-2 rounded-xl px-3 py-2.5"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.06)",
        color: text,
        maxWidth: 320,
      }}
    >
      <PinIcon size={13} />
      <span style={{ fontFamily: UI, fontSize: 12.5, lineHeight: 1.35, opacity: 0.85 }}>
        {address}
      </span>
    </div>
  );
}

function PrimaryCta({
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
        height: 56,
        backgroundColor: ORANGE,
        color: "#061C27",
        fontFamily: UI,
        fontSize: 16,
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

function Avatar({ initial, size = 40 }: { initial: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: "rgba(255,130,63,0.16)",
        border: "1px solid rgba(255,130,63,0.45)",
        color: "#061C27",
        fontFamily: UI,
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
      }}
    >
      {initial}
    </div>
  );
}

/* ---------------- Style helpers ---------------- */

function heading(color: string): React.CSSProperties {
  return {
    fontFamily: UI,
    fontSize: 22,
    fontWeight: 700,
    color,
    letterSpacing: "-0.02em",
    margin: 0,
  };
}

function subline(color: string): React.CSSProperties {
  return {
    fontFamily: UI,
    fontSize: 13,
    color,
    opacity: 0.65,
    margin: 0,
    textAlign: "center",
  };
}

function tertiaryLink(color: string): React.CSSProperties {
  return {
    fontFamily: UI,
    fontSize: 13,
    color,
    opacity: 0.6,
    fontWeight: 500,
    background: "transparent",
    border: "none",
    textAlign: "center",
  };
}

/* ---------------- Icons ---------------- */

function PinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function StarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* ---------------- Memo ---------------- */
/* `useMemo` is unused in current revision; kept import for future use. */
void useMemo;