import { supabase } from '../servicios/clienteSupabase';

/**
 * Cerebro de acceso por membresía — punto único de verdad.
 *
 * Lee el plan activo del usuario (perfiles.membresia_activa_id) y sus `permisos`
 * (jsonb en la tabla `membresias`). Decide qué features del simulador puede usar
 * y a qué contenido (tutoriales/cursos/paquetes) puede acceder.
 *
 * El acceso a CONTENIDO es la unión de dos caminos (coexisten a propósito):
 *   1) Inscripción individual (compra suelta o alumno antiguo "grandfather").
 *   2) El plan del usuario cubre ese tipo de contenido.
 *
 * RENDIMIENTO: cachea en memoria (lado cliente) los permisos del usuario y la
 * tabla de planes, para no golpear Supabase en cada navegación. TTL corto.
 */

export interface PermisosPlan {
  nivel: number;
  facturacion: 'mensual' | 'unica';
  simulador: { tocar: boolean; efectos: boolean; movil: boolean; hero: boolean };
  estudio: { habilitado: boolean; max_pistas: number; max_grabaciones: number };
  contenido: { tutoriales_video: boolean; cursos: boolean; paquetes: boolean };
}

export interface PlanUsuario {
  membresiaId: string;
  nombre: string;
  permisos: PermisosPlan;
}

/**
 * Permisos para usuario SIN plan activo (free permanente o trial vencido).
 * Mantiene el comportamiento actual: simulador básico utilizable + límites del
 * free de Práctica Libre (3 pistas / 10 grabaciones).
 */
export const PERMISOS_FREE: PermisosPlan = {
  nivel: 0,
  facturacion: 'mensual',
  simulador: { tocar: true, efectos: false, movil: false, hero: false },
  estudio: { habilitado: true, max_pistas: 3, max_grabaciones: 10 },
  contenido: { tutoriales_video: false, cursos: false, paquetes: false },
};

// ───────────────────────── Caché en memoria (cliente) ─────────────────────────
const TTL_PERMISOS = 60_000;     // 60 s: el plan del usuario casi no cambia
const TTL_MEMBRESIAS = 300_000;  // 5 min: la tabla de planes es muy estable

let _membresiasCache: { at: number; map: Map<string, { nombre: string; permisos: PermisosPlan }> } | null = null;
const _permisosCache = new Map<string, { at: number; data: PermisosPlan }>();

async function getMembresiasMap(): Promise<Map<string, { nombre: string; permisos: PermisosPlan }>> {
  const ahora = Date.now();
  if (_membresiasCache && ahora - _membresiasCache.at < TTL_MEMBRESIAS) return _membresiasCache.map;

  const { data } = await (supabase.from('membresias').select('id, nombre, permisos') as any);
  const map = new Map<string, { nombre: string; permisos: PermisosPlan }>();
  (data || []).forEach((m: any) => map.set(m.id, { nombre: m.nombre, permisos: m.permisos }));
  _membresiasCache = { at: ahora, map };
  return map;
}

/** Limpia el caché de permisos (útil tras activar trial o cambiar de plan). */
export function invalidarCachePlan(userId?: string): void {
  if (userId) _permisosCache.delete(userId);
  else _permisosCache.clear();
}

/** Devuelve el plan activo del usuario, o null si es free / está vencido. */
export async function obtenerPlanUsuario(userId: string): Promise<PlanUsuario | null> {
  if (!userId) return null;

  const { data: perfil, error } = await (supabase
    .from('perfiles')
    .select('membresia_activa_id, fecha_vencimiento_membresia')
    .eq('id', userId)
    .maybeSingle() as any);

  if (error || !perfil?.membresia_activa_id) return null;

  // Vencida = fecha pasada (fecha lejana / null = nunca vence, ej. Vitalicio).
  const venc: string | null = perfil.fecha_vencimiento_membresia;
  if (venc && venc < new Date().toISOString().slice(0, 10)) return null;

  const map = await getMembresiasMap();
  const m = map.get(perfil.membresia_activa_id);
  if (!m?.permisos) return null;

  return { membresiaId: perfil.membresia_activa_id, nombre: m.nombre, permisos: m.permisos };
}

