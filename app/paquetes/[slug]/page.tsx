import type { Metadata } from 'next'
import { obtenerPaquetePorSlug } from '@/servicios/paquetesService'
import DetallePaquete from '@/Paginas/Paquetes/DetallePaquete'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const resultado = await obtenerPaquetePorSlug(slug)
    if (resultado.success && resultado.data) {
      const paquete = resultado.data
      const titulo = paquete.meta_titulo || `${paquete.titulo} | Academia Vallenata Online`
      const descripcion =
        paquete.meta_descripcion ||
        paquete.descripcion_corta ||
        (paquete.descripcion
          ? String(paquete.descripcion).replace(/<[^>]+>/g, '').trim().slice(0, 160)
          : '') ||
        'Paquete de tutoriales de acordeón vallenato en Academia Vallenata Online.'
      const url = `https://academiavallenata.online/paquetes/${slug}`
      return {
        title: titulo,
        description: descripcion,
        alternates: { canonical: url },
        openGraph: {
          title: titulo,
          description: descripcion,
          url,
          type: 'website',
          ...(paquete.imagen_url ? { images: [{ url: paquete.imagen_url }] } : {}),
        },
      }
    }
  } catch {
    // Si falla la consulta, se usa el metadata genérico de abajo.
  }
  return {
    title: 'Paquete de Tutoriales | Academia Vallenata Online',
    description: 'Detalle del paquete de tutoriales de acordeón vallenato en Academia Vallenata Online.',
    alternates: { canonical: `https://academiavallenata.online/paquetes/${slug}` },
  }
}

export default function DetallePaquetePage() {
  return <DetallePaquete />
}
