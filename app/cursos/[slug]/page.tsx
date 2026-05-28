import type { Metadata } from 'next'
import { supabaseAnonimo } from '@/servicios/clienteSupabase'
import LandingCurso from '@/Paginas/Cursos/LandingCurso'
import { metadataLanding, buscarContenidoCompleto } from '@/Paginas/Cursos/metadataServidor'

const BASE = 'https://academiavallenata.online'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const { data } = await supabaseAnonimo
      .from('cursos')
      .select('slug')
      .not('slug', 'is', null)
    return (data || []).map(({ slug }: { slug: string }) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return metadataLanding(slug, 'curso')
}

export default async function CursoLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // SSG/ISR con datos completos del curso + módulos + lecciones.
  // El HTML llega al cliente ya con todo → la landing renderiza al instante.
  const contenido = await buscarContenidoCompleto(slug, 'curso')

  const jsonLd = contenido ? {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: contenido.titulo,
    description: contenido.descripcion || 'Aprende acordeón vallenato paso a paso con los mejores maestros de Colombia.',
    url: `${BASE}/cursos/${slug}`,
    provider: { '@type': 'Organization', name: 'Academia Vallenata Online', url: BASE },
    ...(contenido.imagen_url ? { image: contenido.imagen_url } : {}),
    ...(contenido.nivel ? { educationalLevel: contenido.nivel } : {}),
    offers: {
      '@type': 'Offer',
      price: contenido.precio_rebajado ?? contenido.precio_normal ?? 0,
      priceCurrency: 'COP',
      availability: 'https://schema.org/InStock',
    },
  } : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <LandingCurso contenidoInicial={contenido} />
    </>
  )
}
