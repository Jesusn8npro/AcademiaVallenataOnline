import type { Metadata } from 'next'
import { supabaseAnonimo } from '@/servicios/clienteSupabase'
import LandingCurso from '@/Paginas/Cursos/LandingCurso'
import { metadataLanding, buscarDatosJsonLd } from '@/Paginas/Cursos/metadataServidor'
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
  const datos = await buscarDatosJsonLd(slug, 'tutorial')

  const jsonLd = datos ? {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: datos.titulo,
    description: datos.descripcion || 'Tutorial de acordeón vallenato paso a paso con los mejores maestros de Colombia.',
    url: `${BASE}/tutoriales/${slug}`,
    provider: { '@type': 'Organization', name: 'Academia Vallenata Online', url: BASE },
    ...(datos.imagen_url ? { image: datos.imagen_url } : {}),
    ...(datos.nivel ? { educationalLevel: datos.nivel } : {}),
    offers: {
      '@type': 'Offer',
      price: datos.precio_rebajado ?? datos.precio_normal ?? 0,
      priceCurrency: 'COP',
      availability: 'https://schema.org/InStock',
    },
  } : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <LandingCurso />
    </>
  )
}
