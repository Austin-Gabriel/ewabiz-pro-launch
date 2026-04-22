import { type InputHTMLAttributes, forwardRef } from "react";
import { useAuthTheme } from "./auth-shell";

/**
 * Quiet, editorial text input. Underline-only when at rest, bagel-orange
 * underline on focus. No heavy borders — keeps the auth screens calm.
 */
export const AuthInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  function AuthInput({ label, ...rest }, ref) {
    const { text, borderCol } = useAuthTheme();
    return (
      <label className="flex w-full flex-col" style={{ gap: 6 }}>
        {label ? (
          <span
            style={{
              fontFamily: '"Uncut Sans", system-ui, sans-serif',
              fontSize: 10,
              letterSpacing: "1.6px",
              textTransform: "uppercase",
              fontWeight: 500,
              color: text,
              opacity: 0.5,
            }}
          >
            {label}
          </span>
        ) : null}
        <input
          ref={ref}
          {...rest}
          className={"w-full bg-transparent outline-none transition-colors duration-300 " + (rest.className ?? "")}
          style={{
            height: 44,
            borderBottom: `1px solid ${borderCol}`,
            color: text,
            fontFamily: '"Uncut Sans", system-ui, sans-serif',
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: "0",
            ...rest.style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderBottomColor = "#FF823F";
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottomColor = borderCol;
            rest.onBlur?.(e);
          }}
        />
      </label>
    );
  }
);