import Link from 'next/link';
import { WorkspaceBrand } from '@gitroom/frontend/components/workspace/workspace.brand';

const FEATURES = [
  {
    title: 'Projects and tasks',
    body: 'Every client’s work on one board — To do, In progress, Review, Done — with deadlines and priorities that are visible at a glance.',
  },
  {
    title: 'Client portal',
    body: 'Clients log in and see exactly where their work stands, in real time. No status emails, no chasing.',
  },
  {
    title: 'Social scheduling',
    body: 'Connect a client’s channels once, then create, approve, schedule and publish to 35+ platforms without leaving the workspace.',
  },
];

export default async function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-[20px] sm:px-[40px] py-[20px] flex items-center justify-between gap-[16px] border-b border-white/10">
        <WorkspaceBrand />
        <Link
          href="/auth/login"
          className="px-[20px] h-[40px] rounded-[8px] bg-[#612BD3] hover:bg-[#5520CB] transition-colors text-[14px] font-[600] flex items-center shrink-0"
        >
          Log in
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-[20px] sm:px-[40px]">
        <section className="w-full max-w-[860px] pt-[64px] sm:pt-[96px] pb-[48px] text-center">
          <h1 className="text-[34px] sm:text-[52px] font-[600] leading-[1.15]">
            Everything FDG does,
            <br className="hidden sm:block" /> in one place.
          </h1>
          <p className="mt-[20px] text-[16px] sm:text-[18px] text-white/60 leading-[1.7] max-w-[620px] mx-auto">
            Projects, deadlines, client updates, approvals and social media
            scheduling — replacing the handful of tools that never quite talked
            to each other.
          </p>
          <div className="mt-[32px] flex flex-col sm:flex-row gap-[12px] justify-center">
            <Link
              href="/auth/login"
              className="px-[24px] h-[48px] rounded-[8px] bg-[#612BD3] hover:bg-[#5520CB] transition-colors text-[15px] font-[600] flex items-center justify-center"
            >
              Log in to your account
            </Link>
            <a
              href="mailto:hello@fdg.agency"
              className="px-[24px] h-[48px] rounded-[8px] bg-white/10 hover:bg-white/15 transition-colors text-[15px] font-[600] flex items-center justify-center"
            >
              Request access
            </a>
          </div>
        </section>

        <section className="w-full max-w-[1040px] pb-[80px] grid grid-cols-1 md:grid-cols-3 gap-[16px]">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#1A1919] border border-white/10 rounded-[12px] p-[24px] flex flex-col gap-[8px]"
            >
              <h2 className="text-[16px] font-[600]">{feature.title}</h2>
              <p className="text-[14px] text-white/60 leading-[1.7]">
                {feature.body}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="px-[20px] sm:px-[40px] py-[24px] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-[12px] text-[13px] text-white/40">
        <span>© {new Date().getFullYear()} FDG</span>
        <Link href="/auth/login" className="hover:text-white transition-colors">
          Log in
        </Link>
      </footer>
    </div>
  );
}
