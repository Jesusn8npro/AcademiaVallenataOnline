export type { EventoCompleto, FiltrosEventos } from './eventos/_tipos';
export { obtenerEventos, obtenerEventosUsuario, obtenerEventoPorId, obtenerCategorias, obtenerTiposEvento } from './eventos/consultas';
export { inscribirseEnEvento, verificarInscripcion } from './eventos/inscripciones';
export { formatearFechaEvento, obtenerEstadoEvento } from './eventos/utilidades';

import { obtenerEventos, obtenerEventosUsuario, obtenerEventoPorId, obtenerCategorias, obtenerTiposEvento } from './eventos/consultas';
import { inscribirseEnEvento, verificarInscripcion } from './eventos/inscripciones';
import { formatearFechaEvento, obtenerEstadoEvento } from './eventos/utilidades';

export const eventosService = {
    obtenerEventos,
    obtenerEventosUsuario,
    obtenerEventoPorId,
    inscribirseEnEvento,
    verificarInscripcion,
    obtenerCategorias,
    obtenerTiposEvento,
    formatearFechaEvento,
    obtenerEstadoEvento
};
