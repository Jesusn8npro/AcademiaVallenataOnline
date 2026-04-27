import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Music, Sliders } from 'lucide-react';
import { useMetronomo } from '../../Hooks/useMetronomo';
import './ModalMetronomo.css';

interface ModalMetronomoProps {
    visible: boolean;
    onCerrar: () => void;
    bpm: number;
    setBpm: React.Dispatch<React.SetStateAction<number>>;
}

const ModalMetronomo: React.FC<ModalMetronomoProps> = ({ visible, onCerrar, bpm, setBpm }) => {
    const met = useMetronomo(bpm);
    const [mostrarSelectorSonido, setMostrarSelectorSonido] = useState(false);

    React.useEffect(() => {
        met.setBpm(bpm);
    }, [bpm]);

    if (!visible) return null;

    return (
        <>
            <div className="modal-metronomo-overlay" onClick={onCerrar} />
            <div className="modal-metronomo-contenedor">

                {!mostrarSelectorSonido ? (
                    <>
                        <div className="modal-metronomo-cabecera">
                            <h3 className="modal-metronomo-titulo">Metrónomo</h3>
                            <button className="btn-cerrar-metronomo" onClick={onCerrar}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-metronomo-cuerpo">
                            <button
                                className={`btn-control-principal ${met.activo ? 'detener' : 'iniciar'}`}
                                onClick={met.activo ? met.detener : met.iniciar}
                            >
                                {met.activo ? 'DETENER' : 'INICIAR'}
                            </button>

                            <div className="indicador-pulsos-row">
                                {Array.from({ length: met.compas }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`pulso-circulo ${met.pulsoActual === i ? 'activo' : ''} ${i === 0 ? 'acento' : ''}`}
                                    />
                                ))}
                            </div>

                            <ControlAjuste
                                label="Velocidad"
                                sublabel="Tempo en BPM"
                                valor={bpm}
                                onInc={() => setBpm(b => Math.min(300, b + 1))}
                                onDec={() => setBpm(b => Math.max(20, b - 1))}
                            />

                            <ControlAjuste
                                label="Tempo"
                                sublabel="Pulsos por compás"
                                valor={met.compas}
                                onInc={() => met.setCompas(c => Math.min(12, c + 1))}
                                onDec={() => met.setCompas(c => Math.max(1, c - 1))}
                            />

                            <ControlAjuste
                                label="Subdivisión"
                                sublabel="Clics por pulso"
                                valor={met.subdivision}
                                onInc={() => met.setSubdivision(s => Math.min(4, s + 1))}
                                onDec={() => met.setSubdivision(s => Math.max(1, s - 1))}
                            />

                            <div className="ajuste-fila clickable" onClick={() => setMostrarSelectorSonido(true)}>
                                <span className="ajuste-label">Efecto de Sonido</span>
                                <div className="valor-con-flecha">
                                    <span>{met.sonidoEfecto}</span>
                                    <ChevronRight size={18} />
                                </div>
                            </div>

                            <div className="ajuste-fila vertical">
                                <span className="ajuste-label">Volumen</span>
                                <div className="volumen-control-container">
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.01"
                                        value={met.volumen}
                                        onChange={(e) => met.setVolumen(parseFloat(e.target.value))}
                                        className="slider-premium-met"
                                    />
                                    <Sliders size={18} className="icono-vol" />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="modal-metronomo-cabecera">
                            <button className="btn-atras" onClick={() => setMostrarSelectorSonido(false)}>
                                <ChevronLeft size={20} />
                            </button>
                            <h3 className="modal-metronomo-titulo">Efectos</h3>
                        </div>
                        <div className="lista-sonidos">
                            {['Electrónico', 'Madera', 'Aplausos', 'Campana 1', 'Campana 2', 'Tono', 'Silencioso', 'Baqueta'].map(sonido => (
                                <div
                                    key={sonido}
                                    className={`item-sonido ${met.sonidoEfecto === sonido ? 'activo' : ''}`}
                                    onClick={() => {
                                        met.setSonidoEfecto(sonido as any);
                                        setMostrarSelectorSonido(false);
                                    }}
                                >
                                    <div className="nombre-con-icono">
                                        <Music size={16} />
                                        <span>{sonido}</span>
                                    </div>
                                    {met.sonidoEfecto === sonido && <div className="check-mark">✓</div>}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="modal-metronomo-footer">
                    <p>Precisión rítmica profesional</p>
                </div>
            </div>
        </>
    );
};

const ControlAjuste: React.FC<{
    label: string,
    sublabel: string,
    valor: number,
    onInc: () => void,
    onDec: () => void
}> = ({ label, sublabel, valor, onInc, onDec }) => (
    <div className="ajuste-fila">
        <div className="ajuste-info">
            <span className="ajuste-label">{label}</span>
            <span className="ajuste-sublabel">{sublabel}</span>
        </div>
        <div className="control-inc-dec">
            <button onClick={onDec}><ChevronLeft size={20} /></button>
            <span className="valor-display">{valor}</span>
            <button onClick={onInc}><ChevronRight size={20} /></button>
        </div>
    </div>
);

export default ModalMetronomo;
