const swatchByCat: Record<string, string> = {
  mineral:  '#d8c9a8',
  foam:     '#f1ece1',
  xps:      '#cf8f5e',
  pur:      '#ffd17a',
  sealants: '#c4d8d2',
  tape:     '#e8dcc4',
  membrane: '#a8b0a4',
  tools:    '#d6d2cb',
};

interface ProductImageProps {
  cat: string;
  tag?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductImage({ cat, tag, size = 'md' }: ProductImageProps) {
  const h = size === 'sm' ? 92 : size === 'lg' ? 220 : 132;
  const bg = swatchByCat[cat] ?? '#e8e3d8';

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: h,
        borderRadius: 12,
        background: bg,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 8px, rgba(0,0,0,0.04) 8px 9px)' }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.5px]"
        style={{ color: 'rgba(0,0,0,0.45)' }}
      >
        product · {cat}
      </div>
      {tag && (
        <div
          className="absolute left-2 top-2 px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono text-white"
          style={{ background: tag.startsWith('−') ? '#ff6a13' : '#1a1a1a' }}
        >
          {tag}
        </div>
      )}
    </div>
  );
}
