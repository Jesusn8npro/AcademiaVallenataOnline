import React, { useEffect, useRef, useState } from 'react';
import AcordeonSimulador from './AcordeonSimulador';
// @ts-ignore
import bgAcordeon from './Acordeon PRO MAX.png';
import { useMotorDeJuego } from '../../hooks/useMotorDeJuego';
import TableroPuntos from '../../componentes/Simulador/TableroPuntos';

// Mock de una canción simple para pruebas (Escala básica)
const CANCION_PRUEBA = [
    { tiempo: 2.0, nota_id: '1-3-cerrando', duracion: 0.5 },
    { tiempo: 3.0, nota_id: '1-4-cerrando', duracion: 0.5 },
    { tiempo: 4.0, nota_id: '1-5-cerrando', duracion: 0.5 },
    { tiempo: 5.0, nota_id: '1-6-cerrando', duracion: 0.5 },
];

const SimuladorGaming: React.FC = () => {
    const { estado, inicializarJuego, procesarInteraccion, verificarMisses } = useMotorDeJuego();
    const [juegoIniciado, setJuegoIniciado] = useState(false);
    const requestRef = useRef<number>();
    const startTimeRef = useRef<number>(0);

    // Iniciar juego (Mock)
    useEffect(() => {
        // En un caso real, esto vendría de seleccionar una canción
        inicializarJuego([]); // Inicializar vacío primero
    }, [inicializarJuego]);

    const iniciarPartida = () => {
        setJuegoIniciado(true);
        inicializarJuego(CANCION_PRUEBA); // Cargar notas
        startTimeRef.current = Date.now();
        loopJuego();
    };

    const loopJuego = () => {
        if (!startTimeRef.current) return;

        const tiempoActual = Date.now() - startTimeRef.current;
        verificarMisses(tiempoActual);

        // Aquí iría la lógica para disparar las "Notas Voladoras" visuales hacia el acordeón
        // Por ahora nos concentramos en el motor matemático

        requestRef.current = requestAnimationFrame(loopJuego);
    };

    // Detener loop al desmontar
    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // Callback cuando el usuario toca una tecla
    const handleNotaPresionada = (data: { idBoton: string; nombre: string } | { id: string; tipo: string }) => {
        if (!juegoIniciado) return;

        const id = 'idBoton' in data ? data.idBoton : data.id;
        const tiempoActual = Date.now() - startTimeRef.current;

        // Traducir IDs del simulador a IDs de la canción si es necesario
        // El simulador envía '1-3-empujar' (cerrando) o '1-3-halar' (abriendo)
        // Normalizamos 'empujar' -> 'cerrando', 'halar' -> 'abriendo' para coincidir con mock
        let idNormalizado = id.replace('empujar', 'cerrando').replace('halar', 'abriendo');

        const resultado = procesarInteraccion(idNormalizado, tiempoActual);
        if (resultado) {
            console.log("🎯 Feedback:", resultado);
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', backgroundColor: '#111', overflow: 'hidden', position: 'relative' }}>

            {/* UI del Juego */}
            <TableroPuntos estado={estado} />

            {!juegoIniciado && (
                <div style={{
                    position: 'absolute',
                    zIndex: 200,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <button
                        onClick={iniciarPartida}
                        style={{
                            padding: '20px 40px',
                            fontSize: '2rem',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            boxShadow: '0 0 20px #22c55e'
                        }}
                    >
                        INICIAR PRUEBA
                    </button>
                    <p style={{ color: 'white', marginTop: '10px' }}>Presiona para probar el motor de puntuación</p>
                </div>
            )}

            <AcordeonSimulador
                direccion="halar"
                imagenFondo={bgAcordeon}
                deshabilitarInteraccion={false}
                onNotaPresionada={handleNotaPresionada}
            />
        </div>
    );
};

export default SimuladorGaming;
