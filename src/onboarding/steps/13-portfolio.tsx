import { useRef, useState } from "react";
import { StepShell } from "../step-shell";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { useOnboarding } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

const MIN_PHOTOS = 3;

export function Step13Portfolio({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const [photos, setPhotos] = useState<string[]>(data.portfolio ?? []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const reads = await Promise.all(
      Array.from(files).map(
        (f) => new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.readAsDataURL(f);
        })
      )
    );
    const next = [...photos, ...reads];
    setPhotos(next);
    patch({ portfolio: next });
  };

  const remove = (idx: number) => {
    const next = photos.filter((_, i) => i !== idx);
    setPhotos(next);
    patch({ portfolio: next });
  };

  const enough = photos.length >= MIN_PHOTOS;
  const submit = () => { patch({ portfolio: photos }); onNext(); };

  return (
    <StepShell
      step={9}
      title="Show your work."
      subtitle={`Add at least ${MIN_PHOTOS} photos. Your best, not your most.`}
      onContinue={submit}
      canContinue={enough}
      ctaLabel={enough ? "Continue" : `${MIN_PHOTOS - photos.length} more to go`}
    >
      <PortfolioBody
        photos={photos}
        inputRef={inputRef}
        onFiles={onFiles}
        remove={remove}
      />
    </StepShell>
  );
}

function PortfolioBody({
  photos, inputRef, onFiles, remove,
}: {
  photos: string[];
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | null) => void;
  remove: (idx: number) => void;
}) {
  const { text, borderCol } = useAuthTheme();
  return (
    <>
      <input
        ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square items-center justify-center rounded-2xl transition-all active:scale-[0.97]"
          style={{
            border: `1.5px dashed rgba(255,130,63,0.5)`,
            backgroundColor: "rgba(255,130,63,0.05)",
          }}
        >
          <div className="flex flex-col items-center gap-1.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.6" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span style={{ fontFamily: SANS_STACK, fontSize: 10.5, color: "#FF823F", fontWeight: 500 }}>Add</span>
          </div>
        </button>
        {photos.map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-2xl" style={{ border: `1px solid ${borderCol}` }}>
            <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 14 }}
              aria-label="Remove"
            >×</button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center" style={{ fontFamily: SANS_STACK, fontSize: 11, color: text, opacity: 0.45 }}>
        {photos.length} / {MIN_PHOTOS} minimum
      </p>
    </>
  );
}
