import type { Metadata } from 'next'
import ClaseCurso from '@/Paginas/Cursos/ClaseCurso'
import { metadataLanding } from '@/Paginas/Cursos/metadataServidor'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; moduloSlug: string; leccionSlug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return metadataLanding(slug, 'curso')
}

export default async function ClaseCursoPage({
  params,
}: {
  params: Promise<{ slug: string; moduloSlug: string; leccionSlug: string }>
}) {
  await params
  return <ClaseCurso />
}
