// ─────────────────────────────────────────────────────────────────────────
// Ruta dinámica /blog/:slug (pública, SEO crítico). generateMetadata lee el
// artículo desde Supabase server-side para title/description/OG REALES.
// En Next 16 `params` es Promise: SIEMPRE `const { slug } = await params`.
// ─────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import { supabaseAnonimo } from '@/servicios/clienteSupabase'
import ArticuloBlog from '@/Paginas/Blog/ArticuloBlog'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const { data } = await supabaseAnonimo
      .from('blog_articulos')
      .select('slug')
      .eq('estado_publicacion', 'publicado')
      .not('slug', 'is', null)
    return (data || []).map(({ slug }: { slug: string }) => ({ slug }))
  } catch {
    return []
  }
}

const BASE_URL = 'https://academiavallenata.online'

async function obtenerArticulo(slug: string) {
  try {
    const { data, error } = await supabaseAnonimo
      .from('blog_articulos')
      .select(
        'titulo, resumen_breve, resumen_completo, portada_url, meta_titulo, meta_descripcion, og_titulo, og_descripcion, og_imagen_url, canonical_url, fecha_publicacion, autor',
      )
      .eq('slug', slug)
      .eq('estado_publicacion', 'publicado')
      .maybeSingle()
    if (error) return null
    return data as Record<string, string | undefined> | null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const articulo = await obtenerArticulo(slug)

  if (!articulo) {
    return {
      title: 'Artículo no encontrado | Academia Vallenata Online',
      description:
        'El artículo que buscas no está disponible. Explora más contenido sobre acordeón vallenato en nuestro blog.',
      alternates: { canonical: `${BASE_URL}/blog/${slug}` },
    }
  }

  const titulo =
    articulo.meta_titulo ||
    `${articulo.titulo} | Academia Vallenata Online`
  const descripcion =
    articulo.meta_descripcion ||
    articulo.resumen_breve ||
    articulo.resumen_completo ||
    'Aprende acordeón vallenato con técnicas, teoría y práctica en Academia Vallenata Online.'
  const canonical = articulo.canonical_url || `${BASE_URL}/blog/${slug}`
  const ogTitulo = articulo.og_titulo || articulo.titulo || titulo
  const ogDescripcion = articulo.og_descripcion || descripcion
  const ogImagen = articulo.og_imagen_url || articulo.portada_url

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical },
    openGraph: {
      title: ogTitulo,
      description: ogDescripcion,
      url: canonical,
      type: 'article',
      ...(articulo.fecha_publicacion
        ? { publishedTime: articulo.fecha_publicacion }
        : {}),
      ...(articulo.autor ? { authors: [articulo.autor] } : {}),
      ...(ogImagen ? { images: [{ url: ogImagen }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitulo,
      description: ogDescripcion,
      ...(ogImagen ? { images: [ogImagen] } : {}),
    },
  }
}

export default async function ArticuloBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const articulo = await obtenerArticulo(slug)

  const jsonLd = articulo
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: articulo.titulo,
        description: articulo.resumen_breve || articulo.resumen_completo || '',
        datePublished: articulo.fecha_publicacion,
        author: { '@type': 'Person', name: articulo.autor || 'Academia Vallenata Online' },
        publisher: { '@type': 'Organization', name: 'Academia Vallenata Online', url: BASE_URL },
        url: `${BASE_URL}/blog/${slug}`,
        ...(articulo.portada_url ? { image: articulo.portada_url } : {}),
      }
    : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ArticuloBlog slug={slug} />
    </>
  )
}
