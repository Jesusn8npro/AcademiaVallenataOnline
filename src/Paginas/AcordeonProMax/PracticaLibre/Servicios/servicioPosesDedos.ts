import { supabase } from '../../../../servicios/clienteSupabase';

// Poses de los dedos de melodía por botón (pestaña Personaje 3D). Global: las define el admin con el
// editor (gizmo) y las ven todos. Lectura pública; escritura solo admins (RLS via es_admin_actual()).
// huesos = { "RightHandIndex1": [x,y,z,w], ... } cuaterniones LOCALES por SUFIJO de hueso (mixamo) →
// independientes del personaje (los 6 comparten el rig mixamo) y del acordeón compartido.

export type HuesosPose = Record<string, [number, number, number, number]>;
export interface PoseDedo {
  nombre: string;
  huesos: HuesosPose;
  dedo?: string | null; // dedo lógico asignado (R_Index/R_Mid/R_Ring/R_Pinky/R_Thumb)
}

export async function cargarPosesDedos(): Promise<Record<string, PoseDedo>> {
  try {
    const { data, error } = await supabase
      .from('poses_dedos_acordeon')
      .select('boton,nombre,huesos,dedo');
    if (error || !data) return {};
    const out: Record<string, PoseDedo> = {};
    for (const r of data as any[]) out[r.boton] = { nombre: r.nombre || '', huesos: r.huesos || {}, dedo: r.dedo ?? null };
    return out;
  } catch {
    return {};
  }
}

export async function guardarPoseDedo(boton: string, nombre: string, huesos: HuesosPose, dedo?: string | null): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await (supabase.from('poses_dedos_acordeon') as any).upsert({
      boton, nombre, huesos, dedo: dedo ?? null, updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'error desconocido' };
  }
}

export async function borrarPoseDedo(boton: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await (supabase.from('poses_dedos_acordeon') as any).delete().eq('boton', boton);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'error desconocido' };
  }
}
