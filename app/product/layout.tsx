import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product - LeadFlow | How AI Cold Email Automation Works",
  description: "See how LeadFlow works. Automate cold email outreach, manage replies in a unified inbox, sync leads to your CRM, and scale B2B sales with AI.",
  openGraph: {
    title: "Product - LeadFlow | How AI Cold Email Automation Works",
    description: "See how LeadFlow works. Automate cold email outreach, manage replies in a unified inbox, sync leads to your CRM, and scale B2B sales.",
    url: "https://tryleadflow.ai/product",
  },
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
