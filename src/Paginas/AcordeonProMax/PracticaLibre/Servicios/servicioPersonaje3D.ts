import { supabase } from '../../../../servicios/clienteSupabase';

// Persistencia del "personaje fichado" del usuario: el mismo personaje (modelo + skin + escenario +
// baile) lo comparten el Mundo 3D, Pro Max y el Simulador App. Logueado → columna perfiles.personaje_3d
// (jsonb), funciona en cualquier dispositivo. Anónimo (Mundo 3D sin login) → localStorage del dispositivo.
//
// Las claves de localStorage 'personaje3d:id' y 'personaje3d:skin' ya existían (contextoPersonajeEstudio)
// → se reusan tal cual para no perder la elección previa de nadie.

export interface Personaje3DGuardado {
  personajeId?: string;
  skin?: string;
  escenarioId?: string;
  baile?: string | null;
}

const LS_ID = 'personaje3d:id';
const LS_SKIN = 'personaje3d:skin';
const LS_ESCENARIO = 'personaje3d:escenario';
const LS_BAILE = 'personaje3d:baile';

export function leerPersonaje3DLocal(): Personaje3DGuardado {
  if (typeof window === 'undefined') return {};
  try {
    return {
      personajeId: localStorage.getItem(LS_ID) || undefined,
      skin: localStorage.getItem(LS_SKIN) || undefined,
      escenarioId: localStorage.getItem(LS_ESCENARIO) || undefined,
      baile: localStorage.getItem(LS_BAILE), // null = "Quieto" (default)
    };
  } catch {
    return {};
  }
}

export function guardarPersonaje3DLocal(data: Personaje3DGuardado): void {
  if (typeof window === 'undefined') return;
  try {
    if (data.personajeId != null) localStorage.setItem(LS_ID, data.personajeId);
    if (data.skin != null) localStorage.setItem(LS_SKIN, data.skin);
    if (data.escenarioId != null) localStorage.setItem(LS_ESCENARIO, data.escenarioId);
    if (data.baile != null) localStorage.setItem(LS_BAILE, data.baile);
    else localStorage.removeItem(LS_BAILE);
  } catch {
    /* storage lleno / bloqueado → la elección igual vive en memoria esta sesión */
  }
}

export async function cargarPersonaje3DDB(userId: string): Promise<Personaje3DGuardado | null> {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('personaje_3d')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return ((data as any).personaje_3d as Personaje3DGuardado) || null;
  } catch {
    return null;
  }
}

export async function guardarPersonaje3DDB(userId: string, data: Personaje3DGuardado): Promise<void> {
  try {
    await (supabase.from('perfiles') as any).update({ personaje_3d: data }).eq('id', userId);
  } catch {
    /* sin red → ya quedó en localStorage; se sincroniza la próxima vez */
  }
}
