// 🎯 HUB CENTRALIZADO DE SERVICIOS
// Evita imports duplicados de servicios comunes

// Re-exportar servicios más utilizados desde su ubicación original
export { default as GamificacionService } from '../../services/gamificacionService';
export { mensajeriaService } from '../../services/mensajeriaService';
export type { Chat, Mensaje, MiembroChat } from '../../services/mensajeriaService';
export { notificacionesService } from '../../services/notificacionesService';
export type { Notificacion, EstadisticasNotificaciones } from '../../services/notificacionesService';
export { eventosService } from '../../services/eventosService';
// export type { Evento, EventoCompleto, FiltrosEventos } from '../../services/eventosService';
export { leadsService } from '../../services/leadsService';
export { chatService } from '../../services/chatService';
export { busquedaService } from '../../services/busquedaService';
export { TiempoService } from '../../services/tiempoService';

// Servicios de paquetes con funciones más utilizadas
export { 
  obtenerPaquetesPublicados, 
  obtenerPaquetePorSlug, 
  obtenerTutorialesPaquete, 
  formatearPrecio as formatearPrecioPaquete,
  inscribirUsuarioEnPaquete,
  eliminarInscripcionPaquete,
  buscarPaquetes
} from '../../services/paquetesService';

// Servicios de cursos y tutoriales
export { obtenerCursoCompletoPorSlug } from '../../services/cursoService';
export { obtenerTutorialCompletoPorSlug } from '../../services/tutorialService';

// Servicios de progreso
export { 
  obtenerProgresoCurso,
  obtenerProgresoLeccion,
  actualizarProgresoLeccion
} from '../../services/progresoService';

export { 
  obtenerProgresoTutorial,
  obtenerProgresoTutorialDeParte,
  actualizarProgresoTutorial
} from '../../services/progresoTutorialService';

// Servicios de admin
export { 
  cargarTodasLasEstadisticas,
  formatearNumero as formatearNumeroAdmin,
  formatearMoneda
} from '../../services/adminService';
export type { 
  EstadisticasCompletas,
  EstadisticasVentas,
  EstadisticasUsuarios,
  EstadisticasComunidad,
  EstadisticasCursos
} from '../../services/adminService';

// Servicios de publicaciones y comunidad
export { crearPublicacionAutomaticaSegura } from '../../services/publicacionesAutoService';

// Servicios de imagen y utilidades
export { formatearTiempoRelativo as formatearTiempoImagenUsuario } from '../../services/imagenUsuarioService';

// Servicios de storage
export { default as StorageService } from '../../services/storageService';
export { default as CancionesService } from '../../services/cancionesService';

// Servicios del simulador
export { cancionesJuegoService } from '../../services/cancionesJuegoService';
export type { CancionCompleta, SecuenciaCancion, NotaCancion } from '../../services/cancionesJuegoService';

/**
 * 🔥 SERVICIOS COMBINADOS - Funciones que combinan múltiples servicios
 */

/**
 * Obtener datos completos del usuario (perfil + progreso + estadísticas)
 * @param usuarioId - ID del usuario
 */
// Funciones combinadas comentadas temporalmente para evitar errores
// Se pueden habilitar cuando se necesiten y se verifiquen las importaciones

/*
export async function obtenerDatosCompletosUsuario(usuarioId: string) {
  try {
    const [progreso, estadisticas, notificaciones] = await Promise.all([
      Promise.resolve({ cursosCompletados: 0, tutorialesEnProgreso: 0 }),
      GamificacionService.obtenerEstadisticasUsuario(usuarioId),
      notificacionesService.obtenerNoLeidas(usuarioId)
    ]);

    return {
      progreso,
      estadisticas,
      notificaciones: notificaciones?.data || []
    };
  } catch (error) {
    console.warn('Error obteniendo datos completos del usuario:', error);
    return null;
  }
}

export async function busquedaGlobal(query: string) {
  try {
    const resultados = await busquedaService.buscarTodo(query);
    return resultados;
  } catch (error) {
    console.warn('Error en búsqueda global:', error);
    return { cursos: [], tutoriales: [], usuarios: [], paquetes: [] };
  }
}
*/ 