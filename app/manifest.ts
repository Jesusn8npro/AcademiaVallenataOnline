import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Academia Vallenata Online',
    short_name: 'AcademiaVallenata',
    description: 'La Academia #1 de Acordeón Vallenato online. Aprende con el simulador gaming más avanzado.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0a1e',
    theme_color: '#8b5cf6',
    orientation: 'portrait-primary',
    categories: ['education', 'music'],
    icons: [
      { src: '/iconos-pwa/icon-72x72.svg', sizes: '72x72', type: 'image/svg+xml' },
      { src: '/iconos-pwa/icon-96x96.svg', sizes: '96x96', type: 'image/svg+xml' },
      { src: '/iconos-pwa/icon-128x128.svg', sizes: '128x128', type: 'image/svg+xml' },
      { src: '/iconos-pwa/icon-144x144.svg', sizes: '144x144', type: 'image/svg+xml' },
      { src: '/iconos-pwa/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
      { src: '/iconos-pwa/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'maskable' },
      { src: '/iconos-pwa/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/iconos-pwa/icon-384x384.svg', sizes: '384x384', type: 'image/svg+xml' },
      { src: '/iconos-pwa/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
      { src: '/iconos-pwa/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
