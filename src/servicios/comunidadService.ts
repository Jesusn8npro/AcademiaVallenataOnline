export type { PublicacionComunidad, ComentarioComunidad, NuevaPublicacion, NuevoComentario } from '../tipos/comunidad';
export { cargarPublicaciones, cargarComentarios, obtenerPublicaciones, obtenerPublicacionPorId } from './comunidad/consultas';
export { crearPublicacion, crearComentario, toggleLike, eliminarPublicacion, eliminarComentario } from './comunidad/mutaciones';
export { formatearFecha, validarPublicacion, validarComentario } from './comunidad/utilidades';

import { cargarPublicaciones, cargarComentarios, obtenerPublicaciones, obtenerPublicacionPorId } from './comunidad/consultas';
import { crearPublicacion, crearComentario, toggleLike, eliminarPublicacion, eliminarComentario } from './comunidad/mutaciones';
import { formatearFecha, validarPublicacion, validarComentario } from './comunidad/utilidades';

const ComunidadService = {
    cargarPublicaciones,
    obtenerPublicaciones,
    obtenerPublicacionPorId,
    cargarComentarios,
    crearPublicacion,
    crearComentario,
    toggleLike,
    eliminarPublicacion,
    eliminarComentario,
    formatearFecha,
    validarPublicacion,
    validarComentario
};

export default ComunidadService;
