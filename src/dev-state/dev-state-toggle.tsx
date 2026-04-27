import { useEffect, useState } from "react";
import { Settings2, X } from "lucide-react";
import {
  useDevState,
  type DevDataDensity,
  type DevProState,
  type DevThemeOverride,
  type DevMode,
  type DevDayContext,
  type DevLifecycle,
  type DevBookingSource,
  type DevPayoutState,
  type DevPendingBalance,
  type DevTaxDocs,
  type DevWeekDensity,
  type DevBlockedTime,
  type DevAvailability,
  type DevRescheduleState,
} from "@/dev-state/dev-state-context";
import { useReschedule } from "@/calendar/reschedule-context";
import { ALL_BOOKINGS } from "@/data/mock-bookings";

/**
 * Floating dev-only state toggle. Pinned bottom-right, above the bottom
 * tab bar. Tapping opens a slide-up panel with radio groups for pro state,
 * data density, theme, mode, day context, lifecycle, booking source,
 * earnings sub-axes, and calendar sub-axes (density / blocked time /
 * availability / reschedule render state). Selections persist via
 * localStorage so they survive reloads in the session.
 */

const SANS = '"Uncut Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const ORANGE = "#FF823F";

const PRO_STATES: { value: DevProState; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Use real auth + KYC state" },
  { value: "mid-onboarding", label: "MID — onboarding", hint: "Signup incomplete" },
  { value: "mid-pending", label: "MID — pending approval", hint: "KYC submitted" },
  { value: "live", label: "LIVE", hint: "Approved — use Day context for density" },
];

const DATA_STATES: { value: DevDataDensity; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Match the chosen pro state" },
  { value: "empty", label: "Empty", hint: "No bookings, earnings, portfolio" },
  { value: "sparse", label: "Sparse", hint: "A few items" },
  { value: "rich", label: "Rich", hint: "Full calendar, earnings, reviews" },
];

const THEMES: { value: DevThemeOverride; label: string }[] = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

const MODES: { value: DevMode; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Use real online state" },
  { value: "offline", label: "Offline", hint: "Default — show day overview" },
  { value: "online", label: "Online", hint: "Available for dispatch" },
];

const DAY_CONTEXTS: { value: DevDayContext; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Match the chosen pro state" },
  { value: "none", label: "No bookings today", hint: "Empty calendar" },
  { value: "one", label: "1 scheduled today", hint: "Single appointment" },
  { value: "multiple", label: "Multiple (3–4)", hint: "Typical busy day" },
  { value: "full", label: "Full day (5+)", hint: "Stacked back-to-back" },
];

const LIFECYCLES: { value: DevLifecycle; label: string; hint: string }[] = [
  { value: "none", label: "None", hint: "No lifecycle takeover" },
  { value: "incoming", label: "Incoming request", hint: "Online dispatch · 60s timer" },
  { value: "get-ready", label: "Get Ready", hint: "Accepted — prep countdown" },
  { value: "en-route", label: "En Route", hint: "Driving to client" },
  { value: "arrived", label: "Arrived (PIN entry)", hint: "4-digit code from client" },
  { value: "in-progress", label: "In Progress", hint: "Service running" },
  { value: "complete", label: "Complete", hint: "Done — earnings + rating" },
];

const BOOKING_SOURCES: { value: DevBookingSource; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Match the active booking's real source" },
  { value: "on-demand", label: "On-demand", hint: "Get Ready shows prep countdown" },
  { value: "scheduled", label: "Scheduled", hint: "Get Ready shows Leave by behavior" },
];

const PAYOUT_STATES: { value: DevPayoutState; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Active verified account" },
  { value: "none", label: "No payout method", hint: "Bank not connected yet" },
  { value: "active", label: "Active", hint: "Verified, payouts flowing" },
  { value: "pending", label: "Pending verification", hint: "Awaiting bank confirm" },
  { value: "failed-recent", label: "Recent failed payout", hint: "Last payout bounced" },
];

const PENDING_BALANCES: { value: DevPendingBalance; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "From mock earnings" },
  { value: "zero", label: "$0 pending", hint: "Nothing in transit" },
  { value: "small", label: "Small ($50–200)", hint: "A few completed bookings" },
  { value: "large", label: "Large ($1,000+)", hint: "Big week" },
];

const TAX_DOC_STATES: { value: DevTaxDocs; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "From mock earnings history" },
  { value: "none", label: "None ready", hint: "Below threshold or new pro" },
  { value: "current-year", label: "Current year ready", hint: "One 1099-K available" },
  { value: "multi-year", label: "Multi-year history", hint: "Several years of docs" },
];

const WEEK_DENSITIES: { value: DevWeekDensity; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Use mock data as-is" },
  { value: "empty", label: "Empty week", hint: "No bookings" },
  { value: "light", label: "Light week", hint: "1–2 per day" },
  { value: "typical", label: "Typical week", hint: "3–4 per day" },
  { value: "packed", label: "Packed week", hint: "5+ per day" },
];

