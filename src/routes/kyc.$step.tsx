import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { KYC_STEP_ORDER, type KycStep, getKycSnapshot } from "@/onboarding-states/kyc/kyc-context";
import { KycIntro } from "@/onboarding-states/kyc/screens/intro";
import { KycTax } from "@/onboarding-states/kyc/screens/tax";
import { KycIdFront } from "@/onboarding-states/kyc/screens/id-front";
import { KycIdBack } from "@/onboarding-states/kyc/screens/id-back";
import { KycSelfie } from "@/onboarding-states/kyc/screens/selfie";
import { KycSubmit } from "@/onboarding-states/kyc/screens/submit";

function isKycStep(s: string): s is KycStep {
  return (KYC_STEP_ORDER as readonly string[]).includes(s);
}

export const Route = createFileRoute("/kyc/$step")({
  head: () => ({
    meta: [
      { title: "Verify your identity — Ewà Biz" },
      { name: "description", content: "A quick check so payouts and bookings work safely." },
    ],
  }),
  beforeLoad: ({ params }) => {
    if (!isKycStep(params.step)) {
      const furthest = getKycSnapshot().furthest ?? "intro";
      throw redirect({ to: "/kyc/$step", params: { step: furthest } });
    }
  },
  component: KycStepPage,
});

function KycStepPage() {
  const { step } = Route.useParams();
  const navigate = useNavigate();

  const goNext = () => {
    const idx = KYC_STEP_ORDER.indexOf(step as KycStep);
    if (idx < 0 || idx >= KYC_STEP_ORDER.length - 1) {
      // Last step (submit) is responsible for routing to a result screen.
      return;
    }
    const next = KYC_STEP_ORDER[idx + 1];
    navigate({ to: "/kyc/$step", params: { step: next } });
  };

  switch (step as KycStep) {
    case "intro": return <KycIntro onNext={goNext} />;
    case "tax": return <KycTax onNext={goNext} />;
    case "id-front": return <KycIdFront onNext={goNext} />;
    case "id-back": return <KycIdBack onNext={goNext} />;
    case "selfie": return <KycSelfie onNext={goNext} />;
    case "submit": return <KycSubmit />;
    default: return null;
  }
}

export interface KycScreenProps { onNext: () => void; }