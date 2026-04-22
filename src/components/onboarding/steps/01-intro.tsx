import { StepShell } from "../step-shell";
import type { StepProps } from "../step-router";

export function Step1Intro({ onNext }: StepProps) {
  return (
    <StepShell
      step={1}
      title={<>Let&apos;s get you set up.</>}
      subtitle="A few quick questions, then we verify you. About six minutes, save anytime."
      onContinue={onNext}
      canContinue
      ctaLabel="Get started"
    >
      <div />
    </StepShell>
  );
}
