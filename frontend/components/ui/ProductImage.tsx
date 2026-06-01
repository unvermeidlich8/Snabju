interface ProductImageProps {
  swatch?: string;
  tag?: string | null;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
}

export function ProductImage({ swatch = '#e8e3d8', tag, size = 'md', imageUrl }: ProductImageProps) {
  const h = size === 'sm' ? 92 : size === 'lg' ? 220 : 132;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: h,
        borderRadius: 12,
        background: swatch,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      {!imageUrl && (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 8px, rgba(0,0,0,0.04) 8px 9px)' }}
        />
      )}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
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
