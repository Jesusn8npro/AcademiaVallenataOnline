import React, { useEffect, useMemo, useState } from 'react'
import './EncabezadoLeccion.css'
import BarraProgresoGeneral from './BarraProgresoGeneral'
import BarraLateralCurso from './BarraLateralCurso'
import { supabase } from '../../servicios/supabaseCliente'

type TipoContenido = 'leccion' | 'clase'

interface EncabezadoLeccionProps {
  cursoTitulo: string
  leccionTitulo: string
  cursoId: string
  leccionId: string
  tipo?: TipoContenido
  mostrarSidebar?: boolean
  onToggleSidebar?: () => void
  curso?: any
  moduloActivo?: string
  progreso?: any
  estadisticasProgreso?: { completadas: number; total: number; porcentaje: number }
  usuarioActual?: any
  leccionAnterior?: any
  leccionSiguiente?: any
}

function generarSlugBase(texto: string) {
  return (texto || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const EncabezadoLeccion: React.FC<EncabezadoLeccionProps> = ({
  cursoTitulo,
  leccionTitulo,
  cursoId,
  leccionId,
  tipo = 'clase',
  mostrarSidebar = true,
  onToggleSidebar = () => { },
  curso = null,
  moduloActivo = '',
  progreso = {},
  estadisticasProgreso = { completadas: 0, total: 0, porcentaje: 0 },
  usuarioActual = null,
  leccionAnterior = null,
  leccionSiguiente = null
}) => {
  const [esPantallaCompleta, setEsPantallaCompleta] = useState(false)
  const [desplazado, setDesplazado] = useState(false)
  const [esDesktop, setEsDesktop] = useState(true)
  const [sidebarMovilAbierta, setSidebarMovilAbierta] = useState(false)
  const [menuOpcionesAbierto, setMenuOpcionesAbierto] = useState(false)
  const [modalAvancesAbierto, setModalAvancesAbierto] = useState(false)

  const cursoSlug = useMemo(() => {
    if (!curso) return cursoId
    return curso.slug || (curso.titulo ? generarSlugBase(curso.titulo) : cursoId)
  }, [curso, cursoId])

  const urlCurso = useMemo(() => {
    return tipo === 'leccion' ? `/mis-cursos/${cursoSlug}` : `/tutoriales/${cursoSlug}/contenido`
  }, [tipo, cursoSlug])

  const { leccionActual, totalLecciones } = useMemo(() => {
    let total = 1
    let actual = 1
    if (curso && tipo === 'leccion' && Array.isArray(curso.modulos)) {
      let contador = 0
      for (const modulo of curso.modulos) {
        if (Array.isArray(modulo.lecciones)) {
          for (const leccion of modulo.lecciones) {
            contador++
            if (String(leccion.id) === String(leccionId) || String(leccion.slug) === String(leccionId)) {
              actual = contador
            }
          }
        }
      }
      total = contador || 1
    } else if (curso && tipo === 'clase') {
      const posiblesListas = [
        curso.clases_tutorial,
        curso.clases,
        curso.partes_tutorial,
        curso.partes
      ].find((arr: any) => Array.isArray(arr) && arr.length > 0) || []
      total = posiblesListas.length || 1
      const idx = posiblesListas.findIndex((c: any) => String(c.id) === String(leccionId) || String(c.slug) === String(leccionId))
      actual = idx >= 0 ? idx + 1 : 1
    }
    return { leccionActual: actual, totalLecciones: total }
  }, [curso, tipo, leccionId])

  useEffect(() => {
    function actualizarTamano() {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200
      setEsDesktop(w > 1024)
    }
    function actualizarScroll() {
      const y = typeof window !== 'undefined' ? window.scrollY : 0
      setDesplazado(y > 8)
    }
    function actualizarPantallaCompleta() {
      const elem = typeof document !== 'undefined' ? (document as any).fullscreenElement || (document as any).webkitFullscreenElement : null
      setEsPantallaCompleta(!!elem)
    }
    actualizarTamano()
    actualizarScroll()
    actualizarPantallaCompleta()
    window.addEventListener('resize', actualizarTamano)
    window.addEventListener('scroll', actualizarScroll)
    document.addEventListener('fullscreenchange', actualizarPantallaCompleta)
    return () => {
      window.removeEventListener('resize', actualizarTamano)
      window.removeEventListener('scroll', actualizarScroll)
      document.removeEventListener('fullscreenchange', actualizarPantallaCompleta)
    }
  }, [])

  function alternarPantallaCompleta() {
    if (typeof document === 'undefined') return
    try {
      const doc: any = document
      const docEl: any = document.documentElement
      const isNativeFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement)
      const hasImmersive = document.body.classList.contains('modo-inmersivo')

      if (isNativeFs) {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen
        if (typeof exit === 'function') exit.call(doc)
        setEsPantallaCompleta(false)
      } else if (hasImmersive) {
        document.body.classList.remove('modo-inmersivo')
        setEsPantallaCompleta(false)
      } else {
        const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen
        if (typeof req === 'function') {
          req.call(docEl)
        } else {
          document.body.classList.add('modo-inmersivo')
          setEsPantallaCompleta(true)
        }
      }
    } catch {
      const hasImmersive = document.body.classList.contains('modo-inmersivo')
      if (hasImmersive) {
        document.body.classList.remove('modo-inmersivo')
        setEsPantallaCompleta(false)
      } else {
        document.body.classList.add('modo-inmersivo')
        setEsPantallaCompleta(true)
      }
    }
  }

  function compartir() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if ((navigator as any).share) {
      ; (navigator as any).share({ title: leccionTitulo, text: cursoTitulo, url })
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
    }
  }

  async function cerrarSesion() {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch { }
  }

  function navegarA(ruta: string) {
    window.location.href = ruta
  }

  function navegarLeccion(destino: any) {
    if (!destino) return
    if (tipo === 'clase') {
      const claseSlug = destino.slug || generarSlugBase(destino.titulo)
      const rutaDestino = `/tutoriales/${cursoSlug}/clase/${claseSlug}`
      window.location.href = rutaDestino
    } else {
      const moduloSlug = destino.modulo?.slug || generarSlugBase(destino.modulo?.titulo || '')
      const leccionSlug = destino.slug || generarSlugBase(destino.titulo)
      if (cursoSlug && moduloSlug && leccionSlug) {
        window.location.href = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`
      }
    }
  }

  return (
    <>
      <header className={`encabezado-leccion${desplazado ? ' desplazado' : ''}`}>
        <div className="lado-izquierdo">
          {!esDesktop && (
            <button className="btn-sidebar-movil" aria-label="Mostrar menú del curso" type="button" onClick={() => setSidebarMovilAbierta(true)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <a href="/" className="enlace-logo">
            <img src="/imagenes/logo academia vallenata.png" alt="Academia Vallenata" className="logo" />
          </a>

          {esDesktop ? (
            <div className="info-curso">
              <div className="migajas">
                <a href={urlCurso} className="curso-titulo-migaja" title="Ver información del curso">
                  {cursoTitulo}
                </a>
                <span className="separador-migaja">▶</span>
                <span className="contador-leccion">{tipo === 'leccion' ? 'Lección' : 'Clase'} {leccionActual} de {totalLecciones}</span>
              </div>
              <h1 className="titulo-leccion-desktop">{leccionTitulo}</h1>
            </div>
          ) : (
            <>
              <div className="info-curso-tablet">
                <a href={urlCurso} className="curso-titulo" title="Ver información del curso">{cursoTitulo}</a>
                <span className="barra">|</span>
                <span className="leccion-titulo"><span className="etiqueta">{tipo === 'leccion' ? 'Lección:' : 'Clase:'}</span> {leccionTitulo}</span>
              </div>
              <div className="info-mobile-platzi">
                <div className="clase-contador">{tipo === 'leccion' ? 'Lección' : 'Clase'} {leccionActual} de {totalLecciones}</div>
                <div className="leccion-titulo-mobile">{leccionTitulo}</div>
              </div>
            </>
          )}
        </div>

        <div className="lado-derecho">
          <div className="mini-nav desktop-solo">
            <button className="mini-nav-btn" type="button" onClick={() => navegarLeccion(leccionAnterior)} disabled={!leccionAnterior} aria-label={tipo === 'leccion' ? 'Lección anterior' : 'Clase anterior'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button className="mini-nav-btn" type="button" onClick={() => navegarLeccion(leccionSiguiente)} disabled={!leccionSiguiente} aria-label={tipo === 'leccion' ? 'Siguiente lección' : 'Siguiente clase'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          <div className="progress-wrapper" onClick={() => setModalAvancesAbierto(true)} role="button" aria-label="Ver detalles de avances" tabIndex={0}>
            <div className="progress-label-mobile">Tus avances</div>
            <BarraProgresoGeneral
              tipo={tipo === 'leccion' ? 'curso' : 'tutorial'}
              contenidoId={cursoId}
              completadas={estadisticasProgreso.completadas}
              total={estadisticasProgreso.total}
              porcentaje={estadisticasProgreso.porcentaje}
            />
          </div>

          {/* Opciones en móvil */}
          <div className="options-container mobile-only">
            <button className="options-btn" type="button" onClick={() => setMenuOpcionesAbierto((v) => !v)} aria-label="Opciones" title="Más opciones">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>

          <button className="header-btn fullscreen-btn desktop-only" type="button" aria-label="Pantalla completa" title="Pantalla completa" onClick={alternarPantallaCompleta}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 9 4 4 9 4" /><polyline points="20 9 20 4 15 4" />
              <polyline points="15 20 20 20 20 15" /><polyline points="9 20 4 20 4 15" />
            </svg>
          </button>

          <div className="actions-container desktop-only">
            <button className="toggle-sidebar-btn" type="button" onClick={onToggleSidebar} aria-label={mostrarSidebar ? 'Ocultar contenido del curso' : 'Mostrar contenido del curso'} title={mostrarSidebar ? 'Ocultar contenido' : 'Ver contenido'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              <span className="toggle-text">{mostrarSidebar ? 'Ocultar contenido' : 'Ver contenido'}</span>
            </button>
            <div className="options-container">
              <button className="options-btn" type="button" onClick={() => setMenuOpcionesAbierto((v) => !v)} aria-label="Opciones" title="Más opciones">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </div>
          </div>

          {menuOpcionesAbierto && (
            <div className="menu-opciones" role="menu">
              <button className="item-opcion" type="button" onClick={alternarPantallaCompleta}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" /></svg>
                {esPantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
              </button>
              <button className="item-opcion" type="button" onClick={() => setModalAvancesAbierto(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z" /></svg>
                Avances
              </button>
              <button className="item-opcion" type="button" onClick={compartir}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8h16v-8M12 16V4m0 0l-4 4m4-4l4 4" /></svg>
                Compartir
              </button>
              <button className="item-opcion" type="button" onClick={() => navegarA('/cursos')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                Cursos
              </button>
              <button className="item-opcion peligro" type="button" onClick={cerrarSesion}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /></svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {sidebarMovilAbierta && !esDesktop && (
        <div className="sidebar-mobile-overlay" onClick={() => setSidebarMovilAbierta(false)}>
          <div className="sidebar-mobile-panel" onClick={(e) => e.stopPropagation()}>
            <BarraLateralCurso
              curso={curso}
              moduloActivo={moduloActivo}
              leccionActiva={leccionId}
              progreso={progreso}
              tipo={tipo === 'leccion' ? 'curso' : 'tutorial'}
              mostrarSidebar={true}
              onCerrarSidebar={() => setSidebarMovilAbierta(false)}
            />
          </div>
        </div>
      )}

      {modalAvancesAbierto && (
        <div className="modal-avances-overlay" onClick={() => setModalAvancesAbierto(false)}>
          <div className="modal-avances" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Avances</h3>
              <button className="cerrar-modal" type="button" onClick={() => setModalAvancesAbierto(false)} aria-label="Cerrar">✕</button>
            </div>
            <div className="modal-body">
              <div className="avances-info">
                <h4>{cursoTitulo}</h4>
                <div className="avances-stats">
                  <div className="stat-item">
                    <div className="stat-label">Progreso general</div>
                    <BarraProgresoGeneral tipo={tipo === 'leccion' ? 'curso' : 'tutorial'} contenidoId={cursoId} />
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">{tipo === 'leccion' ? 'Lección' : 'Clase'} actual</div>
                    <div className="stat-value">{tipo === 'leccion' ? 'Lección' : 'Clase'} {leccionActual} de {totalLecciones}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EncabezadoLeccion
