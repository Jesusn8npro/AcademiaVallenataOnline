import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { ChevronUp, MoveHorizontal } from 'lucide-react';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';
import imagenBajosDefault from '../Parte restante Bajos.jpg';
import { useBotonActivo } from '../store/botonesActivosStore';
import './ContenedorBajos.css';

// Función estable a nivel módulo: garantiza id único de bajo para suscripción.
const obtenerIdBajoUnico = (idOriginal: string) =>
    idOriginal.includes('-bajo') ? idOriginal : `${idOriginal}-bajo`;

interface BotonBajoProps {
    bajo: any;
    datosFila: any[];
    vistaDoble: boolean;
    desactivarAudio: boolean;
    actualizarBotonActivo: (id: string, accion: 'add' | 'remove', extra?: any, silencioso?: boolean) => void;
}

/**
 * Botón de bajo aislado: se suscribe SOLO a su propio id en el store externo.
 * Cuando se presiona/libera otro botón distinto, este NO se re-renderiza.
 */
const BotonBajo: React.FC<BotonBajoProps> = React.memo(({
    bajo, datosFila, vistaDoble, desactivarAudio, actualizarBotonActivo,
}) => {
    const idUnico = obtenerIdBajoUnico(bajo.id);
    const estado = useBotonActivo(idUnico);
    const esActivo = !!estado;

    const [numFila, col] = bajo.id.split('-');
    const idHalar = `${numFila}-${col}-halar-bajo`;
    const idEmpujar = `${numFila}-${col}-empujar-bajo`;
    const notaHalar = datosFila.find((x: any) => x.id === idHalar)?.nombre || '';
    const notaEmpujar = datosFila.find((x: any) => x.id === idEmpujar)?.nombre || '';

    return (
        <button
            data-pos={`${numFila}-${col}`}
            className={`boton-bajo-contenedor ${esActivo ? 'activo' : ''} ${vistaDoble ? 'vista-doble' : ''}`}
            onPointerDown={(e) => {
                if (desactivarAudio) return;
                e.preventDefault(); e.stopPropagation();
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                actualizarBotonActivo(idUnico, 'add', null, true);
            }}
            onPointerUp={(e) => {
                e.preventDefault(); e.stopPropagation();
                actualizarBotonActivo(idUnico, 'remove', null, true);
            }}
            onPointerLeave={() => actualizarBotonActivo(idUnico, 'remove', null, true)}
            onPointerCancel={() => actualizarBotonActivo(idUnico, 'remove', null, true)}
            style={{ touchAction: 'manipulation' }}
            title={bajo.nombre}
        >
            {!vistaDoble ? (
                <span className="texto-boton-bajo">{bajo.nombre}</span>
            ) : (
                <div className="layout-bajos-doble">
                    <span className="bajo-label-doble label-halar">{notaHalar}</span>
                    <span className="bajo-label-doble label-empujar">{notaEmpujar}</span>
                </div>
            )}
        </button>
    );
});
BotonBajo.displayName = 'BotonBajo';

interface ContenedorBajosProps {
    visible: boolean;
    onOpen: () => void;
    onClose: () => void;
    logica: any;
    desactivarAudio?: boolean;
    escala: number;
    manejarCambioFuelle: (dir: 'empujar' | 'halar', engine: any) => void;
    vistaDoble?: boolean;
    /** URL de la imagen del fondo de bajos según el tema activo. Si no se
     *  pasa, cae al asset original importado. */
    imagenBajosUrl?: string;
}

