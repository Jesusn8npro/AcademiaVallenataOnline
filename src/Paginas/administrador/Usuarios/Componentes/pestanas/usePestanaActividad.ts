import { useState, useEffect } from 'react';
import { supabase } from '../../../../../servicios/clienteSupabase';
import type { UsuarioAdmin } from '../../../../../servicios/usuariosAdminService';

export interface DatosActividad {
  tiempoTotal: number;
  sesionesHoy: number;
  ultimaActividad: string | null;
  diasActivos: number;
  promedioSesionDiaria: number;
  sesionesRecientes: any[];
  paginasFavoritas: Array<{ pagina: string; visitas: number; tiempo_total: number }>;
  actividadPorDia: Array<{ fecha: string; tiempo: number; sesiones: number; fecha_formateada: string }>;
  cursosProgreso: any[];
  logrosObtenidos: any[];
  racha: number;
}

const DATOS_INICIALES: DatosActividad = {
  tiempoTotal: 0, sesionesHoy: 0, ultimaActividad: null, diasActivos: 0, promedioSesionDiaria: 0,
  sesionesRecientes: [], paginasFavoritas: [], actividadPorDia: [], cursosProgreso: [], logrosObtenidos: [], racha: 0
};

const MAPA_PAGINAS: Record<string, string> = {
  '/': '🏠 Inicio',
  '/panel-estudiante': '📚 Panel Estudiante',
  '/cursos': '📖 Cursos',
  '/simulador-gaming': '🎮 Simulador',
  '/ranking': '🏆 Ranking',
  '/eventos': '📅 Eventos',
  '/mensajes': '💬 Mensajes'
};

export function formatearTiempo(minutos: number): string {
  if (minutos < 60) return `${minutos}m`;
  return `${Math.floor(minutos / 60)}h ${minutos % 60}m`;
}

export function formatearTiempoRelativo(fecha: string | null): string {
  if (!fecha) return 'Nunca';
  const diferencia = Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60));
  if (diferencia < 1) return 'Ahora mismo';
  if (diferencia < 60) return `Hace ${diferencia}m`;
  if (diferencia < 1440) return `Hace ${Math.floor(diferencia / 60)}h`;
  return `Hace ${Math.floor(diferencia / 1440)}d`;
}

export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function formatearNombrePagina(pagina: string): string {
  return MAPA_PAGINAS[pagina] || pagina.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function procesarDatosActividad(sesiones: any[], eventos: any[], inscripciones: any[]): DatosActividad {
  const ahora = new Date();
  const hoyISO = ahora.toISOString().split('T')[0];

  const tiempoTotal = sesiones?.reduce((t, s) => t + (s.tiempo_total_minutos || 0), 0) || 0;
  const sesionesHoy = sesiones?.filter(s => s.fecha === hoyISO)?.length || 0;
  const ultimaActividad = sesiones?.[0]?.ultima_actividad || null;
  const diasActivos = sesiones?.length || 0;
  const promedioSesionDiaria = diasActivos > 0 ? Math.round(tiempoTotal / diasActivos) : 0;

  const sesionesRecientes = (sesiones || []).slice(0, 10).map(sesion => ({
    ...sesion,
    tiempo_formateado: formatearTiempo(sesion.tiempo_total_minutos || 0),
    hace: formatearTiempoRelativo(sesion.ultima_actividad)
  }));

  const contadorPaginas = new Map<string, { visitas: number; tiempo_total: number }>();
  eventos?.forEach(evento => {
    const pagina = evento.pagina || 'Desconocida';
    const tiempoEvento = evento.duracion_minutos || 1;
    const actual = contadorPaginas.get(pagina);
    if (actual) {
      contadorPaginas.set(pagina, { visitas: actual.visitas + 1, tiempo_total: actual.tiempo_total + tiempoEvento });
    } else {
      contadorPaginas.set(pagina, { visitas: 1, tiempo_total: tiempoEvento });
    }
  });

  const paginasFavoritas = Array.from(contadorPaginas.entries())
    .map(([pagina, datos]) => ({ pagina: formatearNombrePagina(pagina), visitas: datos.visitas, tiempo_total: datos.tiempo_total }))
    .sort((a, b) => b.visitas - a.visitas)
    .slice(0, 8);

  const actividadPorDia = Array.from({ length: 14 }, (_, i) => {
    const fecha = new Date(ahora.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
    const fechaISO = fecha.toISOString().split('T')[0];
    const sesionDia = sesiones?.find(s => s.fecha === fechaISO);
    const eventosDia = eventos?.filter(e => e.created_at?.startsWith(fechaISO)) || [];
    return {
      fecha: fechaISO,
      tiempo: sesionDia?.tiempo_total_minutos || 0,
      sesiones: eventosDia.length,
      fecha_formateada: fecha.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })
    };
  });

  const cursosProgreso = (inscripciones || []).map(i => ({
    ...i,
    nombre: i.cursos?.titulo || i.paquetes_tutoriales?.titulo || 'Curso',
    imagen: i.cursos?.imagen_url || i.paquetes_tutoriales?.imagen_url || '/images/default-course.jpg',
    progreso_texto: `${i.porcentaje_completado || 0}%`,
    estado: i.completado ? 'Completado' : 'En progreso'
  }));

  let racha = 0;
  for (let i = 0; i < sesiones.length; i++) {
    const fechaSesion = new Date(sesiones[i].fecha);
    const fechaEsperada = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
    if (fechaSesion.toDateString() === fechaEsperada.toDateString()) racha++;
    else break;
  }

  return {
    tiempoTotal, sesionesHoy, ultimaActividad, diasActivos, promedioSesionDiaria,
    sesionesRecientes, paginasFavoritas, actividadPorDia, cursosProgreso, logrosObtenidos: [], racha
  };
}

export function usePestanaActividad(usuario: UsuarioAdmin) {
  const [cargandoActividad, setCargandoActividad] = useState(false);
  const [datosActividad, setDatosActividad] = useState<DatosActividad>(DATOS_INICIALES);

  useEffect(() => {
    cargarDatosActividadReal();
  }, [usuario.id]);

  const cargarDatosActividadReal = async () => {
    if (!usuario?.id) return;
    try {
      setCargandoActividad(true);

      const { data: resumenSesiones } = await supabase
        .from('sesiones_usuario')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('fecha', { ascending: false })
        .limit(30);

      const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: eventosActividad } = await supabase
        .from('eventos_actividad')
        .select('*')
        .eq('usuario_id', usuario.id)
        .gte('created_at', hace30Dias)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: progresoInscripciones } = await supabase
        .from('inscripciones')
        .select('*, cursos:curso_id (titulo, imagen_url), paquetes_tutoriales:paquete_id (titulo, imagen_url)')
        .eq('usuario_id', usuario.id);

      setDatosActividad(procesarDatosActividad(resumenSesiones || [], eventosActividad || [], progresoInscripciones || []));
    } catch {
      setDatosActividad(prev => ({ ...prev, tiempoTotal: 0, sesionesHoy: 0, ultimaActividad: null }));
    } finally {
      setCargandoActividad(false);
    }
  };

  return { cargandoActividad, datosActividad };
}
