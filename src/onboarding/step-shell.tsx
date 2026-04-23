import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { TOTAL_STEPS, useOnboarding } from "@/onboarding/onboarding-context";

export interface StepShellProps {
  step: number;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  onContinue: () => void;
  canContinue: boolean;
  ctaLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  hideDock?: boolean;
  /**
   * Quiet decoration: confines squiggles to the bottom 25% of the screen.
   * Defaults to `true` because most onboarding screens are functional forms.
   * Pass `false` on hero / celebratory steps (intro, review summary).
   */
  quietBg?: boolean;
}

export function StepShell(props: StepShellProps) {
  const navigate = useNavigate();
  const { markFurthest } = useOnboarding();

  useEffect(() => {
    markFurthest(props.step);
  }, [props.step, markFurthest]);

  const back = () => {
    if (props.step <= 1) {
      navigate({ to: "/welcome" });
    } else {
      navigate({ to: "/onboarding/$step", params: { step: String(props.step - 1) } });
    }
  };

  return (
    <AuthShell onBack={back} quietSquiggles={props.quietBg ?? true}>
      <ProgressBar step={props.step} />
      <StepBody {...props} />
    </AuthShell>
  );
}

function ProgressBar({ step }: { step: number }) {
  const { borderCol } = useAuthTheme();
  const pct = Math.min(100, Math.max(4, (step / TOTAL_STEPS) * 100));
  return (
    <div
      className="relative z-[2] mx-5 mt-1 overflow-hidden rounded-full"
      style={{ height: 3, backgroundColor: borderCol, opacity: 0.7 }}
      aria-hidden
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, #FF823F 0%, #FFB07A 100%)",
          borderRadius: 9999,
          transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 0 12px rgba(255,130,63,0.35)",
        }}
      />
    </div>
  );
}

function StepBody({
  step,
  title,
  subtitle,
  children,
  onContinue,
  canContinue,
  ctaLabel = "Continue",
  secondaryLabel,
  onSecondary,
  hideDock,
}: StepShellProps) {
  const { text } = useAuthTheme();
  const [slideKey, setSlideKey] = useState(step);

  useEffect(() => {
    setSlideKey(step);
  }, [step]);

  return (
    <div className="relative z-[1] flex flex-1 flex-col">
      <div key={slideKey} className="ewa-step-slide flex flex-1 flex-col px-6 pt-8">
        {title ? (
          <h1
            className="ewa-rise"
            style={{
              fontFamily: SANS_STACK,
              fontWeight: 500,
              fontSize: 28,
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              color: text,
              margin: 0,
              maxWidth: 320,
              animationDelay: "60ms",
            }}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p
            className="ewa-rise"
            style={{
              fontFamily: SANS_STACK,
              fontSize: 13,
              lineHeight: 1.55,
              color: text,
              opacity: 0.62,
              marginTop: 10,
              maxWidth: 320,
              animationDelay: "140ms",
            }}
          >
            {subtitle}
          </p>
        ) : null}

        <div className="ewa-rise mt-7 flex flex-1 flex-col" style={{ animationDelay: "220ms" }}>
          {children}
        </div>
      </div>

      {!hideDock ? (
        <div
          className="ewa-rise relative z-[2] flex flex-col gap-2 px-6 pb-5 pt-3"
          style={{ animationDelay: "320ms" }}
        >
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="group relative w-full overflow-hidden transition-all duration-300 hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              height: 52,
              borderRadius: 9999,
              backgroundColor: "#FF823F",
              color: "#061C27",
              fontFamily: SANS_STACK,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: canContinue
                ? "0 0 32px 0 rgba(255,130,63,0.32), 0 1px 0 0 rgba(255,255,255,0.15) inset"
                : "none",
            }}
          >
            <span
              aria-hidden
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)",
              }}
            />
            <span className="relative">{ctaLabel}</span>
          </button>
          {secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondary}
              style={{
                height: 36,
                fontFamily: SANS_STACK,
                fontSize: 12.5,
                fontWeight: 500,
                color: text,
                opacity: 0.55,
              }}
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
