export interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    nombre_completo: string;
    correo_electronico: string;
    rol: string;
    suscripcion: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    eliminado: boolean;
    url_foto_perfil?: string;
    ciudad?: string;
    pais?: string;
    whatsapp?: string;
    nivel_habilidad?: string;
    documento_numero?: string;
    profesion?: string;
}

export interface Curso {
    id: string;
    titulo: string;
    imagen_url: string;
    precio_normal: number;
    precio_rebajado: number | null;
    descripcion: string;
    tipo?: 'curso' | 'tutorial';
    duracion?: number;
    precio?: number;
}

export interface Tutorial {
    id: string;
    titulo: string;
    imagen_url: string;
    duracion: number;
    precio_normal: number;
    precio_rebajado: number | null;
    descripcion: string;
    precio?: number;
}

export interface Paquete {
    id: string;
    titulo: string;
    descripcion_corta?: string;
    imagen_url?: string;
    precio_normal: number;
    precio_rebajado?: number;
    total_tutoriales?: number;
    nivel?: string;
    categoria?: string;
}

export interface Inscripcion {
    id: string;
    curso_id?: string;
    tutorial_id?: string;
    paquete_id?: string;
    fecha_inscripcion: string;
    estado: string;
    curso?: Curso;
    paquetes_tutoriales?: Paquete;
}

export function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatearPrecio(precio: number | string): string {
    const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(numero);
}
