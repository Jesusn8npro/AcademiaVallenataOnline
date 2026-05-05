/**
 * Tipo `Seccion` compartido por la lógica del estudiante (Pro Max) y el grabador V2.
 * Antes vivía en `Admin/Componentes/EditorSecuencia/tiposEditor.ts`; al borrar Admin/ se movió
 * acá para no acoplar el código del estudiante a la carpeta del maestro.
 */
export interface Seccion {
  id: string;
  nombre: string;
  tickInicio: number;
  tickFin: number;
  tipo: 'melodia' | 'acompanamiento';
  monedas: number;
}
