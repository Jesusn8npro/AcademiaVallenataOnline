import { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import type { CancionHeroConTonalidad } from '../TiposProMax';

export function useCancionesProMax() {
  const [canciones, setCanciones] = useState<CancionHeroConTonalidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('canciones_hero')
          .select('*')
          .order('creado_en', { ascending: false });
        if (err) throw err;
        const procesadas: CancionHeroConTonalidad[] = (data || []).map((row: any) => {
          let secuencia = row.secuencia || row.secuencia_json || [];
          if (typeof secuencia === 'string') {
            try { secuencia = JSON.parse(secuencia); } catch { secuencia = []; }
          }
          return { ...row, secuencia } as CancionHeroConTonalidad;
        });
        setCanciones(procesadas);
      } catch (e: any) {
        setError(e.message || 'Error al cargar canciones');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  return { canciones, cargando, error };
}
