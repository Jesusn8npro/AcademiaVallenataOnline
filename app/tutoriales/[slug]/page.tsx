import type { Metadata } from 'next'
import LandingCurso from '@/Paginas/Cursos/LandingCurso'
import { metadataLanding } from '@/Paginas/Cursos/metadataServidor'

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
