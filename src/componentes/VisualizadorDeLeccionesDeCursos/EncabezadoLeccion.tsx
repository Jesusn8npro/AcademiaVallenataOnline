import React from 'react'
import './EncabezadoLeccion.css'
import BarraProgresoGeneral from './BarraProgresoGeneral'
import BarraLateralCurso from './BarraLateralCurso'
import { useEncabezadoLeccion } from './useEncabezadoLeccion'
import { useUsuario } from '../../contextos/UsuarioContext'

type TipoContenido = 'leccion' | 'clase'

interface EncabezadoLeccionProps {
  cursoTitulo: string
  leccionTitulo: string
  cursoId: string
  leccionId: string
  tipo?: TipoContenido
  mostrarSidebar?: boolean
  onToggleSidebar?: () => void
  mostrarAcordeon?: boolean
  onToggleAcordeon?: () => void
  obtenerTiempoVideo?: () => number
  curso?: any
  moduloActivo?: string
  progreso?: any
  estadisticasProgreso?: { completadas: number; total: number; porcentaje: number }
  usuarioActual?: any
  leccionAnterior?: any
  leccionSiguiente?: any
}

const IconoAcordeon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="1.5" />
    <line x1="7" y1="6" x2="7" y2="18" />
    <line x1="11" y1="6" x2="11" y2="18" />
    <line x1="15" y1="6" x2="15" y2="18" />
    <circle cx="6" cy="20" r="0.6" fill="currentColor" />
    <circle cx="18" cy="20" r="0.6" fill="currentColor" />
  </svg>
)

const EncabezadoLeccion: React.FC<EncabezadoLeccionProps> = ({
  cursoTitulo,
  leccionTitulo,
  cursoId,
  leccionId,
  tipo = 'clase',
  mostrarSidebar = true,
  onToggleSidebar = () => { },
  mostrarAcordeon = false,
  onToggleAcordeon = () => { },
  obtenerTiempoVideo,
  curso = null,
  moduloActivo = '',
  progreso = {},
  estadisticasProgreso = { completadas: 0, total: 0, porcentaje: 0 },
  usuarioActual = null,
  leccionAnterior = null,
  leccionSiguiente = null
}) => {
  const {
    esPantallaCompleta, desplazado, esDesktop,
    sidebarMovilAbierta, setSidebarMovilAbierta,
    menuOpcionesAbierto, setMenuOpcionesAbierto,
    modalAvancesAbierto, setModalAvancesAbierto,
    urlCurso, leccionActual, totalLecciones,
    alternarPantallaCompleta, compartir, cerrarSesion, navegarA, navegarLeccion,
  } = useEncabezadoLeccion({ cursoId, leccionId, tipo, curso, cursoTitulo, leccionTitulo })

  // Acordeón embebido en la clase: por ahora solo lo ven administradores mientras
  // afinamos la experiencia. Una vez listo se libera al resto de roles.
  const { usuario } = useUsuario()
  const esAdmin = usuario?.rol === 'admin'

  // Mobile abre el simulador con ?volverA=... para que el simulador muestre el botón
  // "Volver a la clase" y reanude el video en el segundo en que el alumno lo dejó.
  const irAlSimuladorMovil = () => {
    const tiempo = Math.max(0, Math.floor(obtenerTiempoVideo?.() ?? 0))
    const urlActual = window.location.pathname + window.location.search
    const params = new URLSearchParams({ volverA: urlActual })
    if (tiempo > 0) params.set('t', String(tiempo))
    navegarA(`/simulador-app?${params.toString()}`)
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
            <img src="/logo academia vallenata.png" alt="Academia Vallenata" className="logo" />
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
              completadas={estadisticasProgreso.completadas}
              total={estadisticasProgreso.total}
              porcentaje={estadisticasProgreso.porcentaje}
            />
          </div>

          {esAdmin && (
            <button className="header-btn acordeon-btn mobile-only" type="button" onClick={irAlSimuladorMovil} aria-label="Abrir acordeón virtual" title="Abrir acordeón virtual">
              <IconoAcordeon size={20} />
            </button>
          )}

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
            {esAdmin && (
              <button
                className={`toggle-acordeon-btn ${mostrarAcordeon ? 'activo' : ''}`}
                type="button"
                onClick={onToggleAcordeon}
                aria-label={mostrarAcordeon ? 'Cerrar acordeón virtual' : 'Abrir acordeón virtual'}
                title={mostrarAcordeon ? 'Cerrar acordeón' : 'Abrir acordeón virtual'}
              >
                <IconoAcordeon size={18} />
                <span className="toggle-text">{mostrarAcordeon ? 'Cerrar acordeón' : 'Ver acordeón'}</span>
              </button>
            )}
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
                    <BarraProgresoGeneral tipo={tipo === 'leccion' ? 'curso' : 'tutorial'} />
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
