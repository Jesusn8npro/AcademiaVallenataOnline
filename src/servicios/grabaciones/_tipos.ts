import type { NotaHero } from '../../Core/hero/tipos_Hero';

export type ModoGrabacionHero = 'practica_libre' | 'competencia';

export interface GrabacionEstudianteHero {
    id: string;
    usuario_id: string;
    cancion_id: string | null;
    modo: ModoGrabacionHero;
    origen: string;
    titulo: string | null;
    descripcion: string | null;
    secuencia_grabada?: NotaHero[];
    secuencia_json?: NotaHero[];
    bpm: number;
    resolucion: number;
    tonalidad: string | null;
    duracion_ms: number | null;
    precision_porcentaje: number | null;
    puntuacion: number | null;
    notas_totales: number | null;
    notas_correctas: number | null;
    es_publica: boolean;
    publicacion_id: string | null;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface DatosGuardarGrabacionHero {
    cancion_id?: string | null;
    modo: ModoGrabacionHero;
    origen?: string;
    titulo?: string;
    descripcion?: string | null;
    secuencia_grabada?: NotaHero[];
    secuencia?: NotaHero[];
    bpm: number;
    resolucion?: number;
    tonalidad?: string | null;
    duracion_ms?: number | null;
    precision_porcentaje?: number | null;
    puntuacion?: number | null;
    notas_totales?: number | null;
    notas_correctas?: number | null;
    metadata?: Record<string, any>;
}
