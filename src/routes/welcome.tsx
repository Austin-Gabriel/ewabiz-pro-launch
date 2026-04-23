import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { EwaLockup } from "@/components/ewa-logo";
import { PrimaryButton, SecondaryButton } from "@/auth/auth-buttons";
import { useAuth } from "@/auth/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Ewà Biz — Your craft comes first" },
      {
        name: "description",
        content:
          "Ewà Biz is the professional app for independent barbers and stylists. Trusted bookings on your schedule, on your terms.",
      },
      { property: "og:title", content: "Ewà Biz — Your craft comes first" },
      {
        property: "og:description",
        content: "Trusted bookings on your schedule, on your terms.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <AuthShell topLabel="For Professionals">
      <WelcomeBody />
    </AuthShell>
  );
}

function WelcomeBody() {
  const { isDark, text } = useAuthTheme();
  const navigate = useNavigate();
  const { loading, state } = useAuth();

  // If a session exists, /welcome is the wrong screen — bounce to the
  // appropriate home surface so the pro sees their resume card / dashboard.
  useEffect(() => {
    if (loading) return;
    if (state === "active" || state === "onboarding") {
      navigate({ to: "/home", replace: true });
    }
  }, [loading, state, navigate]);

  return (
    <>
      {/* Horizontal lockup — bagel + wordmark + BIZ */}
      <div className="relative z-[1] flex flex-col items-center" style={{ paddingTop: "12vh" }}>
        <div className="ewa-mark-in">
          <div className="ewa-breathe relative">
            <span
              aria-hidden
              className="ewa-spark absolute"
              style={{
                top: "12%",
                left: "6%",
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: "#FFE9D6",
                boxShadow: "0 0 12px 2px rgba(255,233,214,0.9)",
              }}
            />
            <EwaLockup isDark={isDark} markSize={56} />
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Headline */}
      <div className="relative z-[1] flex flex-col items-center px-8 text-center">
        <h1
          className="ewa-rise"
          style={{
            fontFamily: SANS_STACK,
            fontWeight: 500,
            fontSize: 26,
            lineHeight: 1.18,
            letterSpacing: "-0.02em",
            color: text,
            margin: 0,
            animationDelay: "400ms",
            maxWidth: 320,
          }}
        >
          Your{" "}
          <span className="relative inline-block">
            craft
            <span
              aria-hidden
              className="absolute left-0 ewa-underline-anim"
              style={{
                bottom: -3,
                height: 2,
                width: "100%",
                backgroundColor: "#FF823F",
                borderRadius: 2,
                animationDelay: "900ms",
              }}
            />
          </span>{" "}
          comes first.
        </h1>

        <p
          className="ewa-rise"
          style={{
            fontFamily: SANS_STACK,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: 1.5,
            color: text,
            opacity: 0.62,
            marginTop: 12,
            maxWidth: 280,
            animationDelay: "520ms",
          }}
        >
          Trusted bookings — on your schedule, on your terms.
        </p>
      </div>

      {/* CTAs */}
      <div
        className="relative z-[1] mt-10 flex flex-col items-stretch px-5 ewa-rise"
        style={{ animationDelay: "640ms" }}
      >
        <PrimaryButton onClick={() => navigate({ to: "/signup" })}>
          Join as a pro
        </PrimaryButton>
        <div className="mt-2.5">
          <SecondaryButton onClick={() => navigate({ to: "/login" })}>
            I already have an account
          </SecondaryButton>
        </div>
      </div>

      {/* Footer */}
      <div
        className="relative z-[1] mt-6 flex flex-col items-center px-4 pb-4 ewa-fade"
        style={{ animationDelay: "780ms" }}
      >
        <a
          href="#"
          className="group text-center transition-opacity hover:opacity-100"
          style={{ fontFamily: SANS_STACK, fontWeight: 400, fontSize: 11.5 }}
        >
          <span style={{ color: text, opacity: 0.45 }}>Looking for a beauty pro? </span>
          <span
            style={{ color: "#FF823F", fontWeight: 500 }}
            className="transition-all group-hover:tracking-wide"
          >
            Get the Ewà app →
          </span>
        </a>
        <div
          style={{
            marginTop: 10,
            fontFamily: SANS_STACK,
            fontSize: 10,
            letterSpacing: "0.02em",
            color: text,
            opacity: 0.35,
          }}
        >
          Terms of Service · Privacy Policy
        </div>
      </div>
    </>
  );
}