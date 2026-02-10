import React, { useRef, useState, useEffect } from 'react'
import './PasoInformacionGeneral.css'
import GestorLista from './GestorLista'
import { supabase } from '../../servicios/supabaseCliente'

interface Props {
  tipo: 'curso' | 'tutorial'
  datos: any
  onContinuar: (datos: any) => void
}

export default function PasoInformacionGeneral({ tipo, datos, onContinuar }: Props) {
  const [titulo, setTitulo] = useState<string>(datos.titulo || '')
  const [descripcion, setDescripcion] = useState<string>(datos.descripcion || '')
  const [nivel, setNivel] = useState<string>(datos.nivel || 'principiante')
  const [estado, setEstado] = useState<string>(datos.estado || 'borrador')
  const [es_destacado, setEsDestacado] = useState<boolean>(datos.es_destacado || datos.destacado || false)
  const [imagen_url, setImagenUrl] = useState<string>(datos.imagen_url || '')
  const [tipoSubida, setTipoSubida] = useState<'url' | 'archivo'>('url')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const inputArchivo = useRef<HTMLInputElement>(null)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [progresoSubida, setProgresoSubida] = useState(0)
  const [errorSubida, setErrorSubida] = useState('')
  const [imagenError, setImagenError] = useState(false)
  const [tipo_acceso, setTipoAcceso] = useState<string>(datos.tipo_acceso || 'gratuito')
  const [precio_normal, setPrecioNormal] = useState<string>(datos.precio_normal || datos.precio || '')
  const [precio_rebajado, setPrecioRebajado] = useState<string>(datos.precio_rebajado || datos.precio_descuento || '')
  const [fecha_expiracion, setFechaExpiracion] = useState<string>(datos.fecha_expiracion || '')
  const [descripcion_corta, setDescripcionCorta] = useState<string>(datos.descripcion_corta || '')
  const [categoria, setCategoria] = useState<string>(datos.categoria || 'Acordeón')
  const [plantilla_vista, setPlantillaVista] = useState<string>(datos.plantilla_vista || 'clasica')
  const [duracion_estimada, setDuracionEstimada] = useState<number>(datos.duracion_estimada || 0)
  const [con_modulos, setConModulos] = useState<boolean>(datos.con_modulos ?? true)
  const [objetivos_curso, setObjetivosCurso] = useState<string[]>(Array.isArray(datos.objetivos) ? datos.objetivos : [])
  const [requisitos_curso, setRequisitosCurso] = useState<string[]>(Array.isArray(datos.requisitos) ? datos.requisitos : [])
  const [video_url, setVideoUrl] = useState<string>(datos.video_url || '')
  // Helper para parsear string o array a string[]
  const parseList = (val: any): string[] => {
    if (Array.isArray(val)) return val.map(s => typeof s === 'string' ? s.trim().replace(/[,;]+$/, '') : s);
    if (typeof val === 'string' && val.trim() !== '') {
      let items = val.split(/\r?\n/).map(s => s.trim()).filter(x => x);
      // Soporte para comas si no hay saltos de línea (legacy)
      if (items.length === 1 && items[0].includes(',')) {
        items = items[0].split(',').map(s => s.trim()).filter(x => x);
      }
      // Limpiar comas finales también al cargar
      return items.map(s => s.replace(/[,;]+$/, ''));
    }
    return [];
  };

  const [objetivos_tutorial, setObjetivosTutorial] = useState<string[]>(parseList(datos.objetivos))
  const [requisitos_tutorial, setRequisitosTutorial] = useState<string[]>(parseList(datos.requisitos))
  const [acordeonista, setAcordeonista] = useState<string>(datos.acordeonista || '')
  const [artista, setArtista] = useState<string>(datos.artista || '')
  const [tonalidad, setTonalidad] = useState<string>(datos.tonalidad || '')

  // CRÍTICO: Actualizar todos los estados cuando cambien los datos
  useEffect(() => {
    console.log('🔄 [PASO 1] Actualizando formulario con datos:', datos);
    if (datos && Object.keys(datos).length > 0) {
      setTitulo(datos.titulo || '');
      setDescripcion(datos.descripcion || '');
      setNivel(datos.nivel || 'principiante');
      setEstado(datos.estado || 'borrador');
      setEsDestacado(datos.es_destacado || datos.destacado || false);
      setImagenUrl(datos.imagen_url || '');
      setTipoAcceso(datos.tipo_acceso || 'gratuito');
      setPrecioNormal(datos.precio_normal || datos.precio || '');
      setPrecioRebajado(datos.precio_rebajado || datos.precio_descuento || '');
      setFechaExpiracion(datos.fecha_expiracion || '');
      setDescripcionCorta(datos.descripcion_corta || '');
      setCategoria(datos.categoria || 'Acordeón');
      setPlantillaVista(datos.plantilla_vista || 'clasica');
      setDuracionEstimada(datos.duracion_estimada || 0);
      setConModulos(datos.con_modulos ?? true);
      setObjetivosCurso(Array.isArray(datos.objetivos) ? datos.objetivos : []);
      setRequisitosCurso(Array.isArray(datos.requisitos) ? datos.requisitos : []);
      setVideoUrl(datos.video_url || '');
      setObjetivosTutorial(parseList(datos.objetivos));
      setRequisitosTutorial(parseList(datos.requisitos));
      setAcordeonista(datos.acordeonista || '');
      setArtista(datos.artista || '');
      setTonalidad(datos.tonalidad || '');
      console.log('✅ [PASO 1] Formulario actualizado correctamente');
    }
  }, [datos])

  async function manejarSubidaArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) { setErrorSubida('Solo se permiten archivos de imagen'); return }
    if (archivo.size > 5 * 1024 * 1024) { setErrorSubida('El archivo no puede superar los 5MB'); return }
    setArchivoSeleccionado(archivo)
    setSubiendoImagen(true); setProgresoSubida(0); setErrorSubida('')
    try {
      const extension = archivo.name.split('.').pop()
      const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
      const rutaArchivo = `imagenes-contenido/${nombreArchivo}`
      const { data, error } = await supabase.storage.from('imagenes').upload(rutaArchivo, archivo, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(rutaArchivo)
      setImagenUrl(urlData.publicUrl)
      setProgresoSubida(100)
      setTimeout(() => { setSubiendoImagen(false); setProgresoSubida(0) }, 1000)
    } catch (err: any) { setErrorSubida(err.message || 'Error al subir la imagen'); setSubiendoImagen(false); setProgresoSubida(0) }
  }

  function continuar() {
    if (!titulo.trim()) {
      alert('Por favor, ingresa un título para el ' + (tipo === 'curso' ? 'curso' : 'tutorial'))
      return
    }

    const datosCompletos: any = {
      titulo: titulo.trim(),
      descripcion,
      nivel,
      estado,
      ...(tipo === 'curso' ? { es_destacado } : { destacado: es_destacado }),
      tipo_acceso,
      precio_normal: tipo_acceso === 'pago' ? precio_normal : '',
      precio_rebajado: tipo_acceso === 'pago' ? precio_rebajado : '',
      fecha_expiracion: tipo_acceso === 'pago' ? fecha_expiracion : '',
      descripcion_corta,
      categoria,
      plantilla_vista,
      imagen_url,
      duracion_estimada,
      ...(tipo === 'curso' && { requisitos: requisitos_curso, objetivos: objetivos_curso, con_modulos }),
      ...(tipo === 'tutorial' && { artista, tonalidad, acordeonista, video_url, requisitos: requisitos_tutorial, objetivos: objetivos_tutorial })
    }
    onContinuar(datosCompletos)
  }

  return (
    <div className="formulario-contenedor">
      <div className="contenido-formulario">
        <h2 className="titulo-seccion"><span className="icono-titulo">🎓</span>Información General del {tipo === 'curso' ? 'Curso' : 'Tutorial'}</h2>
        <p className="descripcion-seccion">Completa los datos básicos de tu {tipo} para comenzar</p>

        <div className="grid-formulario">
          <div className="seccion-formulario">
            <h3 className="subtitulo-seccion"><span className="numero-seccion">1</span>Información Básica</h3>
            <div className="campo-formulario campo-completo">
              <label className="etiqueta-campo"><span className="texto-etiqueta">Título del {tipo}</span><span className="descripcion-campo">Escribe un título claro y descriptivo</span></label>
              <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="input-destacado" placeholder={`Ej: Aprende acordeón desde cero`} maxLength={100} />
              <div className="contador-caracteres">{titulo.length}/100</div>
            </div>
            <div className="campo-formulario campo-completo">
              <label className="etiqueta-campo"><span className="texto-etiqueta">Descripción</span><span className="descripcion-campo">Describe qué aprenderán los estudiantes</span></label>
              <textarea style={{ minHeight: '200px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }} value={descripcion} onChange={e => setDescripcion(e.target.value)} className="cc-form-textarea" placeholder={`Explica los objetivos y beneficios de tu ${tipo}...`} rows={4} maxLength={500}></textarea>
              <div className="contador-caracteres">{descripcion.length}/500</div>
            </div>
            <div className="campo-formulario campo-completo">
              <label className="etiqueta-campo"><span className="texto-etiqueta">Descripción Corta</span><span className="descripcion-campo">Un resumen rápido para vistas previas y SEO.</span></label>
              <input type="text" value={descripcion_corta} onChange={e => setDescripcionCorta(e.target.value)} className="input-moderno" placeholder="Ej: Conviértete en un maestro del vallenato..." maxLength={150} />
              <div className="contador-caracteres">{descripcion_corta.length}/150</div>
            </div>
            <div className="campos-en-linea">
              <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Categoría</span></label><input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} className="input-moderno" placeholder="Ej: Acordeón, Técnica, Teoría" /></div>
              <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Plantilla de Vista</span></label><select value={plantilla_vista} onChange={e => setPlantillaVista(e.target.value)} className="select-moderno"><option value="clasica">Clásica</option><option value="minimal">Minimal</option><option value="video_hero">Video Hero</option><option value="premium">Premium</option></select></div>
            </div>
            <div className="campos-en-linea">
              <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Nivel de Dificultad</span></label><select value={nivel} onChange={e => setNivel(e.target.value)} className="select-moderno"><option value="principiante">🌱 Principiante</option><option value="intermedio">📈 Intermedio</option><option value="avanzado">🚀 Avanzado</option></select></div>
              <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Estado</span></label><select value={estado} onChange={e => setEstado(e.target.value)} className="select-moderno"><option value="borrador">📝 Borrador</option><option value="revision">👀 En Revisión</option><option value="publicado">✅ Publicado</option></select></div>
            </div>
          </div>

          <div className="seccion-formulario">
            <h3 className="subtitulo-seccion"><span className="numero-seccion">2</span>Imagen de Portada</h3>
            <div className="seccion-imagen">
              <div className="preview-imagen">
                {imagen_url ? (
                  <>
                    <img src={imagen_url} alt="Preview" className="imagen-preview" onError={() => setImagenError(true)} />
                    <button className="btn-remover-imagen" onClick={() => { setImagenUrl(''); setImagenError(false) }}>✕</button>
                  </>
                ) : (
                  <div className="placeholder-imagen"><div className="icono-placeholder">📸</div><p>Sin imagen de portada</p></div>
                )}
              </div>
              <div className="controles-imagen">
                <div className="tabs-imagen">
                  <button className={`tab-boton ${tipoSubida === 'url' ? 'activo' : ''}`} onClick={() => { setTipoSubida('url'); setArchivoSeleccionado(null) }}>🔗 URL</button>
                  <button className={`tab-boton ${tipoSubida === 'archivo' ? 'activo' : ''}`} onClick={() => { setTipoSubida('archivo'); setImagenUrl('') }}>📁 Subir Archivo</button>
                </div>
                {tipoSubida === 'url' ? (
                  <div className="campo-imagen-url">
                    <input type="url" value={imagen_url} onChange={e => { setImagenUrl(e.target.value); setImagenError(false) }} placeholder="https://ejemplo.com/imagen.jpg" className="input-moderno" />
                    {imagenError && (<p className="error-imagen">❌ No se pudo cargar la imagen desde esta URL</p>)}
                  </div>
                ) : (
                  <div className="campo-subir-archivo">
                    <input type="file" accept="image/*" ref={inputArchivo} onChange={manejarSubidaArchivo} className="input-archivo-oculto" id="input-imagen" />
                    <label htmlFor="input-imagen" className="btn-subir-archivo"><span className="icono-subir">📤</span>{archivoSeleccionado ? archivoSeleccionado.name : 'Seleccionar imagen...'}</label>
                    {subiendoImagen && (
                      <div className="progreso-subida"><div className="barra-progreso"><div className="progreso-fill" style={{ width: `${progresoSubida}%` }}></div></div><span className="texto-progreso">{progresoSubida}% subido</span></div>
                    )}
                    {errorSubida && (<p className="error-imagen">❌ {errorSubida}</p>)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="seccion-formulario">
            <h3 className="subtitulo-seccion"><span className="numero-seccion">2</span>Detalles del Contenido</h3>
            {tipo === 'curso' ? (
              <>
                <div className="campos-en-linea">
                  <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Duración Estimada (Horas)</span></label><input id="duracion-estimada" type="number" value={duracion_estimada} onChange={e => setDuracionEstimada(Number(e.target.value))} className="input-moderno" placeholder="Ej: 10" /></div>
                  <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">¿El curso tiene módulos?</span></label><div className="campo-toggle simple"><label className="toggle-container"><input type="checkbox" checked={con_modulos} onChange={e => setConModulos(e.target.checked)} className="toggle-input" /><div className={`toggle-slider ${con_modulos ? 'activo' : ''}`}><div className="toggle-knob"></div></div><span className="toggle-text-simple">{con_modulos ? 'Sí, usa módulos' : 'No, es simple'}</span></label></div></div>
                </div>
                <div className="campo-formulario campo-completo">
                  <GestorLista
                    titulo="Objetivos del Curso"
                    placeholder="Añadir un objetivo..."
                    items={objetivos_curso}
                    onUpdate={setObjetivosCurso}
                  />
                </div>
                <div className="campo-formulario campo-completo">
                  <GestorLista
                    titulo="Requisitos del Curso"
                    placeholder="Añadir un requisito..."
                    items={requisitos_curso}
                    onUpdate={setRequisitosCurso}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="campo-formulario campo-completo"><label className="etiqueta-campo" htmlFor="video-url"><span className="texto-etiqueta">URL del Video Principal</span><span className="descripcion-campo">Enlace al video de YouTube, Vimeo, etc.</span></label><input id="video-url" type="url" value={video_url} onChange={e => setVideoUrl(e.target.value)} className="input-moderno" placeholder="https://..." /></div>
                <div className="campo-formulario campo-completo">
                  <GestorLista
                    titulo="Objetivos del Tutorial"
                    placeholder="Añadir un objetivo..."
                    items={objetivos_tutorial}
                    onUpdate={setObjetivosTutorial}
                  />
                </div>
                <div className="campo-formulario campo-completo">
                  <GestorLista
                    titulo="Requisitos del Tutorial"
                    placeholder="Añadir un requisito..."
                    items={requisitos_tutorial}
                    onUpdate={setRequisitosTutorial}
                  />
                </div>
              </>
            )}
          </div>

          <div className="seccion-formulario">
            <h3 className="subtitulo-seccion"><span className="numero-seccion">3</span>Configuraciones Especiales</h3>
            <div className="configuraciones-especiales">
              <div className="campo-toggle"><label className="toggle-container"><input type="checkbox" checked={es_destacado} onChange={e => setEsDestacado(e.target.checked)} className="toggle-input" /><div className={`toggle-slider ${es_destacado ? 'activo' : ''}`}><div className="toggle-knob"></div></div><div className="toggle-text"><span className="toggle-titulo">Contenido Destacado</span><span className="toggle-descripcion">Aparecerá en la página principal</span></div></label></div>
              <div className="campo-acceso"><span className="texto-etiqueta">Tipo de Acceso</span><div className="radio-group"><label className="radio-opcion"><input type="radio" checked={tipo_acceso === 'gratuito'} onChange={() => setTipoAcceso('gratuito')} className="radio-input" /><div className="radio-custom"></div><span>🎁 Gratuito</span></label><label className="radio-opcion"><input type="radio" checked={tipo_acceso === 'pago'} onChange={() => setTipoAcceso('pago')} className="radio-input" /><div className="radio-custom"></div><span>💰 De Pago</span></label></div></div>
            </div>
            {tipo_acceso === 'pago' && (
              <div className="seccion-precios"><div className="campos-en-linea">
                <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Precio (COP)</span></label><div className="input-precio"><span className="simbolo-precio">$</span><input type="number" value={precio_normal} onChange={e => setPrecioNormal(e.target.value)} className="input-moderno input-precio-campo" placeholder="50000" /></div></div>
                <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Precio con Descuento (COP)</span></label><div className="input-precio"><span className="simbolo-precio">$</span><input type="number" value={precio_rebajado} onChange={e => setPrecioRebajado(e.target.value)} className="input-moderno input-precio-campo" placeholder="35000" /></div></div>
                <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Fecha de Expiración del Descuento</span></label><input type="date" value={fecha_expiracion} onChange={e => setFechaExpiracion(e.target.value)} className="input-moderno" /></div>
              </div></div>
            )}
          </div>

          {tipo === 'tutorial' && (
            <div className="seccion-formulario"><h3 className="subtitulo-seccion"><span className="numero-seccion">4</span>Información Musical</h3>
              <div className="campos-en-linea"><div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Artista</span></label><input type="text" value={artista} onChange={e => setArtista(e.target.value)} className="input-moderno" placeholder="Nombre del artista" /></div>
                <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Tonalidad</span></label><input type="text" value={tonalidad} onChange={e => setTonalidad(e.target.value)} className="input-moderno" placeholder="Ej: Do Mayor, La menor" /></div></div>
              <div className="campo-formulario"><label className="etiqueta-campo"><span className="texto-etiqueta">Acordeonista</span></label><input type="text" value={acordeonista} onChange={e => setAcordeonista(e.target.value)} className="input-moderno" placeholder="Nombre del acordeonista" /></div>
            </div>
          )}
        </div>

        <div className="acciones-formulario"><button className="btn-continuar" onClick={continuar}><span className="icono-btn">🚀</span>Continuar al Siguiente Paso<span className="flecha-btn">→</span></button></div>
      </div>
    </div>
  )
}
