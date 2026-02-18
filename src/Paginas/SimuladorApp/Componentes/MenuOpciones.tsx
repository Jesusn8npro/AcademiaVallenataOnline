import React, { useEffect, useRef, useState } from 'react';
import {
    Volume2,
    Sliders,
    MessageCircle,
    HelpCircle,
    Settings,
    Star,
    Gift,
    X,
    RotateCcw,
    ChevronUp,
    ChevronDown,
    ArrowLeftRight,
    ArrowUpDown
} from 'lucide-react';
import './MenuOpciones.css';

interface MenuOpcionesProps {
    visible: boolean;
    onCerrar: () => void;
    botonRef?: React.RefObject<HTMLDivElement>;
    distanciaH: number;
    setDistanciaH: React.Dispatch<React.SetStateAction<number>>;
    distanciaV: number;
    setDistanciaV: React.Dispatch<React.SetStateAction<number>>;
    distanciaHBajos: number;
    setDistanciaHBajos: React.Dispatch<React.SetStateAction<number>>;
    distanciaVBajos: number;
    setDistanciaVBajos: React.Dispatch<React.SetStateAction<number>>;
    alejarIOS: boolean;
    setAlejarIOS: React.Dispatch<React.SetStateAction<boolean>>;
    onAbrirContacto?: () => void;
}

