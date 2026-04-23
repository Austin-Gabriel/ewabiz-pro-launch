import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton, SecondaryButton } from "@/auth/auth-buttons";
import { AuthInput } from "@/auth/auth-input";
import { useAuth } from "@/auth/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Ewà Biz" },
      { name: "description", content: "Sign in to your Ewà studio." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <AuthShell topLabel="Sign in" onBack={() => navigate({ to: "/welcome" })} quietSquiggles>
      <LoginBody />
    </AuthShell>
  );
}

function LoginBody() {
  const { text, borderCol } = useAuthTheme();
  const navigate = useNavigate();
  const { signInWithPassword, signInDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"none" | "login" | "demo">("none");

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const submit = async () => {
    if (!valid || busy !== "none") return;
    setBusy("login");
    setError(null);
    const { error: err } = await signInWithPassword(email, password);
    setBusy("none");
    if (err) {
      setError(err);
      return;
    }
    navigate({ to: "/splash" });
  };

  const demo = async () => {
    if (busy !== "none") return;
    setBusy("demo");
    setError(null);
    const { error: err } = await signInDemo();
    setBusy("none");
    if (err) {
      setError(err);
      return;
    }
    navigate({ to: "/home" });
  };

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6">
      <div className="ewa-rise mt-8" style={{ animationDelay: "120ms" }}>
        <h1
          style={{
            fontFamily: SANS_STACK,
            fontWeight: 500,
            fontSize: 26,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: text,
            margin: 0,
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
          }}
        >
          Sign in to your studio.
        </p>
      </div>

      {/* Social placeholders */}
      <div className="ewa-rise mt-7 flex flex-col gap-2.5" style={{ animationDelay: "200ms" }}>
        <SocialButton label="Continue with Apple" icon={<AppleGlyph />} disabled />
        <SocialButton label="Continue with Google" icon={<GoogleGlyph />} disabled />
      </div>

      <div className="ewa-fade my-5 flex items-center gap-3" style={{ animationDelay: "260ms" }}>
        <div className="h-px flex-1" style={{ backgroundColor: text, opacity: 0.12 }} />
        <span style={{ fontFamily: SANS_STACK, fontSize: 10, letterSpacing: "2px", color: text, opacity: 0.4 }}>
          OR
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: text, opacity: 0.12 }} />
      </div>

      <div className="ewa-rise flex flex-col gap-4" style={{ animationDelay: "320ms" }}>
        <AuthInput
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthInput
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Link
          to="/forgot-password"
          style={{
            fontFamily: SANS_STACK,
            fontSize: 12,
            color: "#FF823F",
            fontWeight: 500,
          }}
        >
          Forgot password?
        </Link>
      </div>

      {error ? (
        <p
          className="mt-3 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 12, color: "#FF6B5B" }}
        >
          {error}
        </p>
      ) : null}

      <div className="flex-1" />

      <div className="ewa-rise mb-4 flex flex-col gap-2.5" style={{ animationDelay: "440ms" }}>
        <PrimaryButton onClick={submit} disabled={!valid || busy !== "none"}>
          {busy === "login" ? "Signing in…" : "Continue"}
        </PrimaryButton>
        <SecondaryButton onClick={demo} disabled={busy !== "none"}>
          {busy === "demo" ? "Loading demo…" : "⚡ Skip to demo"}
        </SecondaryButton>
        <p
          className="mt-2 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 12.5, color: text, opacity: 0.6 }}
        >
          New here?{" "}
          <Link to="/signup" style={{ color: "#FF823F", fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>

      <DemoHint borderCol={borderCol} text={text} />
    </div>
  );
}

function SocialButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const { text, borderCol } = useAuthTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.99] disabled:opacity-55"
      style={{
        height: 48,
        borderRadius: 9999,
        backgroundColor: "transparent",
        border: `1px solid ${borderCol}`,
        color: text,
        fontFamily: SANS_STACK,
        fontSize: 13.5,
        fontWeight: 500,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function AppleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.21-1.12 2.99-.74.84-1.95 1.49-2.99 1.41-.13-1.1.42-2.27 1.12-3.02.78-.85 2.1-1.49 2.99-1.51v.13zM20.5 17.27c-.37.86-.55 1.25-1.03 2.01-.67 1.06-1.6 2.38-2.76 2.39-1.04.01-1.31-.69-2.71-.68-1.4 0-1.69.69-2.73.69-1.16-.01-2.05-1.2-2.71-2.27-1.86-2.99-2.06-6.5-.91-8.37.81-1.32 2.1-2.1 3.31-2.1 1.23 0 2.01.68 3.03.68 1 0 1.6-.68 3.03-.68 1.08 0 2.22.59 3.04 1.6-2.66 1.46-2.23 5.27.44 6.73z" />
    </svg>
  );
}
function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#FFC107" d="M21.8 10.2H12v3.9h5.6c-.5 2.6-2.7 4-5.6 4-3.4 0-6.1-2.7-6.1-6.1S8.6 5.9 12 5.9c1.5 0 2.8.5 3.9 1.4l2.7-2.7C16.8 3.1 14.5 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5 0 9.5-3.6 9.5-10 0-.6-.1-1.2-.2-1.8z" />
      <path fill="#FF3D00" d="M3.2 7.3l3.2 2.4C7.3 8 9.5 5.9 12 5.9c1.5 0 2.8.5 3.9 1.4l2.7-2.7C16.8 3.1 14.5 2 12 2 8.3 2 5.1 4.1 3.2 7.3z" />
      <path fill="#4CAF50" d="M12 22c2.4 0 4.6-.9 6.3-2.4l-2.9-2.4c-1 .7-2.2 1.1-3.4 1.1-2.9 0-5.1-1.4-5.6-4l-3.2 2.5C4.9 19.8 8.2 22 12 22z" />
      <path fill="#1976D2" d="M21.8 10.2H12v3.9h5.6c-.3 1.4-1 2.5-2 3.3l2.9 2.4c1.7-1.6 2.8-3.9 2.8-6.7 0-.6-.1-1.2-.2-1.8z" />
    </svg>
  );
}

function DemoHint({ borderCol, text }: { borderCol: string; text: string }) {
  return (
    <div
      className="ewa-fade mb-2 rounded-xl px-3 py-2.5 text-center"
      style={{
        animationDelay: "560ms",
        border: `1px dashed ${borderCol}`,
      }}
    >
      <span style={{ fontFamily: SANS_STACK, fontSize: 11, color: text, opacity: 0.55 }}>
        Demo:{" "}
        <span style={{ color: text, opacity: 0.9, fontWeight: 600 }}>test@ewa.app</span>
        {" / "}
        <span style={{ color: text, opacity: 0.9, fontWeight: 600 }}>test1234</span>
      </span>
    </div>
  );
}