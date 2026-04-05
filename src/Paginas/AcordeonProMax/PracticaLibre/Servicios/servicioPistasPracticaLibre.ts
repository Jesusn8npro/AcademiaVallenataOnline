import { supabase } from '../../../../servicios/clienteSupabase';
import type { PistaPracticaLibre } from '../TiposPracticaLibre';

function mapearPistaGenerica(row: any, origen: 'catalogo' | 'cancion_hero'): PistaPracticaLibre {
  const capasRaw = Array.isArray(row.capas)
    ? row.capas
    : Array.isArray(row.capas_json)
      ? row.capas_json
      : [];

  return {
    id: String(row.id),
    nombre: row.nombre || row.titulo || 'Pista sin nombre',
    artista: row.artista || row.autor || null,
    descripcion: row.descripcion || null,
    bpm: Number(row.bpm) || null,
    tonalidad: row.tonalidad || row.afinacion || null,
    compas: Number(row.compas) || null,
    audioUrl: row.audio_url || row.audio_fondo_url || null,
    imagenUrl: row.imagen_url || null,
    origen,
    capas: capasRaw.map((capa: any, indice: number) => ({
      id: capa.id || `${row.id}-capa-${indice + 1}`,
      nombre: capa.nombre || `Capa ${indice + 1}`,
      url: capa.url || capa.audio_url || capa.ruta || '',
      volumen: typeof capa.volumen === 'number' ? capa.volumen : 1,
      color: capa.color || undefined,
    })).filter((capa: any) => capa.url),
  };
}

export async function listarPistasPracticaLibre(): Promise<PistaPracticaLibre[]> {
  try {
    const { data, error } = await (supabase
      .from('sim_pistas_practica_libre')
      .select('*') as any);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data
        .map((row: any) => mapearPistaGenerica(row, 'catalogo'))
        .filter((pista: PistaPracticaLibre) => pista.audioUrl || (pista.capas && pista.capas.length > 0));
    }
  } catch {
    // Continuamos con el fallback legacy.
  }

  try {
    const { data, error } = await (supabase
      .from('canciones_hero')
      .select('id,titulo,autor,descripcion,bpm,tonalidad,compas,audio_fondo_url')
      .not('audio_fondo_url', 'is', null) as any);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => mapearPistaGenerica(row, 'cancion_hero'));
    }
  } catch {
    // Ignorado: si tampoco existe fallback, devolvemos lista vacia.
  }

  return [];
}
