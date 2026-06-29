import { supabase } from '../../../../servicios/clienteSupabase';
import type { MaterialPieza, NombresCajasConfig } from '../Componentes/VisorAcordeon3D';

// Persistencia del COLOR/ACABADO por parte del acordeón, por usuario. El acordeón es el mismo en todos
// lados, pero el "pintado" por partes es una preferencia personal → columna propia perfiles.acordeon_materiales
// (jsonb), separada de personaje_3d para no pisarse entre sí. Anónimo / sin red → localStorage del dispositivo.
//
// Forma: { [meshOGrupo]: { tinta, roughness, metalness, usarTexturaOriginal } }. La clave 'todos' es el default.

export type MaterialesAcordeon = Record<string, MaterialPieza>;

const LS_MATERIALES = 'acordeon3d:materiales';

export function leerMaterialesLocal(): MaterialesAcordeon | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_MATERIALES);
    return raw ? (JSON.parse(raw) as MaterialesAcordeon) : null;
  } catch {
    return null;
  }
}

export function guardarMaterialesLocal(data: MaterialesAcordeon): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_MATERIALES, JSON.stringify(data));
  } catch {
    /* storage lleno / bloqueado → vive en memoria esta sesión */
  }
}

export async function cargarMaterialesDB(userId: string): Promise<MaterialesAcordeon | null> {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('acordeon_materiales')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return ((data as any).acordeon_materiales as MaterialesAcordeon) || null;
  } catch {
    return null;
  }
}

export async function guardarMaterialesDB(userId: string, data: MaterialesAcordeon): Promise<void> {
  try {
    await (supabase.from('perfiles') as any).update({ acordeon_materiales: data }).eq('id', userId);
  } catch {
    /* sin red → ya quedó en localStorage; se sincroniza la próxima vez */
  }
}

// ── Nombres personalizados sobre las cajas (columna perfiles.acordeon_nombres) ──────────────────────
const LS_NOMBRES = 'acordeon3d:nombres';

export function leerNombresLocal(): NombresCajasConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_NOMBRES);
    return raw ? (JSON.parse(raw) as NombresCajasConfig) : null;
  } catch {
    return null;
  }
}

export function guardarNombresLocal(data: NombresCajasConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_NOMBRES, JSON.stringify(data));
  } catch { /* noop */ }
}

export async function cargarNombresDB(userId: string): Promise<NombresCajasConfig | null> {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('acordeon_nombres')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return ((data as any).acordeon_nombres as NombresCajasConfig) || null;
  } catch {
    return null;
  }
}

export async function guardarNombresDB(userId: string, data: NombresCajasConfig): Promise<void> {
  try {
    await (supabase.from('perfiles') as any).update({ acordeon_nombres: data }).eq('id', userId);
  } catch { /* noop */ }
}
