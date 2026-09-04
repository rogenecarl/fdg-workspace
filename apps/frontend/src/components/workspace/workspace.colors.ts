/**
 * Semantic colours for workspace statuses and priorities.
 *
 * Follows the pattern in announcement.banner.tsx: a lookup record of Tailwind
 * palette classes rather than hardcoded hex. Badges use a translucent tint plus
 * solid coloured text so they read correctly on both the light and dark
 * surfaces - a solid fill would need a different text colour per theme.
 *
 * The 500 weights are chosen because they carry enough contrast against
 * newBgColorInner in both themes (#1a1919 dark, #ffffff light).
 */

export type BadgeStyle = {
  /** Tint + text, for pill badges. */
  badge: string;
  /** Solid fill, for the small column indicator dots. */
  dot: string;
};

export const TASK_STATUS_STYLES: Record<string, BadgeStyle> = {
  TODO: {
    badge: 'bg-slate-500/15 text-slate-400',
    dot: 'bg-slate-400',
  },
  IN_PROGRESS: {
    badge: 'bg-blue-500/15 text-blue-400',
    dot: 'bg-blue-500',
  },
  REVIEW: {
    badge: 'bg-amber-500/15 text-amber-500',
    dot: 'bg-amber-500',
  },
  DONE: {
    badge: 'bg-emerald-500/15 text-emerald-500',
    dot: 'bg-emerald-500',
  },
};

export const TASK_PRIORITY_STYLES: Record<string, BadgeStyle> = {
  LOW: {
    badge: 'bg-emerald-500/15 text-emerald-500',
    dot: 'bg-emerald-500',
  },
  MEDIUM: {
    badge: 'bg-amber-500/15 text-amber-500',
    dot: 'bg-amber-500',
  },
  HIGH: {
    badge: 'bg-red-500/15 text-red-500',
    dot: 'bg-red-500',
  },
};

export const PROJECT_STATUS_STYLES: Record<string, BadgeStyle> = {
  PLANNING: {
    badge: 'bg-slate-500/15 text-slate-400',
    dot: 'bg-slate-400',
  },
  ACTIVE: {
    badge: 'bg-blue-500/15 text-blue-400',
    dot: 'bg-blue-500',
  },
  ON_HOLD: {
    badge: 'bg-amber-500/15 text-amber-500',
    dot: 'bg-amber-500',
  },
  COMPLETED: {
    badge: 'bg-emerald-500/15 text-emerald-500',
    dot: 'bg-emerald-500',
  },
};

/** Shared badge geometry, so every pill in the workspace matches. */
export const BADGE_BASE =
  'text-[11px] font-[600] px-[8px] py-[2px] rounded-[4px] whitespace-nowrap';

const NEUTRAL: BadgeStyle = {
  badge: 'bg-slate-500/15 text-slate-400',
  dot: 'bg-slate-400',
};

export const badgeStyle = (
  styles: Record<string, BadgeStyle>,
  key?: string
): BadgeStyle => (key && styles[key]) || NEUTRAL;

/**
 * A due date in the past on an unfinished task reads red; today or tomorrow
 * reads amber. Done tasks never warn - the deadline stopped mattering.
 */
export const dueDateStyle = (dueDate?: string, status?: string) => {
  if (!dueDate || status === 'DONE') {
    return 'text-textItemBlur';
  }

  const due = new Date(dueDate);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const dueDay = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate()
  ).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (dueDay < startOfToday) {
    return 'text-red-500 font-[600]';
  }

  if (dueDay <= startOfToday + oneDay) {
    return 'text-amber-500 font-[600]';
  }

  return 'text-textItemBlur';
};
