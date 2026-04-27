export type { ExperienciaUsuario, LogroSistema, LogroUsuario, RankingGlobal, EstadisticasUsuario, NotificacionGaming } from '../tipos/gamificacion';
export { calcularXPParaNivel, calcularNivelDesdeXP, obtenerExperienciaUsuario, inicializarExperienciaUsuario, agregarXP } from './gamificacion/experiencia';
export { obtenerLogrosSistema, obtenerLogrosUsuario } from './gamificacion/logros';
export { obtenerRanking, obtenerPosicionUsuario } from './gamificacion/ranking';
export { obtenerEstadisticasUsuario } from './gamificacion/estadisticas';
export { crearNotificacionGaming } from './gamificacion/notificaciones';

import { calcularXPParaNivel, calcularNivelDesdeXP, obtenerExperienciaUsuario, inicializarExperienciaUsuario, agregarXP } from './gamificacion/experiencia';
import { obtenerLogrosSistema, obtenerLogrosUsuario } from './gamificacion/logros';
import { obtenerRanking, obtenerPosicionUsuario } from './gamificacion/ranking';
import { obtenerEstadisticasUsuario } from './gamificacion/estadisticas';
import { crearNotificacionGaming } from './gamificacion/notificaciones';

export const GamificacionServicio = {
    calcularXPParaNivel,
    calcularNivelDesdeXP,
    obtenerExperienciaUsuario,
    inicializarExperienciaUsuario,
    agregarXP,
    obtenerLogrosSistema,
    obtenerLogrosUsuario,
    obtenerRanking,
    obtenerPosicionUsuario,
    obtenerEstadisticasUsuario,
    crearNotificacionGaming
};
