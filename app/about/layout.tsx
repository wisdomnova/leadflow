import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About LeadFlow - Cold Email Automation Platform',
  description: "Learn about LeadFlow's mission to help sales teams scale B2B outreach with AI-powered cold email automation without manual work.",
  openGraph: {
    title: 'About LeadFlow',
    description: 'Discover how LeadFlow helps sales teams automate cold email and scale outreach.',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
