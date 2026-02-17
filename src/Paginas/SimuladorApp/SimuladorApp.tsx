import React, { useEffect, useState, useRef } from 'react';
import './SimuladorApp.css';

// 🪗 IMPORTAMOS LA LÓGICA MAESTRA
import { useLogicaAcordeon } from '../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import { mapaTeclas } from '../SimuladorDeAcordeon/mapaTecladoYFrecuencias';

const SimuladorApp: React.FC = () => {
    const [isPointerDown, setIsPointerDown] = useState(false);

    // Usamos el hook maestro
    const logica = useLogicaAcordeon({
        direccion: 'halar'
    });

    const ACORDEON_ORIGINAL_ID = '4e9f2a94-21c0-4029-872e-7cb1c314af69';
    const TONALIDAD_5_LETRAS = 'GCF';

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

    // 👆 LÓGICA DE DESLIZAMIENTO (GLISSANDO)
    const manejarPointerEnter = (id: string) => {
        if (isPointerDown) {
            logica.actualizarBotonActivo(id, 'add');
        }
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
                logica.limpiarTodasLasNotas();
            }}
            onPointerLeave={() => {
                setIsPointerDown(false);
                logica.limpiarTodasLasNotas();
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
                                                logica.actualizarBotonActivo(nota.id, 'add');
                                            }}
                                            onPointerEnter={() => manejarPointerEnter(nota.id)}
                                            onPointerUp={() => logica.actualizarBotonActivo(nota.id, 'remove')}
                                            onPointerLeave={() => logica.actualizarBotonActivo(nota.id, 'remove')}
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
                onPointerUp={() => logica.setDireccion('halar')}
                onPointerLeave={() => logica.setDireccion('halar')}
            >
                <div className="fuelle-status">
                    {logica.direccion === 'halar' ? 'HALAR (ABRIENDO)' : 'EMPUJAR (CERRANDO)'}
                </div>
                <div className="fuelle-ayuda">MANTÉN PRESIONADO AQUÍ O TECLA [Q]</div>
            </div>
        </div>
    );
};

export default SimuladorApp;
