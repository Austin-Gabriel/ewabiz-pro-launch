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
} from "@/dev-state/dev-state-context";

/**
 * Floating dev-only state toggle. Pinned bottom-right, above the bottom
 * tab bar. Tapping opens a slide-up panel with three radio groups:
 * Pro State, Data Density, Theme Override. Selections persist via
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
    reset,
  } = useDevState();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Scheduled bookings can't enter Get Ready — clear the lifecycle if the
  // source flips while Get Ready is active.
  useEffect(() => {
    if (state.bookingSource === "scheduled" && state.lifecycle === "get-ready") {
      setLifecycle("none");
    }
  }, [state.bookingSource, state.lifecycle, setLifecycle]);

  if (!mounted || !enabled) return null;

  return (
    <>
      {/* Floating button */}
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

      {/* Slide-up panel */}
      {open && (
        <div className="fixed inset-0 z-[70]" style={{ fontFamily: SANS }}>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close dev panel"
            onClick={() => setOpen(false)}
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          />

          {/* Sheet */}
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
            {/* Grabber */}
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