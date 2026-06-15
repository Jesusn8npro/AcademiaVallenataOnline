import { supabase } from '../../../../servicios/clienteSupabase';

// Posición fija del personaje por escenario (pestaña Personaje 3D). Global: la fija el admin y la ven
// todos. Lectura pública; escritura solo admins (RLS via es_admin_actual()). Tabla escenario_personaje_pos.

export interface PosEscenario {
  x: number;
  y: number;
  z: number;
  rotY: number;
  escala: number | null; // null = usar la escala por defecto del código
  autoPiso: boolean;
}

export async function cargarPosicionesEscenario(): Promise<Record<string, PosEscenario>> {
  try {
    const { data, error } = await supabase
      .from('escenario_personaje_pos')
      .select('escenario_id,x,y,z,rot_y,escala,auto_piso');
    if (error || !data) return {};
    const out: Record<string, PosEscenario> = {};
    for (const r of data as any[]) {
      out[r.escenario_id] = { x: r.x, y: r.y, z: r.z, rotY: r.rot_y, escala: r.escala, autoPiso: r.auto_piso };
    }
    return out;
  } catch {
    return {};
  }
}

export async function guardarPosicionEscenario(escenarioId: string, p: PosEscenario): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await (supabase.from('escenario_personaje_pos') as any).upsert({
      escenario_id: escenarioId,
      x: p.x, y: p.y, z: p.z, rot_y: p.rotY,
      escala: p.escala, auto_piso: p.autoPiso,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'error desconocido' };
  }
}
