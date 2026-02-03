import React, { useState, useEffect } from 'react';
import { supabase } from '../../servicios/supabaseCliente';
import './FeedPublicaciones.css';

interface Usuario {
  id: string;
  nombre: string;
}

interface FeedPublicacionesProps {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  url_foto_perfil?: string;
  usuario_slug?: string;
  fecha: string;
  contenido: string;
  url_imagen?: string;
  url_video?: string;
  url_gif?: string;
  tipo: string;
  encuesta?: any;
  me_gusta: string[];
  total_comentarios: number;
  total_compartidos: number;
  usuario: Usuario | null;
}

const FeedPublicaciones: React.FC<FeedPublicacionesProps> = ({
  id,
  usuario_id,
  usuario_nombre,
  url_foto_perfil,
  usuario_slug,
  fecha,
  contenido,
  url_imagen,
  url_video,
  url_gif,
  tipo,
  encuesta,
  me_gusta,
  total_comentarios,
  total_compartidos,
  usuario
}) => {
  // Estados locales
  const [contadorComentarios, setContadorComentarios] = useState(total_comentarios);
  const [meGusta, setMeGusta] = useState<string[]>(me_gusta);
  const [cargandoMeGusta, setCargandoMeGusta] = useState(false);
  const [errorMeGusta, setErrorMeGusta] = useState('');
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [enfoqueAutomaticoComentario, setEnfoqueAutomaticoComentario] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [cargandoComentario, setCargandoComentario] = useState(false);

  // Saber si el usuario actual ya dio like
  const yaDioMeGusta = usuario && meGusta.includes(usuario.id);

  // Cargar contador de comentarios y likes reales desde Supabase
  useEffect(() => {
    const cargarDatosReales = async () => {
      try {
        // Comentarios
        const { count, error } = await supabase
          .from('comunidad_comentarios')
          .select('*', { count: 'exact', head: true })
          .eq('publicacion_id', id);

        if (!error && typeof count === 'number') {
          setContadorComentarios(count);
        }

        // Likes
        await recargarConteoLikes();
      } catch (error) {
        console.error('Error cargando datos reales:', error);
      }
    };

    cargarDatosReales();
  }, [id]);

  // Recargar conteo de likes
  const recargarConteoLikes = async () => {
    try {
      const { data: likesData, error: likesError } = await supabase
        .from('comunidad_publicaciones_likes')
        .select('usuario_id')
        .eq('publicacion_id', id);

      if (!likesError && likesData) {
        const likesUsuarios = likesData.map((like: any) => like.usuario_id);
        setMeGusta(likesUsuarios);
      }
    } catch (error) {
      console.error('Error recargando likes:', error);
    }
  };

  // Alternar me gusta
  const alternarMeGusta = async () => {
    if (!usuario || cargandoMeGusta) return;

    setCargandoMeGusta(true);
    setErrorMeGusta('');

    try {
      if (yaDioMeGusta) {
        // Quitar like
        const { error } = await supabase
          .from('comunidad_publicaciones_likes')
          .delete()
          .eq('publicacion_id', id)
          .eq('usuario_id', usuario.id);

        if (error) throw error;

        setMeGusta(prev => prev.filter(id => id !== usuario.id));
      } else {
        // Agregar like
        const { error } = await supabase
          .from('comunidad_publicaciones_likes')
          .insert([{
            publicacion_id: id,
            usuario_id: usuario.id
          }]);

        if (error) throw error;

        setMeGusta(prev => [...prev, usuario.id]);
      }
    } catch (error) {
      console.error('Error alternando me gusta:', error);
      setErrorMeGusta('Error al actualizar me gusta');
    } finally {
      setCargandoMeGusta(false);
    }
  };

  // Alternar comentarios
  const alternarComentarios = () => {
    setMostrarComentarios(!mostrarComentarios);
    if (!mostrarComentarios) {
      setEnfoqueAutomaticoComentario(true);
    }
  };

  // Enviar comentario
  const enviarComentario = async () => {
    if (!usuario || !nuevoComentario.trim() || cargandoComentario) return;

    setCargandoComentario(true);

    try {
      const { error } = await supabase
        .from('comunidad_comentarios')
        .insert([{
          publicacion_id: id,
          usuario_id: usuario.id,
          contenido: nuevoComentario.trim(),
          fecha_creacion: new Date().toISOString()
        }]);

      if (error) throw error;

      setNuevoComentario('');
      setContadorComentarios(prev => prev + 1);
    } catch (error) {
      console.error('Error enviando comentario:', error);
    } finally {
      setCargandoComentario(false);
    }
  };

  // Navegar al perfil
  const navegarAlPerfil = () => {
    console.log(`🔗 Navegando al perfil de: ${usuario_nombre} `);
    // Aquí implementarías la navegación
    // navigate(`/ usuarios / ${ usuario_slug } `);
  };

  // Formatear fecha
  const formatearFecha = (fechaString: string) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaString;
    }
  };

  return (
    <article className="feed-publicaciones-tarjeta" id={`publicacion - ${id} `}>
      {/* Encabezado de la publicación */}
      <header className="feed-publicaciones-encabezado">
        <div className="feed-publicaciones-info-usuario">
          <div className="feed-publicaciones-contenedor-avatar">
            <div className="feed-publicaciones-contenedor-boton-avatar">
              <img
                src={url_foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario_nombre)}&background=667eea&color=fff`}
                alt={usuario_nombre}
                className="feed-publicaciones-avatar"
                onClick={navegarAlPerfil}
              />
            </div >
            <div className="feed-publicaciones-indicador-estado"></div>
          </div >
          <div className="feed-publicaciones-detalles-usuario">
            <button
              className="feed-publicaciones-boton-nombre-usuario feed-publicaciones-clickeable"
              onClick={navegarAlPerfil}
              aria-label={`Ver perfil de ${usuario_nombre}`}
            >
              <h3 className="feed-publicaciones-nombre-usuario">
                {usuario_nombre}
              </h3>
            </button>
            <div className="feed-publicaciones-metadatos-publicacion">
              <time className="feed-publicaciones-fecha-publicacion">{formatearFecha(fecha)}</time>
              <span className="feed-publicaciones-separador">·</span>
              <span className="feed-publicaciones-visibilidad-publicacion" title="Público">
                <svg className="feed-publicaciones-icono-publico" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Público
              </span>
            </div>
          </div>
        </div >
        <div className="feed-publicaciones-acciones-encabezado">
          <button className="feed-publicaciones-boton-menu" title="Más opciones" aria-label="Opciones de publicación">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </header >

      {/* Contenido de la publicación */}
      < div className="feed-publicaciones-contenido-principal" >
        {tipo === 'foto_perfil' ? (
          <p className="feed-publicaciones-texto-publicacion-automatica">
            <span className="feed-publicaciones-accion-automatica">Actualizó su foto de perfil</span>
          </p>
        ) : tipo === 'foto_portada' ? (
          <p className="feed-publicaciones-texto-publicacion-automatica">
            <span className="feed-publicaciones-accion-automatica">Actualizó su foto de portada</span>
          </p>
        ) : (
          <p className="feed-publicaciones-texto-publicacion">{contenido}</p>
        )}

        {/* Media de la publicación */}
        {
          url_imagen && (
            <div className={`feed-publicaciones-contenedor-media ${tipo === 'foto_perfil' ? 'feed-publicaciones-media-perfil' : ''}`}>
              <img
                src={url_imagen}
                alt="Imagen de la publicación"
                className="feed-publicaciones-imagen-publicacion"
                loading="lazy"
              />
            </div>
          )
        }

        {
          url_video && (
            <div className="feed-publicaciones-contenedor-media">
              <video
                src={url_video}
                controls
                className="feed-publicaciones-video-publicacion"
                preload="metadata"
                aria-label="Video de la publicación"
              >
                <track kind="captions" src="" label="Sin subtítulos disponibles" default />
                Su navegador no soporta la reproducción de video.
              </video>
            </div>
          )
        }

        {
          url_gif && (
            <div className="feed-publicaciones-contenedor-media">
              <img
                src={url_gif}
                alt="GIF de la publicación"
                className="feed-publicaciones-gif-publicacion"
                loading="lazy"
              />
            </div>
          )
        }

        {/* Encuesta */}
        {
          encuesta && encuesta.opciones && encuesta.opciones.length > 0 && (
            <div className="feed-publicaciones-encuesta">
              <h4 className="feed-publicaciones-titulo-encuesta">{encuesta.pregunta}</h4>
              <div className="feed-publicaciones-opciones-encuesta">
                {encuesta.opciones.map((opcion: string, index: number) => (
                  <button
                    key={index}
                    className="feed-publicaciones-opcion-encuesta"
                    onClick={() => console.log('Votar por:', opcion)}
                  >
                    {opcion}
                  </button>
                ))}
              </div>
            </div>
          )
        }
      </div >

      {/* Barra de estadísticas */}
      < div className="feed-publicaciones-barra-estadisticas" >
        <div className="feed-publicaciones-reacciones-info">
          {meGusta.length > 0 && (
            <>
              <div className="feed-publicaciones-iconos-reacciones">
                <span className="feed-publicaciones-icono-reaccion">👍</span>
              </div>
              <span className="feed-publicaciones-contador-reacciones">{meGusta.length}</span>
              <span className="feed-publicaciones-texto-reacciones">
                {meGusta.length === 1 ? 'persona le gusta esto' : 'personas les gusta esto'}
              </span>
            </>
          )}
        </div>
        <div className="feed-publicaciones-estadisticas-derecha">
          {total_comentarios > 0 && (
            <button
              className="feed-publicaciones-boton-contador-comentarios"
              onClick={() => setMostrarComentarios(!mostrarComentarios)}
            >
              {total_comentarios} {total_comentarios === 1 ? 'comentario' : 'comentarios'}
            </button>
          )}
          {total_compartidos > 0 && (
            <>
              <span className="feed-publicaciones-separador-estadisticas">·</span>
              <span className="feed-publicaciones-contador-compartidos">
                {total_compartidos} {total_compartidos === 1 ? 'vez compartida' : 'veces compartida'}
              </span>
            </>
          )}
        </div>
      </div >

      {/* Barra de acciones */}
      < div className="feed-publicaciones-barra-acciones" >
        <button
          className={`feed-publicaciones-boton-accion ${yaDioMeGusta ? 'activo' : ''}`}
          onClick={alternarMeGusta}
          disabled={cargandoMeGusta}
          aria-label={yaDioMeGusta ? 'Quitar me gusta' : 'Me gusta'}
        >
          <svg className="feed-publicaciones-icono-accion" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
          </svg>
          <span className="feed-publicaciones-texto-accion">{yaDioMeGusta ? 'Te gusta' : 'Me gusta'}</span>
          {cargandoMeGusta && (
            <div className="feed-publicaciones-indicador-carga"></div>
          )}
        </button>

        <button
          className="feed-publicaciones-boton-accion"
          onClick={alternarComentarios}
          aria-label="Comentar publicación"
        >
          <svg className="feed-publicaciones-icono-accion" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.89 2 2 2h14l4 4-.01-18z" />
          </svg>
          <span className="feed-publicaciones-texto-accion">Comentar</span>
        </button>

        <button
          className="feed-publicaciones-boton-accion"
          aria-label="Compartir publicación"
        >
          <svg className="feed-publicaciones-icono-accion" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
          </svg>
          <span className="feed-publicaciones-texto-accion">Compartir</span>
        </button>
      </div >

      {/* Sección de comentarios */}
      {
        mostrarComentarios && (
          <div className="feed-publicaciones-seccion-comentarios">
            <div className="feed-publicaciones-formulario-comentario">
              <div className="feed-publicaciones-contenedor-avatar-usuario">
                <img
                  src={usuario ? `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nombre)}&background=667eea&color=fff` : ''}
                  alt="Tu avatar"
                  className="feed-publicaciones-avatar-usuario-actual"
                />
              </div>
              <div className="feed-publicaciones-contenedor-input-comentario">
                <div className="feed-publicaciones-input-wrapper">
                  <input
                    type="text"
                    placeholder="Escribe un comentario..."
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && enviarComentario()}
                    className="feed-publicaciones-input-comentario"
                    autoFocus={enfoqueAutomaticoComentario}
                    onFocus={() => setEnfoqueAutomaticoComentario(false)}
                    maxLength={500}
                  />
                  <div className="feed-publicaciones-contador-caracteres">
                    {nuevoComentario.length}/500
                  </div>
                </div>
                <button
                  className="feed-publicaciones-boton-enviar-comentario"
                  onClick={enviarComentario}
                  disabled={!nuevoComentario.trim() || cargandoComentario}
                >
                  <svg className="feed-publicaciones-icono-enviar" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  {cargandoComentario ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </article >
  );
};

export default FeedPublicaciones;
