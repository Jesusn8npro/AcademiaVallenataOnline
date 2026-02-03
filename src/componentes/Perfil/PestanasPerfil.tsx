import React, { useEffect, useRef, useState } from 'react'
import './pestanas-perfil.css'
import { Link, useLocation } from 'react-router-dom'

interface Props { modalAbierto?: boolean; modoPublico?: boolean; slugUsuario?: string | null }

export default function PestanasPerfil({ modalAbierto = false, modoPublico = false, slugUsuario = null }: Props) {
  const location = useLocation()
  // Iconos SVG
  const iconos = {
    perfil: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='8' r='3.5' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M4 20c0-3.5 8-3.5 8-3.5s8 0 8 3.5' stroke='currentColor' stroke-width='1.5' fill='none'/></svg>`,
    cursos: `<svg width='24' height='24' viewBox='0 0 24 24'><rect x='4' y='4' width='16' height='16' rx='2' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M8 9h8M8 14h5' stroke='currentColor' stroke-width='1.5'/></svg>`,
    comunidad: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='8' cy='8' r='3.5' stroke='currentColor' stroke-width='1.5' fill='none'/><circle cx='16' cy='8' r='3.5' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M2 20c0-3.5 6-3.5 6-3.5s6 0 6 3.5M10 20c0-3.5 6-3.5 6-3.5s6 0 6 3.5' stroke='currentColor' stroke-width='1.5' fill='none'/></svg>`,
    publicaciones: `<svg width='24' height='24' viewBox='0 0 24 24'><rect x='6' y='4' width='12' height='16' rx='2' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M9 9h6M9 13h6' stroke='currentColor' stroke-width='1.5'/></svg>`,
    actividad: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='2.5' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24' stroke='currentColor' stroke-width='1.5'/></svg>`,
    configuracion: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='2.5' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1 1.51V5a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' stroke='currentColor' stroke-width='1.5' fill='none'/></svg>`,
    eventos: `<svg width='24' height='24' viewBox='0 0 24 24'><rect x='3' y='4' width='18' height='18' rx='2' ry='2' stroke='currentColor' stroke-width='1.5' fill='none'/><line x1='16' y1='2' x2='16' y2='6' stroke='currentColor' stroke-width='1.5'/><line x1='8' y1='2' x2='8' y2='6' stroke='currentColor' stroke-width='1.5'/><line x1='3' y1='10' x2='21' y2='10' stroke='currentColor' stroke-width='1.5'/><circle cx='8' cy='14' r='1.5' fill='currentColor'/><circle cx='12' cy='18' r='1.5' fill='currentColor'/><circle cx='16' cy='14' r='1.5' fill='currentColor'/></svg>`,
    grabaciones: `<svg width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='3' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24' stroke='currentColor' stroke-width='1.5'/><circle cx='12' cy='12' r='9' stroke='currentColor' stroke-width='1.5' fill='none'/></svg>`
  };

  const pestañas = modoPublico && slugUsuario ? [
    { label: 'Información', icon: iconos.perfil, route: `/usuarios/${slugUsuario}` },
    { label: 'Publicaciones', icon: iconos.publicaciones, route: `/usuarios/${slugUsuario}/publicaciones` },
    { label: 'Grabaciones', icon: iconos.grabaciones, route: `/usuarios/${slugUsuario}/grabaciones` },
    { label: 'Actividad', icon: iconos.actividad, route: `/usuarios/${slugUsuario}/actividad` }
  ] : [
    { label: 'Perfil', icon: iconos.perfil, route: '/mi-perfil' },
    { label: 'Mis Cursos', icon: iconos.cursos, route: '/mis-cursos' },
    { label: 'Eventos', icon: iconos.eventos, route: '/mis-eventos' },
    { label: 'Publicaciones', icon: iconos.publicaciones, route: '/publicaciones' },
    { label: 'Grabaciones', icon: iconos.grabaciones, route: '/grabaciones' },
    { label: 'Configuración', icon: iconos.configuracion, route: '/configuracion' }
  ]
  let indiceActivo = pestañas.findIndex(p => p.route === location.pathname)
  if (indiceActivo === -1) indiceActivo = pestañas.findIndex(p => location.pathname.startsWith(p.route))
  if (indiceActivo === -1) indiceActivo = 0

  const contenedorNav = useRef<HTMLDivElement>(null)
  const [puedeIzq, setPuedeIzq] = useState(false)
  const [puedeDer, setPuedeDer] = useState(false)
  function actualizarScroll() {
    const el = contenedorNav.current
    if (!el) return
    setPuedeIzq(el.scrollLeft > 0)
    setPuedeDer(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }
  function scroll(dir: 'izq' | 'der') {
    const el = contenedorNav.current
    if (!el) return
    const delta = el.clientWidth * 0.7
    el.scrollTo({ left: dir === 'izq' ? el.scrollLeft - delta : el.scrollLeft + delta, behavior: 'smooth' })
  }
  useEffect(() => { setTimeout(actualizarScroll, 100); window.addEventListener('resize', actualizarScroll); return () => window.removeEventListener('resize', actualizarScroll) }, [])

  return (
    <div className={`perfil-tabs-contenedor-wrapper ${modalAbierto ? 'perfil-tabs-modal-abierto' : ''}`}>
      <div className="perfil-tabs-nav-container-interno">
        <button className={`perfil-tabs-boton-scroll perfil-tabs-izquierda ${puedeIzq ? 'perfil-tabs-visible' : ''}`} aria-label="Desplazar a la izquierda" onClick={() => scroll('izq')}>
          <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <nav className="perfil-tabs-navegacion" ref={contenedorNav} onScroll={actualizarScroll}>
          {pestañas.map((p, i) => (
            <Link key={p.route} to={p.route} className={`perfil-tabs-item ${indiceActivo === i ? 'perfil-tabs-activo' : ''}`} aria-label={p.label} role="tab">
              <div className="perfil-tabs-contenido">
                {p.icon && <div className="perfil-tabs-icono" dangerouslySetInnerHTML={{ __html: p.icon }} />}
                <span className="perfil-tabs-etiqueta">{p.label}</span>
              </div>
            </Link>
          ))}
        </nav>
        <button className={`perfil-tabs-boton-scroll perfil-tabs-derecha ${puedeDer ? 'perfil-tabs-visible' : ''}`} aria-label="Desplazar a la derecha" onClick={() => scroll('der')}>
          <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  )
}
