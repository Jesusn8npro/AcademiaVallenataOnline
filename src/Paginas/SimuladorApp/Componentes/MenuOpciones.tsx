import React, { useEffect, useRef, useState } from 'react';
import {
    Volume2,
    Sliders,
    MessageCircle,
    HelpCircle,
    Settings,
    Star,
    Gift
} from 'lucide-react';
import './MenuOpciones.css';

interface MenuOpcionesProps {
    visible: boolean;
    onCerrar: () => void;
    botonRef?: React.RefObject<HTMLDivElement>;
}

/**
 * 🎯 MENÚ DE OPCIONES - Estilo Cassoto Premium
 * Posicionamiento LATERAL inteligente con flecha horizontal
 */
const MenuOpciones: React.FC<MenuOpcionesProps> = ({ visible, onCerrar, botonRef }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [estilo, setEstilo] = useState<React.CSSProperties>({ opacity: 0 });
    const [ladoFlecha, setLadoFlecha] = useState<'derecha' | 'izquierda'>('derecha');

    useEffect(() => {
        if (visible && botonRef?.current) {
            const calcularPosicion = () => {
                const botonRect = botonRef.current!.getBoundingClientRect();
                const menuWidth = 250;
                const menuHeight = menuRef.current?.offsetHeight || 400;
                const windowWidth = window.innerWidth;

                // 1. Decidir si va a la IZQUIERDA o DERECHA del botón
                let left = 0;
                let lado: 'derecha' | 'izquierda' = 'derecha';

                if (botonRect.left > windowWidth / 2) {
                    // Botón en la mitad derecha -> Menú a la IZQUIERDA
                    left = botonRect.left - menuWidth - 15;
                    lado = 'derecha'; // La flecha está en la derecha del menú
                } else {
                    // Botón en la mitad izquierda -> Menú a la DERECHA
                    left = botonRect.right + 15;
                    lado = 'izquierda'; // La flecha está en la izquierda del menú
                }

                // 2. Centrar verticalmente con el botón
                let top = botonRect.top + (botonRect.height / 2) - (menuHeight / 2);

                // Evitar que se salga por arriba o abajo
                if (top < 10) top = 10;
                if (top + menuHeight > window.innerHeight - 10) {
                    top = window.innerHeight - menuHeight - 10;
                }

                // 3. Posición de la flecha respecto al menú
                const flechaTop = botonRect.top + (botonRect.height / 2) - top;

                setLadoFlecha(lado);
                setEstilo({
                    top: `${top}px`,
                    left: `${left}px`,
                    opacity: 1,
                    visibility: 'visible',
                    '--flecha-top': `${flechaTop}px`
                } as React.CSSProperties);
            };

            // Pequeño delay para dejar que el DOM renderice y obtener offsetHeight
            const timer = setTimeout(calcularPosicion, 0);
            window.addEventListener('resize', calcularPosicion);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', calcularPosicion);
            };
        }
    }, [visible, botonRef]);

    if (!visible) return null;

    return (
        <>
            <div className="menu-opciones-overlay" onClick={onCerrar}></div>
            <div
                ref={menuRef}
                className={`menu-opciones-contenedor flecha-${ladoFlecha}`}
                style={estilo}
            >
                {/* Banner superior */}
                <div className="menu-banner-superior">
                    <Gift size={20} className="icono-regalo" />
                    <span>¡Recomiende y gane!</span>
                </div>

                <div className="menu-opciones-lista">
                    <div className="opcion-menu">
                        <div className="opcion-icono"><Volume2 size={24} /></div>
                        <span className="opcion-texto">Ajustes del fuelle</span>
                    </div>
                    <div className="opcion-menu">
                        <div className="opcion-icono"><Sliders size={24} /></div>
                        <span className="opcion-texto">Tamaños, Posiciones y Diseño</span>
                    </div>
                    <div className="opcion-menu">
                        <div className="opcion-icono"><MessageCircle size={24} /></div>
                        <span className="opcion-texto">Contáctanos</span>
                    </div>
                    <div className="opcion-menu">
                        <div className="opcion-icono"><HelpCircle size={24} /></div>
                        <span className="opcion-texto">Guía del usuario</span>
                    </div>
                    <div className="opcion-menu">
                        <div className="opcion-icono"><Settings size={24} /></div>
                        <span className="opcion-texto">Configuraciones</span>
                    </div>
                </div>

                <div className="menu-redes-sociales">
                    <button className="boton-red-social discord">Discord</button>
                    <button className="boton-red-social tiktok">TikTok</button>
                </div>

                <button className="boton-desbloquear">
                    <Star size={18} fill="currentColor" />
                    <span>DESBLOQUEA TODAS LAS FUNCIONES</span>
                </button>
            </div>
        </>
    );
};

export default MenuOpciones;
