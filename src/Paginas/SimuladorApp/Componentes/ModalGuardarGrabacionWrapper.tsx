import React, { lazy, Suspense } from 'react';
import ModalGuardarSimulador from './ModalGuardarSimulador';

const ModalGrabacionAdmin = lazy(() => import('./ModalGrabacionAdmin'));

interface ModalGuardarGrabacionWrapperProps {
    esAdmin: boolean;
    autorDefault: string;
    grabacion: any;
    onGuardarPersonal: (titulo: string, descripcion: string) => Promise<any>;
    onGuardarCancionHero: (datos: any) => Promise<any>;
    onRegrabar: () => void;
}

/**
 * Decide entre el modal expandido de admin (con opcion de publicar como
 * Cancion Hero + re-grabar + MP3 de fondo) o el modal simple para el resto
 * de roles. Solo se muestra cuando hay una grabacion pendiente de tipo
 * 'practica_libre'.
 */
const ModalGuardarGrabacionWrapper: React.FC<ModalGuardarGrabacionWrapperProps> = ({
    esAdmin,
    autorDefault,
    grabacion,
    onGuardarPersonal,
    onGuardarCancionHero,
    onRegrabar,
}) => {
    const visible = !!grabacion.grabacionPendiente && grabacion.grabacionPendiente.tipo === 'practica_libre';
    const resumen = grabacion.grabacionPendiente ? {
        duracionMs: grabacion.grabacionPendiente.duracionMs,
        bpm: grabacion.grabacionPendiente.bpm,
        tonalidad: grabacion.grabacionPendiente.tonalidad,
        notas: grabacion.grabacionPendiente.secuencia.length,
    } : null;

    if (esAdmin) {
        return (
            <Suspense fallback={null}>
                <ModalGrabacionAdmin
                    visible={visible}
                    guardando={grabacion.guardandoGrabacion}
                    error={grabacion.errorGuardadoGrabacion}
                    tituloSugerido={grabacion.grabacionPendiente?.tituloSugerido || 'Mi grabación'}
                    autorDefault={autorDefault}
                    usoMetronomo={!!grabacion.grabacionPendiente?.metadata?.metronomo}
                    resumen={resumen}
                    onCancelar={grabacion.descartarGrabacionPendiente}
                    onRegrabar={onRegrabar}
                    onGuardarPersonal={onGuardarPersonal}
                    onGuardarCancionHero={onGuardarCancionHero}
                />
            </Suspense>
        );
    }

    return (
        <ModalGuardarSimulador
            visible={visible}
            guardando={grabacion.guardandoGrabacion}
            error={grabacion.errorGuardadoGrabacion}
            tituloSugerido={grabacion.grabacionPendiente?.tituloSugerido || 'Practica libre'}
            resumen={resumen}
            onCancelar={grabacion.descartarGrabacionPendiente}
            onGuardar={onGuardarPersonal}
        />
    );
};

export default ModalGuardarGrabacionWrapper;
