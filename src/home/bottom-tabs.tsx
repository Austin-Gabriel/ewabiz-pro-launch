import type { ReactElement } from "react";
import { useHomeTheme, HOME_SANS } from "./home-shell";

export type TabKey = "home" | "bookings" | "calendar" | "earnings" | "profile";

interface Props {
  active: TabKey;
  onSelect?: (k: TabKey) => void;
  /** Number badge on calendar (e.g. pending requests). */
  badge?: { tab: TabKey; count: number };
}

/**
 * Persistent bottom tab bar. Flat, edge-to-edge, native-app feel — no
 * floating pill, no gradient, no glassy backdrop. A solid surface with a
 * single hairline divider on top, sitting flush against the safe-area
 * inset. Only rendered for the LIVE pro state — hard gate before that.
 */
export function BottomTabs({ active, onSelect, badge }: Props) {
  const { isDark, text, borderCol, bg } = useHomeTheme();

  const tabs: { key: TabKey; label: string; icon: ReactElement }[] = [
    {
      key: "home",
      label: "Home",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      ),
    },
    {
      key: "bookings",
      label: "Bookings",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M4 12h16M4 17h10" />
          <circle cx="19" cy="17" r="2.2" />
        </svg>
      ),
    },
    {
      key: "calendar",
      label: "Calendar",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      ),
    },
    {
      key: "earnings",
      label: "Earnings",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19V8m6 11V5m6 14v-7m6 7v-4" />
        </svg>
      ),
    },
    {
      key: "profile",
      label: "Profile",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20"
      style={{
        backgroundColor: bg,
        borderTop: `1px solid ${borderCol}`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-md items-stretch justify-between px-2 pt-1.5 pb-1">
        {tabs.map((t) => {
          const isActive = active === t.key;
          const showBadge = badge?.tab === t.key && badge.count > 0;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelect?.(t.key)}
              aria-label={t.label}
              aria-current={isActive ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center justify-center transition-opacity active:opacity-60"
              style={{
                minHeight: 52,
                color: isActive ? "#FF823F" : text,
                opacity: isActive ? 1 : 0.55,
                backgroundColor: "transparent",
                fontFamily: HOME_SANS,
              }}
            >
              {t.icon}
              <span style={{ fontSize: 10, fontWeight: 600, marginTop: 3, letterSpacing: "0.01em" }}>
                {t.label}
              </span>
              {showBadge ? (
                <span
                  aria-label={`${badge!.count} pending`}
                  className="absolute"
                  style={{
                    top: 4,
                    right: "26%",
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    borderRadius: 9999,
                    backgroundColor: "#FF823F",
                    color: "#061C27",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 0 2px ${isDark ? "#061C27" : "#F0EBD8"}`,
                  }}
                >
                  {badge!.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}