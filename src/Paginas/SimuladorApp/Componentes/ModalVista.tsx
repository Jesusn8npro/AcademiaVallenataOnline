import React, { useState, useEffect, useRef } from 'react';
import { X, Type, Music, Hash, Eye, Columns } from 'lucide-react';
import './ModalVista.css';

interface ModalVistaProps {
    visible: boolean;
    onCerrar: () => void;
    botonRef: React.RefObject<HTMLDivElement>;

    // Estados de Vista
    modoVista: 'notas' | 'cifrado' | 'numeros' | 'teclas';
    setModoVista: (modo: 'notas' | 'cifrado' | 'numeros' | 'teclas') => void;

    mostrarOctavas: boolean;
    setMostrarOctavas: (mostrar: boolean) => void;

    tamanoFuente: number;
    setTamanoFuente: (tamano: number) => void;

    vistaDoble: boolean;
    setVistaDoble: (doble: boolean) => void;
}

const ModalVista: React.FC<ModalVistaProps> = ({
    visible,
    onCerrar,
    botonRef,
    modoVista,
    setModoVista,
    mostrarOctavas,
    setMostrarOctavas,
    tamanoFuente,
    setTamanoFuente,
    vistaDoble,
    setVistaDoble
}) => {
    if (!visible) return null;

    return (
        <>
            <div className="modal-vista-overlay" onClick={onCerrar} />
            <div className="modal-vista-contenedor">
                <div className="modal-vista-cabecera">
                    <h3 className="modal-vista-titulo">Mostrar Notas</h3>
                    <button className="btn-cerrar-vista" onClick={onCerrar}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-vista-cuerpo">
                    {/* 🎼 SECCIÓN NOTACIÓN */}
                    <div className="opcion-vista-grupo">
                        <div className="opcion-vista-info">
                            <Type size={16} className="icono-opcion" />
                            <span>Notación</span>
                        </div>
                        <div className="selector-botones-grupo">
                            <button
                                className={`btn-opcion-item ${modoVista === 'cifrado' ? 'activo' : ''}`}
                                onClick={() => setModoVista('cifrado')}
                            >
                                C D E
                            </button>
                            <button
                                className={`btn-opcion-item ${modoVista === 'notas' ? 'activo' : ''}`}
                                onClick={() => setModoVista('notas')}
                            >
                                Do Re Mi
                            </button>
                        </div>
                    </div>

                    {/* 🔢 SECCIÓN OCTAVAS */}
                    <div className="opcion-vista-grupo">
                        <div className="opcion-vista-info">
                            <Hash size={16} className="icono-opcion" />
                            <span>Mostrar octavas</span>
                        </div>
                        <label className="switch-premium">
                            <input
                                type="checkbox"
                                checked={mostrarOctavas}
                                onChange={(e) => setMostrarOctavas(e.target.checked)}
                            />
                            <span className="slider-premium"></span>
                        </label>
                    </div>

                    {/* 🪟 SECCIÓN VISTA DOBLE */}
                    <div className="opcion-vista-grupo">
                        <div className="opcion-vista-info">
                            <Columns size={16} className="icono-opcion" />
                            <span>Vista doble (Halar/Empujar)</span>
                        </div>
                        <label className="switch-premium">
                            <input
                                type="checkbox"
                                checked={vistaDoble}
                                onChange={(e) => setVistaDoble(e.target.checked)}
                            />
                            <span className="slider-premium"></span>
                        </label>
                    </div>

                    {/* 📏 SECCIÓN TAMAÑO TEXTO */}
                    <div className="opcion-vista-grupo vertical">
                        <div className="opcion-vista-info">
                            <span className="label-texto">Tamaño del texto</span>
                        </div>
                        <div className="control-slider-container">
                            <span className="fuente-min">A-</span>
                            <input
                                type="range"
                                min="1.5"
                                max="4.5"
                                step="0.1"
                                value={tamanoFuente}
                                onChange={(e) => setTamanoFuente(parseFloat(e.target.value))}
                                className="slider-fuente"
                            />
                            <span className="fuente-max">A+</span>
                        </div>
                    </div>
                </div>

                <div className="modal-vista-footer">
                    <p>Configuración visual de aprendizaje</p>
                </div>
            </div>
        </>
    );
};

export default ModalVista;
