import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"], 
});

export const metadata: Metadata = {
  title: "Leadflow - B2B Cold Email Automation Platform",
  description: "LeadFlow is a B2B SaaS platform for automated, high-conversion cold email campaigns. Find, contact, and convert leads at scale with minimal manual effort.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${raleway.variable} antialiased font-sans`}
      >
        {children} 
      </body>
    </html>
  );
}