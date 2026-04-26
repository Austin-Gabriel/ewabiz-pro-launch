import { Link } from "@tanstack/react-router";
import {
  useDevState,
  type DevLifecycle,
} from "@/dev-state/dev-state-context";
import { LIFECYCLE_BOOKING } from "@/bookings/lifecycle/lifecycle-data";

/**
 * Persistent thin strip surfaced at the top of every primary tab while a
 * booking is in an active lifecycle state (everything except "incoming" and
 * "none"). Tapping routes to /bookings, where the In Progress tab takes over.
 *
 * The strip is intentionally hidden on the In Progress tab itself (redundant
 * — the lifecycle body is the page).
 */

const UI = '"Uncut Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const BAGEL = "#F0EBD8";
const MIDNIGHT = "#061C27";
const ORANGE = "#FF823F";

/** Lifecycle states where the strip is shown. */
const STRIP_VISIBLE: ReadonlySet<DevLifecycle> = new Set([
  "get-ready",
  "en-route",
  "arrived",
  "in-progress",
  "complete",
]);

export function ActiveBookingStrip({ hide = false }: { hide?: boolean }) {
  const { state: dev } = useDevState();
  if (hide) return null;
  if (!STRIP_VISIBLE.has(dev.lifecycle)) return null;

  const label = stripLabel(dev.lifecycle);
  if (!label) return null;

  return (
    <Link
      to="/bookings"
      search={{ tab: "in-progress" }}
      aria-label="Open active booking"
      className="flex w-full items-center gap-2 px-4 transition-opacity active:opacity-80"
      style={{
        height: 40,
        backgroundColor: BAGEL,
        color: MIDNIGHT,
        fontFamily: UI,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "-0.005em",
        fontVariantNumeric: "tabular-nums",
        borderBottom: "1px solid rgba(6,28,39,0.08)",
        textDecoration: "none",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: 9999,
          backgroundColor: ORANGE,
          flexShrink: 0,
          boxShadow: "0 0 8px rgba(255,130,63,0.6)",
          animation: "ewa-strip-pulse 1800ms ease-in-out infinite",
        }}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span aria-hidden style={{ opacity: 0.55, fontWeight: 700 }}>→</span>
      <style>{`
        @keyframes ewa-strip-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.45; }
        }
      `}</style>
    </Link>
  );
}

function stripLabel(state: DevLifecycle): string | null {
  const first = LIFECYCLE_BOOKING.clientName.split(" ")[0];
  switch (state) {
    case "get-ready":
      return `Get ready for ${first} — leave in ${LIFECYCLE_BOOKING.prepMin} min`;
    case "en-route":
      return `On your way to ${first} — ${LIFECYCLE_BOOKING.etaMin} min`;
    case "arrived":
      return `Arrived at ${first} — enter PIN`;
    case "in-progress":
      return `Service in progress with ${first}`;
    case "complete":
      return `Wrapping up with ${first}`;
    default:
      return null;
  }
}