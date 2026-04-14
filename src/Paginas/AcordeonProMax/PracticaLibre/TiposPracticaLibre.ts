export type SeccionPanelPracticaLibre =
  | 'sonido' | 'modelos' | 'pistas' | 'teoria' | 'efectos'
  | 'rec' | 'gestor' | 'gestor_acordes' | 'lista_acordes' | 'libreria' | 'usb';

export interface ModeloVisualAcordeon {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
}

export interface CapaPistaPracticaLibre {
  id: string;
  nombre: string;
  url: string;
  volumen?: number;
  color?: string;
}

export interface PistaPracticaLibre {
  id: string;
  nombre: string;
  artista?: string | null;
  descripcion?: string | null;
  bpm?: number | null;
  tonalidad?: string | null;
  compas?: number | null;
  audioUrl: string | null;
  imagenUrl?: string | null;
  origen: 'catalogo' | 'cancion_hero' | 'local';
  capas?: CapaPistaPracticaLibre[];
  nombreArchivo?: string | null;
}

export interface EfectosPracticaLibre {
  reverb: number;
  bajos: number;
  medios: number;
  agudos: number;
  volumenPista: number;
  autoReiniciarPista: boolean;
}

export interface PreferenciasPracticaLibre {
  modeloVisualId: string;
  pistaId: string | null;
  pistaUrl: string | null;
  pistaNombre: string | null;
  capasActivas: string[];
  mostrarTeoriaCircular: boolean;
  efectos: EfectosPracticaLibre;
  ultimaSeccion: SeccionPanelPracticaLibre | null;
}

export const EFECTOS_PRACTICA_LIBRE_POR_DEFECTO: EfectosPracticaLibre = {
  reverb: 18,
  bajos: 0,
  medios: 0,
  agudos: 0,
  volumenPista: 72,
  autoReiniciarPista: true,
};

export const PREFERENCIAS_PRACTICA_LIBRE_POR_DEFECTO: PreferenciasPracticaLibre = {
  modeloVisualId: 'acordeon_pro_max',
  pistaId: null,
  pistaUrl: null,
  pistaNombre: null,
  capasActivas: [],
  mostrarTeoriaCircular: true,
  efectos: EFECTOS_PRACTICA_LIBRE_POR_DEFECTO,
  ultimaSeccion: 'sonido',
};
