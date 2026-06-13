'use client'
import * as React from 'react'
import { supabase } from '../../../../../servicios/clienteSupabase'
import type { CancionReto, EstadoReto, MensajeChat, Oponente } from './useReto'

// UI del Modo Competencia (Rebanada 1): modal de invitación al retado + panel de negociación (mini-chat
// + selector de canción + "Listo"). NO ejecuta el duelo (Rebanada 2): cuando ambos están listos muestra
// el gancho "¡Listos para el duelo!". Estilo inline en tono oscuro translúcido, igual que el HUD del mundo.

interface Props {
  estado: EstadoReto
  oponente: Oponente | null
  cancion: CancionReto | null
  chat: MensajeChat[]
  miListo: boolean
  suListo: boolean
  ambosListos: boolean
  aviso: string | null
  limpiarAviso: () => void
  aceptar: () => void
  rechazar: () => void
  cancelar: () => void
  enviarChat: (t: string) => void
  proponerCancion: (c: CancionReto) => void
  marcarListo: (v: boolean) => void
  // Duelo (Rebanada 2)
  soyRetador: boolean
  dueloIniciado: boolean
  meTocaJugar: boolean
  terminado: boolean
  ganador: 'yo' | 'rival' | 'empate' | null
  miPuntaje: number | null
  rivalPuntaje: number | null
  empezarDuelo: () => void
}

const PANEL: React.CSSProperties = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 200,
  background: 'rgba(15,18,26,.94)', color: '#fff', borderRadius: 14, padding: 18,
  fontFamily: 'system-ui, sans-serif', width: 'min(420px, calc(100% - 24px))', boxShadow: '0 12px 40px rgba(0,0,0,.6)',
  border: '1px solid rgba(255,255,255,.12)',
}
const BTN = (bg: string): React.CSSProperties => ({ border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: bg, color: '#fff' })

interface SeccionOpt { id: string; nombre: string }
interface CancionConSecciones extends CancionReto { secciones: SeccionOpt[] }

function useCanciones(activo: boolean) {
  const [lista, setLista] = React.useState<CancionConSecciones[]>([])
  React.useEffect(() => {
    if (!activo || lista.length) return
    let vivo = true
    supabase.from('canciones_hero').select('id, titulo, autor, slug, secciones, tonalidad').order('titulo').then(({ data }) => {
      if (!vivo || !data) return
      setLista(data.map((c: any) => {
        let secs = c.secciones
        if (typeof secs === 'string') { try { secs = JSON.parse(secs) } catch { secs = [] } }
        const secciones: SeccionOpt[] = Array.isArray(secs) ? secs.map((s: any) => ({ id: s.id, nombre: s.nombre || s.titulo || 'Sección' })) : []
        return { id: c.id, titulo: c.titulo, autor: c.autor, slug: c.slug, tonalidad: c.tonalidad ?? null, secciones }
      }))
    })
    return () => { vivo = false }
  }, [activo, lista.length])
  return lista
}

