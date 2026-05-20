import type { Mode } from '@/lib/types';

export function ModeChip({ mode }: { mode: Mode }) {
  const isB2B = mode === 'b2b';
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-[0.3px] font-mono uppercase ${
        isB2B ? 'bg-ink text-white' : 'bg-accent-soft text-accent-dk'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isB2B ? 'bg-accent' : 'bg-accent-dk'}`} />
      {isB2B ? 'B2B · опт' : 'Розница'}
    </div>
  );
}