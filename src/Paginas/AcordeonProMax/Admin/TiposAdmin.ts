/**
 * TIPOS Y INTERFACES DEL MÓDULO ADMIN
 * Para gestión de grabaciones, acordes y hardware en PracticaLibre
 */

export interface EstadoAdminRec {
  bpm: number;
  grabando: boolean;
  totalNotas: number;
  duracionMs: number;
}

export interface ConfiguracionAdminUSB {
  esp32Conectado: boolean;
  tipoFuelle?: 'US' | 'SL';
  ultimaConexion?: Date;
}

export interface AcordeAdminItem {
  id: string;
  nombre: string;
  grado?: string;
  tipo: 'Mayor' | 'Menor' | 'Septima';
  botones: string[];
  fuelle: 'abriendo' | 'cerrando';
  descripcion?: string;
}
