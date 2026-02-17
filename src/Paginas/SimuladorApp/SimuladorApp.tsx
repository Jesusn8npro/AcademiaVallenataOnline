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

    // 🛡️ PERSISTENCIA DE SONIDO AL CAMBIAR EL FUELLE
    useEffect(() => {
        // Cuando cambie la dirección (ej: de halar a empujar), 
        // si hay dedos puestos en botones físicos, actualizamos los sonidos
        botonesFisicosPresionados.current.forEach(fisicoId => {
            const [fila, col] = fisicoId.split('-');
            const oldDir = logica.direccion === 'halar' ? 'empujar' : 'halar';
            const oldId = `${fila}-${col}-${oldDir}`;
            const newId = `${fila}-${col}-${logica.direccion}`;

            // Detenemos el anterior y activamos el nuevo
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

    useEffect(() => {
        document.body.classList.add('vista-premium-activa');
        window.scrollTo(0, 0);
        return () => {
            document.body.classList.remove('vista-premium-activa');
        };
    }, []);

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
            className="simulador-app-root"
            onPointerDown={() => setIsPointerDown(true)}
            onPointerUp={() => {
                setIsPointerDown(false);
                // Si el usuario levanta todos los dedos, limpiamos
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
                                                manejarEntradaBoton(nota.id);
                                            }}
                                            onPointerEnter={() => {
                                                if (isPointerDown) manejarEntradaBoton(nota.id);
                                            }}
                                            onPointerUp={() => manejarSalidaBoton(nota.id)}
                                            onPointerLeave={() => {
                                                // En glissando, si salimos del botón pero seguimos con el puntero abajo, quitamos la nota
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

            {/* 🌬️ INDICADOR DE FUELLE INTERACTIVO (SIMULA TECLA Q) */}
            <div
                className={`indicador-fuelle ${logica.direccion}`}
                onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    logica.setDireccion('empujar');
                }}
                onPointerUp={(e) => {
                    e.preventDefault();
                    logica.setDireccion('halar');
                }}
                onPointerLeave={() => logica.setDireccion('halar')}
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
