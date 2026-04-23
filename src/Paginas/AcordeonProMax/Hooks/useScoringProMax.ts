import { useState, useCallback, useRef, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { EstadisticasPartida, EfectoGolpe, ResultadoGolpe, ModoPractica } from '../TiposProMax';
import {
  PUNTOS_PERFECTO,
  PUNTOS_BIEN,
  RACHA_PARA_MULTIPLICADOR,
  MULTIPLICADOR_MAXIMO,
  ESTADISTICAS_INICIALES,
  DANO_FALLADA,
  DANO_PERDIDA,
} from '../TiposProMax';

interface UseScoringProMaxParams {
  modoPracticaRef: MutableRefObject<ModoPractica>;
}

export function useScoringProMax({ modoPracticaRef }: UseScoringProMaxParams) {
  const [estadisticas, setEstadisticas] = useState<EstadisticasPartida>({ ...ESTADISTICAS_INICIALES });
  const [efectosVisuales, setEfectosVisuales] = useState<EfectoGolpe[]>([]);
  const estadisticasRef = useRef<EstadisticasPartida>({ ...ESTADISTICAS_INICIALES });

  useEffect(() => { estadisticasRef.current = estadisticas; }, [estadisticas]);

  const registrarResultado = useCallback((resultado: ResultadoGolpe, posicion: { x: number; y: number } | null) => {
    setEstadisticas(prev => {
      const sig = { ...prev };
      const esPractica = modoPracticaRef.current !== 'ninguno';

      if (resultado === 'perfecto') { sig.puntos += PUNTOS_PERFECTO * sig.multiplicador; sig.notasPerfecto++; sig.rachaActual++; }
      else if (resultado === 'bien') { sig.puntos += PUNTOS_BIEN * sig.multiplicador; sig.notasBien++; sig.rachaActual++; }
      else if (resultado === 'fallada') { sig.notasFalladas++; sig.rachaActual = 0; sig.multiplicador = 1; if (!esPractica) sig.vida = Math.max(0, sig.vida - DANO_FALLADA); }
      else { sig.notasPerdidas++; sig.rachaActual = 0; sig.multiplicador = 1; if (!esPractica) sig.vida = Math.max(0, sig.vida - DANO_PERDIDA); }

      if (sig.rachaActual > sig.rachaMasLarga) sig.rachaMasLarga = sig.rachaActual;
      if (sig.rachaActual > 0 && sig.rachaActual % RACHA_PARA_MULTIPLICADOR === 0) {
        sig.multiplicador = Math.min(sig.multiplicador + 1, MULTIPLICADOR_MAXIMO);
      }
      estadisticasRef.current = sig;
      return sig;
    });

    if (posicion && resultado !== 'perdida') {
      const efecto: EfectoGolpe = {
        id: `${Date.now()}-${Math.random()}`,
        resultado,
        x: posicion.x,
        y: posicion.y,
        creado: Date.now(),
      };
      setEfectosVisuales(prev => [...prev.slice(-8), efecto]);
      setTimeout(() => setEfectosVisuales(prev => prev.filter(e => e.id !== efecto.id)), 900);
    }
  }, [modoPracticaRef]);

  return {
    estadisticas,
    setEstadisticas,
    estadisticasRef,
    efectosVisuales,
    setEfectosVisuales,
    registrarResultado,
  };
}
