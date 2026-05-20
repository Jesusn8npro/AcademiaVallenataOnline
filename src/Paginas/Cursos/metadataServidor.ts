// Resolución de metadata SEO server-side para LandingCurso (cursos y
// tutoriales). Replica la lógica de resolución de slug/UUID del hook
// useLandingCurso pero leyendo en el servidor con el cliente anónimo de
// Supabase. Tolerante a fallos: si Supabase no responde, devuelve null y
// el page.tsx aplica un fallback genérico (el build nunca se rompe).
import type { Metadata } from 'next'
import { supabaseAnonimo } from '../../servicios/clienteSupabase'
import { generarSlug } from '../../utilidades/slug'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type DatosContenido = {
  titulo?: string
  descripcion?: string
  imagen_url?: string
  precio_normal?: number | null
  precio_rebajado?: number | null
  nivel?: string | null
}

async function buscarCurso(slug: string): Promise<DatosContenido | null> {
  try {
    const esUUID = UUID_RE.test(slug)
    const { data } = await supabaseAnonimo
      .from('cursos')
      .select('titulo, descripcion, imagen_url, precio_normal, precio_rebajado, nivel')
      .eq(esUUID ? 'id' : 'slug', slug)
      .maybeSingle()
    return (data as DatosContenido) || null
  } catch {
    return null
  }
}

async function buscarTutorial(slug: string): Promise<DatosContenido | null> {
  try {
    if (UUID_RE.test(slug)) {
      const { data } = await supabaseAnonimo
        .from('tutoriales')
        .select('titulo, descripcion, imagen_url, precio_normal, precio_rebajado, nivel')
        .eq('id', slug)
        .maybeSingle()
      return (data as DatosContenido) || null
    }
    // tutoriales no tiene columna slug — buscar por título generado
    const { data: todos } = await supabaseAnonimo
      .from('tutoriales')
      .select('titulo, descripcion, imagen_url, precio_normal, precio_rebajado, nivel')
    const encontrado = (todos || []).find((t: any) => generarSlug(t.titulo) === slug)
    return (encontrado as DatosContenido) || null
  } catch {
    return null
  }
}

export async function buscarDatosJsonLd(
  slug: string,
  tipo: 'curso' | 'tutorial',
): Promise<DatosContenido | null> {
  return tipo === 'curso' ? buscarCurso(slug) : buscarTutorial(slug)
}

export async function metadataLanding(
  slug: string,
  tipo: 'curso' | 'tutorial',
): Promise<Metadata> {
  const base = 'https://academiavallenata.online'
  const ruta = tipo === 'curso' ? `/cursos/${slug}` : `/tutoriales/${slug}`
  const canonical = `${base}${ruta}`

  const datos =
    tipo === 'curso' ? await buscarCurso(slug) : await buscarTutorial(slug)

  const etiqueta = tipo === 'curso' ? 'Curso' : 'Tutorial'
  const titulo = datos?.titulo
    ? `${datos.titulo} | Academia Vallenata Online`
    : `${etiqueta} de Acordeón Vallenato | Academia Vallenata Online`
  const descripcion =
    datos?.descripcion ||
    `Aprende acordeón vallenato con este ${etiqueta.toLowerCase()} paso a paso de la Academia Vallenata Online. Clases en video con los mejores maestros de Colombia.`

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: canonical,
      type: 'website',
      ...(datos?.imagen_url ? { images: [{ url: datos.imagen_url }] } : {}),
    },
  }
}
