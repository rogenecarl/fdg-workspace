import { getT } from '@gitroom/react/translation/get.translation.service.backend';

export const dynamic = 'force-dynamic';
import { ReactNode } from 'react';
import loadDynamic from 'next/dynamic';
import { WorkspaceBrand } from '@gitroom/frontend/components/workspace/workspace.brand';
const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getT();

  return (
    <div className="bg-[#0E0E0E] flex flex-1 p-[12px] gap-[12px] min-h-screen w-screen text-white">
      {/*<style>{`html, body {overflow-x: hidden;}`}</style>*/}
      <ReturnUrlComponent />
      <div className="flex flex-col py-[40px] px-[20px] flex-1 lg:w-[600px] lg:flex-none rounded-[12px] text-white p-[12px] bg-[#1A1919]">
        <div className="w-full max-w-[440px] mx-auto justify-center gap-[20px] h-full flex flex-col text-white">
          <WorkspaceBrand size="lg" />
          <div className="flex">{children}</div>
        </div>
      </div>
      {/* FDG Workspace: replaces the upstream Postiz testimonial panel. */}
      <div className="flex-1 pt-[88px] px-[40px] hidden lg:flex flex-col items-center">
        <div className="max-w-[520px] w-full flex flex-col gap-[32px]">
          <div className="text-[36px] leading-[1.2] font-[600]">
            Everything FDG does,
            <br />
            in one place.
          </div>
          <div className="text-[16px] text-white/50 leading-[1.7]">
            Projects, deadlines, client updates, approvals and social media
            scheduling — without juggling five different tools.
          </div>
          <div className="flex flex-col gap-[12px]">
            {[
              'Track every client project on one board',
              'Clients see their progress in real time',
              'Schedule and publish to 35+ social platforms',
            ].map((line) => (
              <div key={line} className="flex items-start gap-[12px]">
                <span className="w-[20px] h-[20px] rounded-full bg-[#612BD3] flex items-center justify-center text-[12px] shrink-0 mt-[2px]">
                  ✓
                </span>
                <span className="text-[15px] text-white/70">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
