import React, { useState, useEffect } from 'react'
import { supabase } from '../../servicios/supabaseCliente'
import './InfoPestanaPerfil.css'

interface Perfil {
  id: string
  nombre?: string
  apellido?: string
  nombre_completo?: string
  nombre_usuario?: string
  biografia?: string
  fecha_nacimiento?: string
  profesion?: string
  pais?: string
  ciudad?: string
  direccion_completa?: string
  whatsapp?: string
  instrumento?: string
  nivel_habilidad?: string
  ano_experiencia?: number
  estilo_favorito?: string
  estudios_musicales?: string
  objetivo_aprendizaje?: string
  documento_tipo?: string
  documento_numero?: string
  como_nos_conocio?: string
  [key: string]: any
}

interface Props {
  perfil: Perfil
  onActualizar: (parcial: Partial<Perfil>) => void
}

const paisesComunes = [
  { codigo: '+57', nombre: 'Colombia', bandera: '🇨🇴' },
  { codigo: '+58', nombre: 'Venezuela', bandera: '🇻🇪' },
  { codigo: '+507', nombre: 'Panamá', bandera: '🇵🇦' },
  { codigo: '+1', nombre: 'Estados Unidos', bandera: '🇺🇸' },
  { codigo: '+52', nombre: 'México', bandera: '🇲🇽' },
  { codigo: '+54', nombre: 'Argentina', bandera: '🇦🇷' },
  { codigo: '+34', nombre: 'España', bandera: '🇪🇸' }
]

