import { useDevState } from "@/dev-state/dev-state-context";

/**
 * Persistent thin strip surfaced at the top of every primary tab while the
 * pro is Online (accepting on-demand requests). Mirrors ActiveBookingStrip.
 * Hidden when offline, when a lifecycle takeover is active, or on the Home
 * tab itself (Home has its own dedicated Online toggle UI).
 */

const UI = '"Uncut Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const ORANGE = "#FF823F";
const MIDNIGHT = "#061C27";

export function OnlineModeStrip({ hide = false }: { hide?: boolean }) {
  const { state: dev } = useDevState();
  if (hide) return null;
  if (dev.mode !== "online") return null;
  // If a lifecycle takeover (other than incoming) is active, the
  // ActiveBookingStrip already conveys priority context.
  if (dev.lifecycle !== "none" && dev.lifecycle !== "incoming") return null;

  return (
    <div
      role="status"
      aria-label="You are online and accepting requests"
      className="flex w-full items-center gap-2 px-4"
      style={{
        height: 36,
        backgroundColor: ORANGE,
        color: MIDNIGHT,
        fontFamily: UI,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "-0.005em",
        borderBottom: "1px solid rgba(6,28,39,0.10)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: 9999,
          backgroundColor: MIDNIGHT,
          flexShrink: 0,
          animation: "ewa-online-pulse 1800ms ease-in-out infinite",
        }}
      />
      <span className="min-w-0 flex-1 truncate">
        Online · Accepting new requests
      </span>
      <style>{`
        @keyframes ewa-online-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}