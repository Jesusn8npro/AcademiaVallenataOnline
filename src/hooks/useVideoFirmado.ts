import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../servicios/clienteSupabase';

type Plataforma = 'bunny' | 'youtube' | 'otro';

export type ErrorVideoFirmado =
  | { codigo: 'sin_acceso'; mensaje: string }
  | { codigo: 'no_autenticado'; mensaje: string }
  | { codigo: 'no_encontrado'; mensaje: string }
  | { codigo: 'desconocido'; mensaje: string };

interface RespuestaEdge {
  url: string;
  plataforma: Plataforma;
  video_guid?: string;
  expires_at?: string;
  expires_in_seconds?: number;
  error?: string;
  detalle?: string;
}

interface ParametrosHook {
  parteId?: string;
  tutorialId?: string;
  leccionId?: string;
}

interface ResultadoHook {
  url: string;
  plataforma: Plataforma | null;
  loading: boolean;
  error: ErrorVideoFirmado | null;
  expiresAt: Date | null;
  refrescar: () => Promise<void>;
}

const cacheMemoria = new Map<string, { url: string; plataforma: Plataforma; expiresAt: Date | null }>();
const MARGEN_REFRESCO_MS = 5 * 60 * 1000;
const MIN_DELAY_REFRESCO_MS = 60 * 1000;
const VENTANA_ANTI_LOOP_MS = 30 * 1000;
const MAX_FETCHES_EN_VENTANA = 3;

function clavearCache(parteId?: string, tutorialId?: string, leccionId?: string): string {
  return `parte:${parteId ?? ''}|tutorial:${tutorialId ?? ''}|leccion:${leccionId ?? ''}`;
}

function tieneTiempoUtil(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() - Date.now() > MARGEN_REFRESCO_MS;
}

