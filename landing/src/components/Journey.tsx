import {
  Check,
  Code,
  MagnifyingGlass,
  SquaresFour,
} from "@phosphor-icons/react";
import type { JourneyStepId } from "../content";
import { journeySteps } from "../content";

const icons = {
  plan: SquaresFour,
  implement: Code,
  validate: Check,
  diagnose: MagnifyingGlass,
};

interface JourneyProps {
  activeStep: JourneyStepId;
  onChange: (step: JourneyStepId) => void;
}

export function Journey({ activeStep, onChange }: JourneyProps) {
  return (
    <section className="journey" id="how-it-works" aria-label="Как работает агент">
      <div className="container">
        <div className="journey-track" role="tablist" aria-label="Этапы интеграции">
          {journeySteps.map((step) => {
            const Icon = icons[step.id];
            const isActive = activeStep === step.id;

            return (
              <button
                className={`journey-step${isActive ? " is-active" : ""}`}
                key={step.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="workspace-panel"
                onClick={() => onChange(step.id)}
              >
                <span className="journey-icon">
                  <Icon aria-hidden size={25} weight={isActive ? "bold" : "regular"} />
                </span>
                <strong>
                  {journeySteps.findIndex((item) => item.id === step.id) + 1}.{" "}
                  {step.title}
                </strong>
                <span>{step.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
