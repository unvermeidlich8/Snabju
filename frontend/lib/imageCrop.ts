export type ImageCrop = {
  src: string;
  scale: number;
  offsetX: number;
  offsetY: number;
};

const marker = '#snabju-crop=';

export function readImageCrop(value?: string): ImageCrop {
  if (!value) return { src: '', scale: 1, offsetX: 0, offsetY: 0 };
  const [src, encoded] = value.split(marker, 2);
  if (!encoded) return { src, scale: 1, offsetX: 0, offsetY: 0 };

  const params = new URLSearchParams(encoded);
  const number = (key: string, fallback: number) => {
    const parsed = Number(params.get(key));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    src,
    scale: Math.min(2.5, Math.max(0.5, number('scale', 1))),
    offsetX: Math.min(50, Math.max(-50, number('x', 0))),
    offsetY: Math.min(50, Math.max(-50, number('y', 0))),
  };
}

export function writeImageCrop({ src, scale, offsetX, offsetY }: ImageCrop): string {
  if (!src) return '';
  if (scale === 1 && offsetX === 0 && offsetY === 0) return src;
  return `${src}${marker}scale=${scale.toFixed(2)}&x=${Math.round(offsetX)}&y=${Math.round(offsetY)}`;
}
