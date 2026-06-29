import { supabase } from '../../../../servicios/clienteSupabase';
import type { MaterialesAcordeon } from './servicioMaterialesAcordeon';
import type { NombresCajasConfig } from '../Componentes/VisorAcordeon3D';

// Presets = diseños guardados del acordeón (color por parte + nombres de cajas) con nombre, por usuario.
// Tabla acordeon_presets (RLS: cada quien ve/edita los suyos). Sirven para reusar diseños en el futuro.

export interface PresetAcordeon {
  id: string;
  nombre: string;
  materiales: MaterialesAcordeon | null;
  nombres: NombresCajasConfig | null;
  thumbnail: string | null;
  created_at: string;
}

// Caché local de los presets (SIN thumbnail, para no llenar localStorage) → el Mundo/Personaje resuelve
// el diseño + la piel de base AL INSTANTE sin esperar la DB (la DB confirma en segundo plano). Clave para
// que "edito y abro el Mundo" muestre los cambios ya, sin recargar.
const LS_PRESETS = 'acordeon3d:presets';
export function leerPresetsLocal(): PresetAcordeon[] | null {
  if (typeof window === 'undefined') return null;
  try { const raw = localStorage.getItem(LS_PRESETS); return raw ? (JSON.parse(raw) as PresetAcordeon[]) : null; }
  catch { return null; }
}
export function guardarPresetsLocal(presets: PresetAcordeon[]): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_PRESETS, JSON.stringify(presets.map((p) => ({ ...p, thumbnail: null })))); }
  catch { /* quota / bloqueado */ }
}

export async function listarPresets(userId: string): Promise<PresetAcordeon[]> {
  try {
    const { data, error } = await supabase
      .from('acordeon_presets')
      .select('id,nombre,materiales,nombres,thumbnail,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as any as PresetAcordeon[];
  } catch {
    return [];
  }
}

export async function guardarPreset(
  userId: string, nombre: string, materiales: MaterialesAcordeon, nombres: NombresCajasConfig, thumbnail?: string | null,
): Promise<{ ok: boolean; preset?: PresetAcordeon; error?: string }> {
  try {
    const { data, error } = await (supabase.from('acordeon_presets') as any)
      .insert({ user_id: userId, nombre, materiales, nombres, thumbnail: thumbnail ?? null })
      .select('id,nombre,materiales,nombres,thumbnail,created_at')
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, preset: data as PresetAcordeon };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'error desconocido' };
  }
}

// Actualiza un diseño EXISTENTE (mismo id) → el personaje/mundo que lo tiene seleccionado refleja el
// cambio sin crear un duplicado. Se usa cuando el usuario "guarda" sobre un diseño con el mismo nombre.
export async function actualizarPreset(
  id: string, materiales: MaterialesAcordeon, nombres: NombresCajasConfig, thumbnail?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const upd: any = { materiales, nombres };
    if (thumbnail != null) upd.thumbnail = thumbnail;
    const { error } = await (supabase.from('acordeon_presets') as any).update(upd).eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'error desconocido' };
  }
}

export async function borrarPreset(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('acordeon_presets').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'error desconocido' };
  }
}
