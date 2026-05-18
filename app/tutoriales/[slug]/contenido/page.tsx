import type { Metadata } from 'next'
import ContenidoTutorial from '@/Paginas/Tutoriales/ContenidoTutorial'
import { metadataLanding } from '@/Paginas/Cursos/metadataServidor'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const meta = await metadataLanding(slug, 'tutorial')
  // Ruta protegida: no debe indexarse (contenido del estudiante).
  return { ...meta, robots: { index: false, follow: false } }
}

export default async function ContenidoTutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await params
  return <ContenidoTutorial />
}
