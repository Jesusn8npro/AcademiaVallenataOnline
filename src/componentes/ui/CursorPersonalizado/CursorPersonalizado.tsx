import React, { useEffect, useState, useRef } from 'react';
import { GestorEfectosCursor } from './GestorEfectosCursor';
import { UtilidadesCursor } from './UtilidadesCursor';
import { audioManager, TipoEfectoUI } from '../../../servicios/AudioManager';
import './CursorPersonalizado.css';

const CursorPersonalizado: React.FC = () => {
    const [tipoContexto, setTipoContexto] = useState('normal');
    const [mostrarRipple, setMostrarRipple] = useState(false);
    const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);

    // Refs para evitar re-renders excesivos en loops de animación si fuera necesario
    // Pero usaremos state para lo reactivo básico.
    // Para performance en React, idealmente usaríamos refs para la posición DOM directa
    // pero useEffect con requestAnimationFrame es lo típico. 
    // Dado que GestorEfectosCursor ya hace throttling, usaremos state para simplicidad inicial.
    // Si hay lag, pasaremos a refs directos.

    const cursorRef = useRef<HTMLDivElement>(null);
    const anilloRef = useRef<HTMLDivElement>(null);
    const elementosYaSonaron = useRef<Set<HTMLElement>>(new Set());
    const elementoActualHover = useRef<HTMLElement | null>(null);

    // Variables de estilo dinámico
    const [estiloCursor, setEstiloCursor] = useState({
        escala: 1,
        opacidad: 0.8,
        color: 'var(--color-primary, #6366f1)'
    });

    useEffect(() => {
        const esDispositivoTactil = UtilidadesCursor.esDispositivoTactil();
        if (esDispositivoTactil) return;

        // Ocultar cursor nativo
        document.body.classList.add('cursor-personalizado-activo');
        setVisible(true);

        const obtenerTipoSonidoElemento = (elemento: HTMLElement): TipoEfectoUI => {
            if (elemento.classList.contains('menu-item')) return TipoEfectoUI.HOVER_NAVEGACION;
            if (elemento.classList.contains('leccion-item')) return TipoEfectoUI.SLIDE_1;
            if (elemento.classList.contains('modulo-header')) return TipoEfectoUI.SLIDE_2;
            if (elemento.classList.contains('tab-btn')) return TipoEfectoUI.POP;
            if (elemento.tagName === 'BUTTON' || elemento.classList.contains('btn') || elemento.classList.contains('boton')) return TipoEfectoUI.HOVER_SUTIL;
            if (elemento.tagName === 'A' || elemento.classList.contains('enlace')) return TipoEfectoUI.HOVER_NAVEGACION;
            return TipoEfectoUI.HOVER_SUTIL;
        };

        const manejarMovimiento = (x: number, y: number) => {
            if (cursorRef.current && anilloRef.current) {
                cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                // Anillo con un poco de retraso (lerp) seria ideal, pero por ahora directo para latencia baja
                anilloRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${estiloCursor.escala})`;
            }
        };

        const manejarCambioContexto = (contexto: string, _elemento?: HTMLElement) => {
            setTipoContexto(contexto);

            let nuevaEscala = 1;
            let nuevaOpacidad = 0.8;
            let nuevoColor = 'var(--color-primary, #6366f1)';

            switch (contexto) {
                case 'hover':
                    nuevaEscala = 2.2;
                    nuevaOpacidad = 0.9;
                    nuevoColor = 'var(--color-accent, #8b5cf6)'; // Violeta
                    break;
                case 'texto':
                    nuevaEscala = 1.1;
                    nuevaOpacidad = 0.7;
                    nuevoColor = 'var(--color-text, #374151)';
                    break;
                case 'presionado':
                    nuevaEscala = 0.6;
                    nuevaOpacidad = 1;
                    nuevoColor = 'var(--color-accent, #8b5cf6)';
                    break;
                default:
                    nuevaEscala = 1;
                    nuevaOpacidad = 0.8;
                    nuevoColor = 'var(--color-primary, #6366f1)';
            }

            // Actualizar refs directamente para estilos que cambian rápido
            if (anilloRef.current) {
                anilloRef.current.style.borderColor = nuevoColor;
                anilloRef.current.style.opacity = nuevaOpacidad.toString();
                // La escala se aplica en requestAnimationFrame o en el movimiento
                // Pero aquí actualizamos el state ref para el próximo movimiento
                setEstiloCursor({ escala: nuevaEscala, opacidad: nuevaOpacidad, color: nuevoColor });
            }
            if (cursorRef.current) {
                cursorRef.current.style.backgroundColor = nuevoColor;
            }
        };

        const manejarHover = (entrando: boolean, elemento?: HTMLElement) => {
            if (entrando && elemento) {
                const elementoPrincipal = UtilidadesCursor.encontrarElementoInteractivoPadre(elemento);
                if (elementoPrincipal) {
                    const tipoSonido = obtenerTipoSonidoElemento(elementoPrincipal);
                    if (!elementosYaSonaron.current.has(elementoPrincipal)) {
                        audioManager.reproducirEfectoUI(tipoSonido);
                        elementosYaSonaron.current.add(elementoPrincipal);
                    }
                    elementoActualHover.current = elementoPrincipal;
                }
            } else if (!entrando && elementoActualHover.current) {
                const elementoSalida = elemento;
                if (elementoSalida && elementoActualHover.current && !elementoActualHover.current.contains(elementoSalida)) {
                    if (elementoActualHover.current.classList.contains('menu-item')) {
                        setTimeout(() => {
                            if (elementoActualHover.current) elementosYaSonaron.current.delete(elementoActualHover.current);
                        }, 1000);
                    } else {
                        elementosYaSonaron.current.delete(elementoActualHover.current);
                    }
                    elementoActualHover.current = null;
                }
            }
        };

        const manejarClick = (x: number, y: number, elemento?: HTMLElement) => {
            setRipplePos({ x: x - 40, y: y - 40 });
            setMostrarRipple(true);
            setTimeout(() => setMostrarRipple(false), 600);

            // Sonidos
            if (elemento?.classList.contains('menu-item')) audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_BOTON);
            else if (elemento?.tagName === 'BUTTON') audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_BOTON);
            else if (elemento?.tagName === 'A') audioManager.reproducirEfectoUI(TipoEfectoUI.HOVER_NAVEGACION);
            else audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_GENERAL);
        };

        const gestor = new GestorEfectosCursor({
            onMovimiento: manejarMovimiento,
            onCambioContexto: manejarCambioContexto,
            onClick: manejarClick,
            onHover: manejarHover
        });

        gestor.iniciar();

        return () => {
            gestor.destruir();
            document.body.classList.remove('cursor-personalizado-activo');
            setVisible(false);
        };
    }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

    if (!visible) return null;

    return (
        <>
            <div ref={cursorRef} className="cursor-punto-central"></div>
            <div ref={anilloRef} className={`cursor-anillo-externo ${tipoContexto}`}></div>
            {mostrarRipple && (
                <div
                    className="cursor-ripple"
                    style={{ transform: `translate3d(${ripplePos.x}px, ${ripplePos.y}px, 0)` }}
                ></div>
            )}
        </>
    );
};

export default CursorPersonalizado;
