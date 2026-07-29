import { useState } from "react";
import type { JourneyStepId } from "./content";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Installation } from "./components/Installation";
import { Journey } from "./components/Journey";
import { Skills } from "./components/Skills";
import { Sources } from "./components/Sources";
import { WorkspaceDemo } from "./components/WorkspaceDemo";

export function App() {
  const [activeStep, setActiveStep] = useState<JourneyStepId>("implement");

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Journey activeStep={activeStep} onChange={setActiveStep} />
        <WorkspaceDemo activeStep={activeStep} />
        <Skills />
        <Installation />
        <Sources />
      </main>
      <Footer />
    </>
  );
}
