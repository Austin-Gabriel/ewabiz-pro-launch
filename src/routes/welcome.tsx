import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    if (mq.matches) setIsDark(false);
  }, []);

  const text = isDark ? "#F0EBD8" : "#061C27";
  const bg = isDark ? "#061C27" : "#F0EBD8";
  const glowOpacity = isDark ? 0.12 : 0.08;

  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-hidden transition-colors duration-200 ease-out"
      style={{
        backgroundColor: bg,
        color: text,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Radial ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle 400px at 50% 30%, rgba(255,130,63,${glowOpacity}) 0%, rgba(255,130,63,0) 100%)`,
        }}
      />

      {/* Mode toggle */}
      <button
        type="button"
        onClick={() => setIsDark((v) => !v)}
        aria-label="Toggle color mode"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
        style={{
          marginTop: "env(safe-area-inset-top)",
          color: text,
          opacity: 0.6,
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
        }}
      >
        {isDark ? "☀" : "☾"}
      </button>

      {/* Logo block — ~20% from top */}
      <div className="relative z-[1] flex flex-col items-center" style={{ paddingTop: "20vh" }}>
        <div className="relative" style={{ width: 64, height: 64 }}>
          {/* Donut */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: "#FF823F" }}
          />
          {/* Hole */}
          <div
            className="absolute rounded-full"
            style={{
              width: 24,
              height: 24,
              backgroundColor: bg,
              top: "50%",
              left: "50%",
              transform: "translate(-65%, -50%)",
            }}
          />
          {/* Grave accent */}
          <div
            className="absolute"
            style={{
              width: 12,
              height: 3,
              backgroundColor: "#FF823F",
              borderRadius: 2,
              top: -6,
              right: -4,
              transform: "rotate(15deg)",
            }}
          />
        </div>

        <div
          style={{
            fontFamily: "Fraunces, serif",
            fontWeight: 500,
            fontSize: 44,
            lineHeight: 1,
            marginTop: 16,
            color: text,
          }}
        >
          ewà
        </div>

        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "2px",
            color: "#FF823F",
            marginTop: 12,
          }}
        >
          BIZ
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Headline block — lower third */}
      <div className="relative z-[1] flex flex-col items-center px-8 text-center">
        <h1
          style={{
            fontFamily: "Fraunces, serif",
            fontWeight: 700,
            fontSize: 32,
            lineHeight: 1.1,
            color: text,
            margin: 0,
          }}
        >
          Your{" "}
          <span className="relative inline-block">
            craft
            <span
              aria-hidden
              className="absolute left-0"
              style={{
                bottom: -4,
                height: 3,
                width: "100%",
                backgroundColor: "#FF823F",
                borderRadius: 2,
              }}
            />
          </span>{" "}
          comes first.
        </h1>

        <p
          style={{
            fontFamily: "Fraunces, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 15,
            color: text,
            opacity: 0.7,
            marginTop: 12,
            marginBottom: 0,
          }}
        >
          Trusted bookings — on your schedule, on your terms.
        </p>
      </div>

      {/* CTA block */}
      <div className="relative z-[1] mt-8 flex flex-col items-stretch px-4">
        <button
          type="button"
          onClick={() => console.log("join_as_pro_tapped")}
          className="w-full transition-[filter] duration-150 hover:brightness-110"
          style={{
            height: 56,
            borderRadius: 9999,
            backgroundColor: "#FF823F",
            color: "#061C27",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 0 24px 0 rgba(255,130,63,0.25)",
          }}
        >
          Join as a pro
        </button>

        <button
          type="button"
          onClick={() => console.log("sign_in_tapped")}
          className="mt-3 w-full transition-opacity hover:opacity-90"
          style={{
            height: 56,
            borderRadius: 9999,
            backgroundColor: "transparent",
            border: `1px solid ${isDark ? "rgba(240,235,216,0.25)" : "rgba(6,28,39,0.25)"}`,
            color: text,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          I already have an account
        </button>
      </div>

      {/* Footer */}
      <div className="relative z-[1] mt-6 flex flex-col items-center px-4 pb-4">
        {/* Placeholder href — replace with client app store link */}
        <a
          href="#"
          className="text-center"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 12,
          }}
        >
          <span style={{ color: text, opacity: 0.5 }}>Looking for a beauty pro? </span>
          <span style={{ color: "#FF823F" }}>Get the Ewà app →</span>
        </a>
        <div
          style={{
            marginTop: 8,
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: text,
            opacity: 0.4,
          }}
        >
          Terms of Service · Privacy Policy
        </div>
      </div>
    </div>
  );
}
