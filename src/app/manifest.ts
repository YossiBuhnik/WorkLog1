import type { MetadataRoute } from 'next';

// Makes the site installable as a phone app ("Add to Home Screen"), with the TSK logo as its icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TSK - יומן עבודה',
    short_name: 'TSK',
    description: 'דיווח משמרות, חופשות, מחלה, מילואים וקופה קטנה',
    lang: 'he',
    dir: 'rtl',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#254E7B',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
