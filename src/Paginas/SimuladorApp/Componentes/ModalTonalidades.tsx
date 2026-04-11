import React, { useEffect, useState } from 'react';
import { Music, X, Search, ChevronRight } from 'lucide-react';
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
    'BES': 'Sib - Mib - Lab (5 Letras)',
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
    visible, onCerrar, tonalidadSeleccionada, onSeleccionarTonalidad, listaTonalidades
}) => {
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => { if (!visible) setBusqueda(''); }, [visible]);

    if (!visible) return null;

    const tonalidadesFiltradas = listaTonalidades.filter(t => {
        const nombre = (NOMBRES_LARGOS[t] || t).toLowerCase();
        return nombre.includes(busqueda.toLowerCase()) || t.toLowerCase().includes(busqueda.toLowerCase());
    });

    return (
        <>
            <div className="modal-tonalidades-overlay" onClick={onCerrar} />
            <div className="modal-tonalidades-contenedor">
                <div className="modal-tonalidades-cabecera">
                    <div className="titulo-con-icono">
                        <Music className="icono-titulo" size={18} />
                        <h3 className="modal-tonalidades-titulo">Afinación</h3>
                    </div>
                    <button className="btn-cerrar-tonalidades" onClick={onCerrar}>
                        <X size={18} />
                    </button>
                </div>

                <div className="buscador-premium-container">
                    <Search size={16} className="icono-search" />
                    <input
                        type="text"
                        placeholder="Buscar afinación (Ej: GCF)..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="input-search-pro"
                    />
                </div>

                <div className="modal-tonalidades-lista">
                    {tonalidadesFiltradas.length > 0 ? (
                        tonalidadesFiltradas.map((ton) => (
                            <TonalidadItem 
                                key={ton}
                                id={ton}
                                seleccionado={tonalidadSeleccionada === ton}
                                onClick={() => { onSeleccionarTonalidad(ton); onCerrar(); }}
                                nombreLargo={NOMBRES_LARGOS[ton] || ton}
                            />
                        ))
                    ) : (
                        <div className="sin-resultados">
                            <Music size={40} className="icono-vacio" />
                            <p>No se encontró esa afinación</p>
                        </div>
                    )}
                </div>

                <div className="modal-tonalidades-footer">
                    <p>Personaliza tu experiencia auditiva</p>
                </div>
            </div>
        </>
    );
};

/** 🧱 SUB-COMPONENTE: ITEM DE LISTA **/
const TonalidadItem: React.FC<{ 
    id: string, 
    seleccionado: boolean, 
    onClick: () => void, 
    nombreLargo: string 
}> = ({ id, seleccionado, onClick, nombreLargo }) => (
    <div className={`item-tonalidad-pro ${seleccionado ? 'activo' : ''}`} onClick={onClick}>
        <div className="ton-pre-icono">
            <div className="tecla-mini"></div>
            <div className="tecla-mini"></div>
            <div className="tecla-mini"></div>
        </div>
        <div className="ton-content">
            <span className="ton-id">{id}</span>
            <span className="ton-full">{nombreLargo}</span>
        </div>
        {seleccionado ? <div className="dot-seleccion"></div> : <ChevronRight size={14} className="flecha-item" />}
    </div>
);

export default ModalTonalidades;
