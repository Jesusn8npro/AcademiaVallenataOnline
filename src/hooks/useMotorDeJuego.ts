import { useState, useCallback, useRef } from 'react';

// Interfaces
export interface NotaJuego {
    id: string; // ID único para el juego
    nota_id: string; // ID del botón (ej: '1-1-halar')
    tiempo_ms: number;
    duracion_ms: number;
    fuelle: 'halar' | 'empujar';
    nombre: string;
    procesada: boolean;
    tocadaPorUsuario: boolean;
    tiempoTocada?: number;
    precision?: number;
    puntuacion?: TipoPuntuacion;
}

export type TipoPuntuacion = 'Perfect' | 'Good' | 'Offbeat' | 'Miss';

export interface EstadoJuego {
    puntuacion: number;
    combo: number;
    comboMaximo: number;
    salud: number;
    precision: number;
    notasTocadas: number;
    notasCorrectas: number;
    marcas: {
        perfect: number;
        good: number;
        offbeat: number;
        miss: number;
    };
    ultimoFeedback: {
        tipo: TipoPuntuacion;
        combo: number;
        timestamp: number;
    } | null;
}

// Configuración (Guitar Hero Logic)
export const CONFIG_JUEGO = {
    VENTANA_PERFECT: 50,    // ±50ms
    VENTANA_GOOD: 100,      // ±100ms
    VENTANA_OFFBEAT: 150,   // ±150ms
    VENTANA_MISS: 200,      // ±200ms

    PUNTOS_PERFECT: 300,
    PUNTOS_GOOD: 200,
    PUNTOS_OFFBEAT: 100,
    PUNTOS_MISS: 0,

    SALUD_INICIAL: 100,
    SALUD_GANADA_PERFECT: 2,
    SALUD_GANADA_GOOD: 1,
    SALUD_PERDIDA_OFFBEAT: 5,
    SALUD_PERDIDA_MISS: 10,

    PRECISION_PERFECT: 100,
    PRECISION_GOOD: 85,
    PRECISION_OFFBEAT: 60,
    PRECISION_MISS: 0,

    MARGEN_BUSQUEDA: 300,
};

const ESTADO_INICIAL: EstadoJuego = {
    puntuacion: 0,
    combo: 0,
    comboMaximo: 0,
    salud: CONFIG_JUEGO.SALUD_INICIAL,
    precision: 100,
    notasTocadas: 0,
    notasCorrectas: 0,
    marcas: { perfect: 0, good: 0, offbeat: 0, miss: 0 },
    ultimoFeedback: null
};

