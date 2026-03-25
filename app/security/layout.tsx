import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security - LeadFlow | Data Protection & Privacy",
  description: "Learn how LeadFlow protects your data with enterprise-grade security, encryption, and compliance standards.",
  openGraph: {
    title: "Security - LeadFlow",
    description: "Enterprise-grade security for your cold email automation. Encryption, access controls, and compliance.",
    url: "https://tryleadflow.ai/security",
  },
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
