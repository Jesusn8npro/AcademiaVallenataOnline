import React, { useEffect, useRef, useState } from 'react';
import {
    Volume2,
    Sliders,
    MessageCircle,
    HelpCircle,
    Settings,
    X,
    RotateCcw,
    ChevronUp,
    ArrowLeftRight,
    ArrowUpDown,
    Crown
} from 'lucide-react';
import './MenuOpciones.css';

interface MenuOpcionesProps {
    visible: boolean;
    onCerrar: () => void;
    botonRef?: React.RefObject<HTMLDivElement>;
    onAbrirContacto?: () => void;
}

const ControlSliderCSS: React.FC<{
    label: string,
    variable: string,
    icon: React.ReactNode,
    min?: number,
    max?: number
}> = ({ label, variable, icon, min = 0, max = 15 }) => {
    const [valor, setValor] = useState(0);

    // 🔄 LEER ÚNICAMENTE DEL CSS - SIN SOBRESCRITURAS
    useEffect(() => {
        const style = getComputedStyle(document.documentElement);
        const current = style.getPropertyValue(variable).trim();
        if (current) setValor(parseFloat(current));
    }, [variable]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setValor(v);
        // ✅ SOLO para preview temporal - SIN localStorage
        document.documentElement.style.setProperty(variable, `${v}vh`);
    };

    return (
        <div className="fila-ajuste-diseno">
            <div className="icono-diseno-label">{icon}</div>
            <div className="info-slider-diseno">
                <span className="label-slider-premium">{label}</span>
                <input
                    type="range"
                    min={min} max={max} step="0.1"
                    value={valor}
                    onChange={handleChange}
                    className="input-range-premium"
                />
            </div>
        </div>
    );
};

