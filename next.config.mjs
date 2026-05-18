/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Etapa A de la migración: el App actual corre client-only dentro del shell
  // catch-all. Ignoramos errores TS/ESLint preexistentes (~92k líneas) para
  // alcanzar el checkpoint funcional; se endurece en fases posteriores.
  typescript: { ignoreBuildErrors: true },
  // Optimización de imágenes activada. Los <img> existentes NO se ven
  // afectados (Next solo procesa <Image/>); al migrar imágenes a next/image
  // (logo, heros) se sirven en AVIF/WebP con tamaños responsive.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'tbijzvtyyewhtwgakgka.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.b-cdn.net' },
      { protocol: 'https', hostname: 'iframe.mediadelivery.net' },
    ],
  },
  // Tree-shaking de iconos (lucide-react se usa en 100+ archivos): solo
  // entran al bundle los iconos realmente usados.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
