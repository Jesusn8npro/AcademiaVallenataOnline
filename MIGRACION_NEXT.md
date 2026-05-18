# CONTRATO DE MIGRACIÓN A NEXT.JS — Academia Vallenata Online

> **Este documento es obligatorio.** Todo agente lo lee ANTES de tocar código y
> sigue cada regla al pie de la letra. El objetivo: migración total a Next.js
> App Router **sin romper nada** y **sin dejar rastro de Vite/react-router**.

---

## 1. Estado actual (Fase 0 ya completada — NO la rehagas)

- Next.js 16 ya corre. Vite ya NO es el runtime.
- `app/layout.tsx` = layout raíz con SEO/OG/JSON-LD/GA (NO lo toques).
- `app/[[...slug]]/` = **shell catch-all** que monta `src/App.tsx` client-only.
  Mientras una ruta NO esté migrada, sigue funcionando aquí con react-router.
- `src/compat/router.tsx` = capa de compatibilidad (NO la toques).
- `app/contacto/page.tsx` + `src/Paginas/Contacto/Contacto.tsx` = **PATRÓN DE
  REFERENCIA**. Cópialo. Es la verdad canónica.
- Build verde: `npx next build` debe pasar siempre.

## 2. Regla de oro: PROPIEDAD EXCLUSIVA

- Cada agente es dueño SOLO de las carpetas asignadas (sección 9).
- **PROHIBIDO** tocar: `app/layout.tsx`, `app/[[...slug]]/*`,
  `src/compat/*`, `next.config.mjs`, `tsconfig.json`, `package.json`,
  `src/App.tsx`, ni carpetas de otro agente.
- Si necesitas algo compartido (Menu, Footer, ui), NO lo edites: es del
  Agente 9. Coordínalo dejándolo anotado en `MIGRACION_PENDIENTES.md`.
- NO borres `src/App.tsx` ni el catch-all: eso se hace en la Fase 2 (yo).

## 3. Patrón canónico (cópialo EXACTO)

Para cada ruta del `src/App.tsx` original, crea su carpeta en `app/`:

| react-router (App.tsx) | Next App Router |
|---|---|
| `path="/contacto"` | `app/contacto/page.tsx` |
| `path="/blog"` | `app/blog/page.tsx` |
| `path="/blog/:slug"` | `app/blog/[slug]/page.tsx` |
| `path="/cursos/:slug/:moduloSlug/:leccionSlug"` | `app/cursos/[slug]/[moduloSlug]/[leccionSlug]/page.tsx` |
| ruta con `<Navigate to=.. />` (ej. `/cursos`) | `app/cursos/page.tsx` con `redirect()` |

### 3.1 `app/<ruta>/page.tsx` (Server Component — SEO)

```tsx
import type { Metadata } from 'next'
import MiPagina from '@/Paginas/Grupo/MiPagina'

export const metadata: Metadata = {
  title: 'Título SEO | Academia Vallenata Online',
  description: 'Descripción real para Google (150-160 chars).',
  alternates: { canonical: 'https://academiavallenata.online/mi-ruta' },
  openGraph: { title: '...', description: '...', url: 'https://academiavallenata.online/mi-ruta', type: 'website' },
}

export default function MiPaginaRoute() {
  return <MiPagina />
}
```

Para rutas dinámicas usa `generateMetadata` (lee datos de Supabase server-side):

```tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  // fetch a Supabase server-side para título/desc reales (SEO máximo)
  return { title: `${slug} | Academia Vallenata Online`, description: '...' }
}
export default async function Route({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <MiPagina slug={slug} />
}
```
> En Next 16 `params` es una Promise: SIEMPRE `const { x } = await params`.

### 3.2 El componente de UI (`src/Paginas/...`)

- Conserva su código y su `.css` **IGUAL**. NO reescribas estilos.
- Si usa `useState/useEffect/onClick/hooks/browser API` → añade en la
  PRIMERA línea: `'use client';` (con punto y coma, línea en blanco después).
- Si el componente recibía params por `useParams()`, puedes dejar el
  `useParams` (vía compat) O aceptar props desde el page.tsx. Prefiere props
  desde page.tsx para datos que sirven al SEO.

## 4. Conversión react-router → `@/compat/router`

En CUALQUIER archivo (página o componente) que importe de `'react-router-dom'`:

```diff
- import { useNavigate, Link, useParams, useLocation } from 'react-router-dom'
+ import { useNavigate, Link, useParams, useLocation } from '@/compat/router'
```

- El CUERPO del componente NO cambia (misma API). Solo el import.
- Ese archivo DEBE ser Client Component → `'use client';` en la 1ª línea.
- **NO** importes `BrowserRouter`, `Routes`, `Route` de la compat: esos
  desaparecen (los reemplaza el routing por carpetas). Si un archivo los usa,
  es un archivo de routing (tipo App.tsx) y NO se migra: su lógica se
  reparte en `app/.../page.tsx` + `layout.tsx`.
- `<Outlet/>` → en el `layout.tsx` del grupo se reemplaza por `{children}`.

## 5. Rutas anidadas / layouts (ej. Perfil, Usuarios, Admin)

