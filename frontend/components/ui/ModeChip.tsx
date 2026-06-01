'use client';

import { useMode } from '@/providers/ModeProvider';

export function ModeChip() {
  const { mode, setMode } = useMode();
  const isB2B = mode === 'b2b';
  return (
    <button
      onClick={() => setMode(isB2B ? 'b2c' : 'b2b')}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-[0.3px] font-mono uppercase cursor-pointer active:scale-95 transition-transform ${
        isB2B ? 'bg-ink text-white' : 'bg-accent-soft text-accent-dk'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isB2B ? 'bg-accent' : 'bg-accent-dk'}`} />
      {isB2B ? 'B2B · опт' : 'Розница'}
    </button>
  );
}
