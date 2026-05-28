import type { Metadata } from 'next'
import Eventos from '@/Paginas/Eventos/Eventos'
import { supabaseAnonimo } from '@/servicios/clienteSupabase'
import { mapearEvento } from '@/servicios/eventos/_tipos'

export const metadata: Metadata = {
  title: 'Eventos en Vivo de Acordeón Vallenato | Academia Vallenata Online',
  description:
    'Participa en masterclasses exclusivas, workshops interactivos y conciertos en vivo de acordeón vallenato. Aprende directamente con los mejores maestros.',
  alternates: { canonical: 'https://academiavallenata.online/eventos' },
  openGraph: {
    title: 'Eventos en Vivo de Acordeón Vallenato | Academia Vallenata Online',
    description:
      'Masterclasses, workshops y conciertos en vivo de acordeón vallenato con los mejores maestros.',
    url: 'https://academiavallenata.online/eventos',
    type: 'website',
  },
}

// ISR: regenera la lista de eventos cada 5 minutos. Permite que la página
// llegue al usuario con datos pre-renderizados → cero spinner. El cliente
// luego refresca con filtros/paginación según interacciones.
export const revalidate = 300

async function cargarEventosIniciales() {
  try {
    const { data, count } = await supabaseAnonimo
      .from('eventos')
      .select('*', { count: 'exact' })
      .eq('estado', 'programado')
      .order('fecha_inicio', { ascending: false })
      .limit(12)
    return {
      eventos: (data || []).map((e: any) => mapearEvento(e, false)),
      total: count || 0,
    }
  } catch {
    return { eventos: [], total: 0 }
  }
}

export default async function EventosPage() {
  const { eventos, total } = await cargarEventosIniciales()
  return <Eventos eventosIniciales={eventos} totalInicial={total} />
}
