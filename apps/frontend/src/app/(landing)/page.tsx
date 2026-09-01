import Link from 'next/link';
import { WorkspaceBrand } from '@gitroom/frontend/components/workspace/workspace.brand';

// The agenda is the page's argument: this is what a day inside FDG looks like.
// `at` is a real clock position so the "now" rule can sit correctly between
// entries rather than at an arbitrary offset.
const AGENDA = [
  { at: '09:00', client: 'Northside Dental', what: '3 posts scheduled' },
  { at: '11:30', client: 'Acme Ltd', what: 'Homepage copy in review' },
  { at: '14:00', client: 'Riverside Gym', what: 'Q3 campaign approved' },
  { at: '16:15', client: 'Acme Ltd', what: 'Contract signed' },
];

const COVERS = [
  ['Projects', 'Boards, deadlines and who owns what'],
  ['Client portal', 'Clients watch their own work progress'],
  ['Social', 'Draft, approve and publish to 35+ channels'],
  ['Contracts', 'Agreements and signatures in the same place'],
];

const mono = { fontFamily: 'var(--font-mono)' };
const display = { fontFamily: 'var(--font-display)' };

export default async function LandingPage() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-[24px] sm:px-[48px] h-[88px] flex items-center justify-between gap-[16px]">
        <WorkspaceBrand />
        <Link
          href="/auth/login"
          className="h-[40px] px-[22px] rounded-full border border-[#23232C] hover:border-[#B69DEC] hover:text-[#B69DEC] transition-colors text-[13px] font-[500] flex items-center shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B69DEC]"
        >
          Log in
        </Link>
      </header>

      <main className="flex-1 px-[24px] sm:px-[48px] pb-[64px]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,420px)] gap-[48px] lg:gap-[72px] items-start pt-[40px] lg:pt-[80px]">
          {/* Thesis */}
          <div className="max-w-[620px]">
            <p
              className="text-[11px] tracking-[0.28em] uppercase text-[#B69DEC]"
              style={mono}
            >
              FDG client workspace
            </p>

            <h1
              className="mt-[24px] text-[42px] sm:text-[64px] leading-[0.98] tracking-[-0.045em] font-[700]"
              style={display}
            >
              The workspace
              <br />
              where your
              <br />
              projects live.
            </h1>

            <p className="mt-[28px] text-[17px] leading-[1.65] text-[#EDEBE6]/55 max-w-[480px]">
              Track what we&rsquo;re building for you, approve content before it
              goes out, and see every deadline without asking anyone.
            </p>

            <div className="mt-[36px] flex flex-col sm:flex-row gap-[12px]">
              <Link
                href="/auth/login"
                className="h-[52px] px-[30px] rounded-full bg-[#612BD3] hover:bg-[#5520CB] transition-colors text-[15px] font-[600] text-white flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B69DEC]"
              >
                Log in
              </Link>
              <a
                href="mailto:hello@fdg.agency"
                className="h-[52px] px-[30px] rounded-full border border-[#23232C] hover:border-[#EDEBE6]/40 transition-colors text-[15px] font-[500] flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B69DEC]"
              >
                Ask FDG for access
              </a>
            </div>
          </div>

          {/* Signature: a day inside the agency */}
          <div className="w-full rounded-[16px] border border-[#23232C] bg-[#14141A] overflow-hidden">
            <div className="px-[20px] py-[14px] border-b border-[#23232C] flex items-baseline justify-between gap-[12px]">
              <span
                className="text-[10px] tracking-[0.28em] uppercase text-[#EDEBE6]/40"
                style={mono}
              >
                Today
              </span>
              <span className="text-[12px] text-[#EDEBE6]/40 truncate" style={mono}>
                {today}
              </span>
            </div>

            <ol className="p-[8px]">
              {AGENDA.map((entry, index) => (
                <li key={entry.at}>
                  {/* The now rule: a calendar's current-time marker, sitting
                      between entries. It is what makes the panel read as a
                      running system rather than an illustration. */}
                  {index === 2 && (
                    <div
                      className="flex items-center gap-[10px] px-[12px] py-[10px]"
                      aria-hidden="true"
                    >
                      <span className="w-[6px] h-[6px] rounded-full bg-[#612BD3] shrink-0" />
                      <span className="h-[1px] flex-1 bg-[#612BD3]/40" />
                      <span
                        className="text-[10px] tracking-[0.2em] uppercase text-[#612BD3]"
                        style={mono}
                      >
                        Now
                      </span>
                    </div>
                  )}

                  <div className="flex gap-[16px] px-[12px] py-[13px] rounded-[10px] hover:bg-[#EDEBE6]/[0.03] transition-colors">
                    <span
                      className="text-[12px] text-[#EDEBE6]/40 pt-[2px] tabular-nums shrink-0"
                      style={mono}
                    >
                      {entry.at}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-[600] truncate">
                        {entry.client}
                      </span>
                      <span className="block text-[13px] text-[#EDEBE6]/45 truncate">
                        {entry.what}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* What the workspace covers — a list, not a card grid. */}
        <div className="max-w-[1200px] mx-auto mt-[80px] lg:mt-[120px] border-t border-[#23232C]">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {COVERS.map(([term, detail]) => (
              <div
                key={term}
                className="py-[28px] sm:pe-[32px] border-b sm:border-b-0 border-[#23232C] last:border-b-0"
              >
                <dt className="text-[15px] font-[600]">{term}</dt>
                <dd className="mt-[6px] text-[14px] leading-[1.6] text-[#EDEBE6]/45">
                  {detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </main>

      <footer className="px-[24px] sm:px-[48px] py-[28px] border-t border-[#23232C] flex flex-col sm:flex-row items-center justify-between gap-[10px]">
        <span className="text-[12px] text-[#EDEBE6]/35" style={mono}>
          © {new Date().getFullYear()} FDG
        </span>
        <Link
          href="/auth/login"
          className="text-[12px] text-[#EDEBE6]/35 hover:text-[#B69DEC] transition-colors"
          style={mono}
        >
          Log in
        </Link>
      </footer>
    </div>
  );
}