const MenuOpciones: React.FC<MenuOpcionesProps> = ({
    visible, onCerrar, botonRef, onAbrirContacto
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [estilo, setEstilo] = useState<React.CSSProperties>({ opacity: 0 });
    const [ladoFlecha, setLadoFlecha] = useState<'derecha' | 'izquierda'>('derecha');
    const [vistaActual, setVistaActual] = useState<'principal' | 'diseno'>('principal');
    const [alejarIOS, setAlejarIOS] = useState(false);

    useEffect(() => {
        if (!visible) setVistaActual('principal');
    }, [visible]);

    const toggleIOS = () => {
        const nuevo = !alejarIOS;
        setAlejarIOS(nuevo);
        document.documentElement.style.setProperty('--offset-ios', nuevo ? '10px' : '0px');
    };

    useEffect(() => {
        if (visible && botonRef?.current) {
            const calcularPosicion = () => {
                const botonRect = botonRef.current!.getBoundingClientRect();
                const menuWidth = 280; // Más compacto
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                let left = 0;
                let lado: 'derecha' | 'izquierda' = 'derecha';

                if (botonRect.left > windowWidth / 2) {
                    left = botonRect.left - menuWidth - 10;
                    lado = 'derecha';
                } else {
                    left = botonRect.right + 10;
                    lado = 'izquierda';
                }

                // Ajuste de altura para que no se salga
                let top = botonRect.top + (botonRect.height / 2) - 150; 
                if (top < 10) top = 10;
                
                const menuEstimaHeight = vistaActual === 'diseno' ? 380 : 350;
                if (top + menuEstimaHeight > windowHeight - 10) {
                    top = windowHeight - menuEstimaHeight - 10;
                }

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

            calcularPosicion();
            window.addEventListener('resize', calcularPosicion);
            return () => window.removeEventListener('resize', calcularPosicion);
        }
    }, [visible, botonRef, vistaActual]);

    if (!visible) return null;

    const restaurarTodo = () => {
        // ✅ RESTAURAR DESDE CSS (:root) - NO HARDCODED
        // Los valores se restauran a lo que está en SimuladorApp.css
        const style = getComputedStyle(document.documentElement);
        const cssValues = {
            '--pitos-dist-h': style.getPropertyValue('--pitos-dist-h').trim(),
            '--pitos-dist-v': style.getPropertyValue('--pitos-dist-v').trim(),
            '--bajos-dist-h': style.getPropertyValue('--bajos-dist-h').trim(),
            '--bajos-dist-v': style.getPropertyValue('--bajos-dist-v').trim(),
            '--offset-ios': '0px'
        };

        Object.entries(cssValues).forEach(([variable, valor]) => {
            if (valor) document.documentElement.style.removeProperty(variable);
        });

        setAlejarIOS(false);
    };

    return (
        <>
            <div className="menu-opciones-overlay" onClick={onCerrar}></div>
            <div
                ref={menuRef}
                className={`menu-opciones-contenedor flecha-${ladoFlecha} compacto`}
                style={estilo}
            >
                <div className="menu-opciones-scrollable">
                    {vistaActual === 'principal' ? (
                        <>
                            <div className="menu-redes-superior">
                                <button className="btn-social discord">Discord</button>
                                <button className="btn-social tiktok">TikTok</button>
                            </div>

                            <div className="menu-opciones-lista">
                                <MenuItem icon={<Volume2 />} text="Ajustes del fuelle" />
                                <MenuItem icon={<Sliders />} text="Tamaños, Posiciones y Diseño" onClick={() => setVistaActual('diseno')} />
                                <MenuItem icon={<MessageCircle />} text="Contáctanos" onClick={onAbrirContacto} />
                                <MenuItem icon={<HelpCircle />} text="Guía del usuario" />
                                <MenuItem icon={<Settings />} text="Configuraciones" />
                            </div>

                            <button className="btn-final-premium">
                                <div className="badge-crown"><Crown size={12} fill="currentColor" /></div>
                                <span>DESBLOQUEA TODAS LAS FUNCIONES</span>
                            </button>
                        </>
                    ) : (
                        <div className="panel-diseno-premium">
                            <div className="cabecera-diseno-compacta">
                                <button className="btn-mini-restaurar" onClick={restaurarTodo}>Restaurar</button>
                                <span className="titulo-diseno-mini">Diseño</span>
                                <button className="btn-mini-cerrar" onClick={() => setVistaActual('principal')}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="seccion-ajuste-mini">
                                <div className="label-seccion-mini">
                                    <span>CONFIG. TECLADO</span>
                                    <RotateCcw size={14} className="icon-res-mini" />
                                </div>
                                <div className="item-mini-switch" onClick={toggleIOS}>
                                    <ChevronUp size={16} />
                                    <span>Alejar de barra iOS</span>
                                    <div className={`mini-switch ${alejarIOS ? 'on' : ''}`}><div className="dot"></div></div>
                                </div>
                                <ControlSliderCSS label="Distancia Horizontal" variable="--pitos-dist-h" icon={<ArrowLeftRight size={18} />} />
                                <ControlSliderCSS label="Distancia Vertical" variable="--pitos-dist-v" icon={<ArrowUpDown size={18} />} />
                            </div>

                            <div className="seccion-ajuste-mini">
                                <div className="label-seccion-mini">
                                    <span>CONFIG. BAJOS</span>
                                    <RotateCcw size={14} className="icon-res-mini" />
                                </div>
                                <ControlSliderCSS label="Distancia Horizontal" variable="--bajos-dist-h" icon={<ArrowLeftRight size={18} />} />
                                <ControlSliderCSS label="Distancia Vertical" variable="--bajos-dist-v" icon={<ArrowUpDown size={18} />} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const MenuItem: React.FC<{ icon: React.ReactNode, text: string, onClick?: () => void }> = ({ icon, text, onClick }) => (
    <div className="menu-item-premium" onClick={onClick}>
        <div className="menu-item-icon-box">{icon}</div>
        <span className="menu-item-text">{text}</span>
    </div>
);

export default MenuOpciones;
