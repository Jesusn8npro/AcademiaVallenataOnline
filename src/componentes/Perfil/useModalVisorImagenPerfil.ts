import { useState, useEffect, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { supabase } from '../../servicios/clienteSupabase'
export type { Comentario } from './_tiposVisorImagenPerfil'
import type { Comentario, Like, PropsVisorImagenPerfil as Props } from './_tiposVisorImagenPerfil'

export function useModalVisorImagenPerfil({
  abierto,
  imagenUrl: imagenUrlInicial,
  imagenId: imagenIdInicial,
  tipoImagen,
  usuarioPropietario,
  onCerrar
}: Props) {
  const [todasLasImagenes, setTodasLasImagenes] = useState<any[]>([])
  const [indiceImagenActual, setIndiceImagenActual] = useState(0)
  const [imagenId, setImagenId] = useState<string | null>(imagenIdInicial)
  const [imagenUrl, setImagenUrl] = useState<string>(imagenUrlInicial)
  const [cargandoImagenes, setCargandoImagenes] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState<any>(null)
  const [likes, setLikes] = useState<Like[]>([])
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [totalLikes, setTotalLikes] = useState(0)
  const [yaLikee, setYaLikee] = useState(false)
  const [cargandoLikes, setCargandoLikes] = useState(false)
  const [cargandoComentarios, setCargandoComentarios] = useState(false)
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [dandoLike, setDandoLike] = useState(false)
  const [respondiendo, setRespondiendo] = useState<string | null>(null)
  const [respuestaTexto, setRespuestaTexto] = useState('')

  const modalRef = useRef<HTMLDivElement>(null)
  const comentarioInputRef = useRef<HTMLTextAreaElement>(null)

  const comentariosPrincipales = comentarios.filter(c => !c.comentario_padre_id)

  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase
          .from('perfiles').select('*').eq('id', user.id).single()
        setUsuarioActual({
          id: user.id,
          nombre: perfil?.nombre_completo || user.email?.split('@')[0] || 'Usuario',
          url_foto_perfil: perfil?.url_foto_perfil || ''
        })
      }
    }
    obtenerUsuario()
  }, [])

  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('modal-visor-abierto')
    } else {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-visor-abierto')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-visor-abierto')
    }
  }, [abierto])

  useEffect(() => {
    if (abierto && usuarioPropietario.id && tipoImagen) {
      cargarTodasLasImagenes()
    }
  }, [abierto, usuarioPropietario.id, tipoImagen])

  useEffect(() => {
    if (imagenIdInicial) setImagenId(imagenIdInicial)
    if (imagenUrlInicial) setImagenUrl(imagenUrlInicial)
  }, [imagenIdInicial, imagenUrlInicial])

  useEffect(() => {
    if (abierto && imagenId) {
      cargarLikes()
      cargarComentarios()
    }
  }, [abierto, imagenId])

  useEffect(() => {
    const manejarTeclado = (e: KeyboardEvent) => {
      if (!abierto) return
      if (e.key === 'Escape') onCerrar()
      else if (e.key === 'ArrowLeft') navegarImagenAnterior()
      else if (e.key === 'ArrowRight') navegarImagenSiguiente()
    }
    window.addEventListener('keydown', manejarTeclado)
    return () => window.removeEventListener('keydown', manejarTeclado)
  }, [abierto, indiceImagenActual, todasLasImagenes])

  const cargarTodasLasImagenes = async () => {
    if (!usuarioPropietario.id || !tipoImagen) return
    setCargandoImagenes(true)
    try {
      const { data: imagenesData, error } = await supabase
        .from('usuario_imagenes').select('*')
        .eq('usuario_id', usuarioPropietario.id)
        .eq('tipo', tipoImagen)
        .order('fecha_subida', { ascending: false })
      if (error) throw error
      const imagenes = imagenesData || []
      setTodasLasImagenes(imagenes)
      if (imagenId) {
        const indice = imagenes.findIndex((img: any) => img.id === imagenId)
        setIndiceImagenActual(indice >= 0 ? indice : 0)
      }
    } catch {
      // error silenced; empty list shown
    } finally {
      setCargandoImagenes(false)
    }
  }

  const cargarLikes = async () => {
    if (!imagenId) return
    setCargandoLikes(true)
    try {
      const { data: likesData, error } = await supabase
        .from('usuario_imagenes_likes').select('*').eq('imagen_id', imagenId)
      if (error) throw error
      const ls = likesData || []
      setLikes(ls)
      setTotalLikes(ls.length)
      setYaLikee(usuarioActual ? ls.some((l: Like) => l.usuario_id === usuarioActual.id) : false)
    } catch {
      // error silenced; likes stay at 0
    } finally {
      setCargandoLikes(false)
    }
  }

  const cargarComentarios = async () => {
    if (!imagenId) return
    setCargandoComentarios(true)
    try {
      const { data, error } = await supabase
        .from('usuario_imagenes_comentarios').select('*')
        .eq('imagen_id', imagenId)
        .order('fecha_creacion', { ascending: true })
      if (error) throw error
      setComentarios(data || [])
    } catch {
      // error silenced; empty comment list shown
    } finally {
      setCargandoComentarios(false)
    }
  }

  const toggleLike = async () => {
    if (!usuarioActual || !imagenId || dandoLike) return
    setDandoLike(true)
    try {
      if (yaLikee) {
        const { error } = await supabase
          .from('usuario_imagenes_likes').delete()
          .eq('imagen_id', imagenId).eq('usuario_id', usuarioActual.id)
        if (error) throw error
        setTotalLikes(prev => prev - 1)
        setYaLikee(false)
      } else {
        const { error } = await supabase
          .from('usuario_imagenes_likes')
          .insert({ imagen_id: imagenId, usuario_id: usuarioActual.id, fecha_creacion: new Date().toISOString() })
        if (error) throw error
        setTotalLikes(prev => prev + 1)
        setYaLikee(true)
      }
    } catch {
      // error silenced; optimistic update reverted on next load
    } finally {
      setDandoLike(false)
    }
  }

  const enviarComentario = async () => {
    if (!usuarioActual || !imagenId || !nuevoComentario.trim() || enviandoComentario) return
    setEnviandoComentario(true)
    try {
      const { data, error } = await supabase
        .from('usuario_imagenes_comentarios')
        .insert({
          imagen_id: imagenId,
          usuario_id: usuarioActual.id,
          usuario_nombre: usuarioActual.nombre,
          usuario_avatar: usuarioActual.url_foto_perfil,
          comentario: nuevoComentario.trim(),
          fecha_creacion: new Date().toISOString(),
          comentario_padre_id: null
        }).select().single()
      if (error) throw error
      setComentarios(prev => [...prev, data])
      setNuevoComentario('')
      comentarioInputRef.current?.focus()
    } catch {
      // error silenced; comment not added
    } finally {
      setEnviandoComentario(false)
    }
  }

  const responderComentario = async () => {
    if (!usuarioActual || !imagenId || !respuestaTexto.trim() || !respondiendo || enviandoComentario) return
    setEnviandoComentario(true)
    try {
      const { data, error } = await supabase
        .from('usuario_imagenes_comentarios')
        .insert({
          imagen_id: imagenId,
          usuario_id: usuarioActual.id,
          usuario_nombre: usuarioActual.nombre,
          usuario_avatar: usuarioActual.url_foto_perfil,
          comentario: respuestaTexto.trim(),
          fecha_creacion: new Date().toISOString(),
          comentario_padre_id: respondiendo
        }).select().single()
      if (error) throw error
      setComentarios(prev => [...prev, data])
      setRespuestaTexto('')
      setRespondiendo(null)
    } catch {
      // error silenced; reply not added
    } finally {
      setEnviandoComentario(false)
    }
  }

  const navegarImagenAnterior = () => {
    if (indiceImagenActual > 0) {
      const nuevoIndice = indiceImagenActual - 1
      setIndiceImagenActual(nuevoIndice)
      const imagen = todasLasImagenes[nuevoIndice]
      setImagenId(imagen.id)
      setImagenUrl(imagen.url_imagen)
    }
  }

  const navegarImagenSiguiente = () => {
    if (indiceImagenActual < todasLasImagenes.length - 1) {
      const nuevoIndice = indiceImagenActual + 1
      setIndiceImagenActual(nuevoIndice)
      const imagen = todasLasImagenes[nuevoIndice]
      setImagenId(imagen.id)
      setImagenUrl(imagen.url_imagen)
    }
  }

  const formatearFecha = (fecha: string) => {
    const ahora = new Date()
    const fechaComentario = new Date(fecha)
    const diffMs = ahora.getTime() - fechaComentario.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHoras = Math.floor(diffMins / 60)
    const diffDias = Math.floor(diffHoras / 24)
    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHoras < 24) return `${diffHoras}h`
    if (diffDias < 7) return `${diffDias}d`
    return fechaComentario.toLocaleDateString()
  }

  const manejarTeclaEnter = (e: ReactKeyboardEvent, esRespuesta: boolean) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (esRespuesta) responderComentario()
      else enviarComentario()
    }
  }

  return {
    todasLasImagenes, indiceImagenActual, imagenId, imagenUrl, cargandoImagenes,
    usuarioActual,
    likes, comentarios, nuevoComentario, totalLikes, yaLikee,
    cargandoLikes, cargandoComentarios, enviandoComentario, dandoLike,
    respondiendo, respuestaTexto,
    comentariosPrincipales,
    modalRef, comentarioInputRef,
    setNuevoComentario, setRespondiendo, setRespuestaTexto,
    toggleLike, enviarComentario, responderComentario,
    navegarImagenAnterior, navegarImagenSiguiente,
    formatearFecha, manejarTeclaEnter
  }
}