const ContenedorBajos: React.FC<ContenedorBajosProps> = ({
    visible,
    onOpen,
    onClose,
    logica,
    desactivarAudio = false,
    escala,
    manejarCambioFuelle,
    vistaDoble = false,
    imagenBajosUrl,
}) => {
    const imagenBajos = imagenBajosUrl || imagenBajosDefault;
    const x = useMotionValue(0);
    const draggingRef = useRef(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);

    // 🚀 LÓGICA DE DRAG
    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (!draggingRef.current) return;
            const delta = e.clientX - startXRef.current;
            x.set(currentXRef.current + delta);
        };
        const handlePointerUp = () => { draggingRef.current = false; };
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [x]);

    const handleDragStart = (e: React.PointerEvent) => {
        e.preventDefault(); e.stopPropagation();
        draggingRef.current = true;
        startXRef.current = e.clientX;
        currentXRef.current = x.get();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const renderFila = (datosFila: any[]) => {
        if (!datosFila) return null;

        // Si es Vista Doble, agrupamos por posición para no duplicar botones
        if (vistaDoble) {
            const grupos: Record<string, any> = {};
            datosFila.forEach(b => {
                const pos = b.id.split('-').slice(0, 2).join('-');
                if (!grupos[pos]) grupos[pos] = b;
            });
            return Object.values(grupos)
                .sort((a: any, b: any) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]))
                .map((b: any) => (
                    <BotonBajo
                        key={obtenerIdBajoUnico(b.id)}
                        bajo={b}
                        datosFila={datosFila}
                        vistaDoble={vistaDoble}
                        desactivarAudio={desactivarAudio}
                        actualizarBotonActivo={logica.actualizarBotonActivo}
                    />
                ));
        }

        // Si es vista normal, filtramos por dirección
        return datosFila
            .filter((b: any) => b.id.includes(logica.direccion))
            .sort((a: any, b: any) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]))
            .map((b: any) => (
                <BotonBajo
                    key={obtenerIdBajoUnico(b.id)}
                    bajo={b}
                    datosFila={datosFila}
                    vistaDoble={vistaDoble}
                    desactivarAudio={desactivarAudio}
                    actualizarBotonActivo={logica.actualizarBotonActivo}
                />
            ));
    };

    const handlePointerDownFuelle = (e: React.PointerEvent) => {
        const target = e.target as HTMLElement;
        // Solo actuar si tocamos el "cuero" o el fondo, NO los botones de la interfaz
        if (!visible || !target.closest('.contenedor-bajos-wrapper, .boton-bajos-superior')) {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            manejarCambioFuelle('empujar', motorAudioPro);
        }
    };

    const handlePointerUpFuelle = (e: React.PointerEvent) => {
        const target = e.target as HTMLElement;
        // Revert inmediato a 'halar' al soltar el fuelle. Sin tiempo de gracia: la sensación
        // de cambio instantáneo entre direcciones es lo que el usuario quiere.
        if (!visible || !target.closest('.contenedor-bajos-wrapper, .boton-bajos-superior')) {
            manejarCambioFuelle('halar', motorAudioPro);
        }
    };

    return (
        <>
            {/* 🎵 ZONA DE FUELLE - Ahora es un TOGGLE, no requiere sostener dedo */}
            <div
                className={`seccion-bajos-contenedor ${escala < 0.8 ? 'modo-estirado' : ''}`}
                onPointerDown={handlePointerDownFuelle}
                onPointerUp={handlePointerUpFuelle}
                onPointerCancel={handlePointerUpFuelle}
                style={{ touchAction: 'manipulation' }}
            >
                {!visible && (
                    <button className="boton-bajos-superior" onClick={onOpen}>
                        <span className="texto-bajos">BAJOS</span>
                        <span className="flecha-bajos">▼</span>
                    </button>
                )}
                <img src={imagenBajos} alt="Fondo Bajos" className="img-bajos-fondo" />
                <div className="fuelle-status-overlay">
                    {logica.direccion === 'empujar' ? 'CERRANDO' : 'ABRIENDO'}
                </div>
            </div>

            {/* 🎹 PANEL INTERACTIVO (IDENTICO A GAMING) */}
            {visible && (
                <motion.div
                    className="contenedor-bajos-wrapper"
                    style={{ x }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="contenedor-bajos-principal">
                        <div className="grid-bajos-contenedor">
                            <div className="fila-bajos-contenedor">
                                {renderFila(logica.configTonalidad?.disposicionBajos?.dos)}
                            </div>
                            <div className="fila-bajos-contenedor">
                                {renderFila(logica.configTonalidad?.disposicionBajos?.una)}
                            </div>
                        </div>
                    </div>

                    <div className="bajos-capsula-controles">
                        <button className="btn-capsula-accion btn-cerrar-bajos" onClick={onClose} title="Cerrar">
                            <ChevronUp size={22} />
                        </button>
                        <div className="separador-capsula" />
                        <button className="btn-capsula-accion btn-mover-bajos" onPointerDown={handleDragStart} title="Mover">
                            <MoveHorizontal size={20} />
                        </button>
                    </div>
                </motion.div>
            )}
        </>
    );
};

export default React.memo(ContenedorBajos);
