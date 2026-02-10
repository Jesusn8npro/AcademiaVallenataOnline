import React, { useEffect, useMemo, useState } from 'react'
import './PasoResumenGuardar.css'
import { supabase } from '../../servicios/supabaseCliente'

interface Props {
  tipo: 'curso' | 'tutorial'
  datosGenerales: any
  estructura: any[]
  modoEdicion: boolean
  idContenido?: number | string | null
  onGuardado: (data: any) => void
}

export default function PasoResumenGuardar({ tipo, datosGenerales, estructura, modoEdicion, idContenido, onGuardado }: Props) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function formatearPrecio(precio?: string | number) { if (!precio) return 'Gratuito'; const num = typeof precio === 'string' ? parseFloat(precio) : precio; return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num as number) }
  function obtenerBadgeNivel(nivel: string) { const badges: any = { principiante: { texto: '🌱 Principiante', color: 'bg-green-100 text-green-800' }, intermedio: { texto: '📈 Intermedio', color: 'bg-yellow-100 text-yellow-800' }, avanzado: { texto: '🚀 Avanzado', color: 'bg-red-100 text-red-800' } }; return badges[nivel] || { texto: nivel, color: 'bg-gray-100 text-gray-800' } }
  function obtenerBadgeEstado(estado: string) { const badges: any = { borrador: { texto: '📝 Borrador', color: 'bg-gray-100 text-gray-800' }, revision: { texto: '👀 En Revisión', color: 'bg-blue-100 text-blue-800' }, publicado: { texto: '✅ Publicado', color: 'bg-green-100 text-green-800' } }; return badges[estado] || { texto: estado, color: 'bg-gray-100 text-gray-800' } }

  const badgeNivel = useMemo(() => obtenerBadgeNivel(datosGenerales.nivel || ''), [datosGenerales.nivel])
  const badgeEstado = useMemo(() => obtenerBadgeEstado(datosGenerales.estado || ''), [datosGenerales.estado])

  async function manejarGuardado() {
    if (guardando) return
    setGuardando(true); setError('')
    try {
      const usuario = await supabase.auth.getUser()
      const instructorId = usuario.data.user?.id || null
      const datosParaGuardar: any = {
        titulo: datosGenerales.titulo,
        descripcion: datosGenerales.descripcion,
        nivel: datosGenerales.nivel,
        estado: datosGenerales.estado,
        instructor_id: instructorId,
        categoria: datosGenerales.categoria || 'Acordeón',
        descripcion_corta: datosGenerales.descripcion_corta,
        plantilla_vista: datosGenerales.plantilla_vista || 'clasica',
        ...(tipo === 'curso' ? { es_destacado: datosGenerales.es_destacado } : { destacado: datosGenerales.destacado }),
        tipo_acceso: datosGenerales.tipo_acceso,
        precio_normal: datosGenerales.tipo_acceso === 'pago' ? parseFloat(datosGenerales.precio_normal || '0') || 0 : 0,
        precio_rebajado: datosGenerales.tipo_acceso === 'pago' ? parseFloat(datosGenerales.precio_rebajado || '0') || 0 : 0,
        fecha_expiracion: datosGenerales.fecha_expiracion || null,
        imagen_url: datosGenerales.imagen_url || null,
        ...(tipo === 'tutorial' && { artista: datosGenerales.artista, tonalidad: datosGenerales.tonalidad, acordeonista: datosGenerales.acordeonista, video_url: datosGenerales.video_url, objetivos: datosGenerales.objetivos, requisitos: datosGenerales.requisitos, duracion_estimada: datosGenerales.duracion_estimada || 0, duracion: datosGenerales.duracion || 0 }),
        ...(tipo === 'curso' && { requisitos: Array.isArray(datosGenerales.requisitos) ? datosGenerales.requisitos : (datosGenerales.requisitos ? [datosGenerales.requisitos] : []), objetivos: Array.isArray(datosGenerales.objetivos) ? datosGenerales.objetivos : (datosGenerales.objetivos ? [datosGenerales.objetivos] : []), duracion_estimada: datosGenerales.duracion_estimada || 0, con_modulos: datosGenerales.con_modulos ?? true })
      }
      const tabla = tipo === 'curso' ? 'cursos' : 'tutoriales'
      let data: any, supErr: any
      if (modoEdicion && idContenido) {
        const res = await supabase.from(tabla).update(datosParaGuardar).eq('id', idContenido).select().single()
        data = res.data; supErr = res.error
      } else {
        const res = await supabase.from(tabla).insert([datosParaGuardar]).select().single()
        data = res.data; supErr = res.error
      }
      if (supErr) throw supErr
      if (estructura.length > 0) { await guardarEstructura(data.id, estructura) }
      onGuardado({ ...datosParaGuardar, id: data.id })
    } catch (err: any) { setError(`Error al guardar el ${tipo}: ${err.message}`) } finally { setGuardando(false) }
  }

  async function guardarEstructura(idContenido: any, estructura: any[]) {
    if (tipo === 'tutorial') {
      if (modoEdicion) {
        console.log('🗑️ [GUARDAR] Eliminando partes antiguas del tutorial:', idContenido);
        const { error: errorDelete } = await supabase
          .from('partes_tutorial')
          .delete()
          .eq('tutorial_id', idContenido);

        if (errorDelete) {
          console.error('❌ [GUARDAR] Error al eliminar partes antiguas:', errorDelete);
          throw new Error('No se pudieron actualizar las partes del tutorial. ' + errorDelete.message);
        }
      }

      const partesParaGuardar = estructura.map((parte: any, index: number) => ({
        tutorial_id: idContenido,
        titulo: parte.titulo || `Parte ${index + 1}`,
        descripcion: parte.descripcion || '',
        tipo_parte: parte.tipo_parte || 'introduccion',
        tipo_contenido: parte.tipo_contenido || 'video',
        video_url: parte.video_url || '',
        contenido: parte.contenido || '',
        orden: parte.orden || index + 1,
        visible: parte.visible !== false
      }))

      console.log('📝 [GUARDAR] Insertando nuevas partes:', partesParaGuardar.length);
      const { error } = await supabase.from('partes_tutorial').insert(partesParaGuardar)
      if (error) throw error
    } else {
      if (modoEdicion) {
        const { data: modulosExistentes } = await supabase.from('modulos').select('id,titulo,descripcion,orden').eq('curso_id', idContenido).order('orden')
        for (let i = 0; i < estructura.length; i++) {
          const modulo = estructura[i];
          let moduloId: any
          const moduloExistente = modulosExistentes?.[i] || modulosExistentes?.find((m: any) => m.titulo === modulo.titulo)
          if (moduloExistente) {
            moduloId = moduloExistente.id
            await supabase.from('modulos').update({ titulo: modulo.titulo || 'Módulo sin título', descripcion: modulo.descripcion || '', orden: modulo.orden || (i + 1) }).eq('id', moduloId)
          } else {
            const { data: moduloCreado, error: errM } = await supabase.from('modulos').insert({ curso_id: idContenido, titulo: modulo.titulo || 'Módulo sin título', descripcion: modulo.descripcion || '', orden: modulo.orden || (i + 1) }).select().single()
            if (errM) throw errM
            moduloId = moduloCreado.id
          }
          if (modulo.lecciones && modulo.lecciones.length > 0) {
            const { data: leccionesExistentes } = await supabase.from('lecciones').select('id,titulo,descripcion,orden').eq('modulo_id', moduloId).order('orden')
            for (let j = 0; j < modulo.lecciones.length; j++) {
              const leccion = modulo.lecciones[j]
              const leccionExistente = leccionesExistentes?.[j] || leccionesExistentes?.find((l: any) => l.titulo === leccion.titulo)
              if (leccionExistente) {
                await supabase.from('lecciones').update({ titulo: leccion.titulo || 'Lección sin título', descripcion: leccion.descripcion || '', tipo_contenido: leccion.tipo_contenido || 'video', video_url: leccion.video_url || '', contenido: leccion.contenido || '', orden: leccion.orden || (j + 1) }).eq('id', leccionExistente.id)
              } else {
                const { error: errL } = await supabase.from('lecciones').insert({ modulo_id: moduloId, titulo: leccion.titulo || 'Lección sin título', descripcion: leccion.descripcion || '', tipo_contenido: leccion.tipo_contenido || 'video', video_url: leccion.video_url || '', contenido: leccion.contenido || '', orden: leccion.orden || (j + 1) })
                if (errL) throw errL
              }
            }
          }
        }
      } else {
        for (const modulo of estructura) {
          const { data: moduloCreado, error: errM } = await supabase.from('modulos').insert({ curso_id: idContenido, titulo: modulo.titulo || 'Módulo sin título', descripcion: modulo.descripcion || '', orden: modulo.orden || 1 }).select().single()
          if (errM) throw errM
          if (modulo.lecciones && modulo.lecciones.length > 0) {
            const leccionesParaGuardar = modulo.lecciones.map((leccion: any) => ({ modulo_id: moduloCreado.id, titulo: leccion.titulo || 'Lección sin título', descripcion: leccion.descripcion || '', tipo_contenido: leccion.tipo_contenido || 'video', video_url: leccion.video_url || '', contenido: leccion.contenido || '', orden: leccion.orden || 1 }))
            const { error: errL } = await supabase.from('lecciones').insert(leccionesParaGuardar)
            if (errL) throw errL
          }
        }
      }
    }
  }

  return (
    <div className="resumen-contenedor">
      <div className="header-resumen"><h2 className="titulo-resumen"><span className="icono-resumen">📋</span>{modoEdicion ? 'Editar' : 'Resumen del'} {tipo === 'curso' ? 'Curso' : 'Tutorial'}</h2><p className="descripcion-resumen">{modoEdicion ? 'Revisa los cambios antes de actualizar' : 'Revisa toda la información antes de guardar'}</p></div>
      <div className="contenido-resumen">
        <div className="seccion-resumen">
          <h3 className="subtitulo-resumen"><span className="numero-resumen">1</span>Información General</h3>
          <div className="grid-info">
            <div className="info-item"><span className="info-label">Título:</span><span className="info-value">{datosGenerales.titulo}</span></div>
            <div className="info-item"><span className="info-label">Descripción:</span><span className="info-value">{datosGenerales.descripcion}</span></div>
            <div className="info-item"><span className="info-label">Nivel:</span><span className={`badge ${badgeNivel.color}`}>{badgeNivel.texto}</span></div>
            <div className="info-item"><span className="info-label">Estado:</span><span className={`badge ${badgeEstado.color}`}>{badgeEstado.texto}</span></div>
            <div className="info-item"><span className="info-label">Destacado:</span><span className={`badge ${datosGenerales.es_destacado ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{datosGenerales.es_destacado ? '⭐ Sí' : '📄 No'}</span></div>
            <div className="info-item"><span className="info-label">Acceso:</span><span className={`badge ${datosGenerales.tipo_acceso === 'pago' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{datosGenerales.tipo_acceso === 'pago' ? '💰 De Pago' : '🎁 Gratuito'}</span></div>
            {datosGenerales.imagen_url && (<div className="info-item imagen-preview-resumen"><span className="info-label">Imagen de Portada:</span><div className="imagen-miniatura"><img src={datosGenerales.imagen_url} alt={`Portada del ${tipo}`} className="imagen-resumen" /></div></div>)}
          </div>
          {datosGenerales.tipo_acceso === 'pago' && (
            <div className="seccion-precios"><h4 className="subtitulo-precio">💰 Información de Precios</h4><div className="grid-precios"><div className="precio-item"><span className="precio-label">Precio Normal:</span><span className="precio-value">{formatearPrecio(datosGenerales.precio_normal)}</span></div>{datosGenerales.precio_rebajado && (<div className="precio-item"><span className="precio-label">Precio Rebajado:</span><span className="precio-value descuento">{formatearPrecio(datosGenerales.precio_rebajado)}</span></div>)}{datosGenerales.fecha_expiracion && (<div className="precio-item"><span className="precio-label">Expiración del Descuento:</span><span className="precio-value">{new Date(datosGenerales.fecha_expiracion).toLocaleDateString('es-CO')}</span></div>)}</div></div>
          )}
        </div>

        {tipo === 'tutorial' && (
          <div className="seccion-resumen"><h3 className="subtitulo-resumen"><span className="numero-resumen">2</span>Información Musical</h3><div className="grid-info"><div className="info-item"><span className="info-label">Artista:</span><span className="info-value">{datosGenerales.artista || 'No especificado'}</span></div><div className="info-item"><span className="info-label">Tonalidad:</span><span className="info-value">{datosGenerales.tonalidad || 'No especificada'}</span></div><div className="info-item"><span className="info-label">Acordeonista:</span><span className="info-value">{datosGenerales.acordeonista || 'No especificado'}</span></div></div></div>
        )}

        {estructura.length > 0 && (
          <div className="seccion-resumen"><h3 className="subtitulo-resumen"><span className="numero-resumen">{tipo === 'tutorial' ? '3' : '2'}</span>Estructura del Contenido</h3><div className="estructura-preview">{estructura.map((item: any, index: number) => (
            <div key={index} className="estructura-item"><div className="estructura-header"><span className="estructura-numero">{index + 1}</span><span className="estructura-titulo">{item.titulo || `${tipo === 'curso' ? 'Módulo' : 'Parte'} ${index + 1}`}</span></div>{item.lecciones && item.lecciones.length > 0 && (<div className="lecciones-preview">{item.lecciones.map((leccion: any, lIndex: number) => (<div key={lIndex} className="leccion-item"><span className="leccion-numero">{index + 1}.{lIndex + 1}</span><span className="leccion-titulo">{leccion.titulo || `Lección ${lIndex + 1}`}</span></div>))}</div>)}</div>
          ))}</div></div>
        )}

        {error && (<div className="error-mensaje"><span className="error-icono">❌</span>{error}</div>)}

        <div className="acciones-resumen"><button className={`btn-guardar ${guardando ? 'guardando' : ''}`} onClick={manejarGuardado} disabled={guardando}>{guardando ? (<><div className="spinner"></div>Guardando...</>) : (<><span className="icono-btn">{modoEdicion ? '✏️' : '💾'}</span>{modoEdicion ? 'Actualizar' : 'Guardar'} {tipo === 'curso' ? 'Curso' : 'Tutorial'}</>)}</button></div>
      </div>
    </div>
  )
}
