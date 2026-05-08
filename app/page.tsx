import { LandingNav } from "@/components/landing/nav";
import { LandingHero, FeatureGrid, ComparisonStrip, CTAStrip, LandingFooter } from "@/components/landing/hero";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <FeatureGrid />
        <ComparisonStrip />
        <CTAStrip />
      </main>
      <LandingFooter />
    </div>
  );
}