const PanelReto: React.FC<Props> = (props) => {
  const { estado, oponente, cancion, chat, miListo, suListo, ambosListos, aviso, limpiarAviso,
    aceptar, rechazar, cancelar, enviarChat, proponerCancion, marcarListo,
    soyRetador, dueloIniciado, meTocaJugar, terminado, ganador, miPuntaje, rivalPuntaje, empezarDuelo } = props
  const [texto, setTexto] = React.useState('')
  const canciones = useCanciones(estado === 'negociando')
  const finChat = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => { finChat.current?.scrollIntoView({ block: 'end' }) }, [chat.length])
  // El aviso ("rechazó el reto") se auto-oculta a los 4 s.
  React.useEffect(() => { if (!aviso) return; const t = setTimeout(limpiarAviso, 4000); return () => clearTimeout(t) }, [aviso, limpiarAviso])

  const enviar = () => { enviarChat(texto); setTexto('') }

  return (
    <>
      {aviso && (
        <div style={{ position: 'absolute', top: 130, left: '50%', transform: 'translateX(-50%)', zIndex: 210, background: 'rgba(192,57,43,.95)', color: '#fff', padding: '8px 16px', borderRadius: 10, fontFamily: 'system-ui, sans-serif', fontSize: 14 }}>
          {aviso}
        </div>
      )}

      {/* Invitación entrante */}
      {estado === 'invitado' && oponente && (
        <div style={PANEL}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>⚔️ {oponente.nombre} te reta</div>
          <div style={{ opacity: 0.8, fontSize: 14, marginBottom: 16 }}>¿Aceptas el duelo de acordeón?</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" style={{ ...BTN('#27ae60'), flex: 1 }} onClick={aceptar}>Aceptar</button>
            <button type="button" style={{ ...BTN('#c0392b'), flex: 1 }} onClick={rechazar}>Rechazar</button>
          </div>
        </div>
      )}

      {/* Esperando que el otro acepte */}
      {estado === 'invitando' && oponente && (
        <div style={PANEL}>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>⚔️ Reto enviado a {oponente.nombre}</div>
          <div style={{ opacity: 0.8, fontSize: 14, marginBottom: 16 }}>Esperando que acepte…</div>
          <button type="button" style={{ ...BTN('#444b57'), width: '100%' }} onClick={cancelar}>Cancelar</button>
        </div>
      )}

      {/* Negociación: chat + canción + listo. Se oculta una vez iniciado el duelo. */}
      {estado === 'negociando' && oponente && !dueloIniciado && (
        <div style={PANEL}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>⚔️ Reto vs {oponente.nombre}</div>
            <button type="button" style={{ ...BTN('transparent'), padding: 4, fontSize: 18 }} onClick={cancelar} title="Cancelar reto">✕</button>
          </div>

          {/* Canción acordada */}
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Canción del duelo</div>
          <select
            value={cancion?.id || ''}
            onChange={(e) => {
              const c = canciones.find((x) => x.id === e.target.value)
              if (!c) return
              // Al elegir canción, arranca por la 1ª sección (o canción completa si no tiene secciones).
              const sec = c.secciones[0]
              proponerCancion({ id: c.id, titulo: c.titulo, autor: c.autor, slug: c.slug, tonalidad: c.tonalidad, seccionId: sec?.id ?? null, seccionNombre: sec?.nombre })
            }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: '#1c2230', color: '#fff', fontSize: 14, marginBottom: 12 }}
          >
            <option value="" disabled>{canciones.length ? 'Elige una canción…' : 'Cargando canciones…'}</option>
            {canciones.map((c) => <option key={c.id} value={c.id}>{c.titulo} — {c.autor}</option>)}
          </select>

          {/* Sección del duelo (si la canción tiene secciones). Ambos juegan la MISMA sección. */}
          {cancion && (() => {
            const cSel = canciones.find((x) => x.id === cancion.id)
            if (!cSel || cSel.secciones.length === 0) return null
            return (
              <>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Sección</div>
                <select
                  value={cancion.seccionId || ''}
                  onChange={(e) => {
                    const s = cSel.secciones.find((x) => x.id === e.target.value)
                    proponerCancion({ id: cancion.id, titulo: cancion.titulo, autor: cancion.autor, slug: cancion.slug, tonalidad: cancion.tonalidad, seccionId: s?.id ?? null, seccionNombre: s?.nombre })
                  }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: '#1c2230', color: '#fff', fontSize: 14, marginBottom: 12 }}
                >
                  {cSel.secciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </>
            )
          })()}

          {/* Mini-chat */}
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Chat</div>
          <div style={{ height: 130, overflowY: 'auto', background: 'rgba(0,0,0,.3)', borderRadius: 8, padding: 8, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {chat.length === 0 && <div style={{ opacity: 0.45, fontSize: 13, margin: 'auto' }}>Pónganse de acuerdo en la canción 🎵</div>}
            {chat.map((m, i) => (
              <div key={i} style={{ alignSelf: m.de === 'yo' ? 'flex-end' : 'flex-start', maxWidth: '80%', background: m.de === 'yo' ? '#2d6cdf' : '#333b48', padding: '5px 10px', borderRadius: 10, fontSize: 13, wordBreak: 'break-word' }}>{m.texto}</div>
            ))}
            <div ref={finChat} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') enviar() }}
              placeholder="Escribe un mensaje…"
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: '#1c2230', color: '#fff', fontSize: 14 }}
            />
            <button type="button" style={BTN('#2d6cdf')} onClick={enviar}>Enviar</button>
          </div>

          {/* Listo → Empezar duelo */}
          {ambosListos ? (
            soyRetador ? (
              <button type="button" style={{ ...BTN('linear-gradient(90deg,#ff7a18,#ffb347)'), color: '#1a1100', width: '100%' }} onClick={empezarDuelo}>
                ⚔️ Empezar duelo
              </button>
            ) : (
              <div style={{ background: 'rgba(255,122,24,.18)', border: '1px solid #ff7a18', color: '#ffb347', borderRadius: 10, padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                ✅ Listos — esperando a que {oponente.nombre} inicie el duelo…
              </div>
            )
          ) : (
            <button
              type="button"
              disabled={!cancion}
              style={{ ...BTN(miListo ? '#27ae60' : cancion ? '#ff7a18' : '#444b57'), width: '100%', opacity: cancion ? 1 : 0.6, cursor: cancion ? 'pointer' : 'not-allowed' }}
              onClick={() => marcarListo(!miListo)}
              title={cancion ? '' : 'Primero acuerden una canción'}
            >
              {miListo ? `✓ Listo — esperando a ${oponente.nombre}${suListo ? '' : '…'}` : 'Estoy listo'}
            </button>
          )}
          {!ambosListos && suListo && <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.75, marginTop: 6 }}>{oponente.nombre} ya está listo</div>}
        </div>
      )}

      {/* DUELO en curso, turno del RIVAL → banner no bloqueante (el mundo queda visible para verlo tocar). */}
      {dueloIniciado && !terminado && !meTocaJugar && oponente && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: 'rgba(15,18,26,.92)', color: '#fff', borderRadius: 12, padding: '10px 18px', fontFamily: 'system-ui, sans-serif', textAlign: 'center', boxShadow: '0 8px 28px rgba(0,0,0,.5)', border: '1px solid #ff7a18' }}>
          <div style={{ fontWeight: 800 }}>🎮 Turno de {oponente.nombre}</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Obsérvalo tocar en el mundo…</div>
          {miPuntaje !== null && <div style={{ fontSize: 13, marginTop: 4 }}>Tu puntaje: <b>{miPuntaje.toLocaleString()}</b></div>}
        </div>
      )}

      {/* RESULTADO FINAL del duelo */}
      {terminado && oponente && (
        <div style={PANEL}>
          <div style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', marginBottom: 10 }}>
            {ganador === 'yo' ? '🏆 ¡Ganaste!' : ganador === 'rival' ? '😞 Perdiste' : '🤝 ¡Empate!'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Tú</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: ganador === 'yo' ? '#ffd54a' : '#fff' }}>{(miPuntaje ?? 0).toLocaleString()}</div>
            </div>
            <div style={{ fontSize: 18, opacity: 0.5 }}>vs</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{oponente.nombre}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: ganador === 'rival' ? '#ffd54a' : '#fff' }}>{(rivalPuntaje ?? 0).toLocaleString()}</div>
            </div>
          </div>
          <button type="button" style={{ ...BTN('#ff7a18'), width: '100%' }} onClick={cancelar}>Cerrar</button>
        </div>
      )}
    </>
  )
}

export default PanelReto
