export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario?: string;
  url_foto_perfil?: string;
  rol: string;
  [key: string]: unknown;
}
