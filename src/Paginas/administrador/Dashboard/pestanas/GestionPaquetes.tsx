import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../servicios/supabaseCliente';
import { Box, Star, DollarSign, PlayCircle, Clock, Key, Plus, Boxes, Edit3 } from 'lucide-react';
import './GestionPaquetes.css';

const GestionPaquetes = () => {
    const navigate = useNavigate();
    const [paquetes, setPaquetes] = useState<any[]>([]);
    const [cargandoPaquetes, setCargandoPaquetes] = useState(true);
    const [estadisticasPaquetes, setEstadisticasPaquetes] = useState({
        totalPaquetes: 0,
        paquetesDestacados: 0,
        ingresosTotales: 0,
        promedioTutoriales: 0
    });

    useEffect(() => {
        cargarPaquetes();
    }, []);

    const cargarPaquetes = async () => {
        try {
            setCargandoPaquetes(true);

            const { data: paquetesData, error } = await supabase
                .from('paquetes_tutoriales')
                .select('*')
                .eq('visible', true)
                .order('created_at', { ascending: false })
                .limit(4);

            if (error) {
                console.error("Error cargando paquetes:", error);
                return;
            }

            const paquetesCargados = paquetesData || [];
            setPaquetes(paquetesCargados);
            calcularEstadisticas(paquetesCargados);

        } catch (error) {
            console.error(error);
        } finally {
            setCargandoPaquetes(false);
        }
    };

    const calcularEstadisticas = (paquetesList: any[]) => {
        setEstadisticasPaquetes({
            totalPaquetes: paquetesList.length,
            paquetesDestacados: paquetesList.filter(p => p.destacado).length,
            ingresosTotales: paquetesList.reduce((sum, p) => sum + (parseFloat(p.precio_rebajado) || parseFloat(p.precio_normal) || 0), 0),
            promedioTutoriales: paquetesList.length > 0 ? Math.round(paquetesList.reduce((sum, p) => sum + (p.total_tutoriales || 0), 0) / paquetesList.length) : 0
        });
    };

    const formatearPrecio = (precio: number) => {
        if (precio >= 1000000) return '$' + (precio / 1000000).toFixed(1) + 'M';
        if (precio >= 1000) return '$' + (precio / 1000).toFixed(0) + 'K';
        return '$' + precio.toLocaleString('es-CO');
    };

    const calcularDescuento = (paquete: any) => {
        if (!paquete.precio_rebajado || !paquete.precio_normal) return 0;
        return Math.round(((paquete.precio_normal - paquete.precio_rebajado) / paquete.precio_normal) * 100);
    };

    const irAGestionPaquetes = () => {
        navigate('/administrador/paquetes');
    };

    const crearNuevoPaquete = () => {
        navigate('/administrador/paquetes/crear');
    };

    const editarPaquete = (id: string) => {
        navigate(`/administrador/paquetes/editar/${id}`);
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="contenedor-paquetes">

            {/* 🎯 ENCABEZADO */}
            <div className="encabezado-seccion">
                <div className="titulo-con-accion">
                    <h3>📦 Gestión de Paquetes</h3>
                    <button className="boton-crear" onClick={crearNuevoPaquete} title="Crear nuevo paquete">
                        <Plus size={16} />
                        Nuevo
                    </button>
                </div>
                <p>Administra tus paquetes de tutoriales y sus ventas</p>
            </div>

            {cargandoPaquetes ? (
                /* 🔄 CARGANDO */
                <div className="estado-carga">
                    <div className="spinner-paquetes"></div>
                    <p>Cargando paquetes...</p>
                </div>
            ) : (
                <>
                    {/* 📊 ESTADÍSTICAS RÁPIDAS */}
                    <div className="estadisticas-rapidas">
                        <div className="stat-item">
                            <div className="stat-icono">
                                <Box size={24} />
                            </div>
                            <div className="stat-info">
                                <div className="stat-valor">{estadisticasPaquetes.totalPaquetes}</div>
                                <div className="stat-label">Paquetes Activos</div>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-icono destacado">
                                <Star size={24} />
                            </div>
                            <div className="stat-info">
                                <div className="stat-valor">{estadisticasPaquetes.paquetesDestacados}</div>
                                <div className="stat-label">Destacados</div>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-icono ventas">
                                <DollarSign size={24} />
                            </div>
                            <div className="stat-info">
                                <div className="stat-valor">{formatearPrecio(estadisticasPaquetes.ingresosTotales)}</div>
                                <div className="stat-label">Valor Total</div>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-icono contenido">
                                <PlayCircle size={24} />
                            </div>
                            <div className="stat-info">
                                <div className="stat-valor">{estadisticasPaquetes.promedioTutoriales}</div>
                                <div className="stat-label">Promedio Tutoriales</div>
                            </div>
                        </div>
                    </div>

                    {/* 📋 LISTA DE PAQUETES */}
                    <div className="lista-paquetes">
                        {paquetes.length > 0 ? (
                            paquetes.map((paquete) => (
                                <div key={paquete.id} className={`item-paquete ${paquete.destacado ? 'destacado' : ''}`}>

                                    {/* 📦 INFO PRINCIPAL */}
                                    <div className="paquete-contenido-principal">
                                        <div className="paquete-header">
                                            <div className="paquete-titulo">
                                                <h4>{paquete.titulo}</h4>
                                                {paquete.destacado && (
                                                    <span className="badge-destacado">
                                                        <Star size={12} />
                                                        Destacado
                                                    </span>
                                                )}
                                            </div>
                                            <div className="paquete-fecha">
                                                {formatearFecha(paquete.created_at)}
                                            </div>
                                        </div>

                                        {/* 📊 DETALLES */}
                                        <div className="paquete-detalles">
                                            <div className="detalle-item">
                                                <PlayCircle size={12} />
                                                <span>{paquete.total_tutoriales || 0} tutoriales</span>
                                            </div>

                                            <div className="detalle-item">
                                                <Clock size={12} />
                                                <span>{paquete.duracion_total_estimada || 0} min</span>
                                            </div>

                                            <div className="detalle-item tipo-acceso">
                                                <Key size={12} />
                                                <span>{paquete.tipo_acceso || 'premium'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 💰 PRECIOS Y ACCIONES */}
                                    <div className="paquete-lateral">
                                        <div className="paquete-precios">
                                            {paquete.precio_rebajado && paquete.precio_rebajado < paquete.precio_normal ? (
                                                <div className="precio-oferta">
                                                    <span className="precio-original">{formatearPrecio(parseFloat(paquete.precio_normal))}</span>
                                                    <span className="precio-rebajado">{formatearPrecio(parseFloat(paquete.precio_rebajado))}</span>
                                                    <span className="descuento">-{calcularDescuento(paquete)}%</span>
                                                </div>
                                            ) : (
                                                <div className="precio-normal">
                                                    {formatearPrecio(parseFloat(paquete.precio_normal) || 0)}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className="boton-editar-mini"
                                            onClick={() => editarPaquete(paquete.id)}
                                            title="Editar Paquete"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>

                                </div>
                            ))
                        ) : (
                            /* 😴 SIN PAQUETES */
                            <div className="sin-paquetes">
                                <div className="icono-sin-datos">
                                    <Box size={48} />
                                </div>
                                <h4>No hay paquetes creados</h4>
                                <p>Crea tu primer paquete de tutoriales</p>
                                <button className="boton-crear-primero" onClick={crearNuevoPaquete}>
                                    <Plus size={16} />
                                    Crear Primer Paquete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 🔗 PIE DE SECCIÓN */}
                    <div className="pie-seccion">
                        <button className="boton-ver-todos" onClick={irAGestionPaquetes}>
                            <Boxes size={16} />
                            Ver todos los paquetes
                        </button>
                    </div>
                </>
            )}

        </div>
    );
};

export default GestionPaquetes;
