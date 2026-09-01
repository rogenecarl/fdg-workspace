export const dynamic = 'force-dynamic';
import { ReactNode } from 'react';
import loadDynamic from 'next/dynamic';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import { WorkspaceBrand } from '@gitroom/frontend/components/workspace/workspace.brand';

// The same display and mono faces the landing page uses, scoped to this screen
// so the two public surfaces share one voice. The app behind the login keeps
// its own type.
const archivo = Archivo({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-display',
});

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
});

const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className={`${archivo.variable} ${plexMono.variable} bg-[#0B0B0F] flex flex-1 p-[12px] gap-[12px] min-h-screen w-screen text-[#EDEBE6]`}
    >
      <ReturnUrlComponent />

      <div className="flex flex-col flex-1 lg:w-[560px] lg:flex-none rounded-[16px] border border-[#23232C] bg-[#14141A] py-[40px] px-[20px]">
        <div className="w-full max-w-[420px] mx-auto justify-center gap-[32px] h-full flex flex-col">
          <WorkspaceBrand size="lg" />
          <div className="flex">{children}</div>
        </div>
      </div>

      {/* FDG Workspace: replaces the upstream Postiz testimonial panel.
          The landing page carries the full agenda; this screen stays quiet -
          one statement and one detail. */}
      <div className="flex-1 hidden lg:flex flex-col justify-center px-[64px]">
        <div className="max-w-[520px]">
          <p
            className="text-[11px] tracking-[0.28em] uppercase text-[#B69DEC]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            FDG client workspace
          </p>

          <h2
            className="mt-[24px] text-[48px] leading-[0.98] tracking-[-0.045em] font-[700]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Your projects,
            <br />
            where you
            <br />
            left them.
          </h2>

          <div className="mt-[36px] flex items-center gap-[10px]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#612BD3] shrink-0" />
            <span className="h-[1px] w-[64px] bg-[#612BD3]/40" />
            <span
              className="text-[12px] text-[#EDEBE6]/40"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Everything still running
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
