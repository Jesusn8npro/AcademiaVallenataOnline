/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
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
      { protocol: 'https', hostname: '**.googleusercontent.com' },
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
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https://*.supabase.co https://*.b-cdn.net",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com",
              "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://iframe.mediadelivery.net",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
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
