'use client';

import React, { FC } from 'react';

/**
 * FDG Workspace wordmark.
 *
 * Typographic rather than a mark: "FDG" set tight in the display face, with
 * WORKSPACE letterspaced beneath it in mono - the same mono the product uses
 * for times, so the wordmark and the schedule share a voice. Replace this with
 * FDG's real asset when it exists and every screen updates at once.
 */
export const WorkspaceBrand: FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => {
  const large = size === 'lg';

  return (
    <div className="flex flex-col select-none leading-none">
      <span
        className={`${large ? 'text-[30px]' : 'text-[19px]'} font-[700] tracking-[-0.04em]`}
        style={{ fontFamily: 'var(--font-display, inherit)' }}
      >
        FDG
      </span>
      <span
        className={`${
          large ? 'text-[11px] mt-[6px]' : 'text-[9px] mt-[4px]'
        } tracking-[0.34em] text-[#B69DEC] uppercase`}
        style={{ fontFamily: 'var(--font-mono, inherit)' }}
      >
        Workspace
      </span>
    </div>
  );
};
