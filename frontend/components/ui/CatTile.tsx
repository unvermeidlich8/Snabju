import type { Category } from '@/lib/types';
import { CatIcon } from './CatIcon';

interface CatTileProps {
  cat: Category;
  onClick: () => void;
}

export function CatTile({ cat, onClick }: CatTileProps) {
  return (
    <button onClick={onClick} className="flex flex-col gap-2 text-left" style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: '1.1 / 1',
          borderRadius: 14,
          background: cat.swatch,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(0,0,0,0.05) 6px 7px)' }}
        />
        <div
          className="absolute left-2.5 top-2.5 grid place-items-center"
          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.7)' }}
        >
          <CatIcon kind={cat.icon} color="#1a1a1a" size={18} />
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="text-[13px] font-semibold text-ink leading-tight">{cat.title}</div>
        <div className="text-[11px] text-muted font-mono">{cat.count} SKU</div>
      </div>
    </button>
  );
}
