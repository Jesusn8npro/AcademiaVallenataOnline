import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gamepad2, Crown, GraduationCap, Trophy, Users, Smartphone, ArrowRight,
} from 'lucide-react';
import './BannerEcosistemaHero.css';

// Carrusel rotativo de gatillos de venta del ecosistema Acordeón HERO /
// Pro MAX. Reemplaza el ad estático del 3rd-party que estaba antes en la
// barra de herramientas del SimuladorApp. Cada mensaje cambia cada 5s,
// click en cualquier parte navega al CTA. Algunos mensajes se filtran
// por contexto (ej. "Agregá a tu pantalla" solo si es mobile).

interface MensajeBanner {
    id: string;
    icono: React.ReactNode;
    titulo: string;
    descripcion: string;
    cta: string;
    ruta?: string;
    accion?: () => void;
    /** Acento de color para el gradiente de fondo + glow del icono. */
    acento: 'hero' | 'plus' | 'cursos' | 'ranking' | 'comunidad' | 'app';
    /** Si está definido, solo se muestra cuando la condición es true. */
    soloSi?: () => boolean;
}

const esMobile = () =>
    typeof window !== 'undefined' &&
    (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
     ('ontouchstart' in window && window.innerWidth < 1024));

// Detecta si la app ya está instalada como PWA (display-mode: standalone).
// Si lo está, no tiene sentido mostrar el banner de "agregar a tu pantalla".
const esPwaInstalada = () =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
     (navigator as any).standalone === true);

const MENSAJES_BASE: MensajeBanner[] = [
    {
        id: 'hero',
        icono: <Gamepad2 size={20} />,
        titulo: 'Acordeón HERO',
        descripcion: 'Juega notas en cascada · gana XP y monedas',
        cta: 'JUGAR',
        ruta: '/acordeon-pro-max',
        acento: 'hero',
    },
    {
        id: 'plus',
        icono: <Crown size={20} />,
        titulo: 'Hazte Plus',
        descripcion: 'Todas las canciones · sin anuncios · soporte 24/7',
        cta: 'VER PLANES',
        ruta: '/paquetes',
        acento: 'plus',
    },
    {
        id: 'cursos',
        icono: <GraduationCap size={20} />,
        titulo: 'Aprende desde cero',
        descripcion: 'Tutoriales paso a paso de los mejores acordeoneros',
        cta: 'VER CURSOS',
        ruta: '/tutoriales-de-acordeon',
        acento: 'cursos',
    },
    {
        id: 'ranking',
        icono: <Trophy size={20} />,
        titulo: 'Compite en el Ranking',
        descripcion: 'Sube posiciones tocando canciones reales',
        cta: 'VER RANKING',
        ruta: '/ranking',
        acento: 'ranking',
    },
    {
        id: 'comunidad',
        icono: <Users size={20} />,
        titulo: '+5,000 acordeoneros activos',
        descripcion: 'Comparte avances, recibe feedback, hacé amigos',
        cta: 'UNIRTE',
        ruta: '/comunidad',
        acento: 'comunidad',
    },
    {
        id: 'pwa',
        icono: <Smartphone size={20} />,
        titulo: 'Agrégalo a tu pantalla',
        descripcion: 'Acceso 1-tap · sin barra del navegador · pantalla completa',
        cta: 'CÓMO HACERLO',
        accion: () => {
            const esIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            const mensaje = esIos
                ? 'En Safari: tocá el botón Compartir (⬆️) y luego "Agregar a pantalla de inicio".'
                : 'En Chrome: menú (⋮) → "Instalar app" o "Agregar a pantalla de inicio".';
            alert(mensaje);
        },
        acento: 'app',
        soloSi: () => esMobile() && !esPwaInstalada(),
    },
];

const INTERVALO_MS = 5000;

const BannerEcosistemaHero: React.FC = () => {
    const navigate = useNavigate();
    const [indice, setIndice] = useState(0);
    const [pausado, setPausado] = useState(false);

    // Filtramos los mensajes que no aplican al contexto actual (ej. PWA si
    // ya está instalada o no es mobile).
    const mensajes = useMemo(
        () => MENSAJES_BASE.filter((m) => !m.soloSi || m.soloSi()),
        []
    );

    useEffect(() => {
        if (mensajes.length <= 1 || pausado) return;
        const id = setInterval(() => {
            setIndice((i) => (i + 1) % mensajes.length);
        }, INTERVALO_MS);
        return () => clearInterval(id);
    }, [mensajes.length, pausado]);

    if (mensajes.length === 0) return null;
    const actual = mensajes[indice];

    const handleClick = () => {
        if (actual.accion) actual.accion();
        else if (actual.ruta) navigate(actual.ruta);
    };

    return (
        <button
            type="button"
            className={`bhe-banner bhe-acento-${actual.acento}`}
            onClick={handleClick}
            onPointerEnter={() => setPausado(true)}
            onPointerLeave={() => setPausado(false)}
            aria-label={`${actual.titulo} — ${actual.cta}`}
        >
            <div className="bhe-icono" aria-hidden="true">{actual.icono}</div>
            <div className="bhe-info">
                <h4 className="bhe-titulo">{actual.titulo}</h4>
                <p className="bhe-desc">{actual.descripcion}</p>
            </div>
            <div className="bhe-cta">
                <span>{actual.cta}</span>
                <ArrowRight size={14} />
            </div>
            {/* Indicadores (dots) — solo si hay más de 1 mensaje */}
            {mensajes.length > 1 && (
                <div className="bhe-dots" aria-hidden="true">
                    {mensajes.map((_, i) => (
                        <span
                            key={i}
                            className={`bhe-dot ${i === indice ? 'activo' : ''}`}
                        />
                    ))}
                </div>
            )}
        </button>
    );
};

export default BannerEcosistemaHero;
