import type { ModeloVisualAcordeon } from '../TiposPracticaLibre';

export const MODELOS_VISUALES_ACORDEON: ModeloVisualAcordeon[] = [
  {
    id: 'acordeon_pro_max',
    nombre: 'Acordeon Pro Max',
    descripcion: 'Modelo principal del estudio con presencia moderna y limpia.',
    imagen: '/Acordeon PRO MAX.webp',
  },
  {
    id: 'acordeon_jugador',
    nombre: 'Acordeon Jugador',
    descripcion: 'Version alternativa pensada para sesiones de practica rapida.',
    imagen: '/Acordeon Jugador.webp',
  },
  {
    id: 'modelo_1',
    nombre: 'Modelo 1',
    descripcion: 'Acabado azul perlado con look clasico de escenario.',
    imagen: '/Modelo 1.webp',
  },
  {
    id: 'modelo_2',
    nombre: 'Modelo 2',
    descripcion: 'Variacion visual para alternar sesiones y referencias.',
    imagen: '/Modelo 2.webp',
  },
  {
    id: 'modelo_3',
    nombre: 'Modelo 3',
    descripcion: 'Acabado alterno para practicar con otra identidad visual.',
    imagen: '/Modelo 3.webp',
  },
];

export function obtenerModeloVisualPorId(modeloId: string | null | undefined) {
  return MODELOS_VISUALES_ACORDEON.find((modelo) => modelo.id === modeloId) || MODELOS_VISUALES_ACORDEON[0];
}

export function resolverImagenModeloAcordeon(modeloId: string | null | undefined, fallback: string) {
  return obtenerModeloVisualPorId(modeloId)?.imagen || fallback;
}
