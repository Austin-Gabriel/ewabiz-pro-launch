import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";

export const FieldLabel = ({ children }: { children: React.ReactNode }) => {
  const { text } = useAuthTheme();
  return (
    <span
      style={{
        fontFamily: SANS_STACK,
        fontSize: 10,
        letterSpacing: "1.6px",
        textTransform: "uppercase",
        fontWeight: 500,
        color: text,
        opacity: 0.5,
      }}
    >
      {children}
    </span>
  );
};

export const BigInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(function BigInput({ label, ...rest }, ref) {
  const { text, borderCol } = useAuthTheme();
  return (
    <label className="flex w-full flex-col" style={{ gap: 8 }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <input
        ref={ref}
        {...rest}
        className={"w-full bg-transparent outline-none " + (rest.className ?? "")}
        style={{
          height: 52,
          borderBottom: `1px solid ${borderCol}`,
          color: text,
          fontFamily: SANS_STACK,
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: "-0.01em",
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
});

export const BigTextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
>(function BigTextArea({ label, ...rest }, ref) {
  const { text, borderCol } = useAuthTheme();
  return (
    <label className="flex w-full flex-col" style={{ gap: 8 }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <textarea
        ref={ref}
        rows={4}
        {...rest}
        className={"w-full resize-none bg-transparent outline-none " + (rest.className ?? "")}
        style={{
          minHeight: 110,
          padding: "12px 0",
          borderBottom: `1px solid ${borderCol}`,
          color: text,
          fontFamily: SANS_STACK,
          fontSize: 18,
          lineHeight: 1.45,
          fontWeight: 400,
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
});

export function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const { text, borderCol } = useAuthTheme();
  return (
    <button
      type="button"
      onClick={onToggle}
      className="transition-all duration-200 active:scale-[0.97]"
      style={{
        padding: "10px 16px",
        borderRadius: 9999,
        border: `1px solid ${selected ? "#FF823F" : borderCol}`,
        backgroundColor: selected ? "rgba(255,130,63,0.12)" : "transparent",
        color: selected ? "#FF823F" : text,
        opacity: selected ? 1 : 0.85,
        fontFamily: SANS_STACK,
        fontSize: 13,
        fontWeight: selected ? 500 : 400,
      }}
    >
      {label}
    </button>
  );
}

export function ToggleRow({
  label,
  description,
  on,
  onChange,
}: {
  label: string;
  description?: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  const { text, borderCol } = useAuthTheme();
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center gap-3 py-4 text-left transition-opacity active:opacity-70"
      style={{ borderBottom: `1px solid ${borderCol}` }}
    >
      <div className="flex-1">
        <div style={{ fontFamily: SANS_STACK, fontSize: 15, fontWeight: 500, color: text }}>
          {label}
        </div>
        {description ? (
          <div
            style={{
              fontFamily: SANS_STACK,
              fontSize: 12,
              color: text,
              opacity: 0.55,
              marginTop: 2,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>
      <span
        className="relative inline-block transition-colors duration-200"
        style={{
          width: 44,
          height: 26,
          borderRadius: 9999,
          backgroundColor: on ? "#FF823F" : "rgba(255,255,255,0.12)",
          border: `1px solid ${on ? "#FF823F" : borderCol}`,
        }}
      >
        <span
          className="absolute top-1/2 transition-transform duration-200"
          style={{
            left: 2,
            width: 20,
            height: 20,
            borderRadius: 9999,
            backgroundColor: on ? "#061C27" : "#F0EBD8",
            transform: `translateY(-50%) translateX(${on ? 18 : 0}px)`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </span>
    </button>
  );
}