/** Permisos efectivos del usuario (los del plan activo, o los del free). Cacheado. */
export async function obtenerPermisos(userId: string): Promise<PermisosPlan> {
  if (!userId) return PERMISOS_FREE;

  const cached = _permisosCache.get(userId);
  if (cached && Date.now() - cached.at < TTL_PERMISOS) return cached.data;

  const plan = await obtenerPlanUsuario(userId);
  const permisos = plan?.permisos ?? PERMISOS_FREE;
  _permisosCache.set(userId, { at: Date.now(), data: permisos });
  return permisos;
}

export type TipoContenido = 'tutorial' | 'curso' | 'paquete';

export interface ResultadoAcceso {
  acceso: boolean;
  via: 'inscripcion' | 'plan' | 'ninguno';
}

const CAMPO_INSCRIPCION: Record<TipoContenido, string> = {
  tutorial: 'tutorial_id',
  curso: 'curso_id',
  paquete: 'paquete_id',
};

const BUCKET_CONTENIDO: Record<TipoContenido, keyof PermisosPlan['contenido']> = {
  tutorial: 'tutoriales_video',
  curso: 'cursos',
  paquete: 'paquetes',
};

/**
 * ¿El usuario puede acceder a un contenido específico?
 * Lanza la consulta de inscripción y los permisos EN PARALELO (menos latencia).
 */
export async function tieneAccesoContenido(
  userId: string,
  tipo: TipoContenido,
  contenidoId: string,
): Promise<ResultadoAcceso> {
  if (!userId || !contenidoId) return { acceso: false, via: 'ninguno' };

  const [inscRes, permisos] = await Promise.all([
    (supabase
      .from('inscripciones')
      .select('id')
      .eq('usuario_id', userId)
      .eq(CAMPO_INSCRIPCION[tipo], contenidoId)
      .maybeSingle() as any),
    obtenerPermisos(userId),
  ]);

  if (inscRes?.data) return { acceso: true, via: 'inscripcion' };
  if (permisos.contenido[BUCKET_CONTENIDO[tipo]]) return { acceso: true, via: 'plan' };
  return { acceso: false, via: 'ninguno' };
}

/**
 * "Agrega" un curso/tutorial/paquete a Mis Cursos usando la membresía del usuario
 * (sin pago). El RPC valida en el servidor que el plan esté activo y cubra el tipo.
 * Idempotente. Devuelve { ok, error? }.
 */
export async function agregarContenidoConMembresia(
  tipo: 'curso' | 'tutorial' | 'paquete',
  contenidoId: string,
): Promise<{ ok: boolean; error?: string; ya?: boolean }> {
  const { data, error } = await (supabase.rpc('inscribir_con_membresia', {
    p_tipo: tipo,
    p_contenido_id: contenidoId,
  }) as any);
  if (error) return { ok: false, error: error.message };
  return (data as { ok: boolean; error?: string; ya?: boolean }) || { ok: false, error: 'sin_respuesta' };
}

/** ¿El plan activo del usuario cubre este tipo de contenido? (para mostrar "Agregar"). */
export async function planCubreContenido(userId: string, tipo: TipoContenido): Promise<boolean> {
  if (!userId) return false;
  const permisos = await obtenerPermisos(userId);
  return !!permisos.contenido[BUCKET_CONTENIDO[tipo]];
}

/** ¿Puede usar una feature del simulador (efectos / móvil / modo Hero)? */
export async function puedeUsarFeature(
  userId: string,
  feature: 'efectos' | 'movil' | 'hero',
): Promise<boolean> {
  const permisos = await obtenerPermisos(userId);
  return !!permisos.simulador[feature];
}
