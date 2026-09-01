export const dynamic = 'force-dynamic';
import '../global.scss';
import { ReactNode } from 'react';
import { Archivo, IBM_Plex_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { Metadata } from 'next';

// Three roles, deliberately: Archivo carries the display voice (wide, tight,
// poster-like), Jakarta matches the app behind the login so the two never feel
// like different products, and Plex Mono sets times and labels - the schedule
// is the subject, so its typeface comes from the subject.
const archivo = Archivo({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-display',
});

const jakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-body',
});

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'FDG Workspace',
  description:
    'Track what FDG is building for you, approve content before it goes out, and see every deadline in one place.',
};

// A separate root layout from (app): this page is public, so it must not pull
// in the app's auth, user or organisation context.
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
      <body
        className={`${archivo.variable} ${jakarta.variable} ${plexMono.variable} bg-[#0B0B0F] text-[#EDEBE6] antialiased`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {children}
      </body>
    </html>
  );
}
