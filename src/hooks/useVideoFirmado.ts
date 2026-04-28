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

  const peticionEnVuelo = useRef<Promise<void> | null>(null);
  const timerRefresco = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargar = useCallback(async (forzar = false): Promise<void> => {
    if (!parteId && !tutorialId && !leccionId) {
      setError({ codigo: 'no_encontrado', mensaje: 'Falta parteId, tutorialId o leccionId' });
      return;
    }

    const clave = clavearCache(parteId, tutorialId, leccionId);

    if (!forzar) {
      const enCache = cacheMemoria.get(clave);
      if (enCache && tieneTiempoUtil(enCache.expiresAt)) {
        setUrl(enCache.url);
        setPlataforma(enCache.plataforma);
        setExpiresAt(enCache.expiresAt);
        setError(null);
        return;
      }
    }

    if (peticionEnVuelo.current) return peticionEnVuelo.current;

    setLoading(true);
    setError(null);

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
        setError({ codigo: 'desconocido', mensaje: e?.message || 'Error inesperado' });
        setUrl('');
        setPlataforma(null);
        setExpiresAt(null);
      } finally {
        setLoading(false);
        peticionEnVuelo.current = null;
      }
    })();

    peticionEnVuelo.current = promesa;
    return promesa;
  }, [parteId, tutorialId, leccionId]);

  useEffect(() => {
    void cargar(false);
  }, [cargar]);

  useEffect(() => {
    if (timerRefresco.current) {
      clearTimeout(timerRefresco.current);
      timerRefresco.current = null;
    }
    if (!expiresAt) return;

    const msHastaRefresco = expiresAt.getTime() - Date.now() - MARGEN_REFRESCO_MS;
    if (msHastaRefresco <= 0) {
      void cargar(true);
      return;
    }
    timerRefresco.current = setTimeout(() => { void cargar(true); }, msHastaRefresco);
    return () => {
      if (timerRefresco.current) {
        clearTimeout(timerRefresco.current);
        timerRefresco.current = null;
      }
    };
  }, [expiresAt, cargar]);

  const refrescar = useCallback(() => cargar(true), [cargar]);

  return { url, plataforma, loading, error, expiresAt, refrescar };
}
