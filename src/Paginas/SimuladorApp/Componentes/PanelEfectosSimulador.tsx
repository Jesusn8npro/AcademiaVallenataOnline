import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Sliders } from 'lucide-react';
import './PanelEfectosSimulador.css';

// Versión compacta del PanelEfectosAudio para SimuladorApp. Misma lógica y
// mismas props que el panel grande de Práctica Libre, pero con un layout más
// denso (knobs 38px, faders 80px) que cabe en un modal flotante de ~560px sin
// cubrir todo el simulador. Clases `peas-*` aisladas del CSS del panel grande.

type PresetReverbId =
    | 'habitacion' | 'estudio' | 'cuarto_mediano' | 'garaje'
    | 'sala_ensayo' | 'cuarto_grande' | 'club'
    | 'vestibulo_mediano' | 'iglesia' | 'vestibulo_grande' | 'catedral' | 'cueva' | 'arena'
    | 'escenario_abierto' | 'canon' | 'bosque'
    | 'tunel' | 'cabina' | 'plate' | 'spring' | 'tape_vintage' | 'shimmer';

type PresetDistorsionId =
    | 'tubo_calido' | 'tubo_cremoso' | 'vintage_drive' | 'lofi_tape'
    | 'crunch_clasico' | 'overdrive_blues' | 'rock_70s'
    | 'distorsion_dura' | 'heavy_metal' | 'thrash' | 'death_metal'
    | 'fuzz_muff' | 'fuzz_tone' | 'octave_fuzz'
    | 'bit_crusher' | 'megafono' | 'telefono' | 'wave_folder';

interface PanelEfectosSimuladorProps {
    reverbActivo: boolean;
    reverbIntensidad: number;
    reverbPreset?: PresetReverbId;
    onCambiarReverbActivo: (activo: boolean) => void;
    onCambiarReverbIntensidad: (valor: number) => void;
    onCambiarReverbPreset?: (preset: PresetReverbId) => void;

    ecoActivo?: boolean;
    ecoIntensidad?: number;
    ecoTiempo?: number;
    onCambiarEcoActivo?: (activo: boolean) => void;
    onCambiarEcoIntensidad?: (v: number) => void;
    onCambiarEcoTiempo?: (v: number) => void;

    distorsActivo?: boolean;
    distorsIntensidad?: number;
    distorsPreset?: PresetDistorsionId;
    onCambiarDistorsActivo?: (activo: boolean) => void;
    onCambiarDistorsIntensidad?: (v: number) => void;
    onCambiarDistorsPreset?: (preset: PresetDistorsionId) => void;

    graves: number;
    medios: number;
    agudos: number;
    onCambiarGraves: (v: number) => void;
    onCambiarMedios: (v: number) => void;
    onCambiarAgudos: (v: number) => void;

    volumenTeclado: number;
    volumenBajos: number;
    volumenLoops: number;
    volumenMetronomo: number;
    onCambiarVolumenTeclado: (v: number) => void;
    onCambiarVolumenBajos: (v: number) => void;
    onCambiarVolumenLoops: (v: number) => void;
    onCambiarVolumenMetronomo: (v: number) => void;

    onPreviewTecladoIniciar?: () => void;
    onPreviewTecladoDetener?: () => void;
    onPreviewBajosIniciar?: () => void;
    onPreviewBajosDetener?: () => void;
    onPreviewLoopsIniciar?: () => void;
    onPreviewLoopsDetener?: () => void;
    onPreviewMetronomoIniciar?: () => void;
    onPreviewMetronomoDetener?: () => void;

    panTeclado?: number;
    panBajos?: number;
    panLoops?: number;
    panMetronomo?: number;
    onCambiarPanTeclado?: (v: number) => void;
    onCambiarPanBajos?: (v: number) => void;
    onCambiarPanLoops?: (v: number) => void;
    onCambiarPanMetronomo?: (v: number) => void;

