import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { TOTAL_STEPS, getOnboardingSnapshot } from "@/lib/onboarding-context";
import { StepRouter } from "@/components/onboarding/step-router";

export const Route = createFileRoute("/onboarding/$step")({
  head: () => ({
    meta: [
      { title: "Set up your profile — Ewà Biz" },
      { name: "description", content: "One question at a time. Resume anytime." },
    ],
  }),
  beforeLoad: ({ params }) => {
    const n = Number(params.step);
    if (!Number.isInteger(n) || n < 1 || n > TOTAL_STEPS) {
      const furthest = getOnboardingSnapshot().furthestStep ?? 1;
      throw redirect({ to: "/onboarding/$step", params: { step: String(furthest) } });
    }
  },
  component: StepPage,
});

function StepPage() {
  const { step } = Route.useParams();
  const navigate = useNavigate();
  const n = Number(step);

  const goNext = () => {
    if (n >= TOTAL_STEPS) {
      // Step 14 IS the review. CTA from review goes to KYC (Phase 2 — TBD).
      navigate({ to: "/home" });
    } else {
      navigate({ to: "/onboarding/$step", params: { step: String(n + 1) } });
    }
  };

  return <StepRouter step={n} onNext={goNext} />;
}
