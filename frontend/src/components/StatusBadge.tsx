import clsx from 'clsx';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold border',
        {
          'border-emerald-200 bg-emerald-50 text-emerald-700': tone === 'success',
          'border-amber-200 bg-amber-50 text-amber-700': tone === 'warning',
          'border-rose-200 bg-rose-50 text-rose-700': tone === 'danger',
          'border-sky-200 bg-sky-50 text-sky-700': tone === 'info',
          'border-slate-200 bg-slate-100 text-slate-700': tone === 'neutral',
        },
      )}
    >
      {label}
    </span>
  );
}