react-router:
```
<Route path="/usuarios/:slug" element={<PerfilPublicoLayout/>}>
  <Route index element={<PerfilPublicoPage/>} />
  <Route path="actividad" element={<ActividadUsuarioPage/>} />
</Route>
```
Next App Router:
```
app/usuarios/[slug]/layout.tsx     -> renderiza PerfilPublicoLayout con {children}
app/usuarios/[slug]/page.tsx       -> PerfilPublicoPage
app/usuarios/[slug]/actividad/page.tsx -> ActividadUsuarioPage
```
En `PerfilPublicoLayout`, donde había `<Outlet/>`, pon `{children}` (el
layout.tsx pasa `children` como prop).

## 6. Rutas protegidas (auth / admin)

`<Route element={<ProteccionRuta/>}>` y `<ProteccionAdmin/>`:
- Crea un `layout.tsx` en el grupo protegido que renderice el guard
  existente (`src/SeguridadApp/ProteccionRuta` / `ProteccionAdmin`)
  envolviendo `{children}`. Reusa el guard tal cual (es client).
- NO reimplementes auth. El guard ya funciona client-side.

## 7. Redirecciones

`<Route path="/cursos" element={<Navigate to="/tutoriales-de-acordeon" replace/>} />`
→ `app/cursos/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
export default function Page() { redirect('/tutoriales-de-acordeon') }
```

## 8. Checklist OBLIGATORIO por agente (antes de declarar "hecho")

1. [ ] Cada ruta asignada tiene su `app/<ruta>/page.tsx`.
2. [ ] Todo archivo migrado que use hooks/estado tiene `'use client';`.
3. [ ] Imports `react-router-dom` → `@/compat/router` en TUS archivos.
4. [ ] `npx next build` pasa (compila). Ejecuta SOLO lectura del resultado;
       si falla por un archivo TUYO, arréglalo; si falla por otro grupo,
       anótalo en `MIGRACION_PENDIENTES.md` y NO lo toques.
5. [ ] No tocaste ningún archivo fuera de tu propiedad.
6. [ ] CSS sin cambios (mismos imports `./X.css`).
7. [ ] Metadata SEO real en cada `page.tsx` público (title+description+canonical).
8. [ ] Resumen de lo migrado al final (rutas creadas, archivos con 'use client').

## 9. Mapa de propiedad (los 10 agentes)

| Agente | Rutas (de src/App.tsx) | Carpetas dueñas |
|---|---|---|
| 1 | `/`, `/nuestra-academia`, `/contacto`(ref ya hecha), `/terminos`, `/privacidad`, `/recuperar-contrasena`, `/sesion-cerrada`, 404 | `src/Paginas/Inicio`, `NuestraAcademia`, `Legales`, `CierreSesion`, `404`, `ProximamentePage` |
| 2 | `/blog`, `/blog/:slug` | `src/Paginas/Blog` |
| 3 | `/tutoriales-de-acordeon`, `/cursos`(redirect), `/cursos/:slug`, `/tutoriales/:slug`, `/curso-acordeon-desde-cero`, `/cursos/:slug/:moduloSlug/:leccionSlug`, `/tutoriales/:slug/contenido`, `/tutoriales/:slug/clase/:claseSlug` | `src/Paginas/Cursos`, `src/Paginas/Tutoriales` |
| 4 | `/eventos`, `/eventos/:slug`, `/paquetes`, `/paquetes/:slug`, `/pago-error`, `/pago-exitoso` | `src/Paginas/Eventos`, `Paquetes`, `Pagos` |
| 5 | `/comunidad`, `/mensajes`, `/mensajes/:chatId`, `/notificaciones`, `/ranking` | `src/Paginas/Comunidad`, `Mensajes`, `Notificaciones`, `Ranking` |
| 6 | `/panel-estudiante`, `/mi-perfil`, `/mis-cursos`, `/mis-eventos`, `/publicaciones`, `/grabaciones`, `/mis-validaciones`, `/mis-evaluaciones`, `/mi-perfil/favoritos`, `/configuracion` | `src/Paginas/PanelEstudiante`, `Perfil`, `configuracion` |
| 7 | `/usuarios/:slug` (+ index/actividad/publicaciones/grabaciones) | `src/Paginas/Usuarios` |
| 8 | `/administrador` y TODAS sus subrutas | `src/Paginas/administrador` |
| 9 | `/acordeon-pro-max*`, `/acordeon-3d-test`, `/acordeon-funcional-v1`, `/simulador-app` (3D/audio: usar `dynamic(..,{ssr:false})`) | `src/Paginas/AcordeonProMax`, `SimuladorApp`, `Ejemplos3d1`, `Ejemplos3d2` |
| 10 | Componentes compartidos: convertir imports react-router→compat y añadir `'use client'` donde aplique | `src/componentes/**` (Menu, Footer, Banners, ui, common, Skeletons, etc.) |

> Agente 1 NO rehace `/contacto` (ya está como referencia).
> Servicios/hooks/stores/utilidades: NO se migran de framework (son lógica
> pura). Solo se tocan si importan `react-router-dom` (cámbialo a compat) —
> de eso se encarga el dueño del archivo que lo consume; si es transversal,
> anótalo en `MIGRACION_PENDIENTES.md`.

## 10. Fase 2 (la hace el coordinador, NO los agentes)

Eliminar `src/App.tsx`, `src/main.tsx`, `index.html`, `vite.config.ts`,
`src/registerSW.ts`, `app/[[...slug]]/`, desinstalar Vite y `react-router-dom`,
`next build` final completo y verificación de las 77 rutas.
