import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LogoutProvider } from "@/components/providers/LogoutProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "LeadFlow",
  description: "LeadFlow - AI-powered cold email automation platform",
  keywords: ["leadflow", "cold email", "outreach", "automation", "AI"],
  authors: [{ name: "LeadFlow" }],
  openGraph: {
    title: "LeadFlow",
    description: "LeadFlow - AI-powered cold email automation platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <LogoutProvider>
          {children}
        </LogoutProvider>
      </body>
    </html>
  );
}
