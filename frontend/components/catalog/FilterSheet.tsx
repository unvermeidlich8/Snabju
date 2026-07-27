'use client';

import { Btn } from '@/components/ui/Btn';

interface FilterSheetProps {
  brands: string[];
  active: string[];
  onClose: () => void;
  onApply: (filters: string[]) => void;
}

function FilterGroup({ title, items, active, onToggle }: {
  title: string; items: string[]; active: string[]; onToggle: (tag: string) => void;
}) {
  return (
    <div className="px-4 py-3.5 border-b border-divider">
      <div className="text-[11px] text-muted font-mono tracking-[0.5px] uppercase mb-2.5">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map(v => {
          const on = active.includes(v);
          return (
            <button
              key={v}
              onClick={() => onToggle(v)}
              className="px-3 py-2 rounded-full text-[13px] font-medium cursor-pointer border"
              style={{ background: on ? '#1a1a1a' : '#fff', color: on ? '#fff' : '#3c3833', borderColor: on ? '#1a1a1a' : '#e7e3da' }}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterSheet({ brands, active, onClose, onApply }: FilterSheetProps) {
  const toggle = (tag: string) => {
    onApply(active.includes(tag) ? active.filter(x => x !== tag) : [...active, tag]);
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(20,18,15,0.4)', backdropFilter: 'blur(2px)' }}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-brand w-full overflow-y-auto"
        style={{ borderRadius: '20px 20px 0 0', maxHeight: '80vh', paddingBottom: 80 }}
      >
        <div className="grid place-items-center py-2">
          <div className="w-9 h-1 rounded-sm bg-divider" />
        </div>
        <div className="px-4 py-1 flex justify-between items-center">
          <h3 className="text-xl font-bold text-ink m-0" style={{ letterSpacing: '-0.4px' }}>Фильтры</h3>
          <button onClick={() => onApply([])} className="text-[13px] text-muted cursor-pointer">Сбросить</button>
        </div>
        <FilterGroup title="Бренд" items={brands} active={active} onToggle={toggle} />
        <div className="fixed bottom-0 left-0 right-0 bg-brand p-4 border-t border-divider" onClick={e => e.stopPropagation()}>
          <Btn full size="lg" onClick={onClose}>Применить</Btn>
        </div>
      </div>
    </div>
  );
}
