export const dynamic = 'force-dynamic';
import '../global.scss';
import { ReactNode } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Metadata } from 'next';

const jakartaSans = Plus_Jakarta_Sans({
  weight: ['600', '500', '400'],
  style: ['normal'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FDG Workspace',
  description:
    'Projects, clients and social media scheduling for FDG, in one place.',
};

// A separate root layout from (app): the landing page is public, so it must not
// pull in the app's auth, user or organisation context.
export default async function LandingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${jakartaSans.className} bg-[#0E0E0E] text-white`}>
        {children}
      </body>
    </html>
  );
}
