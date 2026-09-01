'use client';

import React, { FC } from 'react';

/**
 * FDG Workspace wordmark.
 *
 * Deliberately typographic rather than an invented logo - swap the mark below
 * for FDG's real asset when you have it, and every screen that uses this
 * component updates at once.
 */
export const WorkspaceBrand: FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => {
  const large = size === 'lg';

  return (
    <div className="flex items-center gap-[10px] select-none">
      <div
        className={`${
          large ? 'w-[44px] h-[44px] text-[18px]' : 'w-[32px] h-[32px] text-[13px]'
        } rounded-[10px] bg-[#612BD3] text-white font-[600] flex items-center justify-center shrink-0`}
      >
        FDG
      </div>
      <div className="flex flex-col leading-tight min-w-0">
        <span
          className={`${
            large ? 'text-[22px]' : 'text-[16px]'
          } font-[600] truncate`}
        >
          FDG Workspace
        </span>
        {large && (
          <span className="text-[13px] text-white/50 truncate">
            Projects, clients and social in one place
          </span>
        )}
      </div>
    </div>
  );
};
