export interface ExperienciaUsuario {
  id: string;
  usuario_id: string;
  nivel: number;
  xp_actual: number;
  xp_total: number;
  xp_siguiente_nivel: number;
  xp_cursos: number;
  xp_simulador: number;
  xp_comunidad: number;
  xp_logros: number;
  racha_dias: number;
  racha_maxima: number;
  ultima_sesion: string;
  created_at: string;
  updated_at: string;
}

export interface LogroSistema {
  id: string;
  nombre: string;
  descripcion: string;
  descripcion_corta: string;
  icono: string;
  categoria: 'constancia' | 'progreso' | 'precision' | 'social' | 'especial' | 'simulador' | 'cursos' | 'comunidad';
  dificultad: 'facil' | 'medio' | 'dificil' | 'legendario';
  xp_recompensa: number;
  monedas_recompensa: number;
  titulo_especial: string | null;
  condiciones: Record<string, any>;
  activo: boolean;
  visible: boolean;
  orden_mostrar: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogroUsuario {
  id: string;
  usuario_id: string;
  logro_id: string;
  conseguido: boolean;
  progreso_actual: number;
  progreso_objetivo: number;
  porcentaje_progreso: number;
  datos_logro: Record<string, any>;
  conseguido_en: string | null;
  primer_progreso: string;
  ultimo_progreso: string;
  created_at: string;
  updated_at: string;
  logro_sistema?: LogroSistema;
}

export interface RankingGlobal {
  id: string;
  usuario_id: string;
  tipo_ranking: 'general' | 'semanal' | 'mensual' | 'simulador' | 'cursos' | 'precision' | 'constancia' | 'comunidad' | 'especial';
  puntuacion: number;
  posicion: number;
  posicion_anterior: number | null;
  metricas: Record<string, any>;
  periodo_inicio: string;
  periodo_fin: string | null;
  temporada: string | null;
  activo: boolean;
  calculated_at: string;
  created_at: string;
  updated_at: string;
  perfiles?: {
    nombre: string | null;
    apellido: string | null;
    url_foto_perfil?: string | null;
  };
}

export interface SesionSimulador {
  id: string;
  usuario_id: string;
  duracion_minutos: number;
  duracion_segundos: number;
  tiempo_inicio: string;
  tiempo_fin: string | null;
  notas_tocadas: number;
  notas_correctas: number;
  notas_incorrectas: number;
  precision_promedio: number;
  bpm_promedio: number;
  escalas_practicadas: string[];
  acordes_practicados: string[];
  canciones_intentadas: string[];
  afinacion_usada: string;
  tipo_practica: 'libre' | 'leccion' | 'cancion' | 'escala' | 'ejercicio';
  xp_ganado: number;
  logros_desbloqueados: string[];
  nivel_antes: number;
  nivel_despues: number;
  datos_sesion: Record<string, any>;
  created_at: string;
}

export interface EstadisticasUsuario {
  id: string;
  usuario_id: string;
  total_sesiones: number;
  tiempo_total_minutos: number;
  primer_sesion: string | null;
  ultima_sesion: string | null;
  precision_maxima: number;
  precision_promedio: number;
  notas_totales_tocadas: number;
  notas_correctas_totales: number;
  cursos_completados: number;
  tutoriales_completados: number;
  lecciones_completadas: number;
  publicaciones_creadas: number;
  likes_recibidos: number;
  comentarios_hechos: number;
  logros_totales: number;
  logros_faciles: number;
  logros_medios: number;
  logros_dificiles: number;
  logros_legendarios: number;
  racha_actual_dias: number;
  racha_maxima_dias: number;
  dias_activos_total: number;
  mejor_posicion_global: number | null;
  mejor_posicion_semanal: number | null;
  semanas_en_top_10: number;
  calculado_en: string;
  created_at: string;
  updated_at: string;
}

export interface NotificacionGaming {
  id: string;
  usuario_id: string;
  tipo: 'logro_conseguido' | 'subida_nivel' | 'nuevo_ranking' | 'racha_perdida' | 'desafio_completado' | 'monedas_ganadas' | 'evento_especial' | 'meta_alcanzada';
  titulo: string;
  mensaje: string;
  icono: string;
  datos_notificacion: Record<string, any>;
  leida: boolean;
  mostrada: boolean;
  accion_realizada: boolean;
  prioridad: 'baja' | 'normal' | 'alta' | 'critica';
  estilo_visual: 'normal' | 'celebracion' | 'logro' | 'ranking' | 'especial';
  fecha_expiracion: string | null;
  leida_en: string | null;
  mostrada_en: string | null;
  created_at: string;
  updated_at: string;
}
