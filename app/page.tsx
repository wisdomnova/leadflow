import { Metadata } from 'next';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustSection from '@/components/TrustSection';
import FeaturesSection from '@/components/FeaturesSection';
import PricingSection from '@/components/PricingSection';
import AffiliateSection from '@/components/AffiliateSection';
import IntegrationsSection from '@/components/IntegrationsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';
import CTASection from '@/components/CTASection';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'LeadFlow - AI Cold Email Automation for Sales Teams',
  description: 'Scale B2B outreach with LeadFlow. Automate cold email campaigns, manage replies in unified inbox, sync with CRM, and close more deals. AI-powered cold email platform.',
  openGraph: {
    title: 'LeadFlow - AI Cold Email Automation',
    description: 'Automate cold email, inbox management, and CRM syncing. Scale B2B outreach without manual work.',
    type: 'website',
    url: 'https://tryleadflow.ai',
  },
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://tryleadflow.ai/#organization',
        name: 'LeadFlow',
        url: 'https://tryleadflow.ai',
        logo: 'https://tryleadflow.ai/leadflow-black.png',
        description: 'AI-powered cold email automation platform for B2B sales teams',
        sameAs: ['https://twitter.com/tryleadflow', 'https://linkedin.com/company/tryleadflow'],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
          email: 'contact@tryleadflow.ai',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://tryleadflow.ai/#website',
        url: 'https://tryleadflow.ai',
        name: 'LeadFlow',
        description: 'AI Cold Email Automation for Sales Teams',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://tryleadflow.ai/search?q={search_term_string}',
          },
          query_input: 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <div className='min-h-screen bg-[#FBFBFB]'>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
