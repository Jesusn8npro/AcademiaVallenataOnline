import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import { motorAudioPro } from '../../audio/AudioEnginePro';
import type { Muestra } from '../../audio/UniversalSampler';
import { SAMPLES_BRILLANTE_DEFAULT, SAMPLES_ARMONIZADO_DEFAULT } from '../_utilidadesAcordeon';

/**
 * useAcordeonSamples
 * ------------------
 * Carga y reconstruccion del banco de muestras del acordeon:
 *  - JSON local /muestrasLocales.json (pitos, bajos, armonizado)
 *  - Supabase sim_muestras (instrumentos personalizados)
 *  - Reconstruccion del array Muestra[] al cambiar timbre o instrumento
 *
 * NO maneja audio, solo samples. La logica de reproducir/parar va en
 * useAcordeonAudio (consume `muestrasLocalesDBRef` y `muestrasDB`).
 */
interface Args {
  instrumentoId: string;
  timbreActivo: string | undefined;
  setCargandoCloud: (b: boolean) => void;
  soundsPerKeyRef: React.MutableRefObject<Record<string, string[]>>;
}

export function useAcordeonSamples({ instrumentoId, timbreActivo, setCargandoCloud, soundsPerKeyRef }: Args) {
  const [samplesPitos, setSamplesPitos] = useState<string[]>(SAMPLES_BRILLANTE_DEFAULT);
  const [samplesBajos, setSamplesBajos] = useState<string[]>([]);
  const [samplesArmonizado, setSamplesArmonizado] = useState<string[]>(SAMPLES_ARMONIZADO_DEFAULT);
  const [muestrasDB, setMuestrasDB] = useState<any[]>([]);
  const [muestrasLocalesDB, setMuestrasLocalesDB] = useState<Muestra[]>([]);

  /** Ref espejo para evitar stale closure en obtenerRutasAudio cuando cambia timbre. */
  const muestrasLocalesDBRef = useRef<Muestra[]>([]);

  /** Carga JSON local y refresca samples (manual=true limpia banco al terminar). */
  const cargarMuestrasLocales = useCallback(async (manual = false) => {
    try {
      const res = await fetch('/muestrasLocales.json?t=' + Date.now());
      const data = await res.json();
      if (data.pitos?.length > 0) setSamplesPitos(data.pitos);
      if (data.bajos?.length > 0) setSamplesBajos(data.bajos);
      if (data.armonizado?.length > 0) setSamplesArmonizado(data.armonizado);
      else setSamplesBajos(data.bajos || []);
      if (manual) motorAudioPro.limpiarBanco(instrumentoId);
    } catch (_) { }
  }, [instrumentoId]);

  // Carga inicial del JSON
  useEffect(() => { cargarMuestrasLocales(); }, [cargarMuestrasLocales]);

  // Reconstruye Muestra[] al cambiar timbre, instrumento o lista de muestras
  useEffect(() => {
    const mLocales: Muestra[] = [];
    const timbre = timbreActivo || 'Brillante';
    const carpetaPitos = timbre === 'Armonizado' ? 'ArmonizadoPro' : 'Brillante';
    const listaActivePitos = timbre === 'Armonizado' ? samplesArmonizado : samplesPitos;

    // Pitos: formato esperado {Nota}-{Octava}-cm.mp3
    listaActivePitos.forEach(file => {
      const parts = file.split('-');
      if (parts.length >= 2) {
        mLocales.push({
          nota: parts[0],
          octava: parseInt(parts[1]) || 4,
          url_audio: `/audio/Muestras_Cromaticas/${carpetaPitos}/${file}`
        });
      }
    });

    // Bajos: formato Bajo{Nota}[-2][(acorde)]-cm.mp3
    samplesBajos.forEach(file => {
      let clean = file.replace('Bajo', '').replace('-cm.mp3', '');
      let octava = 3;
      let esAcorde = false;
      let cualidad: 'mayor' | 'menor' = 'mayor';

      if (clean.includes('(acorde)')) { esAcorde = true; clean = clean.replace('(acorde)', ''); }
      if (clean.includes('-2')) { octava = 2; clean = clean.replace('-2', ''); }
      if (clean.endsWith('m') && clean.length > 1 && !clean.endsWith('bm')) {
        cualidad = 'menor';
        clean = clean.substring(0, clean.length - 1);
      }

      mLocales.push({
        nota: clean,
        octava,
        url_audio: `/audio/Muestras_Cromaticas/Bajos/${file}`,
        tipo_bajo: esAcorde ? 'acorde' : 'nota',
        cualidad: esAcorde ? cualidad : undefined
      });
    });

    // Actualizar la ref SÍNCRONAMENTE antes de setState — evita stale en obtenerRutasAudio.
    muestrasLocalesDBRef.current = mLocales;
    setMuestrasLocalesDB(mLocales);

    motorAudioPro.limpiarBanco(instrumentoId);
    motorAudioPro.limpiarBanco('4e9f2a94-21c0-4029-872e-7cb1c314af69');
    motorAudioPro.limpiarBanco('acordeon');
    soundsPerKeyRef.current = {};
  }, [samplesPitos, samplesArmonizado, samplesBajos, timbreActivo, instrumentoId]);

  // Carga muestras del instrumento personalizado en Supabase
  useEffect(() => {
    if (!instrumentoId) return;
    setCargandoCloud(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('sim_muestras')
          .select('*')
          .eq('instrumento_id', instrumentoId) as any;
        if (error) throw error;
        setMuestrasDB(data || []);
        motorAudioPro.limpiarBanco(instrumentoId);
        soundsPerKeyRef.current = {};
      } catch (_) { } finally {
        setCargandoCloud(false);
      }
    })();
  }, [instrumentoId]);

  return {
    samplesPitos, samplesBajos, samplesArmonizado,
    muestrasDB, muestrasLocalesDB, muestrasLocalesDBRef,
    cargarMuestrasLocales,
  };
}
