/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Etapa A de la migración: el App actual corre client-only dentro del shell
  // catch-all. Ignoramos errores TS/ESLint preexistentes (~92k líneas) para
  // alcanzar el checkpoint funcional; se endurece en fases posteriores.
  typescript: { ignoreBuildErrors: true },
  // Imágenes remotas (Supabase Storage, Bunny CDN, etc.) sin optimización
  // por ahora para no romper ningún <img> existente.
  images: { unoptimized: true },
  // Tree-shaking de iconos (lucide-react se usa en 100+ archivos): solo
  // entran al bundle los iconos realmente usados.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
