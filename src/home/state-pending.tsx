import { HOME_SANS, HOME_SERIF, useHomeTheme } from "./home-shell";
import { SecondaryButton } from "@/auth/auth-buttons";
import { useNavigate } from "@tanstack/react-router";

/**
 * Pending approval. The pro submitted KYC; we're waiting on the verifier.
 * The entire surface should feel like a slow exhale — quiet pulse, soft
 * suggestion of what to do with the wait.
 */
export function StatePending({
  firstName,
  submittedAtIso,
}: {
  firstName?: string;
  submittedAtIso?: string;
}) {
  const { text, isDark, borderCol } = useHomeTheme();
  const navigate = useNavigate();

  const submitted = submittedAtIso ? new Date(submittedAtIso) : null;
  const submittedLabel = submitted
    ? submitted.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })
    : "just now";

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6 pt-2">
      {/* Slow pulsing dot */}
      <div className="ewa-mark-in mt-6 flex items-center gap-2.5">
        <span
          className="ewa-breathe inline-block rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: "#FF823F",
            boxShadow: "0 0 14px rgba(255,130,63,0.65)",
          }}
        />
        <span style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.6px", textTransform: "uppercase", color: text, opacity: 0.55, fontWeight: 600 }}>
          Under review
        </span>
      </div>

      <h1
        className="ewa-rise"
        style={{
          fontFamily: HOME_SERIF,
          fontWeight: 400,
          fontSize: 34,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: text,
          margin: "20px 0 0 0",
          maxWidth: 320,
          animationDelay: "120ms",
        }}
      >
        Take a breath{firstName ? `, ${firstName}` : ""}.
      </h1>
      <p
        className="ewa-fade"
        style={{
          fontFamily: HOME_SANS,
          fontSize: 14.5,
          lineHeight: 1.55,
          color: text,
          opacity: 0.7,
          maxWidth: 320,
          marginTop: 12,
          animationDelay: "240ms",
        }}
      >
        We're verifying your details — usually under 24 hours. We'll text you
        the moment you're cleared to take bookings.
      </p>

      {/* Timeline strip */}
      <div
        className="ewa-rise mt-8 rounded-2xl px-4 py-4"
        style={{
          backgroundColor: isDark ? "rgba(240,235,216,0.04)" : "rgba(6,28,39,0.035)",
          border: `1px solid ${borderCol}`,
          animationDelay: "340ms",
        }}
      >
        <div style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.4px", textTransform: "uppercase", color: text, opacity: 0.5, fontWeight: 600 }}>
          Your application
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {[
            { label: "Submitted", sub: submittedLabel, done: true },
            { label: "In review", sub: "Usually under 24 hours", done: false, active: true },
            { label: "Approved", sub: "You'll get a text", done: false },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span
                className={row.active ? "ewa-breathe" : ""}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  backgroundColor: row.done ? "#FF823F" : row.active ? "#FF823F" : "transparent",
                  border: row.done || row.active ? "none" : `1px solid ${borderCol}`,
                  flexShrink: 0,
                  boxShadow: row.active ? "0 0 10px rgba(255,130,63,0.55)" : "none",
                }}
              />
              <div className="flex flex-1 items-baseline justify-between">
                <span style={{ fontFamily: HOME_SANS, fontSize: 13.5, color: text, opacity: row.done || row.active ? 1 : 0.5, fontWeight: 500 }}>
                  {row.label}
                </span>
                <span style={{ fontFamily: HOME_SANS, fontSize: 12, color: text, opacity: 0.45 }}>
                  {row.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* While you wait */}
      <div
        className="ewa-rise mt-4 rounded-2xl px-4 py-4"
        style={{
          backgroundColor: "rgba(255,130,63,0.06)",
          border: "1px solid rgba(255,130,63,0.20)",
          animationDelay: "440ms",
        }}
      >
        <div style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.4px", textTransform: "uppercase", color: "#FF823F", fontWeight: 700 }}>
          While you wait
        </div>
        <p style={{ fontFamily: HOME_SERIF, fontSize: 18, lineHeight: 1.35, color: text, marginTop: 8, fontWeight: 400, letterSpacing: "-0.01em" }}>
          Sharpen your service menu — the prices clients see first.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/onboarding/$step", params: { step: "10" } })}
          className="mt-3 inline-flex items-center gap-1.5 transition-opacity hover:opacity-100"
          style={{ fontFamily: HOME_SANS, fontSize: 13, color: "#FF823F", fontWeight: 600 }}
        >
          Edit my menu
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1" />

      <div className="ewa-fade mb-4 mt-6" style={{ animationDelay: "560ms" }}>
        <SecondaryButton onClick={() => navigate({ to: "/welcome" })}>
          Sign out
        </SecondaryButton>
      </div>
    </div>
  );
}