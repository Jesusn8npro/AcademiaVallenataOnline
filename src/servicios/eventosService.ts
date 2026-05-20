export type { EventoCompleto, FiltrosEventos } from './eventos/_tipos';
export { obtenerEventos, obtenerEventosUsuario, obtenerEventoPorId, obtenerCategorias, obtenerTiposEvento, obtenerEventoPorSlug } from './eventos/consultas';
export { inscribirseEnEvento, verificarInscripcion, cancelarInscripcion, obtenerComentariosEvento, obtenerMaterialesEvento, agregarComentario } from './eventos/inscripciones';
export { formatearFechaEvento, obtenerEstadoEvento } from './eventos/utilidades';
export { crearEvento, eliminarEvento } from './eventos/mutaciones';

import { obtenerEventos, obtenerEventosUsuario, obtenerEventoPorId, obtenerCategorias, obtenerTiposEvento, obtenerEventoPorSlug } from './eventos/consultas';
import { inscribirseEnEvento, verificarInscripcion, cancelarInscripcion, obtenerComentariosEvento, obtenerMaterialesEvento, agregarComentario } from './eventos/inscripciones';
import { formatearFechaEvento, obtenerEstadoEvento } from './eventos/utilidades';
import { crearEvento, eliminarEvento } from './eventos/mutaciones';

export const eventosService = {
    obtenerEventos,
    obtenerEventosUsuario,
    obtenerEventoPorId,
    obtenerEventoPorSlug,
    inscribirseEnEvento,
    inscribirseEvento: inscribirseEnEvento,
    verificarInscripcion,
    cancelarInscripcion,
    obtenerComentariosEvento,
    obtenerMaterialesEvento,
    agregarComentario,
    obtenerCategorias,
    obtenerTiposEvento,
    formatearFechaEvento,
    obtenerEstadoEvento,
    crearEvento,
    eliminarEvento
};
