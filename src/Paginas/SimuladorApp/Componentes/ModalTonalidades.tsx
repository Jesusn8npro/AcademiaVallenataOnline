import React, { useEffect, useRef, useState } from 'react';
import { Music, X, Search } from 'lucide-react';
import './ModalTonalidades.css';

interface ModalTonalidadesProps {
    visible: boolean;
    onCerrar: () => void;
    botonRef: React.RefObject<HTMLDivElement>;
    tonalidadSeleccionada: string;
    onSeleccionarTonalidad: (tonalidad: string) => void;
    listaTonalidades: string[];
}

const NOMBRES_LARGOS: Record<string, string> = {
    'F-Bb-Eb': 'Fa - Sib - Mib (Original)',
    'FBE': 'Fa - Sib - Mib (Original)',
    'GCF': 'Sol - Do - Fa (G/C/F)',
    'ADG': 'La - Re - Sol (A/D/G)',
    'BES': 'Sib - Mib - Lab (Cinco Letras)',
    'BEA': 'Si - Mi - La',
    'CFB': 'Do - Fa - Sib',
    'DGC': 'Re - Sol - Do',
    'Gb-B-E': 'Solb - Si - Mi',
    'ADG_FLAT': 'Lab - Reb - Solb',
    'DGB': 'Re - Sol - Si',
    'GDC': 'Sol - Re - Do',
    'ELR': 'Mi - La - Re'
};

const ModalTonalidades: React.FC<ModalTonalidadesProps> = ({
    visible,
    onCerrar,
    tonalidadSeleccionada,
    onSeleccionarTonalidad,
    listaTonalidades
}) => {
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        if (!visible) {
            setBusqueda('');
        }
    }, [visible]);

    if (!visible) return null;

    const tonalidadesFiltradas = listaTonalidades.filter(t => {
        const nombre = (NOMBRES_LARGOS[t] || t).toLowerCase();
        return nombre.includes(busqueda.toLowerCase());
    });

    return (
        <>
            <div className="modal-tonalidades-overlay" onClick={onCerrar} />
            <div className="modal-tonalidades-contenedor">
                <div className="modal-tonalidades-cabecera">
                    <h3 className="modal-tonalidades-titulo">Elija la Afinación</h3>
                    <button className="btn-cerrar-tonalidades" onClick={onCerrar}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-tonalidades-subtitulo">
                    <span>3 HILERAS</span>
                    <div className="linea-activa-tab" />
                </div>

                <div className="buscador-tonalidades-contenedor">
                    <Search size={14} className="icono-buscar" />
                    <input
                        type="text"
                        placeholder="Buscar afinación..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="input-busqueda-tonalidades"
                    />
                </div>

                <div className="modal-tonalidades-lista">
                    {tonalidadesFiltradas.length > 0 ? (
                        tonalidadesFiltradas.map((ton) => (
                            <div
                                key={ton}
                                className={`item-tonalidad ${tonalidadSeleccionada === ton ? 'seleccionado' : ''}`}
                                onClick={() => {
                                    onSeleccionarTonalidad(ton);
                                    onCerrar();
                                }}
                            >
                                <div className="item-tonalidad-icono">
                                    <Music size={18} />
                                </div>
                                <div className="item-tonalidad-info">
                                    <span className="ton-nombre-primario">{ton}</span>
                                    <span className="ton-nombre-desc">{NOMBRES_LARGOS[ton] || ton}</span>
                                </div>
                                {tonalidadSeleccionada === ton && (
                                    <div className="indicador-seleccionado">
                                        <div className="punto-seleccion" />
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="sin-resultados-tonalidades">
                            No se encontraron afinaciones
                        </div>
                    )}
                </div>

                <div className="modal-tonalidades-footer">
                    <p className="footer-pregunta">¿No encontraste la afinación que buscas?</p>
                </div>
            </div>
        </>
    );
};

export default ModalTonalidades;
