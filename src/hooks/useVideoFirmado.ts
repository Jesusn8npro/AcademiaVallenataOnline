import { useEffect, useRef, useState, useCallback } from 'react';
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

interface EntradaCache {
  url: string;
  plataforma: Plataforma;
  expiresAt: Date | null;
}

interface ResultadoHook {
  url: string;
  plataforma: Plataforma | null;
  loading: boolean;
  error: ErrorVideoFirmado | null;
  expiresAt: Date | null;
  refrescar: () => Promise<void>;
}

// ============================================================
// ESTADO COMPARTIDO A NIVEL DE MÓDULO
// Sobrevive entre montajes/desmontajes, evita refetch al re-mount.
// Dedupe global: si la misma clave está siendo pedida, todos los
// componentes que la pidan reusan la misma promesa.
// ============================================================
const cacheUrls = new Map<string, EntradaCache>();
const promesasEnVuelo = new Map<string, Promise<EntradaCache | ErrorVideoFirmado>>();
const MARGEN_VALIDEZ_MS = 60 * 1000;

function clavear(parteId?: string, tutorialId?: string, leccionId?: string): string {
  return `p:${parteId ?? ''}|t:${tutorialId ?? ''}|l:${leccionId ?? ''}`;
}

function entradaValida(entrada: EntradaCache | undefined): entrada is EntradaCache {
  if (!entrada) return false;
  if (!entrada.expiresAt) return true;
  return entrada.expiresAt.getTime() - Date.now() > MARGEN_VALIDEZ_MS;
}

function esError(x: EntradaCache | ErrorVideoFirmado): x is ErrorVideoFirmado {
  return (x as ErrorVideoFirmado).codigo !== undefined;
}

async function pedirURL(
  clave: string,
  parteId?: string,
  tutorialId?: string,
  leccionId?: string
): Promise<EntradaCache | ErrorVideoFirmado> {
  // Dedupe: si ya hay una petición en vuelo para esta clave, reusarla.
  const enVuelo = promesasEnVuelo.get(clave);
  if (enVuelo) return enVuelo;

  const promesa = (async (): Promise<EntradaCache | ErrorVideoFirmado> => {
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
        if (status === 401) return { codigo: 'no_autenticado', mensaje: 'Sesión inválida o expirada' };
        if (status === 403) return { codigo: 'sin_acceso', mensaje: 'No tienes acceso a este video' };
        if (status === 404) return { codigo: 'no_encontrado', mensaje: 'Video no encontrado' };
        return { codigo: 'desconocido', mensaje: errInvoke.message || 'Error invocando obtener-video-firmado' };
      }

      if (!data || !data.url) {
        return { codigo: 'no_encontrado', mensaje: data?.error || 'Respuesta vacía' };
      }

      const entrada: EntradaCache = {
        url: data.url,
        plataforma: data.plataforma,
        expiresAt: data.expires_at ? new Date(data.expires_at) : null
      };
      cacheUrls.set(clave, entrada);
      return entrada;
    } catch (e: any) {
      return { codigo: 'desconocido', mensaje: e?.message || 'Error inesperado' };
    } finally {
      promesasEnVuelo.delete(clave);
    }
  })();

  promesasEnVuelo.set(clave, promesa);
  return promesa;
}

export function useVideoFirmado({ parteId, tutorialId, leccionId }: ParametrosHook): ResultadoHook {
  const [url, setUrl] = useState('');
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorVideoFirmado | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const desmontadoRef = useRef(false);

  // Función de carga sin React refs: trabaja con valores capturados
  // del scope del useEffect. Se invoca desde el efecto y desde refrescar().
  const ejecutarCarga = useCallback(
    async (forzar: boolean): Promise<void> => {
      if (!parteId && !tutorialId && !leccionId) {
        setError({ codigo: 'no_encontrado', mensaje: 'Falta parteId, tutorialId o leccionId' });
        return;
      }

      const clave = clavear(parteId, tutorialId, leccionId);

      if (!forzar) {
        const cached = cacheUrls.get(clave);
        if (entradaValida(cached)) {
          if (!desmontadoRef.current) {
            setUrl(cached.url);
            setPlataforma(cached.plataforma);
            setExpiresAt(cached.expiresAt);
            setError(null);
            setLoading(false);
          }
          return;
        }
      } else {
        cacheUrls.delete(clave);
      }

      if (!desmontadoRef.current) {
        setLoading(true);
        setError(null);
      }

      const resultado = await pedirURL(clave, parteId, tutorialId, leccionId);

      if (desmontadoRef.current) return;

      if (esError(resultado)) {
        setError(resultado);
        setUrl('');
        setPlataforma(null);
        setExpiresAt(null);
      } else {
        setUrl(resultado.url);
        setPlataforma(resultado.plataforma);
        setExpiresAt(resultado.expiresAt);
        setError(null);
      }
      setLoading(false);
    },
    [parteId, tutorialId, leccionId]
  );

  // Cargar 1 vez al montar, y solo cuando los IDs primitivos cambien.
  // SIN auto-refresh por timer: las URLs Bunny duran ~2h. Si el usuario
  // permanece más tiempo, el iframe fallará y mostraremos botón Reintentar.
  // Eliminamos el timer de auto-refresh anterior porque generaba bucles
  // cuando expires_at era inválido o el reloj del cliente derivaba.
  useEffect(() => {
    desmontadoRef.current = false;
    void ejecutarCarga(false);
    return () => {
      desmontadoRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parteId, tutorialId, leccionId]);

  const refrescar = useCallback(() => ejecutarCarga(true), [ejecutarCarga]);

  return { url, plataforma, loading, error, expiresAt, refrescar };
}
