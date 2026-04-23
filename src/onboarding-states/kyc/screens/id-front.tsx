import { useState } from "react";
import { KycShell } from "../kyc-shell";
import { CameraCapture } from "../camera-capture";
import { CapturePreview } from "./capture-preview";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";
import type { KycScreenProps } from "@/routes/kyc.$step";

export function KycIdFront({ onNext }: KycScreenProps) {
  const { data, patch } = useKyc();
  const [cameraOpen, setCameraOpen] = useState(false);

  const onCapture = (dataUrl: string) => {
    patch({ idFront: dataUrl });
    setCameraOpen(false);
  };

  return (
    <>
      <KycShell
        step="id-front"
        title="Front of your ID."
        subtitle="Driver's license or passport. Make sure all four corners are inside the frame."
        onContinue={onNext}
        canContinue={!!data.idFront}
      >
        <CapturePreview
          shot={data.idFront}
          variant="card"
          ctaLabel={data.idFront ? "Retake front" : "Open camera"}
          onOpen={() => setCameraOpen(true)}
        />
      </KycShell>
      {cameraOpen ? (
        <CameraCapture
          facing="environment"
          frame="card"
          instruction="Align your ID inside the frame"
          subInstruction="Step 1 of 2 · Front"
          onCapture={onCapture}
          onCancel={() => setCameraOpen(false)}
        />
      ) : null}
    </>
  );
}