const BLOCKED_TIMES: { value: DevBlockedTime; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "No blocks unless seeded" },
  { value: "none", label: "None", hint: "No blocked time" },
  { value: "one-today", label: "1 block today", hint: "Single mid-afternoon block" },
  { value: "multiple-week", label: "Multiple this week", hint: "A few across the week" },
  { value: "vacation", label: "Vacation week", hint: "Whole week blocked" },
];

const AVAILABILITIES: { value: DevAvailability; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Standard hours" },
  { value: "standard", label: "Standard", hint: "Mon–Fri 10–6" },
  { value: "split-days", label: "Split days", hint: "Midday breaks" },
  { value: "weekend-warrior", label: "Weekend warrior", hint: "Fri–Sun only" },
  { value: "limited", label: "Limited", hint: "3 days only" },
];

const RESCHEDULE_STATES: { value: DevRescheduleState; label: string; hint: string }[] = [
  { value: "none", label: "None", hint: "Confirmed booking, no pending state" },
  { value: "pending-out", label: "Pending out", hint: "Pro proposed; client must respond" },
  { value: "pending-in", label: "Pending in", hint: "Client proposed; pro must respond" },
  { value: "approved", label: "Approved", hint: "Counterparty accepted" },
  { value: "declined", label: "Declined", hint: "Counterparty declined" },
  { value: "expired", label: "Expired", hint: "Proposal timed out" },
];

const RESCHEDULE_FOCUS_ID = "b1";

