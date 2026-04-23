import type { NotaHero } from '../../../../Core/hero/tipos_Hero';

export interface CancionRelacionada {
    titulo?: string | null;
    autor?: string | null;
    slug?: string | null;
    bpm?: number | null;
    audio_fondo_url?: string | null;
}

export interface GrabacionReplayHero {
    id: string;
    modo: 'competencia' | 'practica_libre';
    titulo: string | null;
    descripcion: string | null;
    secuencia_grabada: NotaHero[];
    bpm: number;
    resolucion: number;
    tonalidad: string | null;
    duracion_ms: number | null;
    precision_porcentaje: number | null;
    puntuacion: number | null;
    notas_totales: number | null;
    es_publica?: boolean;
    publicacion_id?: string | null;
    metadata?: Record<string, any> | null;
    created_at: string;
    canciones_hero?: CancionRelacionada | null;
}
