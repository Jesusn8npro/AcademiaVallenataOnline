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

/**
 * Carga COMPLETA del contenido para SSG/ISR.
 *
 * Devuelve el contenido + sus partes (tutorial) o módulos+lecciones (curso),
 * en una forma compatible con el tipo `Contenido` que espera VistaPremium.
 *
 * Se llama en el Server Component (page.tsx) y se pasa como `contenidoInicial`
 * a `<LandingCurso>`. Resultado: la landing renderiza con datos REALES desde
 * el primer paint, sin spinner. El client component aún corre `useLandingCurso`
 * en background para refrescar (stale-while-revalidate).
 *
 * Tolerante a fallos: si algo falla, devuelve null y el client fetcheará.
 */
export async function buscarContenidoCompleto(
  slug: string,
  tipo: 'curso' | 'tutorial',
): Promise<any | null> {
  try {
    if (tipo === 'curso') {
      const esUUID = UUID_RE.test(slug)
      const { data: curso } = await supabaseAnonimo
        .from('cursos')
        .select('*')
        .eq(esUUID ? 'id' : 'slug', slug)
        .maybeSingle()
      if (!curso) return null

      const { data: modulos } = await supabaseAnonimo
        .from('modulos')
        .select('id, titulo, descripcion, orden')
        .eq('curso_id', (curso as any).id)
        .order('orden')

      const moduloIds = (modulos || []).map((m: any) => m.id)
      const { data: lecciones } = moduloIds.length
        ? await supabaseAnonimo
            .from('lecciones')
            .select('id, titulo, orden, modulo_id')
            .in('modulo_id', moduloIds)
            .order('orden')
        : { data: [] as any[] }

      const leccPorModulo = ((lecciones || []) as any[]).reduce(
        (acc: Record<string, any[]>, l: any) => {
          if (!acc[l.modulo_id]) acc[l.modulo_id] = []
          acc[l.modulo_id].push(l)
          return acc
        }, {})

      const modulosConLecciones = (modulos || []).map((m: any) => ({
        ...m,
        slug: generarSlug(m.titulo),
        lecciones: (leccPorModulo[m.id] || [])
          .map((l: any) => ({ ...l, slug: generarSlug(l.titulo) }))
          .sort((a: any, b: any) => a.orden - b.orden),
      }))

      return {
        ...(curso as any),
        tipo: 'curso',
        modulos: modulosConLecciones,
        modulos_preview: modulosConLecciones,
      }
    }

    // tipo === 'tutorial'
    let tutorial: any = null
    if (UUID_RE.test(slug)) {
      const { data } = await supabaseAnonimo
        .from('tutoriales')
        .select('*')
        .eq('id', slug)
        .maybeSingle()
      tutorial = data
    } else {
      const { data: todos } = await supabaseAnonimo.from('tutoriales').select('*')
      tutorial = (todos || []).find((t: any) => generarSlug(t.titulo) === slug)
    }
    if (!tutorial) return null

    const { data: partes } = await supabaseAnonimo
      .from('partes_tutorial')
      .select('id, titulo, descripcion, orden, slug')
      .eq('tutorial_id', tutorial.id)
      .order('orden')

    return {
      ...tutorial,
      tipo: 'tutorial',
      modulos_preview: partes || [],
    }
  } catch {
    return null
  }
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
