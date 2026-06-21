/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'tbijzvtyyewhtwgakgka.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.b-cdn.net' },
      { protocol: 'https', hostname: 'iframe.mediadelivery.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      // Fotos de perfil de OAuth (Facebook)
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
      // Hosts externos donde el admin puede pegar URLs desde el wizard
      // (eventos, portadas de tutoriales, etc.). Si el admin pega una URL
      // desde un host NUEVO no listado aquí, next/image tira "Invalid src
      // prop" en runtime → agregalo a esta lista.
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: '**.imgur.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Comunidad: GIFs y banderas de geolocalización
      { protocol: 'https', hostname: 'media.tenor.com' },
      { protocol: 'https', hostname: 'media1.tenor.com' },
      { protocol: 'https', hostname: 'media2.tenor.com' },
      { protocol: 'https', hostname: 'media3.tenor.com' },
      { protocol: 'https', hostname: '**.giphy.com' },
      { protocol: 'https', hostname: 'flagcdn.com' },
      { protocol: 'https', hostname: '**.flagcdn.com' },
    ],
  },
  experimental: {
    // Tree-shaking agresivo: en vez de importar todo el paquete, Next.js
    // genera imports individuales por símbolo. Reduce bundle size 30-70%
    // en estos paquetes que tienden a tener "barrel files" enormes.
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      'recharts',
      '@react-three/drei',
      '@react-three/fiber',
      'three',
      'react-i18next',
      'i18next',
    ],
  },
  async headers() {
    return [
      {
        // Cache INMUTABLE (1 año) para los assets estáticos pesados de /public: modelos 3D, audio,
        // texturas, videos, decoder Draco e imágenes. Son archivos versionados por commit (al cambiar
        // uno se sube con nombre nuevo, p.ej. acordeon-...-v2), así que el navegador puede cachearlos
        // para siempre → cero round-trips de revalidación en recargas y sesiones nuevas (clave a escala
        // de lanzamiento: ~180MB de estáticos no se re-validan en cada visita). NO incluye el HTML ni
        // sw.js (quedan con la regla /(.*) sin Cache-Control → revalidan, como deben para la PWA).
        source: '/:dir(modelos3d|audio|texturas-acordeon|videos|acordeones|draco|personajes|pieles-acordeon|efectos|assets|iconos-pwa)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            // unsafe-inline: framer-motion + estilos dinámicos de Tailwind
            // unsafe-eval: three.js compila shaders con eval (WebGL)
            // img-src https: amplio: fotos de perfil de Google OAuth, Supabase, Unsplash, etc.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.youtube.com https://s.ytimg.com https://checkout.epayco.co https://*.epayco.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.epayco.co",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https://*.supabase.co https://*.b-cdn.net",
              "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://*.epayco.co https://ipapi.co https://api.ipify.org https://ipwho.is",
              "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://iframe.mediadelivery.net https://checkout.epayco.co https://*.epayco.co https://secure.epayco.co",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://*.epayco.co https://checkout.epayco.co",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

// El analyzer es devDependency — solo se activa localmente con ANALYZE=true.
// En producción el paquete no está instalado, así que se omite con gracia.
let exportConfig = nextConfig;
if (process.env.ANALYZE === 'true') {
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });
    exportConfig = withBundleAnalyzer(nextConfig);
  } catch {
    console.warn('⚠️  @next/bundle-analyzer no instalado — corriendo sin analyzer');
  }
}

export default exportConfig;
