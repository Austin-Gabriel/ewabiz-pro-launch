import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useDevState } from "@/dev-state/dev-state-context";

/**
 * Working-surface shell used by /home and the future tab routes (calendar,
 * earnings, profile). Same atmospheric language as AuthShell — drifting
 * squiggles, paper grain, dark/light crossfade — but quieter:
 *
 *   - squiggles masked to bottom 30% at very low opacity
 *   - no orange ambient glow (this isn't a hero moment)
 *   - top status bar holds greeting + theme toggle
 *
 * A pro lands here 10–30 times a day. The chrome should disappear.
 */

const SANS = '"Uncut Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const SERIF = '"Fraunces", "Times New Roman", serif';

interface ThemeCtx {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  text: string;
  bg: string;
  surface: string;
  surfaceElevated: string;
  borderCol: string;
  borderSoft: string;
  cardSurface: string;
  cardText: string;
  cardBorder: string;
  cardBorderSoft: string;
  sans: string;
  serif: string;
}
const ThemeContext = createContext<ThemeCtx | null>(null);

export function useHomeTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useHomeTheme must be used inside <HomeShell>");
  return ctx;
}

export const HOME_SANS = SANS;
export const HOME_SERIF = SERIF;

/**
 * CardTheme — overrides the surrounding HomeTheme so that anything rendered
 * inside a card sees: navy text on a white surface, with a soft navy border.
 * Use this to wrap card primitives so all the existing sub-components that
 * read `text` / `borderCol` from useHomeTheme() automatically flip to the
 * card palette without having to be rewritten one by one.
 *
 * Cards are PURE WHITE in both light and dark mode. See mem://design/card-surfaces.
 */
export function CardTheme({ children }: { children: ReactNode }) {
  const parent = useHomeTheme();
  const value: ThemeCtx = {
    ...parent,
    text: parent.cardText,
    bg: parent.cardSurface,
    surface: "rgba(6,28,39,0.04)",
    surfaceElevated: "rgba(6,28,39,0.06)",
    borderCol: parent.cardBorder,
    borderSoft: parent.cardBorderSoft,
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export interface HomeShellProps {
  children: ReactNode;
  /** Hide the bottom-tab spacer (used on mid-onboarding/pending hard-gates). */
  noTabBarSpacing?: boolean;
}

export function HomeShell({ children, noTabBarSpacing = false }: HomeShellProps) {
  // Native-mobile working surface: defaults to dark. Dev toggle can force
  // light/dark/system at runtime.
  const { state: dev } = useDevState();
  const [systemDark, setSystemDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setSystemDark(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }
  }, []);

  const isDark =
    dev.theme === "dark" ? true : dev.theme === "light" ? false : systemDark || true;
  const setIsDark = (_v: boolean) => {
    /* theme is controlled via dev toggle / system preference */
  };

  const text = isDark ? "#F0EBD8" : "#061C27";
  const bg = isDark ? "#061C27" : "#F0EBD8";
  // Page-chrome tints (status bar, nav chips, progress tracks). Quiet.
  const surface = isDark ? "rgba(240,235,216,0.04)" : "rgba(6,28,39,0.035)";
  const surfaceElevated = isDark ? "rgba(240,235,216,0.06)" : "rgba(255,255,255,0.55)";
  const borderCol = isDark ? "rgba(240,235,216,0.10)" : "rgba(6,28,39,0.10)";
  const borderSoft = isDark ? "rgba(240,235,216,0.06)" : "rgba(6,28,39,0.06)";
  // Card surfaces: pure WHITE in both modes — crisp, physical objects on the
  // page. Text on cards is always navy. See mem://design/card-surfaces.
  const cardSurface = "#FFFFFF";
  const cardText = "#061C27";
  const cardBorder = "rgba(6,28,39,0.10)";
  const cardBorderSoft = "rgba(6,28,39,0.06)";
  const squiggleOpacity = isDark ? 0.045 : 0.06;
  const grainOpacity = isDark ? 0.14 : 0.18;

  return (
    <ThemeContext.Provider
      value={{ isDark, setIsDark, text, bg, surface, surfaceElevated, borderCol, borderSoft, cardSurface, cardText, cardBorder, cardBorderSoft, sans: SANS, serif: SERIF }}
    >
      <div
        className="relative flex min-h-screen w-full flex-col overflow-hidden"
        style={{
          backgroundColor: bg,
          color: text,
          fontFamily: SANS,
          transition:
            "background-color 600ms cubic-bezier(0.4, 0, 0.2, 1), color 600ms cubic-bezier(0.4, 0, 0.2, 1)",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Quiet drifting squiggles — masked to bottom third so they never
            touch greeting, focus card, or numbers. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[8%] ewa-drift-a"
          style={{
            opacity: squiggleOpacity,
            WebkitMaskImage: "linear-gradient(to bottom, transparent 64%, #000 92%)",
            maskImage: "linear-gradient(to bottom, transparent 64%, #000 92%)",
            transition: "opacity 600ms ease",
          }}
        >
          <svg viewBox="0 0 600 600" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            <path
              d="M-20,420 C90,340 220,500 340,420 S560,340 660,440"
              fill="none"
              stroke="#FF823F"
              strokeWidth="38"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Paper grain — keeps the editorial feel even on the working surface. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{
            opacity: grainOpacity,
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            backgroundSize: "220px 220px",
            transition: "opacity 600ms ease",
          }}
        />

        <div
          className="relative z-[1] flex flex-1 flex-col"
          style={{ paddingBottom: noTabBarSpacing ? 0 : 92 }}
        >
          {children}
        </div>

        {!mounted && (
          <div aria-hidden className="absolute inset-0" style={{ backgroundColor: bg }} />
        )}
      </div>
    </ThemeContext.Provider>
  );
}