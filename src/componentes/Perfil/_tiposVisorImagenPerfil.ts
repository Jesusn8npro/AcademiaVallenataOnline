export interface Comentario {
    id: string;
    usuario_id: string;
    usuario_nombre: string;
    usuario_avatar: string;
    comentario: string;
    fecha_creacion: string;
    comentario_padre_id: string | null;
}

export interface Like {
    id: string;
    usuario_id: string;
}

export interface PropsVisorImagenPerfil {
    abierto: boolean;
    imagenUrl: string;
    imagenId: string | null;
    tipoImagen: 'avatar' | 'portada' | null;
    usuarioPropietario: { id: string; nombre: string; avatar: string };
    onCerrar: () => void;
}
