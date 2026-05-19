import type { Metadata } from 'next'
import { supabaseAnonimo } from '@/servicios/clienteSupabase'
import LandingCurso from '@/Paginas/Cursos/LandingCurso'
import { metadataLanding } from '@/Paginas/Cursos/metadataServidor'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const { data } = await supabaseAnonimo
      .from('tutoriales')
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
  return metadataLanding(slug, 'tutorial')
}

export default async function TutorialLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await params
  return <LandingCurso />
}