    onCerrar?: () => void;
    onRestaurar?: () => void;
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

interface KnobProps {
    valor: number;
    min: number;
    max: number;
    etiqueta?: string;
    acento?: 'naranja' | 'azul' | 'verde' | 'morado' | 'cyan';
    deshabilitado?: boolean;
    onCambiar: (v: number) => void;
    onPreviewIniciar?: () => void;
    onPreviewDetener?: () => void;
}

const Knob: React.FC<KnobProps> = ({
    valor, min, max, etiqueta, acento = 'cyan', deshabilitado, onCambiar,
    onPreviewIniciar, onPreviewDetener,
}) => {
    const rango = max - min;
    const proporcion = rango > 0 ? (valor - min) / rango : 0;
    const rotacion = -135 + proporcion * 270;

    const enPreviewRef = useRef(false);
    const arrancar = useCallback(() => {
        if (enPreviewRef.current) return;
        enPreviewRef.current = true;
        onPreviewIniciar?.();
    }, [onPreviewIniciar]);
    const detener = useCallback(() => {
        if (!enPreviewRef.current) return;
        enPreviewRef.current = false;
        onPreviewDetener?.();
    }, [onPreviewDetener]);

    return (
        <div className={`peas-knob peas-acento-${acento} ${deshabilitado ? 'peas-knob-disabled' : ''}`}>
            <div className="peas-knob-cuerpo">
                <div className="peas-knob-disco" style={{ transform: `rotate(${rotacion}deg)` }}>
                    <div className="peas-knob-marca" />
                </div>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={valor}
                    disabled={deshabilitado}
                    onChange={(e) => onCambiar(parseInt(e.target.value, 10))}
                    onPointerDown={arrancar}
                    onPointerUp={detener}
                    onPointerLeave={detener}
                    onPointerCancel={detener}
                    aria-label={etiqueta}
                />
            </div>
            {etiqueta && <span className="peas-knob-etiqueta">{etiqueta}</span>}
        </div>
    );
};

interface SwitchProps {
    activo: boolean;
    onCambiar: (activo: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ activo, onCambiar }) => (
    <button
        type="button"
        role="switch"
        aria-checked={activo}
        className={`peas-switch ${activo ? 'activo' : ''}`}
        onClick={() => onCambiar(!activo)}
    >
        <span />
    </button>
);

interface FaderProps {
    valor: number;
    min?: number;
    max?: number;
    acento?: 'naranja' | 'azul' | 'verde' | 'morado' | 'rojo';
    pan?: number;
    onCambiar: (v: number) => void;
    onPreviewIniciar?: () => void;
    onPreviewDetener?: () => void;
}

const Fader: React.FC<FaderProps> = ({
    valor, min = 0, max = 100, acento = 'naranja', pan = 0,
    onCambiar, onPreviewIniciar, onPreviewDetener,
}) => {
    const enPreviewRef = useRef(false);

    const arrancar = useCallback(() => {
        if (enPreviewRef.current) return;
        enPreviewRef.current = true;
        onPreviewIniciar?.();
    }, [onPreviewIniciar]);

    const detener = useCallback(() => {
        if (!enPreviewRef.current) return;
        enPreviewRef.current = false;
        onPreviewDetener?.();
    }, [onPreviewDetener]);

    const proporcionVol = Math.max(0, Math.min(1, (valor - min) / (max - min)));
    const proporcionPan = Math.max(-1, Math.min(1, pan / 50));
    const factorL = proporcionPan <= 0 ? 1 : 1 - proporcionPan;
    const factorR = proporcionPan >= 0 ? 1 : 1 + proporcionPan;
    const alturaL = proporcionVol * factorL * 100;
    const alturaR = proporcionVol * factorR * 100;

    return (
        <div className={`peas-fader peas-acento-${acento}`}>
            <div className="peas-fader-canales" aria-hidden="true">
                <div className="peas-fader-canal peas-fader-canal-l" style={{ height: `${alturaL}%` }} />
                <div className="peas-fader-canal peas-fader-canal-r" style={{ height: `${alturaR}%` }} />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={valor}
                onChange={(e) => onCambiar(parseInt(e.target.value, 10))}
                onPointerDown={arrancar}
                onPointerUp={detener}
                onPointerLeave={detener}
                onPointerCancel={detener}
                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
            />
        </div>
    );
};

// ─── Componente principal ───────────────────────────────────────────────────

const PanelEfectosSimulador: React.FC<PanelEfectosSimuladorProps> = ({
    reverbActivo, reverbIntensidad, reverbPreset, onCambiarReverbActivo, onCambiarReverbIntensidad, onCambiarReverbPreset,
    ecoActivo: ecoActivoExt, ecoIntensidad: ecoIntensidadExt, ecoTiempo: ecoTiempoExt,
    onCambiarEcoActivo, onCambiarEcoIntensidad, onCambiarEcoTiempo,
    distorsActivo: distorsActivoExt, distorsIntensidad: distorsIntensidadExt, distorsPreset: distorsPresetExt,
    onCambiarDistorsActivo, onCambiarDistorsIntensidad, onCambiarDistorsPreset,
    graves, medios, agudos, onCambiarGraves, onCambiarMedios, onCambiarAgudos,
    volumenTeclado, volumenBajos, volumenLoops, volumenMetronomo,
    onCambiarVolumenTeclado, onCambiarVolumenBajos, onCambiarVolumenLoops, onCambiarVolumenMetronomo,
    onPreviewTecladoIniciar, onPreviewTecladoDetener,
    onPreviewBajosIniciar, onPreviewBajosDetener,
    onPreviewLoopsIniciar, onPreviewLoopsDetener,
    onPreviewMetronomoIniciar, onPreviewMetronomoDetener,
    panTeclado: panTecladoExt, panBajos: panBajosExt, panLoops: panLoopsExt, panMetronomo: panMetronomoExt,
    onCambiarPanTeclado, onCambiarPanBajos, onCambiarPanLoops, onCambiarPanMetronomo,
    onCerrar, onRestaurar,
}) => {
    // Eco controlado o local (fallback).
    const [ecoActivoLocal, setEcoActivoLocal] = useState(false);
    const [ecoIntensidadLocal, setEcoIntensidadLocal] = useState(30);
    const [ecoTiempoLocal, setEcoTiempoLocal] = useState(40);
    const ecoActivo = ecoActivoExt ?? ecoActivoLocal;
    const ecoIntensidad = ecoIntensidadExt ?? ecoIntensidadLocal;
    const ecoTiempo = ecoTiempoExt ?? ecoTiempoLocal;
    const setEcoActivo = onCambiarEcoActivo ?? setEcoActivoLocal;
    const setEcoIntensidad = onCambiarEcoIntensidad ?? setEcoIntensidadLocal;
    const setEcoTiempo = onCambiarEcoTiempo ?? setEcoTiempoLocal;

    // Distorsión controlada o local (fallback).
    const [distorsActivoLocal, setDistorsActivoLocal] = useState(false);
    const [distorsIntensidadLocal, setDistorsIntensidadLocal] = useState(40);
    const [distorsPresetLocal, setDistorsPresetLocal] = useState<PresetDistorsionId>('crunch_clasico');
    const distorsActivo = distorsActivoExt ?? distorsActivoLocal;
    const distorsIntensidad = distorsIntensidadExt ?? distorsIntensidadLocal;
    const distorsPreset = distorsPresetExt ?? distorsPresetLocal;
    const setDistorsActivo = onCambiarDistorsActivo ?? setDistorsActivoLocal;
    const setDistorsIntensidad = onCambiarDistorsIntensidad ?? setDistorsIntensidadLocal;
    const setDistorsPreset = onCambiarDistorsPreset ?? setDistorsPresetLocal;

    // EQ 5 bandas → mapea a 3 reales (graves/medios/agudos) del motor.
    const [eq60, setEq60] = useState(graves);
    const [eq230, setEq230] = useState(graves);
    const [eq910, setEq910] = useState(medios);
    const [eq3600, setEq3600] = useState(agudos);
    const [eq14k, setEq14k] = useState(agudos);

    useEffect(() => { onCambiarGraves(Math.round((eq60 + eq230) / 2)); }, [eq60, eq230, onCambiarGraves]);
    useEffect(() => { onCambiarMedios(eq910); }, [eq910, onCambiarMedios]);
    useEffect(() => { onCambiarAgudos(Math.round((eq3600 + eq14k) / 2)); }, [eq3600, eq14k, onCambiarAgudos]);

    const [eqContexto, setEqContexto] = useState<'teclas' | 'loops'>('teclas');

    // PAN controlado o local.
    const [panTecladoLocal, setPanTecladoLocal] = useState(0);
    const [panBajosLocal, setPanBajosLocal] = useState(0);
    const [panLoopsLocal, setPanLoopsLocal] = useState(0);
    const [panMetronomoLocal, setPanMetronomoLocal] = useState(0);
    const panTeclado = panTecladoExt ?? panTecladoLocal;
    const panBajos = panBajosExt ?? panBajosLocal;
    const panLoops = panLoopsExt ?? panLoopsLocal;
    const panMetronomo = panMetronomoExt ?? panMetronomoLocal;
    const setPanTeclado = onCambiarPanTeclado ?? setPanTecladoLocal;
    const setPanBajos = onCambiarPanBajos ?? setPanBajosLocal;
    const setPanLoops = onCambiarPanLoops ?? setPanLoopsLocal;
    const setPanMetronomo = onCambiarPanMetronomo ?? setPanMetronomoLocal;

    const presetsReverb: Array<{ id: PresetReverbId; nombre: string; grupo: string }> = [
        { id: 'habitacion', nombre: 'Habitación', grupo: 'Pequeños' },
        { id: 'estudio', nombre: 'Estudio (brillante)', grupo: 'Pequeños' },
        { id: 'cuarto_mediano', nombre: 'Cuarto Mediano', grupo: 'Pequeños' },
        { id: 'garaje', nombre: 'Garaje (azulejo)', grupo: 'Pequeños' },
        { id: 'sala_ensayo', nombre: 'Sala de Ensayo', grupo: 'Medianos' },
        { id: 'cuarto_grande', nombre: 'Cuarto Grande', grupo: 'Medianos' },
        { id: 'club', nombre: 'Club / Bar', grupo: 'Medianos' },
        { id: 'vestibulo_mediano', nombre: 'Vestíbulo Mediano', grupo: 'Grandes' },
        { id: 'iglesia', nombre: 'Iglesia', grupo: 'Grandes' },
        { id: 'vestibulo_grande', nombre: 'Vestíbulo Grande', grupo: 'Grandes' },
        { id: 'catedral', nombre: 'Catedral', grupo: 'Grandes' },
        { id: 'cueva', nombre: 'Cueva (oscuro)', grupo: 'Grandes' },
        { id: 'arena', nombre: 'Arena / Estadio', grupo: 'Grandes' },
        { id: 'escenario_abierto', nombre: 'Escenario Abierto', grupo: 'Aire Libre' },
        { id: 'canon', nombre: 'Cañón (slap)', grupo: 'Aire Libre' },
        { id: 'bosque', nombre: 'Bosque', grupo: 'Aire Libre' },
        { id: 'tunel', nombre: 'Túnel (ping-pong)', grupo: 'Especiales' },
        { id: 'cabina', nombre: 'Cabina (lo-fi)', grupo: 'Especiales' },
        { id: 'plate', nombre: 'Plate (metálico)', grupo: 'Especiales' },
        { id: 'spring', nombre: 'Spring (muelle)', grupo: 'Especiales' },
        { id: 'tape_vintage', nombre: 'Tape Vintage', grupo: 'Especiales' },
        { id: 'shimmer', nombre: 'Shimmer (etéreo)', grupo: 'Especiales' },
    ];
    const gruposReverb = ['Pequeños', 'Medianos', 'Grandes', 'Aire Libre', 'Especiales'];
    const presetActualReverb: PresetReverbId | 'manual' = reverbPreset ?? 'cuarto_grande';

    const presetsDistorsion: Array<{ id: PresetDistorsionId; nombre: string; grupo: string }> = [
        { id: 'tubo_calido', nombre: 'Tubo Cálido', grupo: 'Cálidos' },
        { id: 'tubo_cremoso', nombre: 'Tubo Cremoso', grupo: 'Cálidos' },
        { id: 'vintage_drive', nombre: 'Vintage Drive', grupo: 'Cálidos' },
        { id: 'lofi_tape', nombre: 'Lo-Fi Tape', grupo: 'Cálidos' },
        { id: 'crunch_clasico', nombre: 'Crunch Clásico', grupo: 'Crunch' },
        { id: 'overdrive_blues', nombre: 'Overdrive Blues', grupo: 'Crunch' },
        { id: 'rock_70s', nombre: 'Rock 70s', grupo: 'Crunch' },
        { id: 'distorsion_dura', nombre: 'Distorsión Dura', grupo: 'Hard / Metal' },
        { id: 'heavy_metal', nombre: 'Heavy Metal', grupo: 'Hard / Metal' },
        { id: 'thrash', nombre: 'Thrash', grupo: 'Hard / Metal' },
        { id: 'death_metal', nombre: 'Death Metal', grupo: 'Hard / Metal' },
        { id: 'fuzz_muff', nombre: 'Fuzz Big Muff', grupo: 'Fuzz' },
        { id: 'fuzz_tone', nombre: 'Fuzz Tone', grupo: 'Fuzz' },
        { id: 'octave_fuzz', nombre: 'Octave Fuzz', grupo: 'Fuzz' },
        { id: 'bit_crusher', nombre: 'Bit Crusher', grupo: 'Experimentales' },
        { id: 'megafono', nombre: 'Megáfono', grupo: 'Experimentales' },
        { id: 'telefono', nombre: 'Teléfono', grupo: 'Experimentales' },
        { id: 'wave_folder', nombre: 'Wave Folder', grupo: 'Experimentales' },
    ];
    const gruposDistorsion = ['Cálidos', 'Crunch', 'Hard / Metal', 'Fuzz', 'Experimentales'];

    const handleRestaurarTodo = () => {
        setEcoActivo(false); setEcoIntensidad(30); setEcoTiempo(40);
        setEcoActivoLocal(false); setEcoIntensidadLocal(30); setEcoTiempoLocal(40);
        setDistorsActivo(false); setDistorsIntensidad(40);
        setDistorsActivoLocal(false); setDistorsIntensidadLocal(40);
        setEq60(0); setEq230(0); setEq910(0); setEq3600(0); setEq14k(0);
        setPanTeclado(0); setPanBajos(0); setPanLoops(0); setPanMetronomo(0);
        setPanTecladoLocal(0); setPanBajosLocal(0); setPanLoopsLocal(0); setPanMetronomoLocal(0);
        onRestaurar?.();
    };

    return (
        <div className="peas-root" role="dialog" aria-label="Panel de efectos de audio">
            <header className="peas-header">
                <div className="peas-header-titulo">
                    <Sliders size={15} />
                    <h2>Efectos de Audio</h2>
                </div>
                <div className="peas-header-acciones">
                    <button type="button" className="peas-btn-secundario" disabled title="Próximamente">
                        Avanzado
                    </button>
                    {onCerrar && (
                        <button
                            type="button"
                            className="peas-btn-cerrar"
                            onClick={onCerrar}
                            aria-label="Cerrar panel"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
            </header>

            <div className="peas-fila-procesadores">
                <div className="peas-procesador">
                    <div className="peas-procesador-cabecera">
                        <span className="peas-procesador-nombre">Reverb</span>
                        <Switch activo={reverbActivo} onCambiar={onCambiarReverbActivo} />
                    </div>
                    <div className="peas-procesador-control">
                        <label className="peas-preset-row">
                            <span>Preaj.</span>
                            <select
                                value={presetActualReverb}
                                disabled={!reverbActivo}
                                onChange={(e) => {
                                    const preset = presetsReverb.find((p) => p.id === e.target.value);
                                    if (!preset) return;
                                    onCambiarReverbPreset?.(preset.id);
                                }}
                            >
                                {gruposReverb.map((g) => (
                                    <optgroup key={g} label={g}>
                                        {presetsReverb.filter((p) => p.grupo === g).map((p) => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
                        <Knob
                            valor={reverbIntensidad}
                            min={0}
                            max={100}
                            etiqueta="Intensidad"
                            acento="cyan"
                            deshabilitado={!reverbActivo}
                            onCambiar={onCambiarReverbIntensidad}
                        />
                    </div>
                </div>

                <div className="peas-procesador">
                    <div className="peas-procesador-cabecera">
                        <span className="peas-procesador-nombre">Eco</span>
                        <Switch activo={ecoActivo} onCambiar={setEcoActivo} />
                    </div>
                    <div className="peas-procesador-control">
                        <Knob
                            valor={ecoIntensidad}
                            min={0}
                            max={100}
                            etiqueta="Intensidad"
                            acento="azul"
                            deshabilitado={!ecoActivo}
                            onCambiar={setEcoIntensidad}
                        />
                        <Knob
                            valor={ecoTiempo}
                            min={0}
                            max={100}
                            etiqueta="Tiempo"
                            acento="azul"
                            deshabilitado={!ecoActivo}
                            onCambiar={setEcoTiempo}
                        />
                    </div>
                </div>

                <div className="peas-procesador">
                    <div className="peas-procesador-cabecera">
                        <span className="peas-procesador-nombre">Distors.</span>
                        <Switch activo={distorsActivo} onCambiar={setDistorsActivo} />
                    </div>
                    <div className="peas-procesador-control">
                        <label className="peas-preset-row">
                            <span>Preaj.</span>
                            <select
                                value={distorsPreset}
                                disabled={!distorsActivo}
                                onChange={(e) => {
                                    const preset = presetsDistorsion.find((p) => p.id === e.target.value);
                                    if (preset) setDistorsPreset(preset.id);
                                }}
                            >
                                {gruposDistorsion.map((g) => (
                                    <optgroup key={g} label={g}>
                                        {presetsDistorsion.filter((p) => p.grupo === g).map((p) => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
                        <Knob
                            valor={distorsIntensidad}
                            min={0}
                            max={100}
                            etiqueta="Intensidad"
                            acento="naranja"
                            deshabilitado={!distorsActivo}
                            onCambiar={setDistorsIntensidad}
                        />
                    </div>
                </div>

                <div className="peas-eq">
                    <div className="peas-eq-cabecera">
                        <span className="peas-procesador-nombre">EQ</span>
                        <div className="peas-eq-tabs">
                            <button
                                type="button"
                                className={`peas-eq-tab ${eqContexto === 'teclas' ? 'activo' : ''}`}
                                onClick={() => setEqContexto('teclas')}
                            >Teclas</button>
                            <button
                                type="button"
                                className={`peas-eq-tab ${eqContexto === 'loops' ? 'activo' : ''}`}
                                onClick={() => setEqContexto('loops')}
                            >Loops</button>
                        </div>
                    </div>
                    <div className="peas-eq-grid-controles">
                        <div className="peas-eq-banda">
                            <input
                                type="range" min={-12} max={12} value={eq60}
                                onChange={(e) => setEq60(parseInt(e.target.value, 10))}
                                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
                                aria-label="60 Hz"
                            />
                            <span className="peas-eq-frec">60</span>
                        </div>
                        <div className="peas-eq-banda">
                            <input
                                type="range" min={-12} max={12} value={eq230}
                                onChange={(e) => setEq230(parseInt(e.target.value, 10))}
                                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
                                aria-label="230 Hz"
                            />
                            <span className="peas-eq-frec">230</span>
                        </div>
                        <div className="peas-eq-banda">
                            <input
                                type="range" min={-12} max={12} value={eq910}
                                onChange={(e) => setEq910(parseInt(e.target.value, 10))}
                                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
                                aria-label="910 Hz"
                            />
                            <span className="peas-eq-frec">910</span>
                        </div>
                        <div className="peas-eq-banda">
                            <input
                                type="range" min={-12} max={12} value={eq3600}
                                onChange={(e) => setEq3600(parseInt(e.target.value, 10))}
                                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
                                aria-label="3.6 kHz"
                            />
                            <span className="peas-eq-frec">3.6k</span>
                        </div>
                        <div className="peas-eq-banda">
                            <input
                                type="range" min={-12} max={12} value={eq14k}
                                onChange={(e) => setEq14k(parseInt(e.target.value, 10))}
                                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
                                aria-label="14 kHz"
                            />
                            <span className="peas-eq-frec">14k</span>
                        </div>
                    </div>
                    <div className="peas-eq-escala">
                        <span>+12</span>
                        <span>0 dB</span>
                        <span>−12</span>
                    </div>
                </div>
            </div>

            <div className="peas-volumenes-cabecera">
                <h3>Volúmenes</h3>
                <button type="button" className="peas-btn-secundario" onClick={handleRestaurarTodo}>
                    Restaurar
                </button>
            </div>

            <div className="peas-fila-volumenes">
                <div className="peas-canal peas-acento-naranja">
                    <span className="peas-canal-titulo">Teclado</span>
                    <Fader
                        valor={volumenTeclado}
                        pan={panTeclado}
                        acento="naranja"
                        onCambiar={onCambiarVolumenTeclado}
                        onPreviewIniciar={onPreviewTecladoIniciar}
                        onPreviewDetener={onPreviewTecladoDetener}
                    />
                    <Knob
                        valor={panTeclado}
                        min={-50}
                        max={50}
                        etiqueta="Pan"
                        acento="naranja"
                        onCambiar={setPanTeclado}
                        onPreviewIniciar={onPreviewTecladoIniciar}
                        onPreviewDetener={onPreviewTecladoDetener}
                    />
                    <div className="peas-canal-pan-labels"><span>I</span><span>D</span></div>
                </div>

                <div className="peas-canal peas-acento-azul">
                    <span className="peas-canal-titulo">Bajos</span>
                    <Fader
                        valor={volumenBajos}
                        pan={panBajos}
                        acento="azul"
                        onCambiar={onCambiarVolumenBajos}
                        onPreviewIniciar={onPreviewBajosIniciar}
                        onPreviewDetener={onPreviewBajosDetener}
                    />
                    <Knob
                        valor={panBajos}
                        min={-50}
                        max={50}
                        etiqueta="Pan"
                        acento="azul"
                        onCambiar={setPanBajos}
                        onPreviewIniciar={onPreviewBajosIniciar}
                        onPreviewDetener={onPreviewBajosDetener}
                    />
                    <div className="peas-canal-pan-labels"><span>I</span><span>D</span></div>
                </div>

                <div className="peas-canal peas-acento-verde">
                    <span className="peas-canal-titulo">Loops</span>
                    <Fader
                        valor={volumenLoops}
                        pan={panLoops}
                        acento="verde"
                        onCambiar={onCambiarVolumenLoops}
                        onPreviewIniciar={onPreviewLoopsIniciar}
                        onPreviewDetener={onPreviewLoopsDetener}
                    />
                    <Knob
                        valor={panLoops}
                        min={-50}
                        max={50}
                        etiqueta="Pan"
                        acento="verde"
                        onCambiar={setPanLoops}
                        onPreviewIniciar={onPreviewLoopsIniciar}
                        onPreviewDetener={onPreviewLoopsDetener}
                    />
                    <div className="peas-canal-pan-labels"><span>I</span><span>D</span></div>
                </div>

                <div className="peas-canal peas-acento-morado">
                    <span className="peas-canal-titulo">Metrónomo</span>
                    <Fader
                        valor={volumenMetronomo}
                        pan={panMetronomo}
                        acento="morado"
                        onCambiar={onCambiarVolumenMetronomo}
                        onPreviewIniciar={onPreviewMetronomoIniciar}
                        onPreviewDetener={onPreviewMetronomoDetener}
                    />
                    <Knob
                        valor={panMetronomo}
                        min={-50}
                        max={50}
                        etiqueta="Pan"
                        acento="morado"
                        onCambiar={setPanMetronomo}
                        onPreviewIniciar={onPreviewMetronomoIniciar}
                        onPreviewDetener={onPreviewMetronomoDetener}
                    />
                    <div className="peas-canal-pan-labels"><span>I</span><span>D</span></div>
                </div>
            </div>
        </div>
    );
};

export default PanelEfectosSimulador;
