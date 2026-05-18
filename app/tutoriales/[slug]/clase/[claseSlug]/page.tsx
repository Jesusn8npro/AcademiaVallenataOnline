import type { Metadata } from 'next'
import ClaseTutorial from '@/Paginas/Tutoriales/ClaseTutorial'
import { metadataLanding } from '@/Paginas/Cursos/metadataServidor'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; claseSlug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const meta = await metadataLanding(slug, 'tutorial')
  // Ruta protegida: no debe indexarse (contenido del estudiante).
  return { ...meta, robots: { index: false, follow: false } }
}

export default async function ClaseTutorialPage({
  params,
}: {
  params: Promise<{ slug: string; claseSlug: string }>
}) {
  await params
  return <ClaseTutorial />
}
