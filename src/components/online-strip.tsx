import { useOnline, isOnlineKind } from "@/home/online-context";
import type { OnlineState } from "@/data/mock-data";

/**
 * Persistent thin strip surfaced at the top of every primary tab while the
 * pro is online (accepting requests). Mirrors ActiveBookingStrip — the two
 * are mutually exclusive (a pro who is in an active booking lifecycle is
 * not online), so they never compete for the same row.
 *
 * Purely informational — to toggle offline, the pro returns to Home.
 */

const UI = '"Uncut Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const BAGEL = "#F0EBD8";
const MIDNIGHT = "#061C27";
const ORANGE = "#FF823F";
const GREEN = "#16A34A";

export function OnlineStrip({ hide = false }: { hide?: boolean }) {
  const { state } = useOnline();
  if (hide) return null;
  if (!isOnlineKind(state)) return null;

  const label = stripLabel(state);
  const dotColor = state.kind === "protecting" ? ORANGE : GREEN;

  return (
    <div
      role="status"
      aria-label={label}
      className="flex w-full items-center gap-2 px-4"
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
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: 9999,
          backgroundColor: dotColor,
          flexShrink: 0,
          boxShadow: `0 0 8px ${dotColor === ORANGE ? "rgba(255,130,63,0.6)" : "rgba(22,163,74,0.6)"}`,
          animation: "ewa-online-strip-pulse 1800ms ease-in-out infinite",
        }}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <style>{`
        @keyframes ewa-online-strip-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

function stripLabel(state: OnlineState): string {
  switch (state.kind) {
    case "available":
      return "You're online — accepting requests";
    case "after-hours-online":
      return "Online past hours — accepting requests";
    case "protecting":
      return state.protectingTime
        ? `Protecting your ${state.protectingTime} booking`
        : "Protecting your next booking";
    default:
      return "You're online";
  }
}
