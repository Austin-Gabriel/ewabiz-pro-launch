import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton, SecondaryButton } from "@/auth/auth-buttons";
import { AuthInput } from "@/auth/auth-input";
import { useAuth } from "@/auth/auth-context";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in — Ewà Biz" },
      { name: "description", content: "Welcome back. One tap to your studio." },
    ],
  }),
  validateSearch: (
    search: Record<string, unknown>,
  ): { faceid?: "enrolled" } =>
    search.faceid === "enrolled" ? { faceid: "enrolled" } : {},
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { faceid } = Route.useSearch();
  return (
    <AuthShell topLabel="Sign in" onBack={() => navigate({ to: "/welcome" })} quietSquiggles>
      <SignInBody faceIdEnrolled={faceid === "enrolled"} />
    </AuthShell>
  );
}

function SignInBody({ faceIdEnrolled }: { faceIdEnrolled: boolean }) {
  const { text } = useAuthTheme();
  const navigate = useNavigate();
  const { setIdentifier } = useAuth();
  const [value, setValue] = useState("");
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [faceState, setFaceState] = useState<"idle" | "prompting" | "failed">(
    faceIdEnrolled ? "prompting" : "idle"
  );
  const promptedRef = useRef(false);

  // Auto-prompt Face ID once when the screen loads (enrolled state).
  useEffect(() => {
    if (!faceIdEnrolled || promptedRef.current) return;
    promptedRef.current = true;
    const t = window.setTimeout(() => {
      // Mock: treat auto-prompt as cancelled so the fallback UI is reviewable.
      setFaceState("failed");
    }, 1400);
    return () => window.clearTimeout(t);
  }, [faceIdEnrolled]);

  const placeholder = tab === "phone" ? "+1  •  555  •  000  •  0000" : "you@studio.com";
  const valid =
    tab === "phone"
      ? value.replace(/\D/g, "").length >= 7
      : /\S+@\S+\.\S+/.test(value);

  const submit = () => {
    if (!valid) return;
    setIdentifier(value);
    navigate({ to: "/verify", search: { mode: "sign-in" } });
  };

  const tryFaceId = () => {
    setFaceState("prompting");
    window.setTimeout(() => navigate({ to: "/biometric" }), 500);
  };

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6">
      <div className="ewa-rise mt-10" style={{ animationDelay: "120ms" }}>
        <h1
          style={{
            fontFamily: SANS_STACK,
            fontWeight: 500,
            fontSize: 26,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: text,
            margin: 0,
            maxWidth: 280,
          }}
        >
          Welcome back.
        </h1>
        <p
          style={{
            fontFamily: SANS_STACK,
            fontSize: 13,
            lineHeight: 1.5,
            color: text,
            opacity: 0.6,
            marginTop: 8,
            maxWidth: 300,
          }}
        >
          {faceIdEnrolled
            ? faceState === "failed"
              ? "Use Face ID, or sign in below."
              : "Hold steady — looking for your face."
            : "One tap to your studio."}
        </p>
      </div>

      {/* Face ID — only present when enrolled. Prominent, with auto-prompt
          state mirrored in the button. */}
      {faceIdEnrolled ? (
        <>
          <div className="ewa-rise mt-8" style={{ animationDelay: "220ms" }}>
            <button
              type="button"
              onClick={tryFaceId}
              className="group flex w-full items-center gap-3 rounded-2xl px-4 py-4 transition-all duration-300 active:scale-[0.99]"
              style={{
                border: `1.5px solid rgba(255,130,63,0.55)`,
                backgroundColor: "rgba(255,130,63,0.10)",
                boxShadow:
                  faceState === "prompting"
                    ? "0 0 36px 0 rgba(255,130,63,0.35)"
                    : "0 0 18px 0 rgba(255,130,63,0.15)",
              }}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  faceState === "prompting" ? "ewa-breathe" : ""
                }`}
                style={{ backgroundColor: "rgba(255,130,63,0.18)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 8V6a1 1 0 0 1 1-1h2" />
                  <path d="M19 8V6a1 1 0 0 0-1-1h-2" />
                  <path d="M5 16v2a1 1 0 0 0 1 1h2" />
                  <path d="M19 16v2a1 1 0 0 1-1 1h-2" />
                  <path d="M9 10v1" /><path d="M15 10v1" /><path d="M12 10v3" />
                  <path d="M9 16c1 .8 2 1 3 1s2-.2 3-1" />
                </svg>
              </span>
              <span className="flex flex-col items-start">
                <span style={{ fontFamily: SANS_STACK, fontSize: 14.5, fontWeight: 600, color: text }}>
                  {faceState === "prompting" ? "Looking…" : "Sign in with Face ID"}
                </span>
                <span style={{ fontFamily: SANS_STACK, fontSize: 11.5, color: text, opacity: 0.55, marginTop: 2 }}>
                  {faceState === "failed" ? "Didn't recognize you. Try again." : "One glance to unlock"}
                </span>
              </span>
              <span
                className="ml-auto transition-transform group-hover:translate-x-1"
                style={{ color: "#FF823F", fontSize: 16 }}
              >
                →
              </span>
            </button>
          </div>

          <div className="ewa-fade my-6 flex items-center gap-3" style={{ animationDelay: "300ms" }}>
            <div className="h-px flex-1" style={{ backgroundColor: text, opacity: 0.12 }} />
            <span style={{ fontFamily: SANS_STACK, fontSize: 10, letterSpacing: "2px", color: text, opacity: 0.4 }}>
              OR
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: text, opacity: 0.12 }} />
          </div>
        </>
      ) : (
        <div className="mt-7" />
      )}

      {/* Tab switcher */}
      <div
        className="ewa-rise mb-3 inline-flex self-start gap-5"
        style={{ animationDelay: "360ms" }}
      >
        {(["phone", "email"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setValue("");
            }}
            style={{
              fontFamily: SANS_STACK,
              fontSize: 11,
              letterSpacing: "1.6px",
              textTransform: "uppercase",
              fontWeight: 500,
              color: text,
              opacity: tab === t ? 0.95 : 0.4,
              borderBottom: tab === t ? "1.5px solid #FF823F" : "1.5px solid transparent",
              paddingBottom: 4,
              transition: "opacity 200ms ease, border-color 200ms ease",
            }}
          >
            {t === "phone" ? "Phone" : "Email"}
          </button>
        ))}
      </div>

      <div className="ewa-rise" style={{ animationDelay: "420ms" }}>
        <AuthInput
          type={tab === "phone" ? "tel" : "email"}
          inputMode={tab === "phone" ? "tel" : "email"}
          autoComplete={tab === "phone" ? "tel" : "email"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </div>

      <div className="flex-1" />

      <div className="ewa-rise mb-4 flex flex-col gap-2.5" style={{ animationDelay: "560ms" }}>
        <PrimaryButton onClick={submit} disabled={!valid}>
          Continue
        </PrimaryButton>
        <SecondaryButton onClick={() => navigate({ to: "/join" })}>
          New here? Join as a pro
        </SecondaryButton>
      </div>
    </div>
  );
}