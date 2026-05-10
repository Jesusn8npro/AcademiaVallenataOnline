import React from 'react';
import { Eye, EyeOff, X as XIcon, Crown } from 'lucide-react';

interface BotonModoFocoProps {
    modoFoco: boolean;
    onToggle: () => void;
    esPremium: boolean;
    toastUpgradeVisible: boolean;
    onCerrarToast: () => void;
    onClickVerPlus: () => void;
}

/**
 * Pestana vertical slim del modo foco + toast de upgrade que aparece cuando
 * un usuario FREE consume sus 60s gratuitos.
 *
 * El toast aparece arriba del simulador sin bloquear la jugabilidad y
 * auto-cierra a los 8s (manejado por useModoFoco).
 */
const BotonModoFoco: React.FC<BotonModoFocoProps> = ({
    modoFoco,
    onToggle,
    esPremium,
    toastUpgradeVisible,
    onCerrarToast,
    onClickVerPlus,
}) => {
    return (
        <>
            <button
                type="button"
                className={`btn-modo-foco ${modoFoco ? 'activo' : ''} ${esPremium ? 'premium' : 'free'}`}
                onClick={onToggle}
                title={modoFoco ? 'Salir de modo foco' : 'Modo foco — esconder herramientas'}
                aria-label={modoFoco ? 'Salir de modo foco' : 'Activar modo foco'}
            >
                {modoFoco ? <EyeOff size={14} /> : <Eye size={14} />}
                {!modoFoco && <span>FOCO</span>}
            </button>

            {toastUpgradeVisible && (
                <div className="toast-upgrade-premium" role="status">
                    <div className="toast-icono">
                        <Crown size={14} />
                    </div>
                    <div className="toast-mensaje">
                        <strong>Modo Foco gratuito terminó</strong>
                        Hazte Plus y disfrutalo sin límites
                    </div>
                    <button
                        type="button"
                        className="toast-cta"
                        onClick={onClickVerPlus}
                    >
                        Ver Plus
                    </button>
                    <button
                        type="button"
                        className="toast-cerrar"
                        onClick={onCerrarToast}
                        aria-label="Cerrar"
                    >
                        <XIcon size={14} />
                    </button>
                </div>
            )}
        </>
    );
};

export default BotonModoFoco;
