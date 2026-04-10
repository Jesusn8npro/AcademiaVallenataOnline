import React, { useState, useRef, useEffect } from 'react';
import './PestanasAdministracion.css';
import { type UsuarioActivo } from '../../../../servicios/actividadService';
import {
    Activity,
    MapPin,
    FileText,
    Package,
    PieChart,
    Users,
    CreditCard,
    MessageSquare,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import PestanaActividad from '../pestanas/PestanaActividad';
import PestanaGeolocalizacion from '../pestanas/PestanaGeolocalizacion';
import PestanaBlog from '../pestanas/PestanaBlog';
import PestanaPaquetes from '../pestanas/PestanaPaquetes';
import PestanaRetencion from '../pestanas/PestanaRetencion';
import PestanaUsuarios from '../pestanas/PestanaUsuarios';
import PestanaPagos from '../pestanas/PestanaPagos';
import PestanaComunicaciones from '../pestanas/PestanaComunicaciones';
import PestanaReportes from '../pestanas/PestanaReportes';
import PestanaConfiguracion from '../pestanas/PestanaConfiguracion';

interface Props {
    actividadTiempoReal: UsuarioActivo[];
    alumnosActivos: any[];
    estadisticasGenerales: any;
    onGestionarTodos: () => void;
}

const PestanasAdministracion: React.FC<Props> = ({
    actividadTiempoReal,
    alumnosActivos,
    estadisticasGenerales,
    onGestionarTodos
}) => {
    const [pestañaActiva, setPestañaActiva] = useState('actividad');
    const contenedorNavRef = useRef<HTMLDivElement>(null);
    const [puedeScrollIzquierda, setPuedeScrollIzquierda] = useState(false);
    const [puedeScrollDerecha, setPuedeScrollDerecha] = useState(false);

    // Configuración de pestañas
    const pestañas = [
        { label: 'Actividad', icon: <Activity />, id: 'actividad' },
        { label: 'Geolocalización', icon: <MapPin />, id: 'geolocalizacion' },
        { label: 'Blog & Contenido', icon: <FileText />, id: 'blog' },
        { label: 'Paquetes', icon: <Package />, id: 'paquetes' },
        { label: 'Retención', icon: <PieChart />, id: 'retencion' },
        { label: 'Usuarios', icon: <Users />, id: 'usuarios' },
        { label: 'Pagos', icon: <CreditCard />, id: 'pagos' },
        { label: 'Comunicaciones', icon: <MessageSquare />, id: 'comunicaciones' },
        { label: 'Reportes', icon: <BarChart3 />, id: 'reportes' },
        { label: 'Configuración', icon: <Settings />, id: 'configuracion' }
    ];

    const actualizarEstadoScroll = () => {
        if (!contenedorNavRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = contenedorNavRef.current;

        // Tolerancia de 1px para errores de redondeo
        setPuedeScrollIzquierda(scrollLeft > 1);
        setPuedeScrollDerecha(scrollLeft < scrollWidth - clientWidth - 1);
    };

    const scrollHorizontal = (direccion: 'izquierda' | 'derecha') => {
        if (!contenedorNavRef.current) return;
        const cantidadScroll = contenedorNavRef.current.clientWidth * 0.7;
        const nuevoScrollLeft =
            direccion === 'izquierda'
                ? contenedorNavRef.current.scrollLeft - cantidadScroll
                : contenedorNavRef.current.scrollLeft + cantidadScroll;

        contenedorNavRef.current.scrollTo({
            left: nuevoScrollLeft,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        setTimeout(actualizarEstadoScroll, 100);
        window.addEventListener('resize', actualizarEstadoScroll);
        return () => window.removeEventListener('resize', actualizarEstadoScroll);
    }, []);

    return (
        <div className="contenedor-pestañas-admin">
            <div className="nav-container-admin">
                <button
                    className={`boton-scroll izquierda ${puedeScrollIzquierda ? 'visible' : ''}`}
                    aria-label="Desplazar a la izquierda"
                    onClick={() => scrollHorizontal('izquierda')}
                >
                    <ChevronLeft />
                </button>

                <nav
                    className="navegacion-pestañas-admin"
                    ref={contenedorNavRef}
                    onScroll={actualizarEstadoScroll}
                >
                    {pestañas.map((pestaña) => (
                        <button
                            key={pestaña.id}
                            className={`pestaña-item-admin ${pestañaActiva === pestaña.id ? 'activo' : ''}`}
                            aria-label={pestaña.label}
                            role="tab"
                            onClick={() => {
                                setPestañaActiva(pestaña.id);
                                // navigate(`/administrador?tab=${pestaña.id}`); // Opcional: sincronizar con URL
                            }}
                        >
                            <div className="contenido-pestaña-admin">
                                <div className="icono-admin">{pestaña.icon}</div>
                                <span className="etiqueta-admin">{pestaña.label}</span>
                            </div>
                        </button>
                    ))}
                </nav>

                <button
                    className={`boton-scroll derecha ${puedeScrollDerecha ? 'visible' : ''}`}
                    aria-label="Desplazar a la derecha"
                    onClick={() => scrollHorizontal('derecha')}
                >
                    <ChevronRight />
                </button>
            </div>

            {/* 📂 CONTENIDO DE LAS PESTAÑAS */}
            <div className="contenido-pestañas-admin">

                {/* 📊 PESTAÑA ACTIVIDAD */}
                {pestañaActiva === 'actividad' && (
                    <PestanaActividad
                        actividadTiempoReal={actividadTiempoReal}
                        alumnosActivos={alumnosActivos}
                        estadisticasGenerales={estadisticasGenerales}
                        onGestionarTodos={onGestionarTodos}
                    />
                )}

                {/* 🌍 PESTAÑA GEOLOCALIZACIÓN */}
                {pestañaActiva === 'geolocalizacion' && (
                    <PestanaGeolocalizacion />
                )}

                {/* 📝 PESTAÑA BLOG & CONTENIDO */}
                {pestañaActiva === 'blog' && (
                    <PestanaBlog />
                )}

                {/* 📦 PESTAÑA PAQUETES */}
                {pestañaActiva === 'paquetes' && <PestanaPaquetes />}

                {/* 🎯 PESTAÑA RETENCIÓN */}
                {pestañaActiva === 'retencion' && <PestanaRetencion />}

                {/* 👥 PESTAÑA USUARIOS */}
                {pestañaActiva === 'usuarios' && <PestanaUsuarios />}

                {/* 💰 PESTAÑA PAGOS */}
                {pestañaActiva === 'pagos' && <PestanaPagos />}

                {/* 📢 PESTAÑA COMUNICACIONES */}
                {pestañaActiva === 'comunicaciones' && <PestanaComunicaciones />}

                {/* 📊 PESTAÑA REPORTES */}
                {pestañaActiva === 'reportes' && <PestanaReportes />}

                {/* ⚙️ PESTAÑA CONFIGURACIÓN */}
                {pestañaActiva === 'configuracion' && <PestanaConfiguracion />}

            </div>
        </div>
    );
};

export default PestanasAdministracion;
