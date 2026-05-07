import React from 'react';
import { Save, X } from 'lucide-react';

interface Props {
    visible: boolean;
    mensaje?: string;
    onCerrar: () => void;
}

/** Toast simple mostrado tras guardar una grabacion. Auto-oculta a los 3s
 *  via timer del padre. Usa los estilos `.sim-grab-toast*` definidos en
 *  BarraGrabacionFlotante.css para reutilizar el look. */
const ToastGrabacionGuardada: React.FC<Props> = ({ visible, mensaje = 'Grabación guardada', onCerrar }) => {
    if (!visible) return null;
    return (
        <div className="sim-grab-toast" role="status">
            <span className="sim-grab-toast-icono"><Save size={14} /></span>
            <span>{mensaje}</span>
            <button className="sim-grab-toast-cerrar" onClick={onCerrar} aria-label="Cerrar">
                <X size={14} />
            </button>
        </div>
    );
};

export default React.memo(ToastGrabacionGuardada);
