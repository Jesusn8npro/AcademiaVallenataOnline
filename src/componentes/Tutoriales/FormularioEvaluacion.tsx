'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '../../servicios/clienteSupabase'
import './FormularioEvaluacion.css'

const FondoEspacialProMax = dynamic(
  () => import('../../Paginas/AcordeonProMax/Componentes/FondoEspacialProMax'),
  { ssr: false }
)

interface Props {
  parteId: string
  tutorialId: string
  monedasRecompensa?: number
}

interface Evaluacion {
  id: string
  video_url: string
  estado: string
  monedas_fase1: number
  fase1_otorgada: boolean
  comentario_profesor: string
  created_at: string
}

type ModoEnvio = 'archivo' | 'url'

const MAX_MB = 200
const MAX_BYTES = MAX_MB * 1024 * 1024

function getVideoEmbed(url: string): { tipo: 'iframe' | 'video'; src: string } {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return { tipo: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` }
  const gdMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (gdMatch) return { tipo: 'iframe', src: `https://drive.google.com/file/d/${gdMatch[1]}/preview` }
  return { tipo: 'video', src: url }
}

export default function FormularioEvaluacion({ parteId, tutorialId, monedasRecompensa = 5 }: Props) {
  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [modoEnvio, setModoEnvio] = useState<ModoEnvio>('archivo')
  const [videoUrl, setVideoUrl] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendoPct, setSubiendoPct] = useState<number | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [videoAbierto, setVideoAbierto] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { cargar() }, [parteId])

  async function cargar() {
    setCargando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUsuarioId(user.id)
      const { data } = await (supabase.from('validaciones_tutorial') as any)
        .select('id, video_url, estado, monedas_fase1, fase1_otorgada, comentario_profesor, created_at')
        .eq('usuario_id', user.id)
        .eq('parte_tutorial_id', parteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setEvaluacion(data || null)
    } catch { /* silent */ } finally {
      setCargando(false)
    }
  }

  function onSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setError('')
    if (f && f.size > MAX_BYTES) {
      setError(`El archivo pesa ${(f.size / 1024 / 1024).toFixed(0)} MB. El máximo permitido es ${MAX_MB} MB.`)
      setArchivo(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setArchivo(f)
  }

  async function uploadArchivoAStorage(file: File, uid: string): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    const path = `${uid}/${parteId}-${Date.now()}.${ext}`

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('Debes iniciar sesión para subir archivos.')

    return new Promise((resolve, reject) => {
      const url = `${(supabase as any).supabaseUrl}/storage/v1/object/evaluaciones-videos/${path}`
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.setRequestHeader('x-upsert', 'true')

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setSubiendoPct(Math.round((ev.loaded / ev.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(`${(supabase as any).supabaseUrl}/storage/v1/object/public/evaluaciones-videos/${path}`)
        } else {
          reject(new Error(`Upload falló (${xhr.status}): ${xhr.responseText}`))
        }
      }
      xhr.onerror = () => reject(new Error('Error de red al subir el video.'))
      const form = new FormData()
      form.append('', file)
      xhr.send(form)
    })
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!usuarioId) return
    setEnviando(true); setError(''); setSubiendoPct(null)
    try {
      let urlFinal = ''
      if (modoEnvio === 'archivo') {
        if (!archivo) { setError('Selecciona un archivo de video.'); setEnviando(false); return }
        urlFinal = await uploadArchivoAStorage(archivo, usuarioId)
      } else {
        if (!videoUrl.trim()) { setError('Ingresa la URL del video.'); setEnviando(false); return }
        urlFinal = videoUrl.trim()
      }

      if (evaluacion?.estado === 'rechazado') {
        const { error: err } = await (supabase.from('validaciones_tutorial') as any)
          .update({ video_url: urlFinal, estado: 'pendiente', comentario_profesor: null })
          .eq('id', evaluacion.id)
        if (err) throw err
        setEvaluacion({ ...evaluacion, video_url: urlFinal, estado: 'pendiente', comentario_profesor: '' })
      } else {
        const { data, error: err } = await (supabase.from('validaciones_tutorial') as any)
          .insert({
            usuario_id: usuarioId,
            tutorial_id: tutorialId,
            parte_tutorial_id: parteId,
            video_url: urlFinal,
            estado: 'pendiente',
            monedas_fase1: monedasRecompensa,
            monedas_fase2: 0,
          })
          .select('id, video_url, estado, monedas_fase1, fase1_otorgada, comentario_profesor, created_at')
          .single()
        if (err) throw err
        setEvaluacion(data)
      }
      setVideoUrl(''); setArchivo(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (ex: any) {
      setError(ex?.message || 'Error al enviar. Intenta de nuevo.')
    } finally {
      setEnviando(false); setSubiendoPct(null)
    }
  }

  const esReenvio = evaluacion?.estado === 'rechazado'

  function renderContenido() {
    if (cargando) return <div className="evaluacion-cargando">Cargando evaluación...</div>

    if (evaluacion && evaluacion.estado !== 'rechazado') {
      const embed = getVideoEmbed(evaluacion.video_url)
      return (
        <div className="evaluacion-status-container">
          <div className={`evaluacion-status-card estado-${evaluacion.estado}`}>
            <div className="evaluacion-status-icon">
              {evaluacion.estado === 'aprobado' ? '🏆' : evaluacion.estado === 'en_revision' ? '🔍' : '⏳'}
            </div>
            <h3>
              {evaluacion.estado === 'aprobado' ? '¡Evaluación Aprobada!'
                : evaluacion.estado === 'en_revision' ? 'Video en Revisión'
                : 'Enviado — Esperando Revisión'}
            </h3>
            <p>
              {evaluacion.estado === 'aprobado'
                ? `El profesor aprobó tu ejecución.${evaluacion.fase1_otorgada ? ` +${evaluacion.monedas_fase1} 🪙 y XP acreditados.` : ''}`
                : evaluacion.estado === 'en_revision'
                ? 'El profesor está revisando tu video. Pronto recibirás retroalimentación.'
                : 'Tu video está en la cola de revisión. El profesor te notificará cuando lo evalúe.'}
            </p>
            {evaluacion.comentario_profesor && (
              <div className="evaluacion-comentario-profesor">
                <strong>👨‍🏫 Comentario del profesor:</strong>
                <p>{evaluacion.comentario_profesor}</p>
              </div>
            )}
            <button type="button" className="evaluacion-ver-video-btn" onClick={() => setVideoAbierto(v => !v)}>
              {videoAbierto ? '▲ Ocultar video' : '▶ Ver mi video enviado'}
            </button>
            {videoAbierto && (
              <div className="evaluacion-video-wrapper">
                {embed.tipo === 'iframe' ? (
                  <iframe src={embed.src} className="evaluacion-video-player" allowFullScreen title="Video enviado"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                ) : (
                  <video src={embed.src} controls className="evaluacion-video-player" />
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="evaluacion-form-container">
        <div className="evaluacion-form-header">
          <h2>🎯 Evaluación Final del Tutorial</h2>
          <p>
            Demuestra que dominas lo aprendido enviando un video tocando la pieza completa.
            Un profesor certificado revisará tu ejecución y te dará retroalimentación personalizada.
          </p>
          {monedasRecompensa > 0 && (
            <div className="evaluacion-recompensa-badge">🪙 Recompensa al aprobar: +{monedasRecompensa} monedas y XP</div>
          )}
        </div>

        <div className="evaluacion-pasos">
          <div className="evaluacion-paso"><span className="evaluacion-paso-num">1</span><div><strong>Graba tu ejecución</strong><span>Toca la pieza completa del tutorial, de inicio a fin.</span></div></div>
          <div className="evaluacion-paso"><span className="evaluacion-paso-num">2</span><div><strong>Envía tu video</strong><span>Súbelo directo o comparte el enlace de YouTube / Google Drive.</span></div></div>
          <div className="evaluacion-paso"><span className="evaluacion-paso-num">3</span><div><strong>Revisión profesional</strong><span>Un profesor lo revisa en las próximas horas y te envía retroalimentación.</span></div></div>
          <div className="evaluacion-paso"><span className="evaluacion-paso-num">4</span><div><strong>Gana tus recompensas</strong><span>Si todo está bien, recibes monedas, XP y el 100% del tutorial completado.</span></div></div>
        </div>

        {esReenvio && (
          <div className="evaluacion-rechazado-aviso">
            <strong>❌ Tu evaluación anterior fue rechazada.</strong>
            {evaluacion?.comentario_profesor && <p>Comentario del profesor: {evaluacion.comentario_profesor}</p>}
            <p>Practica los puntos indicados y envía un nuevo video cuando estés listo.</p>
          </div>
        )}

        <form onSubmit={enviar} className="evaluacion-form">
          <div className="evaluacion-modo-tabs">
            <button type="button" className={`evaluacion-modo-tab ${modoEnvio === 'archivo' ? 'activo' : ''}`}
              onClick={() => { setModoEnvio('archivo'); setError('') }}>📁 Subir Video Directo</button>
            <button type="button" className={`evaluacion-modo-tab ${modoEnvio === 'url' ? 'activo' : ''}`}
              onClick={() => { setModoEnvio('url'); setError('') }}>🔗 YouTube / Drive</button>
          </div>

          {modoEnvio === 'archivo' ? (
            <div className="evaluacion-upload-area" onClick={() => inputRef.current?.click()}>
              <input ref={inputRef} type="file" accept="video/*" onChange={onSeleccionarArchivo} style={{ display: 'none' }} />
              {archivo ? (
                <div className="evaluacion-archivo-seleccionado">
                  <span className="evaluacion-archivo-icono">🎬</span>
                  <div>
                    <p className="evaluacion-archivo-nombre">{archivo.name}</p>
                    <p className="evaluacion-archivo-tamano">{(archivo.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button type="button" className="evaluacion-quitar-archivo"
                    onClick={(ev) => { ev.stopPropagation(); setArchivo(null); if (inputRef.current) inputRef.current.value = '' }}>✕</button>
                </div>
              ) : (
                <div className="evaluacion-upload-placeholder">
                  <span style={{ fontSize: '2.5rem' }}>📹</span>
                  <p>Haz clic o arrastra tu video aquí</p>
                  <span className="evaluacion-upload-hint">MP4, WebM, MOV — máximo {MAX_MB} MB</span>
                </div>
              )}
            </div>
          ) : (
            <div className="evaluacion-form-group">
              <label>Enlace de tu video (YouTube o Google Drive)</label>
              <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..." />
              <div className="evaluacion-instrucciones">
                <strong>Cómo compartir tu video:</strong>
                <ol>
                  <li>Graba tocando la pieza completa del tutorial.</li>
                  <li><strong>YouTube</strong>: sube como "Oculto" o "Público" y copia el enlace.</li>
                  <li><strong>Drive</strong>: comparte con "Cualquiera con el enlace" y copia.</li>
                </ol>
                <span className="evaluacion-alerta">⚠️ Si el enlace es privado, el profesor no podrá revisarlo.</span>
              </div>
            </div>
          )}

          {subiendoPct !== null && (
            <div className="evaluacion-progreso-container">
              <div className="evaluacion-progreso-bar" style={{ width: `${subiendoPct}%` }} />
              <span className="evaluacion-progreso-texto">{subiendoPct}% subido...</span>
            </div>
          )}

          {error && <p className="evaluacion-error">{error}</p>}

          <button type="submit" disabled={enviando || subiendoPct !== null} className="evaluacion-btn-enviar">
            {subiendoPct !== null ? `Subiendo... ${subiendoPct}%`
              : enviando ? 'Procesando...'
              : esReenvio ? '🔄 Reenviar Video'
              : '🚀 Enviar para Revisión'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="evaluacion-escena">
      <FondoEspacialProMax contenedor />
      <div className="evaluacion-escena-inner">
        {renderContenido()}
      </div>
    </div>
  )
}
