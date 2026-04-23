import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton } from "@/auth/auth-buttons";
import { AuthInput } from "@/auth/auth-input";
import { useAuth } from "@/auth/auth-context";
import { useOnboarding } from "@/onboarding/onboarding-context";
import { getPendingSignup, clearPendingSignup } from "@/auth/signup-pending";

export const Route = createFileRoute("/signup/services")({
  head: () => ({
    meta: [
      { title: "What do you do? — Ewà Biz" },
      { name: "description", content: "Tell us your craft so we can match you with the right clients." },
    ],
  }),
  component: SignUpServicesPage,
});

const SERVICES: { slug: string; label: string }[] = [
  { slug: "hair", label: "Hairstylist" },
  { slug: "nails", label: "Nail Tech" },
  { slug: "makeup", label: "Makeup Artist" },
  { slug: "lashes", label: "Lash Tech" },
  { slug: "brows", label: "Brow Artist" },
  { slug: "barber", label: "Barber" },
];

function SignUpServicesPage() {
  const navigate = useNavigate();
  return (
    <AuthShell topLabel="One last thing" onBack={() => navigate({ to: "/signup" })} quietSquiggles>
      <SignUpServicesBody />
    </AuthShell>
  );
}

function SignUpServicesBody() {
  const { text, borderCol } = useAuthTheme();
  const navigate = useNavigate();
  const { signUpWithPassword } = useAuth();
  const { patch, markFurthest } = useOnboarding();

  // If they reload directly, send them back to step 1.
  useEffect(() => {
    if (!getPendingSignup()) navigate({ to: "/signup", replace: true });
  }, [navigate]);

  const [services, setServices] = useState<string[]>([]);
  const [studioName, setStudioName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const valid = services.length > 0;

  const toggle = (slug: string) =>
    setServices((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );

  const submit = async () => {
    const account = getPendingSignup();
    if (!account || !valid || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await signUpWithPassword({
      email: account.email,
      password: account.password,
      fullName: account.fullName,
      phone: account.phone,
      services,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }

    // Pre-populate onboarding so we don't re-ask for any of this.
    const nameParts = account.fullName.split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ");
    patch({
      phone: account.phone,
      firstName,
      lastName,
      services,
      studioName: studioName.trim() || undefined,
      furthestStep: 1,
    });
    markFurthest(1);
    clearPendingSignup();

    // Land them on the first onboarding screen (DOB).
    navigate({ to: "/onboarding/$step", params: { step: "1" } });
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
          What's your craft?
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
          Pick everything that applies. You can refine specialties later.
        </p>
      </div>

      <div className="ewa-rise mt-7" style={{ animationDelay: "200ms" }}>
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

      <div className="ewa-rise mt-8" style={{ animationDelay: "300ms" }}>
        <AuthInput
          label="Studio name (optional)"
          autoComplete="organization"
          placeholder="e.g. Maya's Beauty Studio"
          value={studioName}
          onChange={(e) => setStudioName(e.target.value)}
        />
        <p
          style={{
            fontFamily: SANS_STACK,
            fontSize: 11.5,
            color: text,
            opacity: 0.5,
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          You can use your own name if you don't have a studio name.
        </p>
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

      <div className="ewa-rise mt-8 flex flex-col gap-2" style={{ animationDelay: "400ms" }}>
        <PrimaryButton onClick={submit} disabled={!valid || busy}>
          {busy ? "Creating account…" : "Create account"}
        </PrimaryButton>
      </div>
    </div>
  );
}