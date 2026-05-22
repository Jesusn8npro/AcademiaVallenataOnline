'use client';

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../servicios/clienteSupabase'
import { useUsuario } from '../../contextos/UsuarioContext'
import { usePerfilStore } from '../../stores/perfilStore'
import './encabezado-perfil.css'
import ModalVisorImagenPerfil from './ModalVisorImagenPerfil'
import AvatarEditable from './AvatarEditable'
import PortadaEditable from './PortadaEditable'

interface Props {
  urlPortada?: string | null
  urlAvatar?: string | null
  nombreCompleto: string
  posicionPortadaY?: number
  userId?: string | null
  stats?: { puntaje: number; cursos: number; tutoriales: number; ranking: number; monedas: number }
  cargandoStats?: boolean
  nivelUsuario?: number
  rolUsuario?: string
  suscripcionUsuario?: string
  esPerfilPublico?: boolean
  fechaCreacion?: string | null
  slugUsuario?: string | null
  onModalStateChange?: (abierto: boolean) => void
}

const STAT_INFO: Record<string, { titulo: string; descripcion: string; comoGanar: string }> = {
  puntaje: {
    titulo: '⭐ Puntaje XP',
    descripcion: 'Tu puntuación de experiencia total acumulada en la plataforma. Los XP determinan tu nivel y posición en el ranking.',
    comoGanar: 'Completa lecciones de cursos y tutoriales, participa en la comunidad (publicaciones, comentarios, reacciones) y usa el simulador de acordeón.'
  },
  cursos: {
    titulo: '📚 Cursos',
    descripcion: 'Cantidad de cursos estructurados en los que estás inscrito.',
    comoGanar: 'Inscríbete en un curso desde la sección "Cursos & Tutoriales". Cada curso tiene múltiples lecciones progresivas desde lo básico hasta nivel avanzado.'
  },
  tutoriales: {
    titulo: '🎓 Tutoriales',
    descripcion: 'Tutoriales individuales de canciones o técnicas específicas en los que estás inscrito.',
    comoGanar: 'Adquiere tutoriales individuales o en paquetes desde la sección "Cursos & Tutoriales". Son lecciones cortas enfocadas en una canción o técnica puntual.'
  },
  ranking: {
    titulo: '🏆 Ranking',
    descripcion: 'Tu posición en el ranking general entre todos los estudiantes de la plataforma.',
    comoGanar: 'Acumula más Puntaje XP completando lecciones, manteniendo rachas de estudio y siendo activo en la comunidad. ¡Los más constantes lideran el ranking!'
  },
  monedas: {
    titulo: '🪙 Monedas',
    descripcion: 'Monedas virtuales de la academia que puedes acumular y canjear por recompensas.',
    comoGanar: 'Ganas monedas al completar lecciones, lograr rachas de estudio diario, participar en eventos y recibir reconocimientos de la comunidad. Próximamente podrás canjearlas por contenido exclusivo y descuentos.'
  }
}

