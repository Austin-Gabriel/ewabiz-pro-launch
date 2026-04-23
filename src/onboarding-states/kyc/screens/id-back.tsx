import { useState } from "react";
import { KycShell } from "../kyc-shell";
import { CameraCapture } from "../camera-capture";
import { CapturePreview } from "./capture-preview";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";
import type { KycScreenProps } from "@/routes/kyc.$step";

export function KycIdBack({ onNext }: KycScreenProps) {
  const { data, patch } = useKyc();
  const [cameraOpen, setCameraOpen] = useState(false);

  const onCapture = (dataUrl: string) => {
    patch({ idBack: dataUrl });
    setCameraOpen(false);
  };

  return (
    <>
      <KycShell
        step="id-back"
        title="Back of your ID."
        subtitle="Flip it over and frame the barcode side."
        onContinue={onNext}
        canContinue={!!data.idBack}
      >
        <CapturePreview
          shot={data.idBack}
          variant="card"
          ctaLabel={data.idBack ? "Retake back" : "Open camera"}
          onOpen={() => setCameraOpen(true)}
        />
      </KycShell>
      {cameraOpen ? (
        <CameraCapture
          facing="environment"
          frame="card"
          instruction="Frame the back of your ID"
          subInstruction="Step 2 of 2 · Back"
          onCapture={onCapture}
          onCancel={() => setCameraOpen(false)}
        />
      ) : null}
    </>
  );
}