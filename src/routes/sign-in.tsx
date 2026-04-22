import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/components/auth-shell";
import { EwaMark } from "@/components/ewa-logo";
import { PrimaryButton, SecondaryButton } from "@/components/auth-buttons";
import { AuthInput } from "@/components/auth-input";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in — Ewà Biz" },
      { name: "description", content: "Welcome back. One tap to your studio." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  return (
    <AuthShell topLabel="Sign in" onBack={() => navigate({ to: "/welcome" })}>
      <SignInBody />
    </AuthShell>
  );
}

function SignInBody() {
  const { text } = useAuthTheme();
  const navigate = useNavigate();
  const { setIdentifier } = useAuth();
  const [value, setValue] = useState("");
  const [tab, setTab] = useState<"phone" | "email">("phone");

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
          One tap to your studio.
        </p>
      </div>

      {/* Biometric quick-action — present for returning hands */}
      <div className="ewa-rise mt-7" style={{ animationDelay: "220ms" }}>
        <button
          type="button"
          onClick={() => navigate({ to: "/biometric" })}
          className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 active:scale-[0.99]"
          style={{
            border: `1px solid rgba(255,130,63,0.35)`,
            backgroundColor: "rgba(255,130,63,0.06)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,130,63,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,130,63,0.06)";
          }}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,130,63,0.14)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 11a3 3 0 0 0-3 3v3a3 3 0 0 0 6 0v-3a3 3 0 0 0-3-3Z" />
              <path d="M5 11V8a7 7 0 0 1 14 0v3" />
              <path d="M8 11h8" opacity="0.5" />
            </svg>
          </span>
          <span style={{ fontFamily: SANS_STACK, fontSize: 13.5, fontWeight: 500, color: text }}>
            Use Face ID
          </span>
          <span
            className="ml-auto transition-transform group-hover:translate-x-1"
            style={{ color: "#FF823F", fontSize: 16 }}
          >
            →
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="ewa-fade my-6 flex items-center gap-3" style={{ animationDelay: "300ms" }}>
        <div className="h-px flex-1" style={{ backgroundColor: text, opacity: 0.12 }} />
        <span style={{ fontFamily: SANS_STACK, fontSize: 10, letterSpacing: "2px", color: text, opacity: 0.4 }}>
          OR
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: text, opacity: 0.12 }} />
      </div>

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