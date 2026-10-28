import { Footer } from '../components/Footer';
import { LandingNav } from './landing/LandingNav';
import { Hero } from './landing/Hero';
import { PlatformPreview } from './landing/PlatformPreview';
import {
  TelemetryFeature, SimulatorFeature, EngineerFeature, DrivingStateFeature, SeasonFeature, StrategyFeature,
} from './landing/Features';
import { Pipeline, HowItWorks, FinalCta } from './landing/Closing';

// Public entry point for logged-out visitors (see RootIndex in App.tsx). Every product
// preview on it renders a real recorded session (landing/snapshot.json) or the live
// season data, and says which.
export default function LandingPage() {
  return (
    <div id="top" className="min-h-screen w-full overflow-x-hidden bg-[#050505] text-[#F5F5F5] antialiased">
      <a href="#platform" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[#E10600] focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <LandingNav />
      <main>
        <Hero />
        <PlatformPreview />
        <TelemetryFeature />
        <SimulatorFeature />
        <EngineerFeature />
        <DrivingStateFeature />
        <SeasonFeature />
        <StrategyFeature />
        <Pipeline />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
