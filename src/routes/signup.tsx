import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/components/auth-shell";
import { PrimaryButton } from "@/components/auth-buttons";
import { AuthInput } from "@/components/auth-input";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Join Ewà Biz" },
      { name: "description", content: "Create your Ewà studio account." },
    ],
  }),
  component: SignUpPage,
});

const SERVICES: { slug: string; label: string }[] = [
  { slug: "hair", label: "Hair" },
  { slug: "nails", label: "Nails" },
  { slug: "makeup", label: "Makeup" },
  { slug: "lashes", label: "Lashes" },
  { slug: "brows", label: "Brows" },
  { slug: "barber", label: "Barber" },
];

function SignUpPage() {
  const navigate = useNavigate();
  return (
    <AuthShell topLabel="Create account" onBack={() => navigate({ to: "/login" })} quietSquiggles>
      <SignUpBody />
    </AuthShell>
  );
}

function SignUpBody() {
  const { text, borderCol } = useAuthTheme();
  const navigate = useNavigate();
  const { signUpWithPassword } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const valid =
    fullName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6 &&
    phone.replace(/\D/g, "").length >= 7 &&
    services.length > 0;

  const toggle = (slug: string) =>
    setServices((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await signUpWithPassword({
      email,
      password,
      fullName: fullName.trim(),
      phone,
      services,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    // New account — drop into the rich onboarding flow.
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6 pb-6">
      <div className="ewa-rise mt-6" style={{ animationDelay: "100ms" }}>
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
          Create your studio.
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
          A few details to get you started.
        </p>
      </div>

      <div className="ewa-rise mt-6 flex flex-col gap-4" style={{ animationDelay: "200ms" }}>
        <AuthInput
          label="Full name"
          autoComplete="name"
          placeholder="Jamie Carter"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthInput
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 555 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="mt-6">
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
          I am a…
        </span>
        <div className="mt-3 flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const active = services.includes(s.slug);
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => toggle(s.slug)}
                style={{
                  fontFamily: SANS_STACK,
                  fontSize: 13,
                  fontWeight: 500,
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 9999,
                  border: `1px solid ${active ? "#FF823F" : borderCol}`,
                  backgroundColor: active ? "rgba(255,130,63,0.12)" : "transparent",
                  color: active ? "#FF823F" : text,
                  transition: "all 200ms ease",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p
          className="mt-4 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 12, color: "#FF6B5B" }}
        >
          {error}
        </p>
      ) : null}

      <div className="flex-1" />

      <div className="ewa-rise mt-8 flex flex-col gap-2" style={{ animationDelay: "320ms" }}>
        <PrimaryButton onClick={submit} disabled={!valid || busy}>
          {busy ? "Creating account…" : "Continue"}
        </PrimaryButton>
        <p
          className="mt-2 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 12.5, color: text, opacity: 0.6 }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#FF823F", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
        <p
          className="mt-1 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 10.5, color: text, opacity: 0.4, lineHeight: 1.5 }}
        >
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}