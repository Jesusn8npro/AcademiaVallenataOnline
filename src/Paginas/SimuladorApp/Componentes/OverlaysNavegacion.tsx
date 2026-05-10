import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface OverlaysNavegacionProps {
    // Overlay "vine de la clase"
    volverAClaseParam: string | null;
    onVolverALaClase: () => void;
    // Overlay "vine de Grabaciones"
    vinoDeGrabaciones: boolean;
    usuarioEligioQuedarse: boolean;
    countdownVolver: number | null;
    onVolverAGrabaciones: () => void;
    onQuedarseEnSimulador: () => void;
}

/**
 * Overlays flotantes que aparecen segun de donde llego el alumno al
 * simulador:
 * - ?volverA=&t= (clase movil): boton "Volver a la clase" siempre visible.
 * - ?reproducir=<id> (Grabaciones): boton "Volver" + countdown 3s al
 *   terminar el replay con opcion de quedarse.
 *
 * Pueden coexistir aunque en la practica no se da.
 */
const OverlaysNavegacion: React.FC<OverlaysNavegacionProps> = ({
    volverAClaseParam,
    onVolverALaClase,
    vinoDeGrabaciones,
    usuarioEligioQuedarse,
    countdownVolver,
    onVolverAGrabaciones,
    onQuedarseEnSimulador,
}) => {
    return (
        <>
            {volverAClaseParam && (
                <button
                    type="button"
                    className="sim-volver-clase"
                    onClick={onVolverALaClase}
                    aria-label="Volver a la clase"
                >
                    <ArrowLeft size={16} />
                    <span>Volver a la clase</span>
                </button>
            )}

            {vinoDeGrabaciones && !usuarioEligioQuedarse && (
                <>
                    <button
                        type="button"
                        className="sim-volver-grabaciones"
                        onClick={onVolverAGrabaciones}
                        aria-label="Volver a Grabaciones"
                    >
                        <ArrowLeft size={16} />
                        <span>Volver</span>
                    </button>

                    {countdownVolver !== null && (
                        <div className="sim-countdown-volver" role="dialog" aria-live="polite">
                            <p>
                                <strong>Replay terminado.</strong>
                                <br />
                                Volviendo a Grabaciones en <strong>{countdownVolver}s</strong>…
                            </p>
                            <div className="sim-countdown-volver-acciones">
                                <button type="button" onClick={onVolverAGrabaciones}>
                                    Volver ahora
                                </button>
                                <button type="button" className="primaria" onClick={onQuedarseEnSimulador}>
                                    Quedarme aquí
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default OverlaysNavegacion;
