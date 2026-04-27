import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useReschedule } from "@/calendar/reschedule-context";
import { ALL_BOOKINGS, type Booking } from "@/data/mock-bookings";

/**
 * Manual reschedule sheet — date picker + start/end ± steppers + reason.
 * Validates against confirmed bookings, then feeds the same pending state
 * machinery as the long-press drag flow on Calendar.
 *
 * Theme-aware tokens only — semantic shadcn tokens for the picker, plus
 * inline styles tuned for the cream-on-navy app surface to stay consistent
 * with the existing booking detail page.
 */

const UI = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const ORANGE = "#FF823F";
const MIDNIGHT = "#061C27";
const STEP = 5;
const MIN_DUR = 5;

interface Props {
  open: boolean;
  onClose: () => void;
  booking: Booking;
}

export function RescheduleSheet({ open, onClose, booking }: Props) {
  const reschedule = useReschedule();
  // Apply any prior accepted override so the sheet starts from the current
  // canonical time, not the original.
  const override = reschedule.overrides[booking.id];
  const startsAt = override?.startsAt ?? booking.startsAt;
  const durationMin = override?.durationMin ?? booking.durationMin;
  // The service's set duration — the source of truth for how long this
  // service "should" take. Pros can deviate, but we surface the delta so
  // it's a deliberate choice, not a side-effect of the time pickers.
  const serviceDurationMin = booking.durationMin;

  const [date, setDate] = useState<Date>(() => {
    const d = new Date(startsAt);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [startMin, setStartMin] = useState<number>(
    startsAt.getHours() * 60 + startsAt.getMinutes(),
  );
  const [duration, setDuration] = useState<number>(durationMin);
  const [adjustLengthOpen, setAdjustLengthOpen] = useState<boolean>(
    durationMin !== serviceDurationMin,
  );
  const [reason, setReason] = useState<string>("");
  const [phase, setPhase] = useState<"edit" | "confirm">("edit");
  const [calOpen, setCalOpen] = useState(false);

  const composedStart = useMemo(() => {
    const d = new Date(date);
    d.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    return d;
  }, [date, startMin]);
  const endMin = startMin + duration;
  const composedEnd = useMemo(() => {
    const d = new Date(date);
    d.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
    return d;
  }, [date, endMin]);

  const conflictName = useMemo(() => {
    const sMs = composedStart.getTime();
    const eMs = sMs + duration * 60_000;
    for (const b of ALL_BOOKINGS) {
      if (b.id === booking.id) continue;
      if (b.status !== "confirmed") continue;
      const bs = b.startsAt.getTime();
      const be = bs + b.durationMin * 60_000;
      if (sMs < be && eMs > bs) return b.clientName.split(" ")[0];
    }
    return null;
  }, [composedStart, duration, booking.id]);

  const adjustStart = (delta: number) => {
    setStartMin((s) =>
      Math.max(0, Math.min(24 * 60 - MIN_DUR, s + delta)),
    );
  };
  const adjustDuration = (delta: number) => {
    setDuration((d) => Math.max(MIN_DUR, Math.min(24 * 60 - startMin, d + delta)));
  };
  const resetDuration = () => setDuration(serviceDurationMin);
  const durationDelta = duration - serviceDurationMin;

  const handleSubmit = () => setPhase("confirm");
  const handleConfirm = () => {
    reschedule.propose({
      bookingId: booking.id,
      clientLabel: booking.clientName,
      originalStart: startsAt,
      originalDurationMin: durationMin,
      proposedStart: composedStart,
      proposedDurationMin: duration,
    });
    onClose();
    setPhase("edit");
  };

  if (!open) return null;

  const fmt = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const sfx = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return mm === 0 ? `${h12} ${sfx}` : `${h12}:${String(mm).padStart(2, "0")} ${sfx}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="fixed inset-0 z-[80]" style={{ fontFamily: UI }}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      />
      <div
        role="dialog"
        aria-label="Reschedule booking"
        className="absolute bottom-0 left-1/2 flex max-h-[88vh] w-full max-w-md -translate-x-1/2 flex-col overflow-hidden rounded-t-3xl"
        style={{
          backgroundColor: "#FFFFFF",
          color: MIDNIGHT,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          animation: "ewa-sheet-up 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="flex justify-center pt-3">
          <span style={{ width: 36, height: 4, borderRadius: 4, backgroundColor: "rgba(6,28,39,0.18)" }} />
        </div>

        <div className="px-5 pt-3 pb-2">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: MIDNIGHT, opacity: 0.55 }}>
            Reschedule
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2 }}>
            {booking.clientName.split(" ")[0]} · {booking.service}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {phase === "edit" ? (
            <div className="flex flex-col gap-4 pt-2">
              {/* DATE */}
              <Field label="Date">
                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start rounded-xl text-left font-medium")}
                      style={{ height: 48, fontFamily: UI, fontSize: 15, color: MIDNIGHT }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "EEE, MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (d) {
                          setDate(d);
                          setCalOpen(false);
                        }
                      }}
                      disabled={(d) => d < today}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              {/* START TIME — editable like iPhone clock. Tap the hour or
                  minute segment to type directly; ± steppers stay for quick nudges. */}
              <Field label="Start time">
                <div className="flex items-center gap-2">
                  <Stepper onClick={() => adjustStart(-STEP)} ariaLabel="Earlier">−</Stepper>
                  <EditableTime
                    minutes={startMin}
                    onChange={(m) =>
                      setStartMin(Math.max(0, Math.min(24 * 60 - MIN_DUR, m)))
                    }
                  />
                  <Stepper onClick={() => adjustStart(STEP)} ariaLabel="Later">+</Stepper>
                </div>
              </Field>

              {/* DURATION — service has a set length; surface it and let the
                  pro deviate deliberately rather than free-form a range. */}
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <div
                    style={{
                      fontFamily: UI,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: MIDNIGHT,
                      opacity: 0.55,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    Length
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (adjustLengthOpen && durationDelta !== 0) resetDuration();
                      setAdjustLengthOpen((v) => !v);
                    }}
                    style={{
                      fontFamily: UI,
                      fontSize: 12,
                      fontWeight: 600,
                      color: ORANGE,
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {adjustLengthOpen ? "Use service length" : "Adjust length"}
                  </button>
                </div>

                <div
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: "rgba(6,28,39,0.04)",
                    border: "1px solid rgba(6,28,39,0.12)",
                  }}
                >
                  <div className="flex items-baseline justify-between">
                    <div
                      style={{
                        fontFamily: UI,
                        fontSize: 15,
                        fontWeight: 700,
                        color: MIDNIGHT,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {duration} min
                    </div>
                    <div
                      style={{
                        fontFamily: UI,
                        fontSize: 12,
                        color: MIDNIGHT,
                        opacity: 0.6,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      Ends {fmt(endMin)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: UI,
                      fontSize: 11.5,
                      marginTop: 4,
                      color: durationDelta === 0 ? MIDNIGHT : ORANGE,
                      opacity: durationDelta === 0 ? 0.55 : 1,
                      fontWeight: durationDelta === 0 ? 500 : 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {durationDelta === 0
                      ? `Service standard · ${serviceDurationMin} min`
                      : `${durationDelta > 0 ? "+" : ""}${durationDelta} min vs ${serviceDurationMin}-min standard`}
                  </div>
                </div>

                {adjustLengthOpen ? (
                  <div className="flex items-center gap-2">
                    <Stepper onClick={() => adjustDuration(-STEP)} ariaLabel="Shorter">−</Stepper>
                    <TimeBox value={`${duration} min`} />
                    <Stepper onClick={() => adjustDuration(STEP)} ariaLabel="Longer">+</Stepper>
                  </div>
                ) : null}
              </div>

              {/* REASON */}
              <Field label="Reason (optional)">
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you rescheduling?"
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(6,28,39,0.04)",
                    border: "1px solid rgba(6,28,39,0.12)",
                    borderRadius: 10,
                    color: MIDNIGHT,
                    fontFamily: UI,
                    fontSize: 14,
                    padding: "12px 14px",
                    outline: "none",
                  }}
                />
              </Field>

              {conflictName ? (
                <div
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: "rgba(255,130,63,0.10)",
                    border: "1px solid rgba(255,130,63,0.40)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: MIDNIGHT }}>
                    This conflicts with {conflictName}'s booking.
                  </div>
                  <div style={{ fontSize: 12, color: MIDNIGHT, opacity: 0.65, marginTop: 4 }}>
                    Pick a different time before sending.
                  </div>
                </div>
              ) : null}

              <div className="mt-2 flex gap-2">
                <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
                <PrimaryBtn onClick={handleSubmit} disabled={Boolean(conflictName)}>
                  Send request
                </PrimaryBtn>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-3">
              <div
                className="rounded-2xl px-4 py-4"
                style={{
                  backgroundColor: "rgba(255,130,63,0.10)",
                  border: "1px solid rgba(255,130,63,0.40)",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: MIDNIGHT, lineHeight: 1.4 }}>
                  Send reschedule request to {booking.clientName.split(" ")[0]} for{" "}
                  {format(composedStart, "EEE, MMM d")} · {fmt(startMin)} – {fmt(endMin)}?
                </div>
                <div style={{ fontSize: 12.5, color: MIDNIGHT, opacity: 0.7, marginTop: 6 }}>
                  They'll have 24 hours to approve. The original slot stays held until they respond.
                </div>
              </div>
              <div className="mt-1 flex gap-2">
                <SecondaryBtn onClick={() => setPhase("edit")}>Back</SecondaryBtn>
                <PrimaryBtn onClick={handleConfirm}>Confirm</PrimaryBtn>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes ewa-sheet-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        style={{
          fontFamily: UI,
          fontSize: 10.5,
          fontWeight: 700,
          color: MIDNIGHT,
          opacity: 0.55,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Stepper({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex items-center justify-center rounded-xl transition-opacity active:opacity-70"
      style={{
        width: 48,
        height: 48,
        backgroundColor: "rgba(6,28,39,0.05)",
        border: "1px solid rgba(6,28,39,0.12)",
        color: MIDNIGHT,
        fontFamily: UI,
        fontSize: 22,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

/**
 * iPhone-clock-style editable time field. Hour and minute are tappable
 * segments backed by hidden number inputs; AM/PM is a toggle. Commits on
 * blur or Enter so partial typing doesn't churn parent state.
 */
function EditableTime({
  minutes,
  onChange,
}: {
  minutes: number;
  onChange: (next: number) => void;
}) {
  const h24 = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const isPm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

  const [hourStr, setHourStr] = useState(String(h12));
  const [minStr, setMinStr] = useState(String(mm).padStart(2, "0"));

  // Keep local strings in sync when parent updates (steppers, reset, etc.)
  const lastMinutesRef = useRef(minutes);
  if (lastMinutesRef.current !== minutes) {
    lastMinutesRef.current = minutes;
    setHourStr(String(h12));
    setMinStr(String(mm).padStart(2, "0"));
  }

  const commit = (nextH12Str: string, nextMmStr: string, pm: boolean) => {
    let h = parseInt(nextH12Str, 10);
    let m = parseInt(nextMmStr, 10);
    if (Number.isNaN(h)) h = h12;
    if (Number.isNaN(m)) m = mm;
    h = Math.max(1, Math.min(12, h));
    m = Math.max(0, Math.min(59, m));
    const h24Next = (h % 12) + (pm ? 12 : 0);
    onChange(h24Next * 60 + m);
  };

  const togglePm = () => {
    const nextPm = !isPm;
    commit(hourStr, minStr, nextPm);
  };

  const inputStyle: React.CSSProperties = {
    width: 38,
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: UI,
    fontSize: 18,
    fontWeight: 700,
    color: MIDNIGHT,
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em",
    padding: 0,
    // Hide spin buttons
    appearance: "textfield",
    MozAppearance: "textfield",
  } as React.CSSProperties;

  return (
    <div
      className="flex flex-1 items-center justify-center rounded-xl"
      style={{
        backgroundColor: "rgba(6,28,39,0.04)",
        border: "1px solid rgba(6,28,39,0.12)",
        height: 48,
        gap: 2,
      }}
    >
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={12}
        value={hourStr}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setHourStr(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onBlur={() => commit(hourStr, minStr, isPm)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        }}
        aria-label="Hour"
        style={inputStyle}
      />
      <span
        style={{
          fontFamily: UI,
          fontSize: 18,
          fontWeight: 700,
          color: MIDNIGHT,
        }}
      >
        :
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={59}
        value={minStr}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setMinStr(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onBlur={() => {
          const padded = minStr === "" ? "00" : minStr.padStart(2, "0");
          setMinStr(padded);
          commit(hourStr, padded, isPm);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        }}
        aria-label="Minute"
        style={inputStyle}
      />
      <button
        type="button"
        onClick={togglePm}
        aria-label="Toggle AM or PM"
        style={{
          marginLeft: 6,
          padding: "4px 10px",
          borderRadius: 8,
          border: "1px solid rgba(6,28,39,0.18)",
          background: "rgba(6,28,39,0.04)",
          fontFamily: UI,
          fontSize: 13,
          fontWeight: 700,
          color: MIDNIGHT,
          cursor: "pointer",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {isPm ? "PM" : "AM"}
      </button>
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

function TimeBox({ value }: { value: string }) {
  return (
    <div
      className="flex flex-1 items-center justify-center rounded-xl"
      style={{
        backgroundColor: "rgba(6,28,39,0.04)",
        border: "1px solid rgba(6,28,39,0.12)",
        height: 48,
        fontFamily: UI,
        fontSize: 18,
        fontWeight: 700,
        color: MIDNIGHT,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.01em",
      }}
    >
      {value}
    </div>
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="flex-1 rounded-2xl transition-transform active:scale-[0.99]"
      style={{
        height: 52,
        backgroundColor: ORANGE,
        color: MIDNIGHT,
        fontFamily: UI,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "-0.005em",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-2xl transition-opacity active:opacity-70"
      style={{
        height: 52,
        backgroundColor: "transparent",
        border: "1px solid rgba(6,28,39,0.18)",
        color: MIDNIGHT,
        fontFamily: UI,
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </button>
  );
}
