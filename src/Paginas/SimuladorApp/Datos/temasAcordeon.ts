// Catálogo de temas (modelos visuales) para el SimuladorApp.
// Cada tema vive en una carpeta dentro de `public/acordeones/<id>/` con
// 3 archivos fijos: diapason.jpg, bajos.jpg, preview.png. Si querés
// agregar un modelo nuevo:
//   1. Crea `public/acordeones/mi-modelo/` con esos 3 archivos
//   2. Agrega la entrada acá con el id correspondiente
// La galería los muestra automáticamente.
//
// Estructura preparada para escalar SIN tocar código:
// - `categoria` permite filtrar por tabs (Pro MAX / Originales / Personalizados)
// - `premiumOnly` ya está soportado (la galería gating se enciende en F3)
// - `colores` opcional para el editor en vivo (F2) — cuando se quiera
//   tintar un modelo grayscale con un color custom, se usa este campo

export type CategoriaTema = 'pro_max' | 'originales' | 'personalizados';

export interface TemaAcordeon {
    id: string;
    nombre: string;
    categoria: CategoriaTema;
    /** Ruta absoluta desde public. Cargada cuando el modelo se selecciona. */
    diapason: string;
    bajos: string;
    /** Thumbnail mostrado en la galería (carga inmediata). */
    preview: string;
    /** Si true, solo accesible para usuarios Plus. Default false. */
    premiumOnly?: boolean;
    /** Colores opcionales para el editor de personalización (F2). */
    colores?: {
        cuerpo?: string;
        botones?: string;
        fuelle?: string;
    };
    /** Descripción corta visible en el card de la galería. */
    descripcion?: string;
}

export const TEMA_DEFAULT_ID = 'pro_max';

export const TEMAS_ACORDEON: TemaAcordeon[] = [
    {
        id: 'pro_max',
        nombre: 'Pro MAX',
        categoria: 'pro_max',
        diapason: '/acordeones/pro-max/diapason.jpg',
        bajos: '/acordeones/pro-max/bajos.jpg',
        preview: '/acordeones/pro-max/preview.png',
        descripcion: 'Modelo principal. Acabado azul perlado clásico.',
    },
    {
        id: 'rojo',
        nombre: 'Rojo Clásico',
        categoria: 'originales',
        diapason: '/acordeones/rojo/diapason.jpg',
        bajos: '/acordeones/rojo/bajos.jpg',
        preview: '/acordeones/rojo/preview.png',
        descripcion: 'Look rojo con detalles dorados — vallenato puro.',
    },
    {
        id: 'verde',
        nombre: 'Verde Vallenato',
        categoria: 'originales',
        diapason: '/acordeones/verde/diapason.jpg',
        bajos: '/acordeones/verde/bajos.jpg',
        preview: '/acordeones/verde/preview.png',
        descripcion: 'Edición verde tropical con acentos.',
    },
];

export const ETIQUETAS_CATEGORIA: Record<CategoriaTema | 'todos', string> = {
    todos: 'Todos',
    pro_max: 'Pro MAX',
    originales: 'Originales',
    personalizados: 'Personalizados',
};

/** Devuelve el tema por id, o el default si no existe. */
export function obtenerTemaPorId(id: string | null | undefined): TemaAcordeon {
    if (!id) return TEMAS_ACORDEON[0];
    return TEMAS_ACORDEON.find((t) => t.id === id) || TEMAS_ACORDEON[0];
}

const STORAGE_KEY = 'simuladorapp_tema_acordeon';

/** Lee el tema guardado del localStorage. Cae a default si no hay. */
export function leerTemaGuardado(): string {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v && TEMAS_ACORDEON.some((t) => t.id === v)) return v;
    } catch (_) { /* SSR / disabled storage */ }
    return TEMA_DEFAULT_ID;
}

export function guardarTemaElegido(id: string) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch (_) { }
}
