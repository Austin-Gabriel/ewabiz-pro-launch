import type { ReactElement } from "react";
import { useHomeTheme, HOME_SANS } from "./home-shell";

export type TabKey = "home" | "calendar" | "earnings" | "profile";

interface Props {
  active: TabKey;
  onSelect?: (k: TabKey) => void;
  /** Number badge on calendar (e.g. pending requests). */
  badge?: { tab: TabKey; count: number };
}

/**
 * Persistent bottom tab bar. Floating pill, glassy, sits above safe-area.
 * Only rendered for the LIVE pro state — hard gate before that.
 */
export function BottomTabs({ active, onSelect, badge }: Props) {
  const { isDark, text, borderCol } = useHomeTheme();

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
      className="fixed inset-x-0 z-20 flex justify-center"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
        pointerEvents: "none",
      }}
      aria-label="Primary"
    >
      <div
        className="flex items-center gap-1 rounded-full px-2 py-1.5"
        style={{
          pointerEvents: "auto",
          backgroundColor: isDark ? "rgba(10,31,46,0.78)" : "rgba(247,243,230,0.82)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          border: `1px solid ${borderCol}`,
          boxShadow: isDark
            ? "0 12px 40px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.04) inset"
            : "0 12px 40px rgba(6,28,39,0.10), 0 0 0 0.5px rgba(255,255,255,0.5) inset",
          transition: "background-color 600ms ease, border-color 600ms ease",
        }}
      >
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
              className="relative flex flex-col items-center justify-center rounded-full transition-all duration-300 active:scale-95"
              style={{
                width: 64,
                height: 48,
                color: isActive ? "#FF823F" : text,
                opacity: isActive ? 1 : 0.55,
                backgroundColor: isActive ? "rgba(255,130,63,0.12)" : "transparent",
                fontFamily: HOME_SANS,
              }}
            >
              {t.icon}
              <span style={{ fontSize: 9.5, fontWeight: 600, marginTop: 2, letterSpacing: "0.02em" }}>
                {t.label}
              </span>
              {showBadge ? (
                <span
                  aria-label={`${badge!.count} pending`}
                  className="absolute"
                  style={{
                    top: 4,
                    right: 10,
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
                    boxShadow: "0 0 0 2px rgba(10,31,46,0.78)",
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