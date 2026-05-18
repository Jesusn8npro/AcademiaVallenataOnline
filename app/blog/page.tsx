// ─────────────────────────────────────────────────────────────────────────
// Ruta /blog (pública, SEO crítico). page.tsx = Server Component que exporta
// `metadata` rica server-side y renderiza el componente de UI existente.
// ─────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import Blog from '@/Paginas/Blog/Blog'

export const metadata: Metadata = {
  title: 'Blog de Acordeón Vallenato | Academia Vallenata Online',
  description:
    'Historias inspiradoras, técnicas profesionales y consejos de expertos en acordeón vallenato. Aprende teoría, práctica y secretos del vallenato con nuestra comunidad de músicos.',
  keywords: [
    'blog acordeón vallenato',
    'aprender acordeón',
    'técnicas de acordeón',
    'vallenato',
    'consejos acordeón',
    'Academia Vallenata Online',
  ],
  alternates: { canonical: 'https://academiavallenata.online/blog' },
  openGraph: {
    title: 'Blog de Acordeón Vallenato | Academia Vallenata Online',
    description:
      'Historias inspiradoras, técnicas profesionales y consejos de expertos en acordeón vallenato. Únete a nuestra comunidad de músicos apasionados.',
    url: 'https://academiavallenata.online/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog de Acordeón Vallenato | Academia Vallenata Online',
    description:
      'Historias, técnicas y consejos de expertos en acordeón vallenato.',
  },
}

export default function BlogPage() {
  return <Blog />
}
