import React from 'react';
import { X, Save } from 'lucide-react';
import './ModalGuardarSimulador.css';

interface Props {
    cancionTitulo: string;
    precision: number;
    titulo: string;
    descripcion: string;
    onTituloChange: (v: string) => void;
    onDescripcionChange: (v: string) => void;
    onGuardar: () => void;
    onCerrar: () => void;
    guardando?: boolean;
    error?: string | null;
}

const ModalGuardarSimulador: React.FC<Props> = ({
    cancionTitulo, precision,
    titulo, descripcion,
    onTituloChange, onDescripcionChange,
    onGuardar, onCerrar,
    guardando = false, error = null,
}) => {
    return (
        <div className="sim-guardar-overlay" onClick={onCerrar}>
            <div className="sim-guardar-panel" onClick={(e) => e.stopPropagation()}>
                <header className="sim-guardar-header">
                    <button
                        className="sim-guardar-cerrar"
                        onClick={onCerrar}
                        disabled={guardando}
                        aria-label="Cerrar"
                    ><X size={18} /></button>
                    <div className="sim-guardar-titulo-bloque">
                        <span className="sim-guardar-eyebrow">Guardar ejecución</span>
                        <h2>{cancionTitulo}</h2>
                    </div>
                    <span className="sim-guardar-precision">{precision}%</span>
                </header>

                <div className="sim-guardar-body">
                    <label className="sim-guardar-campo">
                        <span>Título</span>
                        <input
                            type="text"
                            value={titulo}
                            onChange={(e) => onTituloChange(e.target.value)}
                            placeholder="Ej: Mi mejor intento en Do mayor"
                            maxLength={120}
                            disabled={guardando}
                            autoFocus
                        />
                    </label>
                    <label className="sim-guardar-campo">
                        <span>Descripción <small>(opcional)</small></span>
                        <textarea
                            value={descripcion}
                            onChange={(e) => onDescripcionChange(e.target.value)}
                            placeholder="¿Qué practicaste? ¿Dónde mejoraste?"
                            maxLength={500}
                            rows={3}
                            disabled={guardando}
                        />
                    </label>

                    {error && <p className="sim-guardar-error">{error}</p>}
                </div>

                <footer className="sim-guardar-acciones">
                    <button
                        className="sim-guardar-btn secundario"
                        onClick={onCerrar}
                        disabled={guardando}
                    >
                        Ahora no
                    </button>
                    <button
                        className="sim-guardar-btn primario"
                        onClick={onGuardar}
                        disabled={guardando}
                    >
                        <Save size={14} />
                        {guardando ? 'Guardando…' : 'Guardar'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ModalGuardarSimulador;
