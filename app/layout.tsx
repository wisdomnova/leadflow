import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"], 
});

export const metadata: Metadata = {
  title: "Leadflow - B2B Cold Email Automation Platform",
  description: "LeadFlow is a B2B SaaS platform for automated, high-conversion cold email campaigns. Find, contact, and convert leads at scale with minimal manual effort.",
};

// 🎯 Loading fallback for Suspense
function LayoutLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}
 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) { 
  return (
    <html lang="en">
      <head>
        {/* 🎯 Wrap GoogleAnalytics in Suspense */}
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
      </head> 
      <body
        className={`${raleway.variable} antialiased font-sans`}
      >
        {/* 🎯 Wrap children in Suspense to handle any useSearchParams usage */}
        <Suspense fallback={<LayoutLoading />}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}

// 🎯 Force dynamic rendering
export const dynamic = 'force-dynamic'