const MenuOpciones: React.FC<MenuOpcionesProps> = ({
    visible, onCerrar, botonRef,
    distanciaH, setDistanciaH,
    distanciaV, setDistanciaV,
    distanciaHBajos, setDistanciaHBajos,
    distanciaVBajos, setDistanciaVBajos,
    alejarIOS, setAlejarIOS,
    onAbrirContacto
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [estilo, setEstilo] = useState<React.CSSProperties>({ opacity: 0 });
    const [ladoFlecha, setLadoFlecha] = useState<'derecha' | 'izquierda'>('derecha');
    const [vistaActual, setVistaActual] = useState<'principal' | 'diseno'>('principal');

    useEffect(() => {
        if (!visible) {
            // Cuando se cierra el modal, reseteamos a la vista principal
            // para que la próxima vez que se abra, no aparezca en diseño
            setVistaActual('principal');
        }
    }, [visible]);

    useEffect(() => {
        if (visible && botonRef?.current) {
            const calcularPosicion = () => {
                const botonRect = botonRef.current!.getBoundingClientRect();
                const menuWidth = vistaActual === 'diseno' ? 320 : 250;
                const menuHeight = menuRef.current?.offsetHeight || (vistaActual === 'diseno' ? 450 : 400);
                const windowWidth = window.innerWidth;

                let left = 0;
                let lado: 'derecha' | 'izquierda' = 'derecha';

                if (botonRect.left > windowWidth / 2) {
                    left = botonRect.left - menuWidth - 15;
                    lado = 'derecha';
                } else {
                    left = botonRect.right + 15;
                    lado = 'izquierda';
                }

                let top = botonRect.top + (botonRect.height / 2) - (menuHeight / 2);
                if (top < 10) top = 10;
                if (top + menuHeight > window.innerHeight - 10) {
                    top = window.innerHeight - menuHeight - 10;
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

            const timer = setTimeout(calcularPosicion, 0);
            window.addEventListener('resize', calcularPosicion);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', calcularPosicion);
            };
        }
    }, [visible, botonRef, vistaActual]);

    if (!visible) return null;

    const restaurarTodo = () => {
        setDistanciaH(2.5);
        setDistanciaV(0.8);
        setDistanciaHBajos(2.5);
        setDistanciaVBajos(0.8);
        setAlejarIOS(false);
    };

    return (
        <>
            <div className="menu-opciones-overlay" onClick={onCerrar}></div>
            <div
                ref={menuRef}
                className={`menu-opciones-contenedor flecha-${ladoFlecha} ${vistaActual === 'diseno' ? 'ancho-diseno' : ''}`}
                style={estilo}
            >
                {vistaActual === 'principal' ? (
                    <>
                        <div className="menu-banner-superior">
                            <Gift size={20} className="icono-regalo" />
                            <span>¡Recomiende y gane!</span>
                        </div>

                        <div className="menu-opciones-lista">
                            <div className="opcion-menu">
                                <div className="opcion-icono"><Volume2 size={24} /></div>
                                <span className="opcion-texto">Ajustes del fuelle</span>
                            </div>
                            <div className="opcion-menu" onClick={() => setVistaActual('diseno')}>
                                <div className="opcion-icono"><Sliders size={24} /></div>
                                <span className="opcion-texto">Tamaños, Posiciones y Diseño</span>
                            </div>
                            <div className="opcion-menu" onClick={onAbrirContacto}>
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
                    </>
                ) : (
                    <div className="panel-ajustes-diseno">
                        {/* Cabecera del panel de diseño */}
                        <div className="cabecera-panel">
                            <button className="btn-restaurar" onClick={restaurarTodo}>
                                <span>Restaurar Todo</span>
                            </button>
                            <h3 className="titulo-panel">Opciones de Diseño</h3>
                            <button className="btn-cerrar-panel" onClick={onCerrar}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Sección Config Teclado */}
                        <div className="seccion-ajuste">
                            <div className="seccion-titulo-fila">
                                <span className="label-seccion">CONFIG. DEL TECLADO</span>
                                <button className="btn-reset-seccion" onClick={() => { setDistanciaH(2.5); setDistanciaV(0.8); }}>
                                    <RotateCcw size={14} />
                                </button>
                            </div>

                            <div className="fila-ajuste toggle-ios">
                                <ChevronUp size={20} className="icono-ajuste" />
                                <div className="texto-con-info">
                                    <span>AAleja el teclado de la barra inferior de iOS</span>
                                </div>
                                <div className={`ios-toggle ${alejarIOS ? 'activo' : ''}`} onClick={() => setAlejarIOS(!alejarIOS)}>
                                    <div className="toggle-circulo"></div>
                                </div>
                                <HelpCircle size={16} className="icono-ayuda-mini" />
                            </div>

                            <div className="fila-ajuste slider-ajuste">
                                <ArrowLeftRight size={20} className="icono-ajuste" />
                                <div className="control-slider">
                                    <span className="label-slider">Distancia Horizontal</span>
                                    <input
                                        type="range"
                                        min="-5" max="15" step="0.1"
                                        value={distanciaH}
                                        onChange={(e) => setDistanciaH(parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="fila-ajuste slider-ajuste">
                                <ArrowUpDown size={20} className="icono-ajuste" />
                                <div className="control-slider">
                                    <span className="label-slider">Distancia Vertical</span>
                                    <input
                                        type="range"
                                        min="-5" max="15" step="0.1"
                                        value={distanciaV}
                                        onChange={(e) => setDistanciaV(parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección Config Bajos */}
                        <div className="seccion-ajuste">
                            <div className="seccion-titulo-fila">
                                <span className="label-seccion">CONFIG. DE BAJOS</span>
                                <button className="btn-reset-seccion" onClick={() => { setDistanciaHBajos(2.5); setDistanciaVBajos(0.8); }}>
                                    <RotateCcw size={14} />
                                </button>
                            </div>

                            <div className="fila-ajuste slider-ajuste">
                                <ArrowLeftRight size={20} className="icono-ajuste" />
                                <div className="control-slider">
                                    <span className="label-slider">Distancia Horizontal</span>
                                    <input
                                        type="range"
                                        min="-5" max="15" step="0.1"
                                        value={distanciaHBajos}
                                        onChange={(e) => setDistanciaHBajos(parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="fila-ajuste slider-ajuste">
                                <ArrowUpDown size={20} className="icono-ajuste" />
                                <div className="control-slider">
                                    <span className="label-slider">Distancia Vertical</span>
                                    <input
                                        type="range"
                                        min="-5" max="15" step="0.1"
                                        value={distanciaVBajos}
                                        onChange={(e) => setDistanciaVBajos(parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default MenuOpciones;
