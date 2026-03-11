import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - LeadFlow',
  description: 'Access your LeadFlow account to manage cold email campaigns and track replies.',
  robots: 'noindex, nofollow',
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
