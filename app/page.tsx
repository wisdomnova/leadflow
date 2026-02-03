import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustSection from "@/components/TrustSection";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import AffiliateSection from "@/components/AffiliateSection";
import IntegrationsSection from "@/components/IntegrationsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      <Navbar />
      <Hero />
      <TrustSection />
      <FeaturesSection />
      <PricingSection />
      <IntegrationsSection />
      <TestimonialsSection />
      <AffiliateSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
