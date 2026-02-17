import React, { useEffect, useState, useRef } from 'react';
import './SimuladorApp.css';

// 🪗 IMPORTAMOS LA LÓGICA MAESTRA
import { useLogicaAcordeon } from '../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import { mapaTeclas } from '../SimuladorDeAcordeon/mapaTecladoYFrecuencias';

const SimuladorApp: React.FC = () => {
    const [isPointerDown, setIsPointerDown] = useState(false);
    // Rastreamos qué botones físicos (fila-col) están siendo presionados
    const botonesFisicosPresionados = useRef<Set<string>>(new Set());

    // Usamos el hook maestro
    const logica = useLogicaAcordeon({
        direccion: 'halar'
    });

    const ACORDEON_ORIGINAL_ID = '4e9f2a94-21c0-4029-872e-7cb1c314af69';
    const TONALIDAD_5_LETRAS = 'GCF';

    // 🛡️ BLINDAJE TOTAL: PREVENCIÓN DE GESTOS NATIVOS Y MENÚ CONTEXTUAL
    useEffect(() => {
        const prevenirMenu = (e: MouseEvent) => e.preventDefault();
        const prevenirGestos = (e: TouchEvent) => {
            if (e.touches.length > 1) {
                e.preventDefault(); // Bloquea zoom de dos dedos
            }
        };

        // Bloqueo de menú contextual (click largo en móvil)
        window.addEventListener('contextmenu', prevenirMenu);
        // Bloqueo de gestos táctiles del sistema
        window.addEventListener('touchstart', prevenirGestos, { passive: false });

        document.body.classList.add('vista-premium-activa');
        window.scrollTo(0, 0);

        return () => {
            window.removeEventListener('contextmenu', prevenirMenu);
            window.removeEventListener('touchstart', prevenirGestos);
            document.body.classList.remove('vista-premium-activa');
        };
    }, []);

    // 🛡️ PERSISTENCIA DE SONIDO AL CAMBIAR EL FUELLE
    useEffect(() => {
        botonesFisicosPresionados.current.forEach(fisicoId => {
            const [fila, col] = fisicoId.split('-');
            const oldDir = logica.direccion === 'halar' ? 'empujar' : 'halar';
            const oldId = `${fila}-${col}-${oldDir}`;
            const newId = `${fila}-${col}-${logica.direccion}`;

            logica.actualizarBotonActivo(oldId, 'remove');
            logica.actualizarBotonActivo(newId, 'add');
        });
    }, [logica.direccion]);

    useEffect(() => {
        if (logica.instrumentoId !== ACORDEON_ORIGINAL_ID) {
            logica.setInstrumentoId(ACORDEON_ORIGINAL_ID);
        }
        if (logica.tonalidadSeleccionada !== TONALIDAD_5_LETRAS) {
            logica.setTonalidadSeleccionada(TONALIDAD_5_LETRAS);
        }
    }, [logica.instrumentoId, logica.tonalidadSeleccionada]);

    const manejarEntradaBoton = (notaId: string) => {
        const [fila, col] = notaId.split('-');
        const fisicoId = `${fila}-${col}`;
        botonesFisicosPresionados.current.add(fisicoId);
        logica.actualizarBotonActivo(notaId, 'add');
    };

    const manejarSalidaBoton = (notaId: string) => {
        const [fila, col] = notaId.split('-');
        const fisicoId = `${fila}-${col}`;
        botonesFisicosPresionados.current.delete(fisicoId);
        logica.actualizarBotonActivo(notaId, 'remove');
    };

    const hileras = [
        { id: '1', nombre: 'Afuera (1)', clase: 'hilera-afuera', notas: logica.configTonalidad.primeraFila },
        { id: '2', nombre: 'Medio (2)', clase: 'hilera-medio', notas: logica.configTonalidad.segundaFila },
        { id: '3', nombre: 'Adentro (3)', clase: 'hilera-adentro', notas: logica.configTonalidad.terceraFila }
    ];

    return (
        <div
            className="simulador-app-root capa-blindaje-total"
            onPointerDown={(e) => {
                // No llamamos preventDefault aquí para permitir que los hijos reciban el evento
                setIsPointerDown(true);
            }}
            onPointerUp={(e) => {
                setIsPointerDown(false);
                if (botonesFisicosPresionados.current.size === 0) {
                    logica.limpiarTodasLasNotas();
                }
            }}
        >
            <div className="simulador-canvas">
                <div className="contenedor-pitos-horizontal">
                    {hileras.slice().reverse().map((hilera) => (
                        <div key={hilera.id} className={`hilera-pitos ${hilera.clase}`}>
                            {hilera.notas
                                .filter((n: any) => n.id.includes(logica.direccion))
                                .map((nota: any) => {
                                    const [fila, col] = nota.id.split('-');
                                    const letraTeclado = (Object.keys(mapaTeclas).find(
                                        k => mapaTeclas[k].fila === parseInt(fila) && mapaTeclas[k].columna === parseInt(col)
                                    ) || '').toUpperCase();

                                    return (
                                        <div
                                            key={nota.id}
                                            className={`pito-boton ${logica.botonesActivos[nota.id] ? 'activo' : ''}`}
                                            onPointerDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                manejarEntradaBoton(nota.id);
                                            }}
                                            onPointerEnter={(e) => {
                                                if (isPointerDown) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    manejarEntradaBoton(nota.id);
                                                }
                                            }}
                                            onPointerUp={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                manejarSalidaBoton(nota.id);
                                            }}
                                            onPointerLeave={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                manejarSalidaBoton(nota.id);
                                            }}
                                        >
                                            <div className="brillo-pito"></div>
                                            <div className="info-nota">
                                                <span className="nota-etiqueta">{nota.nombre}</span>
                                                <span className="tecla-computador">{letraTeclado}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>

            {/* 🌬️ INDICADOR DE FUELLE INTERACTIVO */}
            <div
                className={`indicador-fuelle ${logica.direccion}`}
                onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    logica.setDireccion('empujar');
                }}
                onPointerUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    logica.setDireccion('halar');
                }}
                onPointerLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    logica.setDireccion('halar');
                }}
                style={{ cursor: 'pointer', userSelect: 'none', touchAction: 'none' }}
            >
                <div className="fuelle-status">
                    {logica.direccion === 'halar' ? 'HALAR (ABRIENDO)' : 'EMPUJAR (CERRANDO)'}
                </div>
                <div className="fuelle-ayuda">MANTÉN PRESIONADO AQUÍ PARA CAMBIAR DIRECCIÓN</div>
            </div>
        </div>
    );
};


export default SimuladorApp;
