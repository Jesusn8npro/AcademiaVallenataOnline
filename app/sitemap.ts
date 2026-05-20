import type { MetadataRoute } from 'next'
import { supabaseAnonimo } from '@/servicios/clienteSupabase'

const BASE = 'https://academiavallenata.online'

// Regenera el sitemap cada hora (ISR) en vez de en cada request.
export const revalidate = 3600

// Cada fuente va en su propio try/catch: si Supabase falla o una tabla/
// columna no existe, se omite esa sección pero el sitemap NUNCA rompe el
// build (siempre devuelve al menos las rutas estáticas públicas).
async function slugs(
  tabla: string,
  ruta: string,
  filtros?: (q: any) => any,
): Promise<MetadataRoute.Sitemap> {
  try {
    let q = (supabaseAnonimo as any).from(tabla).select('slug').not('slug', 'is', null)
    if (filtros) q = filtros(q)
    const { data, error } = await q.limit(5000)
    if (error || !data) return []
    return data
      .filter((r: any) => r.slug)
      .map((r: any) => ({
        url: `${BASE}/${ruta}/${r.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/tutoriales-de-acordeon`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/paquetes`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/eventos`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/nuestra-academia`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/curso-acordeon-desde-cero`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/contacto`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/terminos`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/privacidad`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const [blog, tutoriales, cursos, eventos, paquetes] = await Promise.all([
    slugs('blog_articulos', 'blog', (q) => q.eq('estado_publicacion', 'publicado')),
    slugs('tutoriales', 'tutoriales'),
    slugs('cursos', 'cursos'),
    slugs('eventos', 'eventos'),
    slugs('paquetes_tutoriales', 'paquetes'),
  ])

  return [...estaticas, ...blog, ...tutoriales, ...cursos, ...eventos, ...paquetes]
}
