import { Link, useNavigate } from "@tanstack/react-router";
import { HomeShell, useHomeTheme, HOME_SANS } from "@/home/home-shell";

const UI = HOME_SANS;
const NAVY = "#061C27";

/**
 * Phase 1 placeholder for the Settings surface. Lets the Profile → Settings
 * link route somewhere real until Phase 5 ships the full Settings groups.
 */
export function SettingsPlaceholderPage() {
  return (
    <HomeShell noTabBarSpacing>
      <SubHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-24 text-center">
        <h2 style={{ fontFamily: UI, fontSize: 22, fontWeight: 600 }}>Settings</h2>
        <p style={{ fontFamily: UI, fontSize: 14, opacity: 0.7, lineHeight: 1.5, maxWidth: 280 }}>
          Account, payouts, booking preferences, and notifications are coming next.
        </p>
        <Link
          to="/profile"
          className="mt-3 rounded-full px-4 py-2"
          style={{ backgroundColor: "#FF823F", color: NAVY, fontFamily: UI, fontSize: 13, fontWeight: 600 }}
        >
          Back to profile
        </Link>
      </div>
    </HomeShell>
  );
}

function SubHeader() {
  const { text } = useHomeTheme();
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between px-2 pt-2" style={{ height: 52 }}>
      <button
        type="button"
        aria-label="Back"
        onClick={() => navigate({ to: "/profile" })}
        className="flex items-center justify-center transition-opacity active:opacity-50"
        style={{ width: 44, height: 44, color: text }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h1 style={{ fontFamily: UI, fontSize: 16, fontWeight: 600, color: text, letterSpacing: "-0.005em" }}>
        Settings
      </h1>
      <div style={{ width: 44 }} />
    </div>
  );
}
