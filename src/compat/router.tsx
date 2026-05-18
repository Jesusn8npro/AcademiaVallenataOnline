'use client'

/**
 * CAPA DE COMPATIBILIDAD react-router-dom -> next/navigation
 * ----------------------------------------------------------
 * Permite migrar páginas/componentes a Next App Router cambiando UNA sola
 * línea: el import de 'react-router-dom' por '@/compat/router'. El cuerpo
 * del componente queda IGUAL (mismo useNavigate, useParams, Link, etc.).
 *
 * Reglas para los agentes (ver MIGRACION_NEXT.md):
 *  - <Routes>/<Route>/<BrowserRouter> NO se migran con esta capa: desaparecen
 *    (los reemplaza el routing por carpetas de Next). No los re-exportamos.
 *  - <Outlet/> se reemplaza por {children} en el layout.tsx del grupo.
 *  - Todo archivo que use estos hooks/componentes debe ser Client Component
 *    ('use client' arriba), porque next/navigation solo corre en cliente.
 */

import NextLink from 'next/link'
import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from 'next/navigation'
import * as React from 'react'

// ── useNavigate ───────────────────────────────────────────────────────────
// react-router: navigate('/ruta') | navigate('/ruta', { replace:true }) | navigate(-1)
export function useNavigate() {
  const router = useRouter()
  return React.useCallback(
    (to: string | number, options?: { replace?: boolean; state?: unknown }) => {
      if (typeof to === 'number') {
        if (to < 0) router.back()
        else router.forward()
        return
      }
      if (options?.replace) router.replace(to)
      else router.push(to)
    },
    [router],
  )
}

// ── useLocation ───────────────────────────────────────────────────────────
export function useLocation() {
  const pathname = usePathname()
  const sp = useNextSearchParams()
  const search = sp?.toString() ? `?${sp.toString()}` : ''
  return {
    pathname: pathname || '/',
    search,
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: null as unknown,
    key: 'default',
  }
}

// ── useParams ─────────────────────────────────────────────────────────────
// next devuelve string | string[]; react-router siempre string. Normalizamos.
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const p = useNextParams() || {}
  const out: Record<string, string> = {}
  for (const k of Object.keys(p)) {
    const v = (p as Record<string, string | string[]>)[k]
    out[k] = Array.isArray(v) ? v.join('/') : (v ?? '')
  }
  return out as T
}

// ── useSearchParams ───────────────────────────────────────────────────────
// react-router devuelve [URLSearchParams, setSearchParams]. Lo replicamos.
export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string> | string, opts?: { replace?: boolean }) => void,
] {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useNextSearchParams()
  const current = new URLSearchParams(sp?.toString() || '')
  const setSearchParams = React.useCallback(
    (
      next: URLSearchParams | Record<string, string> | string,
      opts?: { replace?: boolean },
    ) => {
      let qs: string
      if (typeof next === 'string') qs = next
      else if (next instanceof URLSearchParams) qs = next.toString()
      else qs = new URLSearchParams(next).toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      if (opts?.replace) router.replace(url)
      else router.push(url)
    },
    [router, pathname],
  )
  return [current, setSearchParams]
}

// ── Link ──────────────────────────────────────────────────────────────────
// react-router usa `to`; next usa `href`. Aceptamos ambos + props extra.
type LinkProps = Omit<React.ComponentProps<typeof NextLink>, 'href'> & {
  to?: string
  href?: string
  replace?: boolean
  state?: unknown
  end?: boolean
}
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, href, state, end, ...rest },
  ref,
) {
  const destino = (to ?? href ?? '#') as string
  return <NextLink ref={ref} href={destino} {...rest} />
})

// ── NavLink ───────────────────────────────────────────────────────────────
// Soporta className/style/children como función con { isActive } (react-router).
type NavLinkProps = Omit<LinkProps, 'className' | 'style' | 'children'> & {
  className?: string | ((state: { isActive: boolean }) => string)
  style?: React.CSSProperties | ((state: { isActive: boolean }) => React.CSSProperties)
  children?: React.ReactNode | ((state: { isActive: boolean }) => React.ReactNode)
}
export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, href, end, className, style, children, ...rest },
  ref,
) {
  const destino = (to ?? href ?? '#') as string
  const pathname = usePathname() || '/'
  const isActive = end ? pathname === destino : pathname.startsWith(destino)
  const cls = typeof className === 'function' ? className({ isActive }) : className
  const stl = typeof style === 'function' ? style({ isActive }) : style
  const kids = typeof children === 'function' ? children({ isActive }) : children
  return (
    <NextLink ref={ref} href={destino} className={cls} style={stl} {...rest}>
      {kids}
    </NextLink>
  )
})

// ── Navigate ──────────────────────────────────────────────────────────────
// <Navigate to="/x" replace /> -> redirección en cliente.
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter()
  React.useEffect(() => {
    if (replace) router.replace(to)
    else router.push(to)
  }, [to, replace, router])
  return null
}

// ── Outlet ────────────────────────────────────────────────────────────────
// En App Router las rutas anidadas reciben {children} en su layout.tsx.
// Este Outlet lee de un contexto que el layout migrado debe proveer.
export const OutletContext = React.createContext<React.ReactNode>(null)
export function Outlet() {
  return <>{React.useContext(OutletContext)}</>
}
export function useOutletContext<T = unknown>(): T {
  return React.useContext(OutletContext) as T
}

// Passthroughs útiles
export { useRouter, usePathname }
