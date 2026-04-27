export interface ResultadoBusqueda {
    id: string | number;
    titulo: string;
    descripcion?: string;
    tipo: 'curso' | 'tutorial' | 'blog' | 'usuario' | 'evento' | 'paquete';
    url: string;
    imagen?: string;
    nivel?: string;
    autor?: string;
    categoria?: string;
    precio?: number;
    fechaCreacion?: string;
}

export interface ResultadosBusqueda {
    cursos: ResultadoBusqueda[];
    tutoriales: ResultadoBusqueda[];
    blog: ResultadoBusqueda[];
    usuarios: ResultadoBusqueda[];
    eventos: ResultadoBusqueda[];
    paquetes: ResultadoBusqueda[];
    total: number;
}
