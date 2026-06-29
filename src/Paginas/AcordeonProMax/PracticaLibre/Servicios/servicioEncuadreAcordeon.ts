import { supabase } from '../../../../servicios/clienteSupabase';

// Encuadre 3D GLOBAL del acordeón en los modos de juego (Maestro/Alumno/Synthesia/Competitivo):
// orientación (rotación X/Y/Z) + tamaño/centrado (fill + offset). Lo fija el ADMIN desde la página de
// la canción (botón "Posición", mismos controles que /modo-competitivo-muestra) y lo ven todos.
// Lectura pública; escritura solo admins (RLS via es_admin_actual()). Tabla acordeon_encuadre (1 fila, id='global').

export interface EncuadreAcordeon {
  rotacion: [number, number, number]; // radianes (X, Y, Z)
  fill: number;
  offX: number;
  offY: number;
}

export type EncuadreId = 'global' | 'estudio';

export async function cargarEncuadreAcordeon(id: EncuadreId = 'global'): Promise<EncuadreAcordeon | null> {
  try {
    const { data, error } = await supabase
      .from('acordeon_encuadre')
      .select('rot_x,rot_y,rot_z,fill,offset_x,offset_y')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    const r = data as any;
    return { rotacion: [r.rot_x, r.rot_y, r.rot_z], fill: r.fill, offX: r.offset_x, offY: r.offset_y };
  } catch {
    return null;
  }
}

export async function guardarEncuadreAcordeon(id: EncuadreId, e: EncuadreAcordeon): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await (supabase.from('acordeon_encuadre') as any).upsert({
      id,
      rot_x: e.rotacion[0], rot_y: e.rotacion[1], rot_z: e.rotacion[2],
      fill: e.fill, offset_x: e.offX, offset_y: e.offY,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'error desconocido' };
  }
}
