import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { ChevronUp, MoveHorizontal } from 'lucide-react';
import { motorAudioPro } from '../../SimuladorDeAcordeon/AudioEnginePro';
import imagenBajos from '../Parte restante Bajos.jpg';
import './ContenedorBajos.css';

interface ContenedorBajosProps {
    visible: boolean;
    onOpen: () => void;
    onClose: () => void;
    logica: any;
    desactivarAudio?: boolean;
    escala: number;
    manejarCambioFuelle: (dir: 'empujar' | 'halar', engine: any) => void;
    vistaDoble?: boolean;
}

const ContenedorBajos: React.FC<ContenedorBajosProps> = ({
    visible,
    onOpen,
    onClose,
    logica,
    desactivarAudio = false,
    escala,
    manejarCambioFuelle,
    vistaDoble = false
}) => {
    const x = useMotionValue(0);
    const draggingRef = useRef(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);
    // Ref para cancelar el revert-a-halar cuando el fuelle se vuelve a presionar antes del timeout
    const fuelleRevertRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // 🎹 FUNCIÓN PARA ASEGURAR ID ÚNICO DE BAJO
    const obtenerIdBajoUnico = (idOriginal: string) => {
        if (idOriginal.includes('-bajo')) return idOriginal;
        return `${idOriginal}-bajo`;
    };

    // 🔘 RENDERIZADO DE BOTÓN (ASPECTO GAMING)
    const renderBotonBajo = (bajo: any, datosFila: any[]) => {
        const idUnico = obtenerIdBajoUnico(bajo.id);
        const esActivo = logica.botonesActivos && logica.botonesActivos[idUnico];
        const [numFila, col] = bajo.id.split('-');
        
        // Buscamos las dos notas (halar y empujar) dentro de la misma fila actual
        const idHalar = `${numFila}-${col}-halar-bajo`;
        const idEmpujar = `${numFila}-${col}-empujar-bajo`;
        
        const notaHalar = datosFila.find((x: any) => x.id === idHalar)?.nombre || '';
        const notaEmpujar = datosFila.find((x: any) => x.id === idEmpujar)?.nombre || '';

        return (
            <button
                key={idUnico}
                data-pos={`${numFila}-${col}`} // 🔍 IDENTIFICADOR PARA EL HUNDIMIENTO INTELIGENTE
                className={`boton-bajo-contenedor ${esActivo ? 'activo' : ''} ${vistaDoble ? 'vista-doble' : ''}`}
                onPointerDown={(e) => {
                    if (desactivarAudio) return;
                    e.preventDefault(); e.stopPropagation();
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    logica.actualizarBotonActivo(idUnico, 'add', null, true);
                }}
                onPointerUp={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    logica.actualizarBotonActivo(idUnico, 'remove', null, true);
                }}
                onPointerLeave={() => logica.actualizarBotonActivo(idUnico, 'remove', null, true)}
                onPointerCancel={() => logica.actualizarBotonActivo(idUnico, 'remove', null, true)}
                style={{ touchAction: 'none' }}
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
                .map(b => renderBotonBajo(b, datosFila));
        }

        // Si es vista normal, filtramos por dirección
        return datosFila
            .filter((b: any) => b.id.includes(logica.direccion))
            .sort((a: any, b: any) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]))
            .map(b => renderBotonBajo(b, datosFila));
    };

    const handlePointerDownFuelle = (e: React.PointerEvent) => {
        const target = e.target as HTMLElement;
        // Solo actuar si tocamos el "cuero" o el fondo, NO los botones de la interfaz
        if (!visible || !target.closest('.contenedor-bajos-wrapper, .boton-bajos-superior')) {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            // Cancelar revert pendiente
            if (fuelleRevertRef.current !== null) {
                clearTimeout(fuelleRevertRef.current);
                fuelleRevertRef.current = null;
            }
            manejarCambioFuelle('empujar', motorAudioPro);
        }
    };

    const handlePointerUpFuelle = (e: React.PointerEvent) => {
        const target = e.target as HTMLElement;
        if (!visible || !target.closest('.contenedor-bajos-wrapper, .boton-bajos-superior')) {
            fuelleRevertRef.current = setTimeout(() => {
                fuelleRevertRef.current = null;
                manejarCambioFuelle('halar', motorAudioPro);
            }, 60);
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
                style={{ touchAction: 'none' }}
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

export default ContenedorBajos;