export const useMotorDeJuego = () => {
    const [estado, setEstado] = useState<EstadoJuego>(ESTADO_INICIAL);
    const notasPendientesRef = useRef<NotaJuego[]>([]);

    // Inicializar el juego con una lista de notas (canción)
    const inicializarJuego = useCallback((notasCancion: any[]) => {
        // Convertir formato de canción a NotaJuego
        const notasProcesadas: NotaJuego[] = notasCancion.map((nota, index) => ({
            id: `nota-${index}`,
            nota_id: nota.nota_id || nota.idBoton || `nota-${index}`,
            tiempo_ms: nota.timestamp_ms || Math.floor((nota.tiempo || 0) * 1000),
            duracion_ms: nota.duracion_ms || Math.floor((nota.duracion || 0.2) * 1000),
            fuelle: nota.fuelle || nota.direccion || 'halar',
            nombre: nota.nombre || nota.nota_id || 'Nota',
            procesada: false,
            tocadaPorUsuario: false
        })).sort((a, b) => a.tiempo_ms - b.tiempo_ms);

        notasPendientesRef.current = notasProcesadas;
        setEstado(ESTADO_INICIAL);
        console.log("🎸 Motor de Juego Inicializado con", notasProcesadas.length, "notas.");
    }, []);

    // Procesar input del usuario (tecla/botón presionado)
    const procesarInteraccion = useCallback((notaId: string, tiempoActual: number): TipoPuntuacion | null => {
        // Buscar nota esperada en ventana de tiempo
        const notaIndex = notasPendientesRef.current.findIndex(nota => {
            if (nota.procesada) return false;
            if (Math.abs(nota.tiempo_ms - tiempoActual) <= CONFIG_JUEGO.MARGEN_BUSQUEDA) {
                // Verificar coincidencia exacta de ID
                return nota.nota_id === notaId;
            }
            return false;
        });

        if (notaIndex !== -1) {
            const nota = notasPendientesRef.current[notaIndex];
            const diferencia = Math.abs(nota.tiempo_ms - tiempoActual);

            // Determinar puntuación
            let tipo: TipoPuntuacion = 'Miss';
            if (diferencia <= CONFIG_JUEGO.VENTANA_PERFECT) tipo = 'Perfect';
            else if (diferencia <= CONFIG_JUEGO.VENTANA_GOOD) tipo = 'Good';
            else if (diferencia <= CONFIG_JUEGO.VENTANA_OFFBEAT) tipo = 'Offbeat';

            // Marcar como procesada
            notasPendientesRef.current[notaIndex].procesada = true;

            actualizarEstado(tipo);
            return tipo;
        } else {
            // Nota tocada cuando no debía (opcional: penalizar)
            // actualizarEstado('Miss'); // Descomentar para modo estricto
            return null;
        }
    }, []);

    // Loop de mantenimiento (detectar Misses por tiempo pasados)
    const verificarMisses = useCallback((tiempoActual: number) => {
        let huboCambios = false;
        let missesCount = 0;

        notasPendientesRef.current.forEach(nota => {
            if (!nota.procesada && (tiempoActual > nota.tiempo_ms + CONFIG_JUEGO.VENTANA_MISS)) {
                nota.procesada = true;
                missesCount++;
                huboCambios = true;
            }
        });

        if (huboCambios) {
            for (let i = 0; i < missesCount; i++) {
                actualizarEstado('Miss');
            }
        }
    }, []);

    // Función interna para actualizar el estado inmutablemente
    const actualizarEstado = (tipo: TipoPuntuacion) => {
        setEstado(prev => {
            const nuevo = { ...prev };

            // Actualizar contadores
            nuevo.notasTocadas++;
            nuevo.marcas[tipo.toLowerCase() as keyof typeof nuevo.marcas]++;

            // Combo
            if (tipo === 'Miss' || tipo === 'Offbeat') {
                nuevo.combo = 0;
            } else {
                nuevo.combo++;
                nuevo.notasCorrectas++;
                if (nuevo.combo > nuevo.comboMaximo) nuevo.comboMaximo = nuevo.combo;
            }

            // Puntos
            let puntosBase = 0;
            switch (tipo) {
                case 'Perfect': puntosBase = CONFIG_JUEGO.PUNTOS_PERFECT; break;
                case 'Good': puntosBase = CONFIG_JUEGO.PUNTOS_GOOD; break;
                case 'Offbeat': puntosBase = CONFIG_JUEGO.PUNTOS_OFFBEAT; break;
                case 'Miss': puntosBase = CONFIG_JUEGO.PUNTOS_MISS; break;
            }

            const multiplicador = 1 + (Math.min(nuevo.combo, 50) * 0.1); // Cap multiplicador
            nuevo.puntuacion += Math.floor(puntosBase * multiplicador);

            // Salud
            if (tipo === 'Miss') nuevo.salud = Math.max(0, nuevo.salud - CONFIG_JUEGO.SALUD_PERDIDA_MISS);
            else if (tipo === 'Perfect') nuevo.salud = Math.min(100, nuevo.salud + CONFIG_JUEGO.SALUD_GANADA_PERFECT);

            // Feedback Visual
            nuevo.ultimoFeedback = {
                tipo,
                combo: nuevo.combo,
                timestamp: Date.now()
            };

            return nuevo;
        });
    };

    const reiniciarJuego = useCallback(() => {
        setEstado(ESTADO_INICIAL);
        notasPendientesRef.current = [];
    }, []);

    return {
        estado,
        inicializarJuego,
        procesarInteraccion,
        verificarMisses,
        reiniciarJuego
    };
};
