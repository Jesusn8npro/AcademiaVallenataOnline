import React, { useEffect, useMemo, useState } from 'react'
import './WizardContenido.css'
import PasoInformacionGeneral from './PasoInformacionGeneral'
import GestorEstructuraContenido from './GestorEstructuraContenido'
import PasoResumenGuardar from './PasoResumenGuardar'

interface Props {
  tipo: 'curso' | 'tutorial'
  datosIniciales?: any
  estructuraInicial?: any[]
  onBack?: () => void
  tituloEdicion?: string
  modoEdicion?: boolean
}

export default function WizardContenido({ tipo: tipoProp, datosIniciales, estructuraInicial, onBack, tituloEdicion, modoEdicion: modoEdicionProp }: Props) {
  const [tipo, setTipo] = useState<'curso' | 'tutorial'>(tipoProp || 'tutorial')
  const [pasoActual, setPasoActual] = useState(1)
  const [animandoCambio, setAnimandoCambio] = useState(false)
  const [datosGenerales, setDatosGenerales] = useState<any>({})
  const [estructuraContenido, setEstructuraContenido] = useState<any[]>([])
  const [cursoCreado, setCursoCreado] = useState<any>(null)

  const modoEdicion = modoEdicionProp ?? !!(datosIniciales && (datosIniciales.id || datosIniciales.slug))

  // ... (rest of useEffects same as before)
  // Actualizar datos cuando llegan los iniciales
  useEffect(() => {
    if (datosIniciales && Object.keys(datosIniciales).length > 0) {
      setDatosGenerales({ ...datosIniciales });
    }
  }, [datosIniciales])

  useEffect(() => {
    if (estructuraInicial && estructuraInicial.length > 0) {
      setEstructuraContenido([...estructuraInicial]);
    }
  }, [estructuraInicial])

  // ... (useMemo pasos same as before)
  const pasos = useMemo(() => {
    return tipo === 'curso'
      ? [
        { id: 1, titulo: '📝 Información General', descripcion: 'Datos básicos del curso' },
        { id: 2, titulo: '📚 Módulos y Lecciones', descripcion: 'Estructura educativa' },
        { id: 3, titulo: '💾 Resumen y Guardado', descripcion: 'Revisión final y guardar' },
        { id: 4, titulo: '🎉 Finalización', descripcion: 'Proceso completado' }
      ]
      : [
        { id: 1, titulo: '📝 Información General', descripcion: 'Datos básicos del tutorial' },
        { id: 2, titulo: '🎬 Estructura del Contenido', descripcion: 'Partes y organización' },
        { id: 3, titulo: '💾 Resumen y Guardado', descripcion: 'Revisión final y guardar' },
        { id: 4, titulo: '🎉 Finalización', descripcion: 'Proceso completado' }
      ]
  }, [tipo])

  const totalPasos = pasos.length
  const porcentajeProgreso = ((pasoActual - 1) / (totalPasos - 1)) * 100

  async function cambiarPaso(nuevoPaso: number) {
    if (nuevoPaso < 1 || nuevoPaso > totalPasos || nuevoPaso === pasoActual) return
    setAnimandoCambio(true)
    await new Promise(r => setTimeout(r, 150))
    setPasoActual(nuevoPaso)
    await new Promise(r => setTimeout(r, 150))
    setAnimandoCambio(false)
  }
  function avanzarPaso() { if (pasoActual < totalPasos) cambiarPaso(pasoActual + 1) }
  function retrocederPaso() { if (pasoActual > 1) cambiarPaso(pasoActual - 1) }

  function cambiarTipoContenido(nuevoTipo: 'curso' | 'tutorial') {
    if (tipo === nuevoTipo || pasoActual > 1) return
    setTipo(nuevoTipo)
    setPasoActual(1)
    setDatosGenerales({})
    setEstructuraContenido([])
    setCursoCreado(null)
  }

  function manejarDatosGenerales(datos: any) { setDatosGenerales(datos); avanzarPaso() }
  function manejarEstructura(datos: any[]) { setEstructuraContenido(datos); avanzarPaso() }
  function manejarGuardado(finalData: any) { setCursoCreado(finalData); setPasoActual(4) }

  return (
    <div className="wizard-futurista">
      <header className="wizard-header">
        <div className="header-top-bar">
          {onBack && (
            <button className="wizard-btn-panel" onClick={onBack} title="Volver al Panel">
              <span className="icono">📊</span>
              <span>Panel</span>
            </button>
          )}

          {modoEdicion && (
            <div className="wizard-status-badge">
              <span className="dot"></span>
              MODO EDICIÓN
            </div>
          )}
        </div>

        <div className="header-content">
          <h1 className="titulo-principal">
            <span className="icono-creator">🚀</span>
            <span className="texto-titulo">{tituloEdicion || 'Creator Studio'}</span>
            <span className="subtitulo">Sistema Avanzado de Creación de Contenido</span>
          </h1>

          <div className="selector-tipo">
            <button className={`tipo-btn ${tipo === 'tutorial' ? 'activo' : ''}`} onClick={() => cambiarTipoContenido('tutorial')} disabled={pasoActual > 1}>
              <span className="icono">🎥</span>
              Tutorial
            </button>
            <button className={`tipo-btn ${tipo === 'curso' ? 'activo' : ''}`} onClick={() => cambiarTipoContenido('curso')} disabled={pasoActual > 1}>
              <span className="icono">🎓</span>
              Curso
            </button>
          </div>
        </div>
      </header>

      <div className="indicador-progreso">
        <div className="barra-progreso"><div className="progreso-fill" style={{ width: `${porcentajeProgreso}%` }}></div></div>
        <span className="texto-progreso">Paso {pasoActual} de {totalPasos}</span>
      </div>

      <nav className="navegacion-pasos">
        {pasos.map(paso => (
          <button key={paso.id} className={`paso-boton ${pasoActual === paso.id ? 'activo' : ''} ${pasoActual > paso.id ? 'completado' : ''}`} onClick={() => cambiarPaso(paso.id)}>
            <div className="numero-paso">
              {pasoActual > paso.id ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : paso.id}
            </div>
            <div className="info-paso">
              <span className="titulo-paso">{paso.titulo}</span>
              <span className="descripcion-paso">{paso.descripcion}</span>
            </div>
          </button>
        ))}
      </nav>

      <main className={`contenido-paso ${animandoCambio ? 'animando' : ''}`}>
        {pasoActual === 1 && (
          <PasoInformacionGeneral
            key={datosIniciales?.id || 'nuevo'}
            tipo={tipo}
            datos={datosGenerales}
            onContinuar={manejarDatosGenerales}
          />
        )}
        {pasoActual === 2 && (
          <GestorEstructuraContenido
            key={datosIniciales?.id || 'nuevo'}
            tipo={tipo}
            datosGenerales={datosGenerales}
            estructura={estructuraContenido}
            onContinuar={manejarEstructura}
          />
        )}
        {pasoActual === 3 && (
          <PasoResumenGuardar tipo={tipo} datosGenerales={datosGenerales} estructura={estructuraContenido} modoEdicion={modoEdicion} idContenido={datosIniciales?.id} onGuardado={manejarGuardado} />
        )}
        {pasoActual === 4 && (
          <div className="paso-final">
            <div className="exito-container">
              <div className="exito-circulo"><div className="check-icon">✓</div></div>
              <h2 className="exito-titulo">¡{tipo === 'curso' ? 'Curso' : 'Tutorial'} Creado Exitosamente!</h2>
              <p className="exito-descripcion">Tu {tipo} "{datosGenerales.titulo}" ha sido guardado correctamente en la base de datos.</p>
              <div className="acciones-finales">
                <a href={`/${tipo === 'curso' ? 'cursos' : 'tutoriales'}/${cursoCreado ? (tipo === 'curso' ? cursoCreado.slug : cursoCreado.titulo?.toLowerCase().replace(/\s+/g, '-')) : 'nuevo-contenido'}`} className="btn-ver-contenido" target="_blank">
                  <span className="icono">👁️</span>
                  Ver {tipo === 'curso' ? 'Curso' : 'Tutorial'}
                </a>
                <button className="btn-crear-otro" onClick={() => { setPasoActual(1); setDatosGenerales({}); setEstructuraContenido([]); setCursoCreado(null) }}>
                  <span className="icono">➕</span>
                  Crear Otro {tipo === 'curso' ? 'Curso' : 'Tutorial'}
                </button>
                <a href="/administrador/panel-contenido" className="btn-panel"><span className="icono">📊</span>Ir al Panel</a>
              </div>
            </div>
          </div>
        )}
      </main>

      {pasoActual < totalPasos && (
        <footer className="controles-navegacion">
          <button className={`boton-navegacion anterior ${pasoActual === 1 ? 'deshabilitado' : ''}`} onClick={retrocederPaso} disabled={pasoActual === 1}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Anterior
          </button>
          <button className={`boton-navegacion siguiente ${pasoActual === totalPasos ? 'deshabilitado' : ''}`} onClick={avanzarPaso} disabled={pasoActual === totalPasos}>
            Siguiente
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </footer>
      )}
    </div>
  )
}
