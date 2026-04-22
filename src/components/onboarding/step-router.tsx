import { Step4Name } from "./steps/04-name";
import { Step5Craft } from "./steps/05-craft";
import { Step6Services } from "./steps/06-services";
import { Step7Experience } from "./steps/07-experience";
import { Step8Specializations } from "./steps/08-specializations";
import { Step9Area } from "./steps/09-area";
import { Step11Availability } from "./steps/11-availability";
import { Step12Menu } from "./steps/12-menu";
import { Step13Portfolio } from "./steps/13-portfolio";
import { Step14Review } from "./steps/14-review";

interface Props {
  step: number;
  onNext: () => void;
}

export function StepRouter({ step, onNext }: Props) {
  switch (step) {
    case 1: return <Step4Name onNext={onNext} />;
    case 2: return <Step5Craft onNext={onNext} />;
    case 3: return <Step6Services onNext={onNext} />;
    case 4: return <Step7Experience onNext={onNext} />;
    case 5: return <Step8Specializations onNext={onNext} />;
    case 6: return <Step9Area onNext={onNext} />;
    case 7: return <Step11Availability onNext={onNext} />;
    case 8: return <Step12Menu onNext={onNext} />;
    case 9: return <Step13Portfolio onNext={onNext} />;
    case 10: return <Step14Review onNext={onNext} />;
    default: return null;
  }
}

export interface StepProps { onNext: () => void; }
