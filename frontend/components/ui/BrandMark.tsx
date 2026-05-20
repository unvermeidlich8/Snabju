interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 22 }: BrandMarkProps) {
  return (
    <div
      className="inline-flex items-baseline gap-1 font-sans font-extrabold text-ink"
      style={{ fontSize: size, letterSpacing: '-0.8px' }}
    >
      <span
        className="inline-block bg-accent self-center"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: 4,
          transform: 'translateY(1px)',
        }}
      />
      snabju
    </div>
  );
}