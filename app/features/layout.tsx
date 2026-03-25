import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features - LeadFlow | AI Cold Email Automation Platform",
  description: "Explore LeadFlow features: unified inbox, native CRM, AI-powered sequences, email warmup, team collaboration, and advanced analytics for B2B outreach.",
  openGraph: {
    title: "Features - LeadFlow | AI Cold Email Automation Platform",
    description: "Explore LeadFlow features: unified inbox, native CRM, AI-powered sequences, email warmup, team collaboration, and advanced analytics.",
    url: "https://tryleadflow.ai/features",
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
