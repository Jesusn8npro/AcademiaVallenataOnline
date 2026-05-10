import { useCallback, useRef } from 'react';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';
import type { useReproductorLoops } from './useReproductorLoops';
import type { useMetronomo } from './useMetronomo';

type LoopsApi = ReturnType<typeof useReproductorLoops>;
type MetronomoApi = ReturnType<typeof useMetronomo>;
type LogicaApi = any;

const PREVIEW_TECLADO_ID = '1-3-halar';
const PREVIEW_BAJOS_ID = '1-1-halar-bajo';

interface PreviewsParams {
    logica: LogicaApi;
    loops: LoopsApi;
    metronomoVivo: MetronomoApi;
    pistaPreviewLoops: any;
}

/**
 * Previews del Panel de Efectos: tocan un sonido mientras el alumno mantiene
 * presionado un slider de volumen.
 *
 * - TECLADO/BAJOS: activan visualmente un boton fijo de cada bus.
 * - LOOPS: arrancan "Pista de chande sabor" (o la primera disponible) si no
 *   habia ninguna sonando, y la silencian al soltar — solo si fuimos
 *   nosotros quienes la activamos. Si el alumno ya tenia una pista corriendo
 *   por su cuenta, no la tocamos.
 * - METRONOMO: enciende el metronomo vivo si estaba apagado y lo apaga al
 *   soltar — mismo flag para no sobreescribir un metronomo del alumno.
 */
export const usePreviewsEfectos = ({
    logica,
    loops,
    metronomoVivo,
    pistaPreviewLoops,
}: PreviewsParams) => {
    const previewTecladoIniciar = useCallback(() => {
        motorAudioPro.activarContexto();
        logica.actualizarBotonActivo(PREVIEW_TECLADO_ID, 'add');
    }, [logica.actualizarBotonActivo]);
    const previewTecladoDetener = useCallback(() => {
        logica.actualizarBotonActivo(PREVIEW_TECLADO_ID, 'remove');
    }, [logica.actualizarBotonActivo]);

    const previewBajosIniciar = useCallback(() => {
        motorAudioPro.activarContexto();
        logica.actualizarBotonActivo(PREVIEW_BAJOS_ID, 'add');
    }, [logica.actualizarBotonActivo]);
    const previewBajosDetener = useCallback(() => {
        logica.actualizarBotonActivo(PREVIEW_BAJOS_ID, 'remove');
    }, [logica.actualizarBotonActivo]);

    const loopsActivadoPorPreviewRef = useRef(false);
    const previewLoopsIniciar = useCallback(() => {
        motorAudioPro.activarContexto();
        if (loops.pistaActiva || !pistaPreviewLoops) return;
        // precargarPistas es idempotente: si ya esta en cache no descarga;
        // si no, descarga + decodifica antes del play.
        loops.precargarPistas([pistaPreviewLoops]);
        loopsActivadoPorPreviewRef.current = true;
        loops.reproducir(pistaPreviewLoops);
    }, [loops, pistaPreviewLoops]);
    const previewLoopsDetener = useCallback(() => {
        if (loopsActivadoPorPreviewRef.current) {
            loopsActivadoPorPreviewRef.current = false;
            loops.detener();
        }
    }, [loops]);

    const metronomoEncendidoPorPreviewRef = useRef(false);
    const previewMetronomoIniciar = useCallback(() => {
        motorAudioPro.activarContexto();
        if (!metronomoVivo.activo) {
            metronomoEncendidoPorPreviewRef.current = true;
            void metronomoVivo.iniciar();
        }
    }, [metronomoVivo]);
    const previewMetronomoDetener = useCallback(() => {
        if (metronomoEncendidoPorPreviewRef.current) {
            metronomoEncendidoPorPreviewRef.current = false;
            metronomoVivo.detener();
        }
    }, [metronomoVivo]);

    return {
        previewTecladoIniciar,
        previewTecladoDetener,
        previewBajosIniciar,
        previewBajosDetener,
        previewLoopsIniciar,
        previewLoopsDetener,
        previewMetronomoIniciar,
        previewMetronomoDetener,
    };
};