export function useVideoFirmado({ parteId, tutorialId, leccionId }: ParametrosHook): ResultadoHook {
  const [url, setUrl] = useState('');
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorVideoFirmado | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  // Refs para evitar que `cargar` se recree y re-dispare efectos.
  const paramsRef = useRef({ parteId, tutorialId, leccionId });
  paramsRef.current = { parteId, tutorialId, leccionId };

  const peticionEnVuelo = useRef<Promise<void> | null>(null);
  const timerRefresco = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const desmontadoRef = useRef(false);

  // Anti-loop: timestamps de fetches reales (que llegaron a la red).
  const fetchesRecientes = useRef<number[]>([]);

  // `cargar` con deps vacías: referencia ESTABLE entre renders.
  // Lee parámetros vía paramsRef.current para evitar dependencia.
  const cargar = useCallback(async (forzar = false): Promise<void> => {
    const { parteId, tutorialId, leccionId } = paramsRef.current;

    if (!parteId && !tutorialId && !leccionId) {
      if (!desmontadoRef.current) {
        setError({ codigo: 'no_encontrado', mensaje: 'Falta parteId, tutorialId o leccionId' });
      }
      return;
    }

    const clave = clavearCache(parteId, tutorialId, leccionId);

    if (!forzar) {
      const enCache = cacheMemoria.get(clave);
      if (enCache && tieneTiempoUtil(enCache.expiresAt)) {
        if (!desmontadoRef.current) {
          setUrl(enCache.url);
          setPlataforma(enCache.plataforma);
          setExpiresAt(enCache.expiresAt);
          setError(null);
        }
        return;
      }
    }

    if (peticionEnVuelo.current) return peticionEnVuelo.current;

    // Anti-loop: descartar fetches viejos fuera de la ventana
    const ahora = Date.now();
    fetchesRecientes.current = fetchesRecientes.current.filter(
      ts => ahora - ts < VENTANA_ANTI_LOOP_MS
    );
    if (fetchesRecientes.current.length >= MAX_FETCHES_EN_VENTANA) {
      if (!desmontadoRef.current) {
        setError({
          codigo: 'desconocido',
          mensaje: 'Demasiados intentos de refresco; se detiene para evitar bucle. Intenta recargar la página.'
        });
        setLoading(false);
      }
      return;
    }
    fetchesRecientes.current.push(ahora);

    if (!desmontadoRef.current) {
      setLoading(true);
      setError(null);
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const promesa = (async () => {
      try {
        const body: Record<string, string> = {};
        if (parteId) body.parte_id = parteId;
        if (tutorialId) body.tutorial_id = tutorialId;
        if (leccionId) body.leccion_id = leccionId;

        const { data, error: errInvoke } = await supabase.functions.invoke<RespuestaEdge>(
          'obtener-video-firmado',
          { body }
        );

        if (ctrl.signal.aborted || desmontadoRef.current) return;

        if (errInvoke) {
          const status = (errInvoke as { context?: { status?: number } }).context?.status;
          let codigo: ErrorVideoFirmado['codigo'] = 'desconocido';
          let mensaje = errInvoke.message || 'Error invocando obtener-video-firmado';

          if (status === 401) { codigo = 'no_autenticado'; mensaje = 'Sesión inválida o expirada'; }
          else if (status === 403) { codigo = 'sin_acceso'; mensaje = 'No tienes acceso a este video'; }
          else if (status === 404) { codigo = 'no_encontrado'; mensaje = 'Video no encontrado'; }

          setError({ codigo, mensaje });
          setUrl('');
          setPlataforma(null);
          setExpiresAt(null);
          return;
        }

        if (!data || !data.url) {
          setError({ codigo: 'no_encontrado', mensaje: data?.error || 'Respuesta vacía' });
          setUrl('');
          setPlataforma(null);
          setExpiresAt(null);
          return;
        }

        const exp = data.expires_at ? new Date(data.expires_at) : null;
        cacheMemoria.set(clave, { url: data.url, plataforma: data.plataforma, expiresAt: exp });

        setUrl(data.url);
        setPlataforma(data.plataforma);
        setExpiresAt(exp);
        setError(null);
      } catch (e: any) {
        if (ctrl.signal.aborted || desmontadoRef.current) return;
        setError({ codigo: 'desconocido', mensaje: e?.message || 'Error inesperado' });
        setUrl('');
        setPlataforma(null);
        setExpiresAt(null);
      } finally {
        if (!desmontadoRef.current) setLoading(false);
        peticionEnVuelo.current = null;
      }
    })();

    peticionEnVuelo.current = promesa;
    return promesa;
  }, []);

  // Carga inicial / al cambiar IDs primitivos (NO al cambiar `cargar`).
  useEffect(() => {
    desmontadoRef.current = false;
    void cargar(false);
    return () => {
      desmontadoRef.current = true;
      abortRef.current?.abort();
      if (timerRefresco.current) {
        clearTimeout(timerRefresco.current);
        timerRefresco.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parteId, tutorialId, leccionId]);

  // Programar refresco antes de que expire la URL.
  // Si la URL ya viene vencida o muy próxima a vencer, NO refrescar
  // inmediatamente — eso causaría loop. Posponer al menos MIN_DELAY_REFRESCO_MS.
  useEffect(() => {
    if (timerRefresco.current) {
      clearTimeout(timerRefresco.current);
      timerRefresco.current = null;
    }
    if (!expiresAt) return;

    const ms = expiresAt.getTime() - Date.now() - MARGEN_REFRESCO_MS;
    const delay = Math.max(ms, MIN_DELAY_REFRESCO_MS);

    timerRefresco.current = setTimeout(() => {
      void cargar(true);
    }, delay);

    return () => {
      if (timerRefresco.current) {
        clearTimeout(timerRefresco.current);
        timerRefresco.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const refrescar = useCallback(() => cargar(true), [cargar]);

  return { url, plataforma, loading, error, expiresAt, refrescar };
}
