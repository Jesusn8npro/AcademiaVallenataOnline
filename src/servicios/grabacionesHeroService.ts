export type { ModoGrabacionHero, GrabacionEstudianteHero, DatosGuardarGrabacionHero } from './grabaciones/_tipos';
export { guardarGrabacion, obtenerMisGrabaciones, obtenerGrabacionesUsuario, obtenerGrabacionesPublicasUsuario, obtenerGrabacion, obtenerGrabacionPublica } from './grabaciones/consultas';
export { actualizarTitulo, eliminarGrabacion, actualizarVisibilidadGrabacion, publicarGrabacionEnComunidad } from './grabaciones/mutaciones';
