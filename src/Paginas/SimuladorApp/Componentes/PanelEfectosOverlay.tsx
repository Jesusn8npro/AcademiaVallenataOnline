import React, { lazy, Suspense } from 'react';
import type { useEfectosAudio } from '../Hooks/useEfectosAudio';
import type { useReproductorLoops } from '../Hooks/useReproductorLoops';
import type { useMetronomo } from '../Hooks/useMetronomo';

const PanelEfectosSimulador = lazy(() => import('./PanelEfectosSimulador'));

type EfectosApi = ReturnType<typeof useEfectosAudio>;
type LoopsApi = ReturnType<typeof useReproductorLoops>;
type MetronomoApi = ReturnType<typeof useMetronomo>;

interface PanelEfectosOverlayProps {
    visible: boolean;
    efectos: EfectosApi;
    loops: LoopsApi;
    metronomoVivo: MetronomoApi;
    onCerrar: () => void;
    onPreviewTecladoIniciar: () => void;
    onPreviewTecladoDetener: () => void;
    onPreviewBajosIniciar: () => void;
    onPreviewBajosDetener: () => void;
    onPreviewLoopsIniciar: () => void;
    onPreviewLoopsDetener: () => void;
    onPreviewMetronomoIniciar: () => void;
    onPreviewMetronomoDetener: () => void;
}

/**
 * Overlay del Panel de Efectos. Solo monta el panel cuando `visible` es true
 * (lazy import). Conecta los setters del hook useEfectosAudio + previews del
 * caller con las props del panel.
 */
const PanelEfectosOverlay: React.FC<PanelEfectosOverlayProps> = ({
    visible,
    efectos,
    loops,
    metronomoVivo,
    onCerrar,
    onPreviewTecladoIniciar,
    onPreviewTecladoDetener,
    onPreviewBajosIniciar,
    onPreviewBajosDetener,
    onPreviewLoopsIniciar,
    onPreviewLoopsDetener,
    onPreviewMetronomoIniciar,
    onPreviewMetronomoDetener,
}) => {
    if (!visible) return null;
    return (
        <div className="peas-modal-overlay" onClick={onCerrar}>
            <div className="peas-modal-contenido" onClick={(e) => e.stopPropagation()}>
                <Suspense fallback={null}>
                    <PanelEfectosSimulador
                        reverbActivo={efectos.reverbActivo}
                        reverbIntensidad={efectos.reverbIntensidad}
                        reverbPreset={efectos.reverbPreset}
                        onCambiarReverbActivo={efectos.setReverbActivo}
                        onCambiarReverbIntensidad={efectos.setReverbIntensidad}
                        onCambiarReverbPreset={efectos.setReverbPreset}
                        ecoActivo={efectos.ecoActivo}
                        ecoIntensidad={efectos.ecoIntensidad}
                        ecoTiempo={efectos.ecoTiempo}
                        onCambiarEcoActivo={efectos.setEcoActivo}
                        onCambiarEcoIntensidad={efectos.setEcoIntensidad}
                        onCambiarEcoTiempo={efectos.setEcoTiempo}
                        distorsActivo={efectos.distorsActivo}
                        distorsIntensidad={efectos.distorsIntensidad}
                        distorsPreset={efectos.distorsPreset}
                        onCambiarDistorsActivo={efectos.setDistorsActivo}
                        onCambiarDistorsIntensidad={efectos.setDistorsIntensidad}
                        onCambiarDistorsPreset={efectos.setDistorsPreset}
                        graves={efectos.graves}
                        medios={efectos.medios}
                        agudos={efectos.agudos}
                        onCambiarGraves={efectos.setGraves}
                        onCambiarMedios={efectos.setMedios}
                        onCambiarAgudos={efectos.setAgudos}
                        volumenTeclado={efectos.volumenTeclado}
                        volumenBajos={efectos.volumenBajos}
                        volumenLoops={Math.round(loops.volumen * 100)}
                        volumenMetronomo={Math.round(metronomoVivo.volumen * 100)}
                        onCambiarVolumenTeclado={efectos.setVolumenTeclado}
                        onCambiarVolumenBajos={efectos.setVolumenBajos}
                        onCambiarVolumenLoops={(v) => loops.setVolumen(v / 100)}
                        onCambiarVolumenMetronomo={(v) => metronomoVivo.setVolumen(v / 100)}
                        panTeclado={efectos.panTeclado}
                        panBajos={efectos.panBajos}
                        panLoops={efectos.panLoops}
                        panMetronomo={efectos.panMetronomo}
                        onCambiarPanTeclado={efectos.setPanTeclado}
                        onCambiarPanBajos={efectos.setPanBajos}
                        onCambiarPanLoops={efectos.setPanLoops}
                        onCambiarPanMetronomo={efectos.setPanMetronomo}
                        onPreviewTecladoIniciar={onPreviewTecladoIniciar}
                        onPreviewTecladoDetener={onPreviewTecladoDetener}
                        onPreviewBajosIniciar={onPreviewBajosIniciar}
                        onPreviewBajosDetener={onPreviewBajosDetener}
                        onPreviewLoopsIniciar={onPreviewLoopsIniciar}
                        onPreviewLoopsDetener={onPreviewLoopsDetener}
                        onPreviewMetronomoIniciar={onPreviewMetronomoIniciar}
                        onPreviewMetronomoDetener={onPreviewMetronomoDetener}
                        onCerrar={onCerrar}
                        onRestaurar={efectos.restaurarEfectos}
                    />
                </Suspense>
            </div>
        </div>
    );
};

export default PanelEfectosOverlay;
