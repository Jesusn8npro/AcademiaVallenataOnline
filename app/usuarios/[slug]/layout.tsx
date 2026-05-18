// ─────────────────────────────────────────────────────────────────────────
// Ruta anidada pública /usuarios/:slug (perfil público, SEO útil).
// layout.tsx = Server Component que exporta generateMetadata (lee el perfil
// desde Supabase server-side para title/description/OG REALES) y renderiza
// PerfilPublicoLayout pasándole {children} (reemplaza al <Outlet/> de
// react-router) + el slug por prop.
// En Next 16 `params` es Promise: SIEMPRE `const { slug } = await params`.
// ─────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { supabaseAnonimo } from '@/servicios/clienteSupabase'
import { generarSlug } from '@/utilidades/slug'
import PerfilPublicoLayout from '@/Paginas/Usuarios/PerfilPublicoLayout'

const BASE_URL = 'https://academiavallenata.online'

async function obtenerPerfil(slug: string) {
  try {
    const { data: exacto } = await supabaseAnonimo
      .from('perfiles')
      .select('nombre,apellido,nombre_completo,nombre_usuario,biografia,ciudad,pais,url_foto_perfil,rol')
      .eq('nombre_usuario', slug)
      .maybeSingle()

    if (exacto) return exacto as Record<string, string | undefined> | null

    const { data: todos } = await supabaseAnonimo
      .from('perfiles')
      .select('nombre,apellido,nombre_completo,nombre_usuario,biografia,ciudad,pais,url_foto_perfil,rol')

    const lista = Array.isArray(todos) ? (todos as Record<string, string | undefined>[]) : []
    const encontrado = lista.find((u) => {
      const nc = (u.nombre_completo || `${u.nombre || ''} ${u.apellido || ''}`).trim()
      return generarSlug(nc) === slug || generarSlug(`${u.nombre || ''} ${u.apellido || ''}`.trim()) === slug
    })
    return encontrado || null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const perfil = await obtenerPerfil(slug)
  const canonical = `${BASE_URL}/usuarios/${slug}`

  if (!perfil) {
    return {
      title: 'Perfil no encontrado | Academia Vallenata Online',
      description:
        'El perfil que buscas no está disponible. Explora la comunidad de acordeoneros en Academia Vallenata Online.',
      alternates: { canonical },
    }
  }

  const nombre =
    perfil.nombre_completo ||
    `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() ||
    'Usuario'
  const titulo = `${nombre} | Academia Vallenata Online`
  const ubicacion = `${perfil.ciudad || ''} ${perfil.pais || ''}`.trim()
  const descripcion =
    perfil.biografia ||
    `Conoce el perfil de ${nombre}${ubicacion ? ` (${ubicacion})` : ''} en la comunidad de Academia Vallenata Online: publicaciones, actividad y grabaciones de acordeón vallenato.`
  const ogImagen = perfil.url_foto_perfil

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: canonical,
      type: 'profile',
      ...(ogImagen ? { images: [{ url: ogImagen }] } : {}),
    },
    twitter: {
      card: 'summary',
      title: titulo,
      description: descripcion,
      ...(ogImagen ? { images: [ogImagen] } : {}),
    },
  }
}

export default async function UsuarioLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PerfilPublicoLayout slug={slug}>{children}</PerfilPublicoLayout>
}
