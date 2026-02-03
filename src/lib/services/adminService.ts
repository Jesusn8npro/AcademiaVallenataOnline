import { supabase } from '$lib/supabase';

// Tipos para las estadísticas
export interface EstadisticasUsuarios {
  total: number;
  nuevos_mes: number;
  activos: number;
  crecimiento: number;
  premium: number;
}

export interface EstadisticasCursos {
  total: number;
  publicados: number;
  estudiantes: number;
  completados: number;
  rating: number;
}

export interface EstadisticasVentas {
  total: number;
  mes_actual: number;
  ingresos: number;
  crecimiento_ventas: number;
  ticket_promedio: number;
}

export interface EstadisticasBlog {
  articulos: number;
  publicados: number;
  borradores: number;
  visitas: number;
  engagement: number;
}

export interface EstadisticasComunidad {
  publicaciones: number;
  comentarios: number;
  likes: number;
  usuarios_activos: number;
  engagement: number;
}

export interface EstadisticasTutoriales {
  total: number;
  completados: number;
  progreso: number;
  tiempo_promedio: number;
  satisfaccion: number;
}

export interface EstadisticasEventos {
  proximos: number;
  pasados: number;
  participantes: number;
  cancelados: number;
}

export interface EstadisticasNotificaciones {
  enviadas: number;
  pendientes: number;
  abiertas: number;
  clicks: number;
}

export interface EstadisticasCompletas {
  usuarios: EstadisticasUsuarios;
  cursos: EstadisticasCursos;
  ventas: EstadisticasVentas;
  blog: EstadisticasBlog;
  comunidad: EstadisticasComunidad;
  tutoriales: EstadisticasTutoriales;
  eventos: EstadisticasEventos;
  notificaciones: EstadisticasNotificaciones;
}

// Utilidades para fechas
function obtenerFechasDelMes() {
  const fechaInicioMes = new Date();
  fechaInicioMes.setDate(1);
  
  const fechaMesAnterior = new Date();
  fechaMesAnterior.setMonth(fechaMesAnterior.getMonth() - 1);
  fechaMesAnterior.setDate(1);

  return { fechaInicioMes, fechaMesAnterior };
}

