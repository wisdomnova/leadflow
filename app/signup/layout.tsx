import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account - LeadFlow',
  description: 'Sign up for LeadFlow and start automating cold email campaigns in minutes.',
  robots: 'noindex, nofollow',
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
