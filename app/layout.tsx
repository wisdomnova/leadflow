import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LogoutProvider } from "@/components/providers/LogoutProvider";
import Script from "next/script";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tryleadflow.ai"),
  title: "LeadFlow - AI Cold Email Automation for Sales Teams",
  description: "Scale outbound with AI. LeadFlow automates cold email campaigns, unifies inbox management, syncs with CRM, and generates qualified leads without manual work.",
  keywords: ["cold email", "email automation", "outreach software", "sales automation", "lead generation", "AI email", "sales engagement"],
  authors: [{ name: "LeadFlow", url: "https://tryleadflow.ai" }],
  creator: "LeadFlow",
  publisher: "LeadFlow",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "og:locale": "en_US",
    "og:site_name": "LeadFlow",
  },
  openGraph: {
    title: "LeadFlow - AI Cold Email Automation for Sales Teams",
    description: "Scale outbound with AI. LeadFlow automates cold email campaigns, unifies inbox management, syncs with CRM, and generates qualified leads.",
    type: "website",
    url: "https://tryleadflow.ai",
    siteName: "LeadFlow",
    locale: "en_US",
    images: [
      {
        url: "https://tryleadflow.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "LeadFlow - AI Cold Email Automation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadFlow - AI Cold Email Automation",
    description: "Automate cold email, manage replies, sync to CRM. Scale B2B outreach with AI.",
    site: "@tryleadflow",
    creator: "@tryleadflow",
    images: {
      url: "https://tryleadflow.ai/og-image.png",
      alt: "LeadFlow",
    },
  },
  verification: {
    google: "Lo08LJJpwR7kcsKKwSmhnJv3FA-FAAk6uBCnlM0x4Bo",
  },
  category: "Business",
  applicationName: "LeadFlow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="canonical" href="https://tryleadflow.ai" />
        <link rel="alternate" hrefLang="en" href="https://tryleadflow.ai" />
        <meta name="theme-color" content="#745DF3" />
        <meta name="msapplication-TileColor" content="#745DF3" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LeadFlow" />
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WTW623SS');`,
          }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WTW623SS"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <LogoutProvider>{children}</LogoutProvider>
      </body>
    </html>
  );
}