export default function EncabezadoPerfil({
  urlPortada, urlAvatar, nombreCompleto, posicionPortadaY = 50, userId,
  stats = { puntaje: 0, cursos: 0, tutoriales: 0, ranking: 0, monedas: 0 },
  cargandoStats = false,
  nivelUsuario = 1, rolUsuario = 'Estudiante', suscripcionUsuario = 'Free',
  esPerfilPublico = false, fechaCreacion = null, slugUsuario = null, onModalStateChange
}: Props) {
  const [modalStatKey, setModalStatKey] = useState<string | null>(null)
  const [modalDetalle, setModalDetalle] = useState<{ titulo: string; progreso?: number }[]>([])
  const [modalDetalleCargando, setModalDetalleCargando] = useState(false)

  const abrirModalStat = useCallback((key: string) => setModalStatKey(key), [])
  const cerrarModalStat = useCallback(() => { setModalStatKey(null); setModalDetalle([]) }, [])

  useEffect(() => {
    if (modalStatKey) {
      document.body.classList.add('ep-stat-modal-abierto')
    } else {
      document.body.classList.remove('ep-stat-modal-abierto')
    }
    return () => document.body.classList.remove('ep-stat-modal-abierto')
  }, [modalStatKey])

  useEffect(() => {
    if (!modalStatKey || !userId) return
    if (modalStatKey !== 'cursos' && modalStatKey !== 'tutoriales') return

    setModalDetalleCargando(true)
    setModalDetalle([])

    const campo = modalStatKey === 'cursos' ? 'curso_id' : 'tutorial_id'
    const tabla = modalStatKey === 'cursos' ? 'cursos' : 'tutoriales'

    ;(async () => {
      try {
        const { data: inscripciones } = await supabase
          .from('inscripciones')
          .select(campo)
          .eq('usuario_id', userId)
          .not(campo, 'is', null)

        const ids = (inscripciones || []).map((row: any) => row[campo]).filter(Boolean)

        if (ids.length === 0) {
          setModalDetalle([])
          return
        }

        const { data: contenido } = await supabase
          .from(tabla)
          .select('titulo')
          .in('id', ids)

        setModalDetalle((contenido || []).map((item: any) => ({ titulo: item.titulo || 'Sin título' })))
      } catch {
        // silent
      } finally {
        setModalDetalleCargando(false)
      }
    })()
  }, [modalStatKey, userId])

  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState<'portada' | 'avatar' | 'posicion' | null>(null)
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)
  const [mostrarProximamente, setMostrarProximamente] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [imagenModalUrl, setImagenModalUrl] = useState('')
  const [imagenModalId, setImagenModalId] = useState<string | null>(null)
  const [tipoImagenModal, setTipoImagenModal] = useState<'avatar' | 'portada' | null>(null)
  const [urlAvatarLocal, setUrlAvatarLocal] = useState(urlAvatar)
  const [urlPortadaLocal, setUrlPortadaLocal] = useState(urlPortada)

  const { actualizarUsuario, usuario } = useUsuario()
  const { cargarDatosPerfil } = usePerfilStore()

  function mostrarMensajeFn(texto: string, tipo: 'portada' | 'avatar' | 'posicion') {
    setMensaje(texto)
    setTipoMensaje(tipo)
    setTimeout(() => { setMensaje(''); setTipoMensaje(null) }, 3000)
  }

  async function abrirModalImagen(tipo: 'avatar' | 'portada') {
    if (!userId) return
    const urlActual = tipo === 'avatar' ? urlAvatarLocal : urlPortadaLocal
    const { data: imagenData, error } = await supabase.from('usuario_imagenes').select('*').eq('usuario_id', userId).eq('tipo', tipo).eq('es_actual', true).single()
    let url = urlActual || ''
    let id: string | null = null
    if (error || !imagenData) {
      if (!url) return
      const { data: nuevaImagen } = await supabase.from('usuario_imagenes').insert({ usuario_id: userId, url_imagen: url, tipo, fecha_subida: new Date().toISOString(), es_actual: true }).select().single()
      id = nuevaImagen?.id || null
    } else { id = imagenData.id; url = imagenData.url_imagen }
    setImagenModalId(id); setImagenModalUrl(url); setTipoImagenModal(tipo); setModalAbierto(true); onModalStateChange?.(true)
  }

  async function iniciarChatPrivado() {
    try {
      setEnviandoMensaje(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !userId || user.id === userId) { window.location.href = '/mensajes'; setEnviandoMensaje(false); return }
      const { data: mis } = await supabase.from('miembros_chat').select('chat_id').eq('usuario_id', user.id).eq('estado_miembro', 'activo')
      const chatIds = (mis || []).map((m: { chat_id: string }) => m.chat_id)
      if (chatIds.length > 0) {
        const { data: comunes } = await supabase.from('miembros_chat').select('chat_id').in('chat_id', chatIds).eq('usuario_id', userId).eq('estado_miembro', 'activo')
        const existente = (comunes || [])[0] as { chat_id: string } | undefined
        if (existente?.chat_id) { window.location.href = `/mensajes/${existente.chat_id}`; setEnviandoMensaje(false); return }
      }
      const { data: nuevoChat } = await supabase.from('chats').insert({ es_grupal: false, activo: true, creado_por: user.id }).select().single()
      if (!nuevoChat?.id) { setEnviandoMensaje(false); return }
      await supabase.from('miembros_chat').insert([
        { chat_id: nuevoChat.id, usuario_id: user.id, estado_miembro: 'activo' },
        { chat_id: nuevoChat.id, usuario_id: userId, estado_miembro: 'activo' }
      ])
      window.location.href = `/mensajes/${nuevoChat.id}`
      setEnviandoMensaje(false)
    } catch { setEnviandoMensaje(false) }
  }

  function formatearFechaRegistro(fecha: string | null): string {
    if (!fecha) return `Miembro desde ${new Date().getFullYear()}`
    const d = new Date(fecha)
    return `Miembro desde ${d.toLocaleDateString('es-ES', { month: 'long' })} ${d.getFullYear()}`
  }

  async function handleAvatarCambiado(nuevaUrl: string) {
    setUrlAvatarLocal(nuevaUrl)
    if (userId === usuario?.id) actualizarUsuario({ url_foto_perfil: nuevaUrl })
    await cargarDatosPerfil(true)
    mostrarMensajeFn('¡Avatar actualizado!', 'avatar')
  }

  async function handlePortadaCambiada(nuevaUrl: string) {
    setUrlPortadaLocal(nuevaUrl)
    await cargarDatosPerfil(true)
  }

  return (
    <>
      <PortadaEditable
        urlPortada={urlPortadaLocal}
        posicionPortadaY={posicionPortadaY}
        userId={userId}
        onCambiarPortada={handlePortadaCambiada}
        onVerFoto={() => abrirModalImagen('portada')}
        onMensaje={mostrarMensajeFn}
      >
        <AvatarEditable
          urlFoto={urlAvatarLocal}
          nombreUsuario={nombreCompleto}
          userId={userId}
          onCambiarFoto={handleAvatarCambiado}
          onVerFoto={() => abrirModalImagen('avatar')}
        />
        {mensaje && (
          <div className={`ep-mensaje-flotante${tipoMensaje === 'avatar' ? ' ep-avatar' : ''}`}>{mensaje}</div>
        )}
      </PortadaEditable>

      <div className="ep-info-usuario">
        <div className="ep-seccion-estadisticas">
          <div className="ep-estadistica ep-estadistica-clickable" role="button" tabIndex={0} onClick={() => abrirModalStat('puntaje')} onKeyDown={e => e.key === 'Enter' && abrirModalStat('puntaje')}>
            <div className="ep-icono-estadistica ep-puntaje">⭐</div>
            <div className="ep-valor">{cargandoStats ? <span className="ep-valor-cargando" /> : stats.puntaje.toLocaleString('es-CO')}</div>
            <div className="ep-etiqueta">Puntaje XP</div>
          </div>
          {(cargandoStats || stats.cursos > 0) && (
            <div className="ep-estadistica ep-estadistica-clickable" role="button" tabIndex={0} onClick={() => abrirModalStat('cursos')} onKeyDown={e => e.key === 'Enter' && abrirModalStat('cursos')}>
              <div className="ep-icono-estadistica ep-curso">📚</div>
              <div className="ep-valor">{cargandoStats ? <span className="ep-valor-cargando" /> : stats.cursos}</div>
              <div className="ep-etiqueta">Cursos</div>
            </div>
          )}
          {(cargandoStats || stats.tutoriales > 0) && (
            <div className="ep-estadistica ep-estadistica-clickable" role="button" tabIndex={0} onClick={() => abrirModalStat('tutoriales')} onKeyDown={e => e.key === 'Enter' && abrirModalStat('tutoriales')}>
              <div className="ep-icono-estadistica ep-tutorial">🎓</div>
              <div className="ep-valor">{cargandoStats ? <span className="ep-valor-cargando" /> : stats.tutoriales}</div>
              <div className="ep-etiqueta">Tutoriales</div>
            </div>
          )}
          <div className="ep-estadistica ep-estadistica-clickable" role="button" tabIndex={0} onClick={() => abrirModalStat('ranking')} onKeyDown={e => e.key === 'Enter' && abrirModalStat('ranking')}>
            <div className="ep-icono-estadistica ep-ranking">🏆</div>
            <div className="ep-valor">{cargandoStats ? <span className="ep-valor-cargando" /> : (stats.ranking ? `#${stats.ranking}` : '--')}</div>
            <div className="ep-etiqueta">Ranking</div>
          </div>
          <div className="ep-estadistica ep-estadistica-clickable" role="button" tabIndex={0} onClick={() => abrirModalStat('monedas')} onKeyDown={e => e.key === 'Enter' && abrirModalStat('monedas')}>
            <div className="ep-icono-estadistica ep-monedas">🪙</div>
            <div className="ep-valor">{cargandoStats ? <span className="ep-valor-cargando" /> : Math.round(stats.monedas).toLocaleString('es-CO')}</div>
            <div className="ep-etiqueta">Monedas</div>
          </div>
        </div>
        <div className="ep-separador-vertical" />
        <div className="ep-seccion-central">
          <div className="ep-info-usuario-principal">
            <div className="ep-nombre-usuario">{nombreCompleto}</div>
            <div className="ep-estrellas-rating">
              <div className="ep-estrellas">{'★'.repeat(4)}{'☆'.repeat(1)}</div>
              <div className="ep-nivel-usuario">Nivel {nivelUsuario}</div>
            </div>
          </div>
          <div className="ep-badges-usuario">
            <span className="ep-badge ep-badge-rol">{rolUsuario}</span>
            <span className="ep-badge ep-badge-suscripcion">{suscripcionUsuario}</span>
          </div>
        </div>
        <div className="ep-seccion-accion">
          {esPerfilPublico ? (
            <>
              <div className="ep-info-perfil-publico">
                <div className="ep-fecha-registro">{formatearFechaRegistro(fechaCreacion)}</div>
              </div>
              <div className="ep-acciones-perfil-publico">
                <button className="ep-boton-mensaje" onClick={iniciarChatPrivado} disabled={enviandoMensaje}>{enviandoMensaje ? 'Enviando...' : '✉️ Mensaje'}</button>
                <button className="ep-boton-seguir" onClick={() => { setMostrarProximamente(true); setTimeout(() => setMostrarProximamente(false), 2000) }}>{mostrarProximamente ? 'Próximamente' : '➕ Seguir'}</button>
                <button className="ep-boton-publicaciones" onClick={() => slugUsuario && (window.location.href = `/usuarios/${slugUsuario}/publicaciones`)}>📝 Publicaciones</button>
              </div>
            </>
          ) : (
            <>
              <div className="ep-saludo-accion">¡Sigue así, {nombreCompleto ? nombreCompleto.split(' ')[0] : 'crack'}!</div>
              <button className="ep-boton-accion-principal" onClick={() => window.location.href = '/mis-cursos'}>🎹 Ir a mi aprendizaje</button>
            </>
          )}
        </div>
      </div>

      <ModalVisorImagenPerfil
        abierto={modalAbierto}
        imagenUrl={imagenModalUrl}
        imagenId={imagenModalId}
        tipoImagen={tipoImagenModal}
        usuarioPropietario={{ id: userId || '', nombre: nombreCompleto, avatar: urlAvatarLocal || '' }}
        onCerrar={() => { setModalAbierto(false); onModalStateChange?.(false) }}
      />

      {modalStatKey && STAT_INFO[modalStatKey] && (
        <div className="ep-stat-modal-overlay" onClick={cerrarModalStat} role="dialog" aria-modal="true">
          <div className="ep-stat-modal" onClick={e => e.stopPropagation()}>
            <button className="ep-stat-modal-cerrar" onClick={cerrarModalStat} aria-label="Cerrar">✕</button>
            <div className="ep-stat-modal-titulo">{STAT_INFO[modalStatKey].titulo}</div>

            {/* Valor actual destacado */}
            <div className="ep-stat-modal-valor-actual">
              {modalStatKey === 'puntaje' && <span>{stats.puntaje.toLocaleString('es-CO')} XP acumulados</span>}
              {modalStatKey === 'cursos' && <span>{stats.cursos} {stats.cursos === 1 ? 'curso inscrito' : 'cursos inscritos'}</span>}
              {modalStatKey === 'tutoriales' && <span>{stats.tutoriales} {stats.tutoriales === 1 ? 'tutorial inscrito' : 'tutoriales inscritos'}</span>}
              {modalStatKey === 'ranking' && <span>{stats.ranking ? `Posición #${stats.ranking} en el ranking` : 'Aún sin posición en el ranking'}</span>}
              {modalStatKey === 'monedas' && <span>{Math.round(stats.monedas).toLocaleString('es-CO')} monedas disponibles</span>}
            </div>

            <p className="ep-stat-modal-desc">{STAT_INFO[modalStatKey].descripcion}</p>

            {/* Lista de cursos o tutoriales inscritos */}
            {(modalStatKey === 'cursos' || modalStatKey === 'tutoriales') && (
              <div className="ep-stat-modal-seccion">
                <div className="ep-stat-modal-seccion-titulo">
                  {modalStatKey === 'cursos' ? 'Mis cursos' : 'Mis tutoriales'}
                </div>
                {modalDetalleCargando ? (
                  <div className="ep-stat-modal-lista-cargando">
                    <span className="ep-valor-cargando" style={{ width: '100%', height: 14 }} />
                    <span className="ep-valor-cargando" style={{ width: '80%', height: 14 }} />
                    <span className="ep-valor-cargando" style={{ width: '90%', height: 14 }} />
                  </div>
                ) : modalDetalle.length > 0 ? (
                  <ul className="ep-stat-modal-lista">
                    {modalDetalle.map((item, i) => (
                      <li key={i} className="ep-stat-modal-lista-item">
                        <span className="ep-stat-modal-lista-dot">{modalStatKey === 'cursos' ? '📚' : '🎓'}</span>
                        {item.titulo}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ep-stat-modal-vacio">Aún no tienes {modalStatKey === 'cursos' ? 'cursos' : 'tutoriales'} inscritos.</p>
                )}
              </div>
            )}

            <div className="ep-stat-modal-seccion">
              <div className="ep-stat-modal-seccion-titulo">¿Cómo {modalStatKey === 'monedas' || modalStatKey === 'puntaje' ? 'ganar' : 'inscribirse'}?</div>
              <p className="ep-stat-modal-seccion-texto">{STAT_INFO[modalStatKey].comoGanar}</p>
            </div>

            <button className="ep-stat-modal-btn-ir" onClick={cerrarModalStat}>Entendido</button>
          </div>
        </div>
      )}
    </>
  )
}
