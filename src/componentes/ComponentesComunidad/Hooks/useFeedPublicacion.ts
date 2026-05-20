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

function formatearFechaRelativa(fechaString: string): string {
  try {
    const diff = Date.now() - new Date(fechaString).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Ahora';
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(fechaString).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function agruparComentarios(todos: any[]): any[] {
  const padres = todos.filter(c => !c.comentario_padre_id);
  const hijos = todos.filter(c => !!c.comentario_padre_id);
  return padres.map(p => ({
    ...p,
    respuestas: hijos.filter(h => h.comentario_padre_id === p.id),
    mostrarRespuestas: false,
  }));
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
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [enfoqueAutomaticoComentario, setEnfoqueAutomaticoComentario] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [cargandoComentario, setCargandoComentario] = useState(false);
  // Respuestas
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [cargandoRespuesta, setCargandoRespuesta] = useState(false);
  // Otros
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [pedirConfirmacionEliminar, setPedirConfirmacionEliminar] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  const [grabacionHero, setGrabacionHero] = useState<GrabacionReplayHero | null>(null);
  const [cargandoGrabacionHero, setCargandoGrabacionHero] = useState(false);
  const [mostrarReplayHero, setMostrarReplayHero] = useState(false);
  const [menuComentarioId, setMenuComentarioId] = useState<string | null>(null);

  const yaDioMeGusta = !!(usuario && meGusta.includes(usuario.id));
  const esDuenioOAdmin = !!(usuario && (usuario.id === usuario_id || usuario.rol === 'admin'));

  // me_gusta y total_comentarios ya vienen correctos del feed query (consultas.ts
  // los incluye en el join). No hay re-fetch por post al montar.

  useEffect(() => {
    const grabacionId = (encuesta as { grabacion_id?: string })?.grabacion_id;
    if (tipo !== 'grabacion_hero' || !grabacionId) return;
    const cargar = async () => {
      try {
        setCargandoGrabacionHero(true);
        const data = await obtenerGrabacionPublica(grabacionId);
        setGrabacionHero(data as GrabacionReplayHero);
      } catch { /* no-fatal */ } finally { setCargandoGrabacionHero(false); }
    };
    cargar();
  }, [(encuesta as { grabacion_id?: string })?.grabacion_id, tipo]);

  const alternarMeGusta = async () => {
    if (!usuario || cargandoMeGusta) return;
    setCargandoMeGusta(true);
    try {
      if (yaDioMeGusta) {
        const { error } = await supabase.from('comunidad_publicaciones_likes').delete()
          .eq('publicacion_id', id).eq('usuario_id', usuario.id);
        if (error) throw error;
        setMeGusta(prev => prev.filter(uid => uid !== usuario.id));
      } else {
        const { error } = await supabase.from('comunidad_publicaciones_likes')
          .insert([{ publicacion_id: id, usuario_id: usuario.id }] as any);
        if (error) throw error;
        setMeGusta(prev => [...prev, usuario.id]);
      }
    } catch { /* no-fatal */ } finally { setCargandoMeGusta(false); }
  };

  const cargarComentarios = async () => {
    setCargandoLista(true);
    try {
      const { data } = await supabase
        .from('comunidad_comentarios')
        .select('id, comentario, fecha_creacion, usuario_id, usuario_nombre, usuario_avatar, total_likes, comentario_padre_id')
        .eq('publicacion_id', id)
        .order('fecha_creacion', { ascending: true });
      const raw = data || [];
      const sinAvatar = [...new Set(raw.filter((c: any) => !c.usuario_avatar).map((c: any) => c.usuario_id))];
      let perfilesMap: Record<string, string> = {};
      if (sinAvatar.length > 0) {
        const { data: perfs } = await supabase.from('perfiles').select('id, url_foto_perfil').in('id', sinAvatar);
        perfilesMap = Object.fromEntries((perfs || []).filter((p: any) => p.url_foto_perfil).map((p: any) => [p.id, p.url_foto_perfil]));
      }
      setComentarios(agruparComentarios(raw.map((c: any) => ({ ...c, usuario_avatar: c.usuario_avatar || perfilesMap[c.usuario_id] || null }))));
    } catch { /* no-fatal */ } finally { setCargandoLista(false); }
  };

  const alternarComentarios = () => {
    const abriendo = !mostrarComentarios;
    setMostrarComentarios(abriendo);
    if (abriendo) {
      setEnfoqueAutomaticoComentario(true);
      cargarComentarios();
    }
  };

  const alternarRespuestasComentario = (comentarioId: string) => {
    setComentarios(prev => prev.map(c =>
      c.id === comentarioId ? { ...c, mostrarRespuestas: !c.mostrarRespuestas } : c
    ));
  };

  const iniciarRespuesta = (comentarioId: string, nombreUsuario: string) => {
    setRespondiendo(comentarioId);
    setTextoRespuesta(`@${nombreUsuario} `);
  };

  const cancelarRespuesta = () => {
    setRespondiendo(null);
    setTextoRespuesta('');
  };

  const enviarComentario = async () => {
    if (!usuario || !nuevoComentario.trim() || cargandoComentario) return;
    setCargandoComentario(true);
    try {
      const { error } = await supabase.from('comunidad_comentarios')
        .insert([{
          publicacion_id: id,
          usuario_id: usuario.id,
          usuario_nombre: usuario.nombre,
          usuario_avatar: usuario.url_foto_perfil || null,
          comentario: nuevoComentario.trim(),
          fecha_creacion: new Date().toISOString(),
        }] as any);
      if (error) throw error;
      setNuevoComentario('');
      setContadorComentarios(prev => prev + 1);
      setComentarios(prev => [...prev, {
        id: `temp-${Date.now()}`,
        comentario: nuevoComentario.trim(),
        fecha_creacion: new Date().toISOString(),
        usuario_id: usuario.id,
        usuario_nombre: usuario.nombre,
        usuario_avatar: usuario.url_foto_perfil || null,
        total_likes: 0,
        comentario_padre_id: null,
        respuestas: [],
        mostrarRespuestas: false,
      }]);
    } catch { /* no-fatal */ } finally { setCargandoComentario(false); }
  };

  const enviarRespuesta = async (comentarioPadreId: string) => {
    if (!usuario || !textoRespuesta.trim() || cargandoRespuesta) return;
    setCargandoRespuesta(true);
    try {
      const { error } = await supabase.from('comunidad_comentarios')
        .insert([{
          publicacion_id: id,
          usuario_id: usuario.id,
          usuario_nombre: usuario.nombre,
          usuario_avatar: usuario.url_foto_perfil || null,
          comentario: textoRespuesta.trim(),
          comentario_padre_id: comentarioPadreId,
          fecha_creacion: new Date().toISOString(),
        }] as any);
      if (error) throw error;
      const nuevaRespuesta = {
        id: `temp-r-${Date.now()}`,
        comentario: textoRespuesta.trim(),
        fecha_creacion: new Date().toISOString(),
        usuario_id: usuario.id,
        usuario_nombre: usuario.nombre,
        usuario_avatar: usuario.url_foto_perfil || null,
        total_likes: 0,
        comentario_padre_id: comentarioPadreId,
      };
      setComentarios(prev => prev.map(c =>
        c.id === comentarioPadreId
          ? { ...c, respuestas: [...(c.respuestas || []), nuevaRespuesta], mostrarRespuestas: true }
          : c
      ));
      setContadorComentarios(prev => prev + 1);
      setTextoRespuesta('');
      setRespondiendo(null);
    } catch { /* no-fatal */ } finally { setCargandoRespuesta(false); }
  };

  const eliminarComentario = async (comentarioId: string, comentarioPadreId?: string | null) => {
    try {
      const { error } = await supabase.from('comunidad_comentarios').delete().eq('id', comentarioId);
      if (error) throw error;
      if (comentarioPadreId) {
        setComentarios(prev => prev.map(c =>
          c.id === comentarioPadreId
            ? { ...c, respuestas: (c.respuestas || []).filter((r: any) => r.id !== comentarioId) }
            : c
        ));
      } else {
        setComentarios(prev => prev.filter(c => c.id !== comentarioId));
      }
      setContadorComentarios(prev => prev - 1);
      setMenuComentarioId(null);
    } catch { /* no-fatal */ }
  };

  const manejarEliminar = () => { if (!esDuenioOAdmin || eliminando) return; setPedirConfirmacionEliminar(true); };
  const cancelarEliminar = () => { setPedirConfirmacionEliminar(false); setErrorEliminar(''); };
  const ejecutarEliminar = async () => {
    setEliminando(true); setErrorEliminar('');
    try {
      await eliminarPublicacion(id);
      onEliminar?.(id);
    } catch { setErrorEliminar('Error al eliminar la publicación'); }
    finally { setEliminando(false); setPedirConfirmacionEliminar(false); setMostrarMenu(false); }
  };

  return {
    contadorComentarios, meGusta, cargandoMeGusta,
    mostrarComentarios, comentarios, cargandoLista,
    enfoqueAutomaticoComentario, nuevoComentario,
    cargandoComentario, mostrarMenu, eliminando, grabacionHero,
    cargandoGrabacionHero, mostrarReplayHero, yaDioMeGusta, esDuenioOAdmin,
    pedirConfirmacionEliminar, errorEliminar,
    respondiendo, textoRespuesta, cargandoRespuesta,
    setMostrarMenu, setMostrarReplayHero, setEnfoqueAutomaticoComentario,
    setNuevoComentario, setTextoRespuesta,
    alternarMeGusta, alternarComentarios, enviarComentario,
    enviarRespuesta, iniciarRespuesta, cancelarRespuesta,
    alternarRespuestasComentario,
    menuComentarioId, setMenuComentarioId, eliminarComentario,
    manejarEliminar, cancelarEliminar, ejecutarEliminar,
    formatearFecha: formatearFechaRelativa,
  };
}