export function DevStateToggle() {
  const {
    enabled,
    state,
    setProState,
    setDataDensity,
    setTheme,
    setMode,
    setDayContext,
    setLifecycle,
    setBookingSource,
    setPayoutState,
    setPendingBalance,
    setTaxDocs,
    setWeekDensity,
    setBlockedTime,
    setAvailability,
    setRescheduleState,
    reset,
  } = useDevState();
  const reschedule = useReschedule();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (state.bookingSource === "scheduled" && state.lifecycle === "get-ready") {
      setLifecycle("none");
    }
  }, [state.bookingSource, state.lifecycle, setLifecycle]);

  // Reschedule render-state bridge. Translates the chosen state into
  // proposals on the focus booking so every reschedule-aware surface
  // re-renders in sync.
  useEffect(() => {
    const focus = ALL_BOOKINGS.find((b) => b.id === RESCHEDULE_FOCUS_ID);
    if (!focus) return;

    if (state.rescheduleState === "none") {
      reschedule.clearAll();
      return;
    }

    const proposedStart = new Date(focus.startsAt);
    proposedStart.setHours(proposedStart.getHours() + 2);
    const baseInput = {
      bookingId: focus.id,
      clientLabel: focus.clientName,
      originalStart: focus.startsAt,
      originalDurationMin: focus.durationMin,
      proposedStart,
      proposedDurationMin: focus.durationMin,
    };

    if (state.rescheduleState === "pending-out") {
      reschedule.clearAll();
      reschedule.propose({ ...baseInput, direction: "outgoing" });
    } else if (state.rescheduleState === "pending-in") {
      reschedule.clearAll();
      reschedule.propose({ ...baseInput, direction: "incoming" });
    } else if (state.rescheduleState === "approved") {
      reschedule.clearAll();
      reschedule.propose({ ...baseInput, direction: "outgoing" });
      setTimeout(() => reschedule.simulateAccept(focus.id), 0);
    } else if (state.rescheduleState === "declined") {
      reschedule.clearAll();
      reschedule.propose({ ...baseInput, direction: "outgoing" });
      setTimeout(() => reschedule.simulateDecline(focus.id), 0);
    } else if (state.rescheduleState === "expired") {
      reschedule.clearAll();
      reschedule.propose({ ...baseInput, direction: "outgoing" });
      setTimeout(() => reschedule.simulateExpire(focus.id), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rescheduleState]);

  if (!mounted || !enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open dev state toggle"
        className="fixed z-[60] flex items-center justify-center rounded-full transition-transform active:scale-95"
        style={{
          right: 14,
          bottom: "calc(env(safe-area-inset-bottom) + 102px)",
          width: 44,
          height: 44,
          backgroundColor: "rgba(6,28,39,0.92)",
          border: "1px solid rgba(255,130,63,0.45)",
          color: "#F0EBD8",
          boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Settings2 size={18} strokeWidth={1.75} />
        <span
          aria-hidden
          className="absolute -top-1 -right-1 rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: ORANGE,
            boxShadow: "0 0 8px rgba(255,130,63,0.7)",
          }}
        />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70]" style={{ fontFamily: SANS }}>
          <button
            type="button"
            aria-label="Close dev panel"
            onClick={() => setOpen(false)}
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          />

          <div
            role="dialog"
            aria-label="Dev state toggle"
            className="absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl"
            style={{
              backgroundColor: "#0B2330",
              border: "1px solid rgba(240,235,216,0.10)",
              borderBottom: "none",
              color: "#F0EBD8",
              animation: "ewa-sheet-up 320ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div className="flex justify-center pt-3">
              <span style={{ width: 36, height: 4, borderRadius: 4, backgroundColor: "rgba(240,235,216,0.18)" }} />
            </div>

            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <div>
                <div style={{ fontSize: 10, letterSpacing: "1.6px", textTransform: "uppercase", opacity: 0.55, fontWeight: 600 }}>
                  Dev only
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>State toggle</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: "rgba(240,235,216,0.06)",
                  color: "#F0EBD8",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <Group
                title="Booking source"
                value={state.bookingSource}
                options={BOOKING_SOURCES}
                onChange={(v) => setBookingSource(v as DevBookingSource)}
              />
              <Group
                title="Lifecycle state"
                value={state.lifecycle}
                options={
                  state.bookingSource === "scheduled"
                    ? LIFECYCLES.filter((l) => l.value !== "get-ready")
                    : LIFECYCLES
                }
                onChange={(v) => setLifecycle(v as DevLifecycle)}
              />
              <Group
                title="Mode"
                value={state.mode}
                options={MODES}
                onChange={(v) => setMode(v as DevMode)}
              />
              {state.mode !== "online" ? (
                <Group
                  title="Day context (offline)"
                  value={state.dayContext}
                  options={DAY_CONTEXTS}
                  onChange={(v) => setDayContext(v as DevDayContext)}
                />
              ) : null}
              <Group
                title="Pro state"
                value={state.proState}
                options={PRO_STATES}
                onChange={(v) => setProState(v as DevProState)}
              />
              <Group
                title="Data density"
                value={state.dataDensity}
                options={DATA_STATES}
                onChange={(v) => setDataDensity(v as DevDataDensity)}
              />
              {state.proState === "live" || state.proState === "auto" ? (
                <>
                  <Group
                    title="Earnings · payout state"
                    value={state.payoutState}
                    options={PAYOUT_STATES}
                    onChange={(v) => setPayoutState(v as DevPayoutState)}
                  />
                  <Group
                    title="Earnings · pending balance"
                    value={state.pendingBalance}
                    options={PENDING_BALANCES}
                    onChange={(v) => setPendingBalance(v as DevPendingBalance)}
                  />
                  <Group
                    title="Earnings · tax docs"
                    value={state.taxDocs}
                    options={TAX_DOC_STATES}
                    onChange={(v) => setTaxDocs(v as DevTaxDocs)}
                  />
                </>
              ) : null}
              <Group
                title="Density (calendar)"
                value={state.weekDensity}
                options={WEEK_DENSITIES}
                onChange={(v) => setWeekDensity(v as DevWeekDensity)}
              />
              <Group
                title="Blocked time (calendar)"
                value={state.blockedTime}
                options={BLOCKED_TIMES}
                onChange={(v) => setBlockedTime(v as DevBlockedTime)}
              />
              <Group
                title="Availability (calendar)"
                value={state.availability}
                options={AVAILABILITIES}
                onChange={(v) => setAvailability(v as DevAvailability)}
              />
              <Group
                title="Reschedule state"
                value={state.rescheduleState}
                options={RESCHEDULE_STATES}
                onChange={(v) => setRescheduleState(v as DevRescheduleState)}
              />
              <Group
                title="Theme override"
                value={state.theme}
                options={THEMES.map((t) => ({ ...t, hint: "" }))}
                onChange={(v) => setTheme(v as DevThemeOverride)}
              />
            </div>

            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{
                borderTop: "1px solid rgba(240,235,216,0.08)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
              }}
            >
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-xl py-3 text-sm font-medium transition-opacity active:opacity-70"
                style={{
                  backgroundColor: "rgba(240,235,216,0.06)",
                  border: "1px solid rgba(240,235,216,0.12)",
                  color: "#F0EBD8",
                }}
              >
                Reset to default
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-opacity active:opacity-80"
                style={{ backgroundColor: ORANGE, color: "#061C27" }}
              >
                Done
              </button>
            </div>
          </div>

          <style>{`
            @keyframes ewa-sheet-up {
              from { transform: translateY(100%); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

function Group({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: { value: string; label: string; hint?: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <section className="mt-5">
      <div
        style={{
          fontSize: 10,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          opacity: 0.55,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors"
              style={{
                backgroundColor: selected ? "rgba(255,130,63,0.10)" : "rgba(240,235,216,0.03)",
                border: `1px solid ${selected ? "rgba(255,130,63,0.45)" : "rgba(240,235,216,0.08)"}`,
              }}
            >
              <div className="flex flex-col">
                <span style={{ fontSize: 14, fontWeight: 500, color: "#F0EBD8" }}>{opt.label}</span>
                {opt.hint ? (
                  <span style={{ fontSize: 12, opacity: 0.55, marginTop: 1 }}>{opt.hint}</span>
                ) : null}
              </div>
              <span
                aria-hidden
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  border: `1.5px solid ${selected ? ORANGE : "rgba(240,235,216,0.3)"}`,
                  backgroundColor: "transparent",
                }}
              >
                {selected ? (
                  <span
                    style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: ORANGE }}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
