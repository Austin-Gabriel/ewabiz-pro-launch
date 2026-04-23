import { useEffect, useState } from "react";
import { KycShell } from "../kyc-shell";
import { CameraCapture } from "../camera-capture";
import { CapturePreview } from "./capture-preview";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";
import type { KycScreenProps } from "@/routes/kyc.$step";

/**
 * Selfie + simple liveness prompt. The "liveness" here is a scripted prompt
 * sequence ("Look straight" → "Blink slowly" → "Turn slightly left") shown
 * before capture. In production a real provider drives this; the mock just
 * walks the prompt timeline so the feel of the flow is honest.
 */
export function KycSelfie({ onNext }: KycScreenProps) {
  const { data, patch } = useKyc();
  const [cameraOpen, setCameraOpen] = useState(false);

  const onCapture = (dataUrl: string) => {
    patch({ selfie: dataUrl });
    setCameraOpen(false);
  };

  return (
    <>
      <KycShell
        step="selfie"
        title="A quick selfie."
        subtitle="We compare it to your ID. Good light, no hat or sunglasses."
        onContinue={onNext}
        canContinue={!!data.selfie}
      >
        <CapturePreview
          shot={data.selfie}
          variant="face"
          ctaLabel={data.selfie ? "Retake selfie" : "Open camera"}
          onOpen={() => setCameraOpen(true)}
        />
      </KycShell>
      {cameraOpen ? (
        <SelfieCamera
          onCapture={onCapture}
          onCancel={() => setCameraOpen(false)}
        />
      ) : null}
    </>
  );
}

function SelfieCamera({
  onCapture,
  onCancel,
}: {
  onCapture: (d: string) => void;
  onCancel: () => void;
}) {
  const prompts = [
    { text: "Look straight at the camera", sub: "Liveness · 1 of 3" },
    { text: "Blink slowly", sub: "Liveness · 2 of 3" },
    { text: "Turn slightly left, then back", sub: "Liveness · 3 of 3" },
    { text: "Hold still — capturing", sub: "Almost done" },
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx >= prompts.length - 1) return;
    const t = window.setTimeout(() => setIdx((i) => i + 1), 1600);
    return () => window.clearTimeout(t);
  }, [idx, prompts.length]);

  return (
    <CameraCapture
      facing="user"
      frame="face"
      instruction={prompts[idx].text}
      subInstruction={prompts[idx].sub}
      onCapture={onCapture}
      onCancel={onCancel}
    />
  );
}
