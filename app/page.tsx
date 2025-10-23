import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { AboutSection } from "@/components/landing/about-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="about">
        <AboutSection />
      </div>
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      <div id="contact">
        <CTASection />
      </div>
      <Footer />
    </main>
  );
}