export default function InfoPestanaPerfil({ perfil, onActualizar }: Props) {
  const [form, setForm] = useState<Perfil>(perfil)
  const [guardando, setGuardando] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState('personal')

  const [indicativoSeleccionado, setIndicativoSeleccionado] = useState('+57')
  const [numeroWhatsapp, setNumeroWhatsapp] = useState('')

  useEffect(() => {
    setForm(perfil)
    if (perfil.whatsapp) {
      const whatsapp = perfil.whatsapp.toString()
      let encontrado = false
      for (const pais of paisesComunes) {
        if (whatsapp.startsWith(pais.codigo)) {
          setIndicativoSeleccionado(pais.codigo)
          setNumeroWhatsapp(whatsapp.substring(pais.codigo.length))
          encontrado = true
          break
        }
      }
      if (!encontrado) {
        setNumeroWhatsapp(whatsapp)
      }
    }
  }, [perfil])

  function toggleSeccion(nombre: string) {
    setSeccionActiva(prev => prev === nombre ? '' : nombre)
  }

  function cambiar(campo: string, valor: any) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)

    try {
      const datosActualizados = { ...form }

      // Procesar WhatsApp
      if (numeroWhatsapp) {
        datosActualizados.whatsapp = indicativoSeleccionado + numeroWhatsapp
      }

      // Procesar Nombre Completo
      if (datosActualizados.nombre || datosActualizados.apellido) {
        datosActualizados.nombre_completo = `${datosActualizados.nombre || ''} ${datosActualizados.apellido || ''}`.trim()
      }

      const { error } = await supabase
        .from('perfiles')
        .update(datosActualizados)
        .eq('id', perfil.id)

      if (error) throw error

      onActualizar(datosActualizados)
      alert('¡Perfil actualizado correctamente!')
    } catch (error: any) {
      console.error('Error al guardar:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="ipp-info-perfil">
      <div className="ipp-formulario-perfil">
        <form onSubmit={guardar}>

          {/* SECCIÓN: Información Personal */}
          <div className="ipp-seccion-acordeon">
            <button type="button" className="ipp-header-seccion" onClick={() => toggleSeccion('personal')}>
              <div className="ipp-titulo-wrapper">
                <div className="ipp-icono-seccion">👤</div>
                <h2 className="ipp-titulo-seccion">Información Personal</h2>
              </div>
              <div className={`ipp-icono-cheveron ${seccionActiva === 'personal' ? 'ipp-rotado' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </button>

            {seccionActiva === 'personal' && (
              <div className="ipp-contenido-seccion">
                <div className="ipp-grid-form ipp-grid-3-columnas">
                  <div className="ipp-campo">
                    <label htmlFor="nombre">Nombre</label>
                    <input id="nombre" type="text" value={form.nombre || ''} onChange={e => cambiar('nombre', e.target.value)} placeholder="Tu nombre" className="ipp-input-principal" />
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="apellido">Apellido</label>
                    <input id="apellido" type="text" value={form.apellido || ''} onChange={e => cambiar('apellido', e.target.value)} placeholder="Tu apellido" className="ipp-input-principal" />
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="nombre_usuario">Usuario</label>
                    <input id="nombre_usuario" type="text" value={form.nombre_usuario || ''} onChange={e => cambiar('nombre_usuario', e.target.value)} placeholder="@usuario" className="ipp-input-principal" />
                  </div>
                  <div className="ipp-campo ipp-campo-completo">
                    <label htmlFor="biografia">Biografía</label>
                    <textarea id="biografia" value={form.biografia || ''} onChange={e => cambiar('biografia', e.target.value)} placeholder="Cuéntanos sobre ti..." className="ipp-textarea-principal" rows={3}></textarea>
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
                    <input id="fecha_nacimiento" type="date" value={form.fecha_nacimiento || ''} onChange={e => cambiar('fecha_nacimiento', e.target.value)} className="ipp-input-principal" />
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="profesion">Profesión</label>
                    <input id="profesion" type="text" value={form.profesion || ''} onChange={e => cambiar('profesion', e.target.value)} placeholder="Tu profesión" className="ipp-input-principal" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN: Ubicación y Contacto */}
          <div className="ipp-seccion-acordeon">
            <button type="button" className="ipp-header-seccion" onClick={() => toggleSeccion('ubicacion')}>
              <div className="ipp-titulo-wrapper">
                <div className="ipp-icono-seccion">📍</div>
                <h2 className="ipp-titulo-seccion">Ubicación y Contacto</h2>
              </div>
              <div className={`ipp-icono-cheveron ${seccionActiva === 'ubicacion' ? 'ipp-rotado' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </button>

            {seccionActiva === 'ubicacion' && (
              <div className="ipp-contenido-seccion">
                <div className="ipp-grid-form ipp-grid-3-columnas">
                  <div className="ipp-campo">
                    <label htmlFor="pais">País</label>
                    <input id="pais" type="text" value={form.pais || ''} onChange={e => cambiar('pais', e.target.value)} placeholder="Tu país" className="ipp-input-principal" />
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="ciudad">Ciudad</label>
                    <input id="ciudad" type="text" value={form.ciudad || ''} onChange={e => cambiar('ciudad', e.target.value)} placeholder="Tu ciudad" className="ipp-input-principal" />
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="direccion">Dirección</label>
                    <input id="direccion" type="text" value={form.direccion_completa || ''} onChange={e => cambiar('direccion_completa', e.target.value)} placeholder="Dirección completa" className="ipp-input-principal" />
                  </div>
                </div>
                <div className="ipp-seccion-whatsapp">
                  <label className="ipp-whatsapp-label"><span className="ipp-icono-whatsapp">📱</span> WhatsApp</label>
                  <div className="ipp-whatsapp-container">
                    <select value={indicativoSeleccionado} onChange={e => setIndicativoSeleccionado(e.target.value)} className="ipp-select-indicativo">
                      {paisesComunes.map(pais => (
                        <option key={pais.codigo} value={pais.codigo}>{pais.bandera} {pais.codigo}</option>
                      ))}
                    </select>
                    <input type="tel" value={numeroWhatsapp} onChange={e => setNumeroWhatsapp(e.target.value)} placeholder="Número de WhatsApp" className="ipp-input-whatsapp" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN: Trayectoria Musical */}
          <div className="ipp-seccion-acordeon">
            <button type="button" className="ipp-header-seccion" onClick={() => toggleSeccion('trayectoria')}>
              <div className="ipp-titulo-wrapper">
                <div className="ipp-icono-seccion">🎵</div>
                <h2 className="ipp-titulo-seccion">Trayectoria Musical</h2>
              </div>
              <div className={`ipp-icono-cheveron ${seccionActiva === 'trayectoria' ? 'ipp-rotado' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </button>

            {seccionActiva === 'trayectoria' && (
              <div className="ipp-contenido-seccion">
                <div className="ipp-grid-form ipp-grid-3-columnas">
                  <div className="ipp-campo">
                    <label htmlFor="instrumento">Instrumento</label>
                    <select id="instrumento" value={form.instrumento || ''} onChange={e => cambiar('instrumento', e.target.value)} className="ipp-input-principal">
                      <option value="">Selecciona...</option>
                      <option value="acordeon">Acordeón</option>
                      <option value="caja">Caja</option>
                      <option value="guacharaca">Guacharaca</option>
                      <option value="bajo">Bajo</option>
                      <option value="guitarra">Guitarra</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="nivel_habilidad">Nivel</label>
                    <select id="nivel_habilidad" value={form.nivel_habilidad || ''} onChange={e => cambiar('nivel_habilidad', e.target.value)} className="ipp-input-principal">
                      <option value="">Selecciona...</option>
                      <option value="principiante">Principiante</option>
                      <option value="intermedio">Intermedio</option>
                      <option value="avanzado">Avanzado</option>
                      <option value="experto">Experto</option>
                    </select>
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="ano_experiencia">Años Exp.</label>
                    <input id="ano_experiencia" type="number" min="0" max="100" value={form.ano_experiencia || ''} onChange={e => cambiar('ano_experiencia', e.target.value)} placeholder="0" className="ipp-input-principal" />
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="estilo_favorito">Estilo Favorito</label>
                    <input id="estilo_favorito" type="text" value={form.estilo_favorito || ''} onChange={e => cambiar('estilo_favorito', e.target.value)} placeholder="Ej: Vallenato" className="ipp-input-principal" />
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="estudios_musicales">Estudios</label>
                    <input id="estudios_musicales" type="text" value={form.estudios_musicales || ''} onChange={e => cambiar('estudios_musicales', e.target.value)} placeholder="Ej: Autodidacta" className="ipp-input-principal" />
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="objetivo_aprendizaje">Objetivo</label>
                    <input id="objetivo_aprendizaje" type="text" value={form.objetivo_aprendizaje || ''} onChange={e => cambiar('objetivo_aprendizaje', e.target.value)} placeholder="¿Qué quieres lograr?" className="ipp-input-principal" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN: Información Adicional */}
          <div className="ipp-seccion-acordeon">
            <button type="button" className="ipp-header-seccion" onClick={() => toggleSeccion('adicional')}>
              <div className="ipp-titulo-wrapper">
                <div className="ipp-icono-seccion">📄</div>
                <h2 className="ipp-titulo-seccion">Información Adicional</h2>
              </div>
              <div className={`ipp-icono-cheveron ${seccionActiva === 'adicional' ? 'ipp-rotado' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </button>

            {seccionActiva === 'adicional' && (
              <div className="ipp-contenido-seccion">
                <div className="ipp-grid-form ipp-grid-3-columnas">
                  <div className="ipp-campo">
                    <label htmlFor="documento_tipo">Tipo de Documento</label>
                    <select id="documento_tipo" value={form.documento_tipo || ''} onChange={e => cambiar('documento_tipo', e.target.value)} className="ipp-input-principal">
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="TI">Tarjeta de Identidad</option>
                      <option value="PP">Pasaporte</option>
                    </select>
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="documento_numero">Número de Documento</label>
                    <input id="documento_numero" type="text" value={form.documento_numero || ''} onChange={e => cambiar('documento_numero', e.target.value)} placeholder="Número del documento" className="ipp-input-principal" />
                  </div>
                  <div className="ipp-campo">
                    <label htmlFor="como_nos_conocio">¿Cómo nos conociste?</label>
                    <select id="como_nos_conocio" value={form.como_nos_conocio || ''} onChange={e => cambiar('como_nos_conocio', e.target.value)} className="ipp-input-principal">
                      <option value="">Selecciona una opción...</option>
                      <option value="redes_sociales">Redes Sociales</option>
                      <option value="youtube">YouTube</option>
                      <option value="google">Google</option>
                      <option value="recomendacion">Recomendación</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón Guardar */}
          <div className="ipp-acciones-form">
            <button type="submit" className="ipp-btn-guardar" disabled={guardando}>
              {guardando ? (
                <>
                  <div className="ipp-spinner"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="ipp-icono-guardar">💾</span>
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
