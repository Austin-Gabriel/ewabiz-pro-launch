import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useAuthTheme } from "./auth-shell";

/**
 * Pill-shaped primary CTA used across the auth flow. Bagel orange with a
 * warm glow on hover and a subtle gloss sweep — matches the welcome screen.
 */
export function PrimaryButton({
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      {...rest}
      className={
        "group relative w-full overflow-hidden transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_0_44px_0_rgba(255,130,63,0.42)] active:scale-[0.98] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none " +
        (rest.className ?? "")
      }
      style={{
        height: 52,
        borderRadius: 9999,
        backgroundColor: "#FF823F",
        color: "#061C27",
        fontFamily: '"Uncut Sans", system-ui, sans-serif',
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: "0",
        boxShadow: "0 0 32px 0 rgba(255,130,63,0.28), 0 1px 0 0 rgba(255,255,255,0.15) inset",
        ...rest.style,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)",
        }}
      />
      <span className="relative">{children}</span>
    </button>
  );
}

/**
 * Outlined secondary action. Borrows ambient text/border color from the
 * shell so it feels native to whichever screen it's placed on.
 */
export function SecondaryButton({
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const { text, borderCol, isDark } = useAuthTheme();
  return (
    <button
      type="button"
      {...rest}
      className={
        "w-full transition-all duration-300 active:scale-[0.98] disabled:opacity-50 " +
        (rest.className ?? "")
      }
      style={{
        height: 52,
        borderRadius: 9999,
        backgroundColor: "transparent",
        border: `1px solid ${borderCol}`,
        color: text,
        fontFamily: '"Uncut Sans", system-ui, sans-serif',
        fontWeight: 500,
        fontSize: 14,
        letterSpacing: "0",
        transition:
          "border-color 300ms ease, background-color 300ms ease, transform 200ms ease, color 600ms ease",
        ...rest.style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#FF823F";
        e.currentTarget.style.backgroundColor = isDark
          ? "rgba(255,130,63,0.06)"
          : "rgba(255,130,63,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderCol;
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {children}
    </button>
  );
}