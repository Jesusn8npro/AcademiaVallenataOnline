import { useCallback, useEffect, useState } from 'react';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';

// Tipos de presets de reverb. Mantenidos en este orden segun catalogo del motor.
export type ReverbPreset =
    | 'habitacion' | 'estudio' | 'cuarto_mediano' | 'garaje'
    | 'sala_ensayo' | 'cuarto_grande' | 'club'
    | 'vestibulo_mediano' | 'iglesia' | 'vestibulo_grande' | 'catedral' | 'cueva' | 'arena'
    | 'escenario_abierto' | 'canon' | 'bosque'
    | 'tunel' | 'cabina' | 'plate' | 'spring' | 'tape_vintage' | 'shimmer';

export type DistorsionPreset =
    | 'tubo_calido' | 'tubo_cremoso' | 'vintage_drive' | 'lofi_tape'
    | 'crunch_clasico' | 'overdrive_blues' | 'rock_70s'
    | 'distorsion_dura' | 'heavy_metal' | 'thrash' | 'death_metal'
    | 'fuzz_muff' | 'fuzz_tone' | 'octave_fuzz'
    | 'bit_crusher' | 'megafono' | 'telefono' | 'wave_folder';

/**
 * Estado y wiring del Panel de Efectos de Audio del simulador.
 * Toda la sincronizacion al motor se hace dentro: el caller solo lee/escribe
 * los setters via las props del PanelEfectosSimulador.
 *
 * Reverb arranca apagado por defecto -> el motor mantiene latencia minima
 * en Android (directBus activo). Idem eco/distorsion.
 */
export const useEfectosAudio = () => {
    // ─── Reverb ─────────────────────────────────────────────────────────────
    const [reverbActivo, setReverbActivo] = useState(false);
    const [reverbIntensidad, setReverbIntensidad] = useState(20);
    const [reverbPreset, setReverbPreset] = useState<ReverbPreset>('cuarto_grande');

    // ─── Eco: intensidad 0..100 = wet+feedback; tiempo 0..100 -> 50..800ms ──
    const [ecoActivo, setEcoActivo] = useState(false);
    const [ecoIntensidad, setEcoIntensidad] = useState(30);
    const [ecoTiempo, setEcoTiempo] = useState(40);

    // ─── Distorsion: intensidad = mezcla wet; preset = curva + EQ tonal ─────
    const [distorsActivo, setDistorsActivo] = useState(false);
    const [distorsIntensidad, setDistorsIntensidad] = useState(40);
    const [distorsPreset, setDistorsPreset] = useState<DistorsionPreset>('crunch_clasico');

    // ─── EQ ────────────────────────────────────────────────────────────────
    const [graves, setGraves] = useState(0);
    const [medios, setMedios] = useState(0);
    const [agudos, setAgudos] = useState(0);

    // ─── Sub-buses TECLADO/BAJOS (volumen + pan independientes) ────────────
    const [volumenTeclado, setVolumenTeclado] = useState(85);
    const [volumenBajos, setVolumenBajos] = useState(85);
    // UI -50..50, motor -1..1.
    const [panTeclado, setPanTeclado] = useState(0);
    const [panBajos, setPanBajos] = useState(0);

    // ─── Pan loops/metronomo (van por el StereoPannerNode de su propio hook,
    //     no por el motor principal). Se exponen para que el caller wirec con
    //     loops.setPan() y metronomoVivo.setPan().
    const [panLoops, setPanLoops] = useState(0);
    const [panMetronomo, setPanMetronomo] = useState(0);

    // ─── Wiring al motor de audio ───────────────────────────────────────────
    // Reverb apagado -> 0 (motor se va al directBus, latencia minima Android).
    useEffect(() => {
        const cantidad = reverbActivo ? reverbIntensidad / 100 : 0;
        motorAudioPro.actualizarReverb(cantidad);
    }, [reverbActivo, reverbIntensidad]);

    // Cambiar preset regenera el impulse response del ConvolverNode.
    useEffect(() => {
        motorAudioPro.cargarPresetReverb(reverbPreset);
    }, [reverbPreset]);

    // Eco: apagado -> intensidad 0 (silencia wet+feedback).
    useEffect(() => {
        const intensidadFinal = ecoActivo ? ecoIntensidad / 100 : 0;
        const tiempoSeg = 0.05 + (ecoTiempo / 100) * 0.75;
        motorAudioPro.actualizarEco(intensidadFinal, tiempoSeg);
    }, [ecoActivo, ecoIntensidad, ecoTiempo]);

    // Distorsion: knob = wet mix; preset = curva + EQ.
    useEffect(() => {
        const intensidadFinal = distorsActivo ? distorsIntensidad / 100 : 0;
        motorAudioPro.actualizarDistorsion(intensidadFinal);
    }, [distorsActivo, distorsIntensidad]);

    useEffect(() => {
        motorAudioPro.cargarPresetDistorsion(distorsPreset);
    }, [distorsPreset]);

    useEffect(() => {
        motorAudioPro.actualizarEQ(graves, medios, agudos);
    }, [graves, medios, agudos]);

    // Sub-buses TECLADO/BAJOS.
    useEffect(() => {
        motorAudioPro.setVolumenBusTeclado(volumenTeclado / 100);
    }, [volumenTeclado]);
    useEffect(() => {
        motorAudioPro.setVolumenBusBajos(volumenBajos / 100);
    }, [volumenBajos]);
    useEffect(() => {
        motorAudioPro.setPanTeclado(panTeclado / 50);
    }, [panTeclado]);
    useEffect(() => {
        motorAudioPro.setPanBajos(panBajos / 50);
    }, [panBajos]);

    const restaurarEfectos = useCallback(() => {
        setReverbActivo(false);
        setReverbIntensidad(20);
        setEcoActivo(false);
        setEcoIntensidad(30);
        setEcoTiempo(40);
        setDistorsActivo(false);
        setDistorsIntensidad(40);
        setGraves(0);
        setMedios(0);
        setAgudos(0);
    }, []);

    return {
        reverbActivo, setReverbActivo,
        reverbIntensidad, setReverbIntensidad,
        reverbPreset, setReverbPreset,
        ecoActivo, setEcoActivo,
        ecoIntensidad, setEcoIntensidad,
        ecoTiempo, setEcoTiempo,
        distorsActivo, setDistorsActivo,
        distorsIntensidad, setDistorsIntensidad,
        distorsPreset, setDistorsPreset,
        graves, setGraves,
        medios, setMedios,
        agudos, setAgudos,
        volumenTeclado, setVolumenTeclado,
        volumenBajos, setVolumenBajos,
        panTeclado, setPanTeclado,
        panBajos, setPanBajos,
        panLoops, setPanLoops,
        panMetronomo, setPanMetronomo,
        restaurarEfectos,
    };
};