// Utilidades para formateo
export function formatearNumero(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function formatearMoneda(num: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

export function calcularCrecimiento(actual: number, anterior: number): number {
  return anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : 0;
}

// Cargar estadísticas de usuarios
export async function cargarEstadisticasUsuarios(): Promise<EstadisticasUsuarios> {
  const { data: usuarios } = await supabase
    .from('perfiles')
    .select('id, fecha_creacion, suscripcion')
    .eq('eliminado', false);

  const { fechaInicioMes, fechaMesAnterior } = obtenerFechasDelMes();

  const total = usuarios?.length || 0;
  
  const nuevosEsteMes = usuarios?.filter((u: any) => 
    new Date(u.fecha_creacion) >= fechaInicioMes
  ).length || 0;
  
  const nuevosMesAnterior = usuarios?.filter((u: any) => 
    new Date(u.fecha_creacion) >= fechaMesAnterior && 
    new Date(u.fecha_creacion) < fechaInicioMes
  ).length || 0;

  const activos = usuarios?.filter((u: any) => 
    u.suscripcion && u.suscripcion !== 'free'
  ).length || 0;

  const premium = usuarios?.filter((u: any) => 
    u.suscripcion === 'premium' || u.suscripcion === 'avanzada'
  ).length || 0;

  const crecimiento = calcularCrecimiento(nuevosEsteMes, nuevosMesAnterior);

  return {
    total,
    nuevos_mes: nuevosEsteMes,
    activos,
    crecimiento,
    premium
  };
}

// Cargar estadísticas de cursos
export async function cargarEstadisticasCursos(): Promise<EstadisticasCursos> {
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, es_publico, estudiantes_inscritos, estado');

  const { data: progresoLecciones } = await supabase
    .from('progreso_lecciones')
    .select('completado, usuario_id');

  const total = cursos?.length || 0;
  const publicados = cursos?.filter((c: any) => c.es_publico).length || 0;
  const estudiantes = cursos?.reduce((sum: number, c: any) => sum + (c.estudiantes_inscritos || 0), 0) || 0;
  const completados = progresoLecciones?.filter((p: any) => p.completado).length || 0;
  const rating = 4.7; // Placeholder

  return {
    total,
    publicados,
    estudiantes,
    completados,
    rating
  };
}

// Cargar estadísticas de ventas
export async function cargarEstadisticasVentas(): Promise<EstadisticasVentas> {
  const { data: ventas } = await supabase
    .from('pagos_epayco')
    .select('valor, created_at, estado')
    .eq('estado', 'aceptada');

  const { fechaInicioMes, fechaMesAnterior } = obtenerFechasDelMes();

  const ventasEsteMes = ventas?.filter((v: any) => 
    new Date(v.created_at) >= fechaInicioMes
  ) || [];
  
  const ventasMesAnterior = ventas?.filter((v: any) => 
    new Date(v.created_at) >= fechaMesAnterior && 
    new Date(v.created_at) < fechaInicioMes
  ) || [];

  const total = ventas?.length || 0;
  const mes_actual = ventasEsteMes.length;
  const ingresos = ventas?.reduce((sum: number, v: any) => sum + Number(v.valor), 0) || 0;
  
  const ingresosMesAnterior = ventasMesAnterior.reduce((sum: number, v: any) => sum + Number(v.valor), 0);
  const ingresosEsteMes = ventasEsteMes.reduce((sum: number, v: any) => sum + Number(v.valor), 0);
  
  const crecimiento_ventas = calcularCrecimiento(ingresosEsteMes, ingresosMesAnterior);
  const ticket_promedio = total > 0 ? Math.round(ingresos / total) : 0;

  return {
    total,
    mes_actual,
    ingresos,
    crecimiento_ventas,
    ticket_promedio
  };
}

// Cargar estadísticas del blog
export async function cargarEstadisticasBlog(): Promise<EstadisticasBlog> {
  const { data: blog } = await supabase
    .from('blog_articulos')
    .select('id, estado');

  const articulos = blog?.length || 0;
  const publicados = blog?.filter((a: any) => a.estado === 'publicado').length || 0;
  const borradores = blog?.filter((a: any) => a.estado === 'borrador').length || 0;
  const visitas = 0; // Placeholder
  const engagement = 0; // Placeholder

  return {
    articulos,
    publicados,
    borradores,
    visitas,
    engagement
  };
}

// Cargar estadísticas de comunidad
export async function cargarEstadisticasComunidad(): Promise<EstadisticasComunidad> {
  const { data: publicaciones } = await supabase
    .from('comunidad_publicaciones')
    .select('id');
  
  const { data: comentarios } = await supabase
    .from('comunidad_comentarios')
    .select('id');

  const { data: likes } = await supabase
    .from('comunidad_publicaciones_likes')
    .select('id');

  return {
    publicaciones: publicaciones?.length || 0,
    comentarios: comentarios?.length || 0,
    likes: likes?.length || 0,
    usuarios_activos: 0, // Placeholder
    engagement: 0 // Placeholder
  };
}

// Cargar estadísticas de tutoriales
export async function cargarEstadisticasTutoriales(): Promise<EstadisticasTutoriales> {
  const { data: tutoriales } = await supabase
    .from('tutoriales')
    .select('id');

  const { data: progreso } = await supabase
    .from('progreso_tutorial')
    .select('completado');

  const total = tutoriales?.length || 0;
  const completados = progreso?.filter((p: any) => p.completado).length || 0;
  const progresoTotal = progreso?.length || 0;
  const tiempo_promedio = 45; // Placeholder
  const satisfaccion = 92; // Placeholder

  return {
    total,
    completados,
    progreso: progresoTotal,
    tiempo_promedio,
    satisfaccion
  };
}

// Cargar estadísticas de eventos
export async function cargarEstadisticasEventos(): Promise<EstadisticasEventos> {
  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, fecha_evento, estado');

  const ahora = new Date();
  
  const proximos = eventos?.filter((e: any) => 
    new Date(e.fecha_evento) > ahora && e.estado !== 'cancelado'
  ).length || 0;
  
  const pasados = eventos?.filter((e: any) => 
    new Date(e.fecha_evento) < ahora && e.estado === 'finalizado'
  ).length || 0;
  
  const cancelados = eventos?.filter((e: any) => 
    e.estado === 'cancelado'
  ).length || 0;
  
  const participantes = 150; // Placeholder

  return {
    proximos,
    pasados,
    participantes,
    cancelados
  };
}

// Cargar estadísticas de notificaciones
export async function cargarEstadisticasNotificaciones(): Promise<EstadisticasNotificaciones> {
  const { data: notificaciones } = await supabase
    .from('notificaciones')
    .select('id, fecha_creacion, estado, visto');

  const enviadas = notificaciones?.filter((n: any) => 
    n.estado === 'enviada'
  ).length || 0;
  
  const pendientes = notificaciones?.filter((n: any) => 
    n.estado === 'pendiente'
  ).length || 0;
  
  const abiertas = notificaciones?.filter((n: any) => 
    n.visto === true
  ).length || 0;
  
  const clicks = 85; // Placeholder

  return {
    enviadas,
    pendientes,
    abiertas,
    clicks
  };
}

// Función principal para cargar todas las estadísticas
export async function cargarTodasLasEstadisticas(): Promise<EstadisticasCompletas> {
  try {
    const [
      usuarios,
      cursos,
      ventas,
      blog,
      comunidad,
      tutoriales,
      eventos,
      notificaciones
    ] = await Promise.all([
      cargarEstadisticasUsuarios(),
      cargarEstadisticasCursos(),
      cargarEstadisticasVentas(),
      cargarEstadisticasBlog(),
      cargarEstadisticasComunidad(),
      cargarEstadisticasTutoriales(),
      cargarEstadisticasEventos(),
      cargarEstadisticasNotificaciones()
    ]);

    return {
      usuarios,
      cursos,
      ventas,
      blog,
      comunidad,
      tutoriales,
      eventos,
      notificaciones
    };
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    throw error;
  }
} 