import type { Metadata } from 'next'
import { eventosService } from '@/servicios/eventosService'
import DetalleEvento from '@/Paginas/Eventos/DetalleEvento'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const { evento } = await eventosService.obtenerEventoPorSlug(slug)
    if (evento) {
      const titulo = `${evento.titulo} | Academia Vallenata Online`
      const descripcion =
        (evento.descripcion
          ? String(evento.descripcion).replace(/<[^>]+>/g, '').trim().slice(0, 160)
          : '') || 'Evento de acordeón vallenato en Academia Vallenata Online.'
      const url = `https://academiavallenata.online/eventos/${slug}`
      const imagen = evento.imagen_portada
      return {
        title: titulo,
        description: descripcion,
        alternates: { canonical: url },
        openGraph: {
          title: titulo,
          description: descripcion,
          url,
          type: 'website',
          ...(imagen ? { images: [{ url: imagen }] } : {}),
        },
      }
    }
  } catch {
    // Si falla la consulta, se usa el metadata genérico de abajo.
  }
  return {
    title: 'Evento | Academia Vallenata Online',
    description: 'Detalle del evento de acordeón vallenato en Academia Vallenata Online.',
    alternates: { canonical: `https://academiavallenata.online/eventos/${slug}` },
  }
}

export default function DetalleEventoPage() {
  return <DetalleEvento />
}
