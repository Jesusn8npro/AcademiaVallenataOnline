import { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import { obtenerGrabacionPublica } from '../../../servicios/grabacionesHeroService';
import { eliminarPublicacion } from '../../../servicios/comunidadService';
import type { GrabacionReplayHero } from '../../../Paginas/Perfil/MisGrabaciones/Componentes/ModalReplayGrabacionHero';
import type { Usuario } from '../../../Paginas/Comunidad/tipos';

interface UseFeedPublicacionParams {
  id: string;
  me_gusta: string[];
  total_comentarios: number;
  usuario_id: string;
  tipo: string;
  encuesta?: unknown;
  usuario: Usuario | null;
  onEliminar?: (id: string) => void;
}

export function useFeedPublicacion({
  id,
  me_gusta,
  total_comentarios,
  usuario_id,
  tipo,
  encuesta,
  usuario,
  onEliminar,
}: UseFeedPublicacionParams) {
  const [contadorComentarios, setContadorComentarios] = useState(total_comentarios);
  const [meGusta, setMeGusta] = useState<string[]>(me_gusta);
  const [cargandoMeGusta, setCargandoMeGusta] = useState(false);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [enfoqueAutomaticoComentario, setEnfoqueAutomaticoComentario] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [cargandoComentario, setCargandoComentario] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [grabacionHero, setGrabacionHero] = useState<GrabacionReplayHero | null>(null);
  const [cargandoGrabacionHero, setCargandoGrabacionHero] = useState(false);
  const [mostrarReplayHero, setMostrarReplayHero] = useState(false);

  const yaDioMeGusta = !!(usuario && meGusta.includes(usuario.id));
  const esDuenioOAdmin = !!(usuario && (usuario.id === usuario_id || usuario.rol === 'admin'));

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { count } = await supabase
          .from('comunidad_comentarios')
          .select('*', { count: 'exact', head: true })
          .eq('publicacion_id', id);

        if (typeof count === 'number') setContadorComentarios(count);

        const { data: likesData } = await supabase
          .from('comunidad_publicaciones_likes')
          .select('usuario_id')
          .eq('publicacion_id', id);

        if (likesData) {
          setMeGusta(likesData.map((l: { usuario_id: string }) => l.usuario_id));
        }
      } catch {
        // datos en tiempo real son no-fatales; se muestran los datos iniciales
      }
    };

    cargarDatos();
  }, [id]);

  useEffect(() => {
    const grabacionId = (encuesta as { grabacion_id?: string })?.grabacion_id;
    if (tipo !== 'grabacion_hero' || !grabacionId) return;

    const cargar = async () => {
      try {
        setCargandoGrabacionHero(true);
        const data = await obtenerGrabacionPublica(grabacionId);
        setGrabacionHero(data as GrabacionReplayHero);
      } catch {
        // error no fatal
      } finally {
        setCargandoGrabacionHero(false);
      }
    };

    cargar();
  }, [(encuesta as { grabacion_id?: string })?.grabacion_id, tipo]);

  const alternarMeGusta = async () => {
    if (!usuario || cargandoMeGusta) return;
    setCargandoMeGusta(true);

    try {
      if (yaDioMeGusta) {
        const { error } = await supabase
          .from('comunidad_publicaciones_likes')
          .delete()
          .eq('publicacion_id', id)
          .eq('usuario_id', usuario.id);
        if (error) throw error;
        setMeGusta(prev => prev.filter(uid => uid !== usuario.id));
      } else {
        const { error } = await supabase
          .from('comunidad_publicaciones_likes')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert([{ publicacion_id: id, usuario_id: usuario.id }] as any);
        if (error) throw error;
        setMeGusta(prev => [...prev, usuario.id]);
      }
    } catch {
      // error no fatal — UI mantiene estado anterior
    } finally {
      setCargandoMeGusta(false);
    }
  };

  const alternarComentarios = () => {
    setMostrarComentarios(v => !v);
    if (!mostrarComentarios) setEnfoqueAutomaticoComentario(true);
  };

  const enviarComentario = async () => {
    if (!usuario || !nuevoComentario.trim() || cargandoComentario) return;
    setCargandoComentario(true);

    try {
      const { error } = await supabase
        .from('comunidad_comentarios')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([{
          publicacion_id: id,
          usuario_id: usuario.id,
          usuario_nombre: usuario.nombre,
          comentario: nuevoComentario.trim(),
          fecha_creacion: new Date().toISOString(),
        }] as any);

      if (error) throw error;
      setNuevoComentario('');
      setContadorComentarios(prev => prev + 1);
    } catch {
      // error de comentario no bloquea la UI
    } finally {
      setCargandoComentario(false);
    }
  };

  const manejarEliminar = async () => {
    if (!esDuenioOAdmin || eliminando) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.')) return;

    setEliminando(true);
    try {
      await eliminarPublicacion(id);
      onEliminar?.(id);
    } catch {
      alert('Error al eliminar la publicación');
    } finally {
      setEliminando(false);
      setMostrarMenu(false);
    }
  };

  const formatearFecha = (fechaString: string): string => {
    try {
      return new Date(fechaString).toLocaleString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return fechaString;
    }
  };

  return {
    contadorComentarios, meGusta, cargandoMeGusta,
    mostrarComentarios, enfoqueAutomaticoComentario, nuevoComentario,
    cargandoComentario, mostrarMenu, eliminando, grabacionHero,
    cargandoGrabacionHero, mostrarReplayHero, yaDioMeGusta, esDuenioOAdmin,
    setMostrarMenu, setMostrarReplayHero, setEnfoqueAutomaticoComentario, setNuevoComentario,
    alternarMeGusta, alternarComentarios, enviarComentario, manejarEliminar, formatearFecha,
  };
}
