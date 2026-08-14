interface ProductImageProps {
  swatch?: string;
  tag?: string | null;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
  presentation?: 'card' | 'hero';
}

import { readImageCrop } from '@/lib/imageCrop';

export function ProductImage({ tag, imageUrl, presentation = 'card' }: ProductImageProps) {
  const crop = readImageCrop(imageUrl);
  const isHero = presentation === 'hero';
  const shouldContain = isHero || crop.scale <= 1;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: isHero ? '4 / 3' : '1 / 1',
        borderRadius: 12,
        background: 'transparent',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      {!imageUrl && (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 8px, rgba(0,0,0,0.04) 8px 9px)' }}
        />
      )}
      {crop.src && (
        <img
          src={crop.src}
          alt=""
          className={`absolute inset-0 w-full h-full ${shouldContain ? 'object-contain' : 'object-cover'}`}
          style={{ transform: `translate(${crop.offsetX}%, ${crop.offsetY}%) scale(${crop.scale})` }}
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
