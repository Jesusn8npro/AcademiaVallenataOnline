export interface TutorialPaqueteItem {
    id: string;
    paquete_id: string;
    tutorial_id: string;
    orden: number;
    incluido: boolean;
    tutoriales?: {
        id: string;
        titulo: string;
        descripcion_corta?: string;
        imagen_url?: string;
        duracion_estimada?: number;
        precio_normal?: number;
        nivel?: string;
        categoria?: string;
        artista?: string;
        tonalidad?: string;
    };
}

export interface PaqueteTutorial {
    id?: string;
    titulo: string;
    descripcion?: string;
    descripcion_corta?: string;
    imagen_url?: string;
    precio_normal: number;
    precio_rebajado?: number;
    descuento_porcentaje?: number;
    estado: 'borrador' | 'publicado' | 'archivado';
    categoria?: string;
    nivel: 'principiante' | 'intermedio' | 'avanzado';
    destacado?: boolean;
    total_tutoriales?: number;
    duracion_total_estimada?: number;
    instructor_id?: string;
    tipo_acceso: 'gratuito' | 'premium' | 'vip';
    fecha_expiracion?: string;
    objetivos?: string;
    requisitos?: string;
    incluye?: string;
    ventajas?: string;
    slug?: string;
    meta_titulo?: string;
    meta_descripcion?: string;
    tags?: string[];
    orden_mostrar?: number;
    visible?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface PaqueteItem {
    id?: string;
    paquete_id: string;
    tutorial_id: string;
    orden: number;
    incluido: boolean;
    precio_individual_referencia?: number;
    notas?: string;
}

export interface ProgresoPaquete {
    id?: string;
    usuario_id: string;
    paquete_id: string;
    tutoriales_completados: number;
    tutoriales_totales: number;
    porcentaje_completado: number;
    ultimo_tutorial_id?: string;
    ultima_actividad: string;
    completado: boolean;
    fecha_completado?: string;
    tiempo_total_visto: number;
}

export interface ResultadoOperacion<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface TutorialResumen {
    id: string;
    titulo: string;
    imagen_url: string | null;
    categoria: string | null;
    nivel: string | null;
    precio_normal?: number;
    precio_rebajado?: number;
}
