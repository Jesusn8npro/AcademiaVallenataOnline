import { supabase } from '../../../../servicios/clienteSupabase';
import {
  EFECTOS_PRACTICA_LIBRE_POR_DEFECTO,
  PREFERENCIAS_PRACTICA_LIBRE_POR_DEFECTO,
  type PreferenciasPracticaLibre,
} from '../TiposPracticaLibre';

const CLAVE_PREFERENCIAS_PRACTICA_LIBRE = 'promax_practica_libre_preferencias_v1';

interface RegistroPreferenciasPracticaLibre {
  version: number;
  porTonalidad: Record<string, PreferenciasPracticaLibre>;
}

function crearRegistroVacio(): RegistroPreferenciasPracticaLibre {
  return {
    version: 1,
    porTonalidad: {},
  };
}

function normalizarPreferencias(
  preferencias?: Partial<PreferenciasPracticaLibre> | null
): PreferenciasPracticaLibre {
  return {
    ...PREFERENCIAS_PRACTICA_LIBRE_POR_DEFECTO,
    ...(preferencias || {}),
    efectos: {
      ...EFECTOS_PRACTICA_LIBRE_POR_DEFECTO,
      ...(preferencias?.efectos || {}),
    },
    capasActivas: Array.isArray(preferencias?.capasActivas) ? preferencias!.capasActivas : [],
  };
}

function leerRegistroLocal(): RegistroPreferenciasPracticaLibre {
  if (typeof window === 'undefined') return crearRegistroVacio();

  try {
    const raw = window.localStorage.getItem(CLAVE_PREFERENCIAS_PRACTICA_LIBRE);
    if (!raw) return crearRegistroVacio();

    const parsed = JSON.parse(raw) as RegistroPreferenciasPracticaLibre;
    if (!parsed || typeof parsed !== 'object') return crearRegistroVacio();

    return {
      version: 1,
      porTonalidad: parsed.porTonalidad || {},
    };
  } catch {
    return crearRegistroVacio();
  }
}

function escribirRegistroLocal(registro: RegistroPreferenciasPracticaLibre) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CLAVE_PREFERENCIAS_PRACTICA_LIBRE, JSON.stringify(registro));
  } catch {
    // Ignorado a proposito.
  }
}

function obtenerClaveTonalidad(tonalidad: string) {
  return `ajustes_acordeon_vPRO_${tonalidad}`;
}

export function obtenerPreferenciasPracticaLibreLocales(tonalidad: string) {
  const registro = leerRegistroLocal();
  return normalizarPreferencias(registro.porTonalidad[tonalidad]);
}

export async function cargarPreferenciasPracticaLibre(tonalidad: string) {
  const locales = obtenerPreferenciasPracticaLibreLocales(tonalidad);

  try {
    const { data: authData } = await supabase.auth.getUser();
    const usuario = authData.user;
    if (!usuario) return locales;

    const { data, error } = await (supabase
      .from('sim_ajustes_usuario')
      .select('tonalidades_configuradas')
      .eq('usuario_id', usuario.id)
      .maybeSingle() as any);

    if (error) return locales;

    const clave = obtenerClaveTonalidad(tonalidad);
    const desdeNube = data?.tonalidades_configuradas?.[clave]?.practicaLibre;
    if (!desdeNube) return locales;

    const fusionadas = normalizarPreferencias({
      ...locales,
      ...desdeNube,
      efectos: {
        ...locales.efectos,
        ...(desdeNube.efectos || {}),
      },
    });

    await guardarPreferenciasPracticaLibreLocal(tonalidad, fusionadas);
    return fusionadas;
  } catch {
    return locales;
  }
}

export async function guardarPreferenciasPracticaLibreLocal(
  tonalidad: string,
  preferencias: PreferenciasPracticaLibre
) {
  const registro = leerRegistroLocal();
  registro.porTonalidad[tonalidad] = normalizarPreferencias(preferencias);
  escribirRegistroLocal(registro);
}

export async function guardarPreferenciasPracticaLibre(
  tonalidad: string,
  preferencias: PreferenciasPracticaLibre,
  instrumentoId?: string | null
) {
  const preferenciasNormalizadas = normalizarPreferencias(preferencias);
  await guardarPreferenciasPracticaLibreLocal(tonalidad, preferenciasNormalizadas);

  try {
    const { data: authData } = await supabase.auth.getUser();
    const usuario = authData.user;
    if (!usuario) return;

    const { data } = await (supabase
      .from('sim_ajustes_usuario')
      .select('tonalidades_configuradas,instrumento_id')
      .eq('usuario_id', usuario.id)
      .maybeSingle() as any);

    const clave = obtenerClaveTonalidad(tonalidad);
    const configuracionesActuales = data?.tonalidades_configuradas || {};
    const configuracionTonalidad = configuracionesActuales[clave] || {};

    const siguientePayload = {
      ...configuracionesActuales,
      [clave]: {
        ...configuracionTonalidad,
        practicaLibre: preferenciasNormalizadas,
      },
    };

    await (supabase.from('sim_ajustes_usuario').upsert({
      usuario_id: usuario.id,
      tonalidad_activa: tonalidad,
      instrumento_id: instrumentoId || data?.instrumento_id || null,
      tonalidades_configuradas: siguientePayload,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'usuario_id' }) as any);
  } catch {
    // Si Supabase falla, al menos queda persistido localmente.
  }
}

export function obtenerSnapshotMetadataPracticaLibre(tonalidad: string) {
  const preferencias = obtenerPreferenciasPracticaLibreLocales(tonalidad);
  return {
    modelo_visual_id: preferencias.modeloVisualId,
    pista_id: preferencias.pistaId,
    pista_url: preferencias.pistaUrl,
    pista_nombre: preferencias.pistaNombre,
    capas_activas: preferencias.capasActivas,
    efectos: preferencias.efectos,
    mostrar_teoria_circular: preferencias.mostrarTeoriaCircular,
  };
}
