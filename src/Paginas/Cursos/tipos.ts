export interface Modulo {
    id: string;
    titulo: string;
    descripcion: string;
    orden: number;
    slug: string;
    lecciones?: Leccion[];
}

export interface Leccion {
    id: string;
    titulo: string;
    slug: string;
    orden: number;
}

export interface Contenido {
    id: string;
    titulo: string;
    slug: string;
    descripcion: string;
    descripcion_corta: string;
    imagen_url: string;
    categoria: string;
    nivel: string;
    precio_normal: number;
    precio_rebajado: number;
    fecha_expiracion: string;
    tipo_acceso: 'gratuito' | 'pago' | 'premium';
    plantilla_vista: 'premium' | 'clasica' | 'minimal' | 'video_hero';
    objetivos: string[] | string;
    estudiantes_inscritos: number;
    testimonio: string;
    autor_testimonio: string;
    instructor_id: string;
    modulos_preview: Modulo[];
    tipo: 'curso' | 'tutorial';
    modulos?: Modulo[];
    lecciones_sueltas?: Leccion[];
}

export interface DatosVista {
    contenido: Contenido;
    estaInscrito: boolean;
    instructor?: {
        full_name: string;
        avatar_url: string;
    };
}
