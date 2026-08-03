import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Snabju — управление заказами',
    short_name: 'Snabju',
    start_url: '/admin/orders',
    display: 'standalone',
    background_color: '#faf9f7',
    theme_color: '#1a1a1a',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
