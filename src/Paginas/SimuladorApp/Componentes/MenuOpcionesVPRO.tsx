import React from 'react';
import './MenuOpcionesVPRO.css';

interface MenuOpcionesVPROProps {
    estaAbierto: boolean;
    alCerrar: () => void;
}

/**
 * Componente del Menú de Opciones V-PRO.
 * Muestra las configuraciones avanzadas, redes sociales y soporte.
 */
const MenuOpcionesVPRO: React.FC<MenuOpcionesVPROProps> = ({ estaAbierto, alCerrar }) => {
    if (!estaAbierto) return null;

    return (
        <div className="menu-opciones-vpro-overlay" onClick={alCerrar}>
            <div className="menu-opciones-vpro-tarjeta" onClick={(e) => e.stopPropagation()}>

                {/* Banner Superior: Recomiende y gane */}
                <div className="menu-vpro-banner-promo">
                    <span className="icono-regalo">🎁</span>
                    <span className="texto-promo">¡Recomiende y gane!</span>
                </div>

                {/* Lista de Opciones Principales */}
                <div className="menu-vpro-lista">
                    <div className="menu-vpro-item">
                        <div className="menu-vpro-icono-box">
                            <span className="vpro-icon-fuelle"></span>
                        </div>
                        <span className="menu-vpro-texto">Ajustes del fuelle</span>
                    </div>

                    <div className="menu-vpro-item">
                        <div className="menu-vpro-icono-box">
                            <span className="vpro-icon-diseno"></span>
                        </div>
                        <span className="menu-vpro-texto">Tamaños, Posiciones y Diseño</span>
                    </div>

                    <div className="menu-vpro-item">
                        <div className="menu-vpro-icono-box">
                            <span className="vpro-icon-contacto"></span>
                        </div>
                        <span className="menu-vpro-texto">Contáctanos</span>
                    </div>

                    <div className="menu-vpro-item">
                        <div className="menu-vpro-icono-box">
                            <span className="vpro-icon-guia"></span>
                        </div>
                        <span className="menu-vpro-texto">Guía del usuario</span>
                    </div>

                    <div className="menu-vpro-item">
                        <div className="menu-vpro-icono-box">
                            <span className="vpro-icon-config"></span>
                        </div>
                        <span className="menu-vpro-texto">Configuraciones</span>
                    </div>
                </div>

                {/* Redes Sociales */}
                <div className="menu-vpro-redes">
                    <button className="btn-red-social discord">
                        <span className="vpro-icon-discord"></span>
                        Discord
                    </button>
                    <button className="btn-red-social tiktok">
                        <span className="vpro-icon-tiktok"></span>
                        TikTok
                    </button>
                </div>

                {/* Botón de Acción Principal: Desbloquear */}
                <button className="menu-vpro-btn-premium">
                    <span className="icono-corona">👑</span>
                    <div className="texto-premium-box">
                        <span className="texto-premium-linea-1">DESBLOQUEA TODAS LAS</span>
                        <span className="texto-premium-linea-2">FUNCIONES</span>
                    </div>
                </button>

            </div>
        </div>
    );
};

export default MenuOpcionesVPRO;
