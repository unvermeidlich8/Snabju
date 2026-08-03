'use client';

import { useMode } from '@/providers/ModeProvider';

export function ModeChip() {
  useMode();
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-[0.3px] font-mono uppercase bg-ink text-white">
      <span className="w-1.5 h-1.5 rounded-full bg-accent" /> B2B · опт
    </div>
  );
}
