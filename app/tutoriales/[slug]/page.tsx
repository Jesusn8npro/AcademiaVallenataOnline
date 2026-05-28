import type { Metadata } from 'next'
import { supabaseAnonimo } from '@/servicios/clienteSupabase'
import LandingCurso from '@/Paginas/Cursos/LandingCurso'
import { metadataLanding, buscarContenidoCompleto } from '@/Paginas/Cursos/metadataServidor'
import { generarSlug } from '@/utilidades/slug'

const BASE = 'https://academiavallenata.online'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const { data } = await supabaseAnonimo
      .from('tutoriales')
      .select('id, titulo')
    return (data || [])
      .filter((t: any) => t.titulo)
      .map((t: any) => ({ slug: generarSlug(t.titulo) }))
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
  return metadataLanding(slug, 'tutorial')
}

export default async function TutorialLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Carga completa del tutorial + sus partes en el SERVIDOR. Esto se ejecuta
  // durante el build (SSG con generateStaticParams) o on-demand con
  // revalidate=3600. El HTML pre-renderizado llega al cliente con los datos
  // ya embebidos → la landing renderiza INSTANTÁNEA sin spinner.
  const contenido = await buscarContenidoCompleto(slug, 'tutorial')

  const jsonLd = contenido ? {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: contenido.titulo,
    description: contenido.descripcion || 'Tutorial de acordeón vallenato paso a paso con los mejores maestros de Colombia.',
    url: `${BASE}/tutoriales/${slug}`,
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
