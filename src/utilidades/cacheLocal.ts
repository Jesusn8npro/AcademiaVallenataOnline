/**
 * Cache simple en localStorage con TTL (stale-while-revalidate).
 *
 * Patrón: leer del cache INSTANTÁNEAMENTE al montar, mostrar al usuario, y
 * en paralelo refrescar de Supabase. Así la navegación entre páginas se
 * siente instantánea aunque la red tarde.
 *
 * Uso:
 *   const cached = leerCache<MisStats>('sidebar:stats', 60_000);
 *   if (cached) setStats(cached);  // instantáneo
 *   const fresh = await fetchearDeSupabase();
 *   setStats(fresh);
 *   guardarCache('sidebar:stats', fresh);
 */

const PREFIJO = 'cache:';

interface Entrada<T> {
  v: T;
  t: number; // timestamp ms
}

/** Devuelve el valor cacheado si NO superó maxEdadMs. Si no hay o expiró, null. */
export function leerCache<T>(clave: string, maxEdadMs = 5 * 60_000): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIJO + clave);
    if (!raw) return null;
    const e = JSON.parse(raw) as Entrada<T>;
    if (Date.now() - e.t > maxEdadMs) return null;
    return e.v;
  } catch {
    return null;
  }
}

/** Devuelve cualquier valor cacheado aunque haya expirado — útil para mostrar
 *  algo mientras se refresca en background (stale-while-revalidate). */
export function leerCacheStale<T>(clave: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIJO + clave);
    if (!raw) return null;
    return (JSON.parse(raw) as Entrada<T>).v;
  } catch {
    return null;
  }
}

export function guardarCache<T>(clave: string, valor: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify({ v: valor, t: Date.now() }));
  } catch {
    // quota exceeded — silencioso
  }
}

export function borrarCache(clave: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(PREFIJO + clave); } catch {}
}
