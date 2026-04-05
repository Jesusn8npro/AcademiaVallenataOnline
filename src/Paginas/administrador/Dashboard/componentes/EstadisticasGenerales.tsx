import React from 'react';
import './EstadisticasGenerales.css';
import { useNavigate } from 'react-router-dom';

interface DatosEstadisticas {
    totalUsuarios: number;
    usuariosPremium: number;
    totalContenido: number;
    cursosActivos: number;
    tutorialesActivos: number;
    inscripcionesRecientes: number;
    porcentajePremium: number;
    ventasTotalesMes: number;
    transaccionesDelMes: number;
    ventasCursos: number;
    ventasTutoriales: number;
    ventasOtros: number;
    pagosAceptados: number;
    pagosPendientes: number;
    pagosRechazados: number;
}

interface Props {
    datos: DatosEstadisticas | null;
    onClickCursos?: () => void;
    onClickUsuarios?: () => void;
}

const EstadisticasGenerales: React.FC<Props> = ({ datos }) => {
    const navigate = useNavigate();

    // Formatear números grandes
    const formatearNumero = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    // Formatear moneda
    const formatearMoneda = (monto: number): string => {
        if (monto >= 1000000000) return '$' + (monto / 1000000000).toFixed(1) + 'B';
        if (monto >= 1000000) return '$' + (monto / 1000000).toFixed(1) + 'M';
        if (monto >= 1000) return '$' + (monto / 1000).toFixed(0) + 'K';
        if (monto >= 100) return '$' + Math.round(monto).toLocaleString('es-CO');
        return '$' + monto.toFixed(0);
    };

    // Simular crecimiento (para demo)
    const obtenerCrecimiento = () => Math.floor(Math.random() * 20) + 5;

    const handleVerContenido = (tipo: string) => {
        // Navegación específica según la pestaña deseada en el futuro, por ahora al panel general
        navigate('/administrador/contenido');
    };

    if (!datos) {
        return (
            <div className="estado-sin-datos">
                <div className="icono-sin-datos">
                    <i className="fas fa-chart-bar"></i>
                </div>
                <h3>Cargando estadísticas...</h3>
                <p>Obteniendo métricas de la academia</p>
            </div>
        );
    }

    return (
        <div className="contenedor-estadisticas">

            {/* 🎯 TÍTULO DE SECCIÓN */}
            <div className="encabezado-seccion">
                <h2>📊 Estadísticas Generales</h2>
                <p>Métricas principales de la Academia Vallenata</p>
            </div>

            {/* 📈 GRID DE MÉTRICAS */}
            <div className="grid-metricas">

                {/* 👥 TOTAL USUARIOS */}
                <div className="tarjeta-metrica usuarios clickeable" onClick={() => navigate('/administrador/usuarios')}>
                    <div className="icono-metrica">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="contenido-metrica">
                        <div className="numero-principal">{formatearNumero(datos.totalUsuarios)}</div>
                        <div className="etiqueta-metrica">Total Estudiantes</div>
                        <div className="indicador-crecimiento positivo">
                            <i className="fas fa-arrow-up"></i>
                            +{obtenerCrecimiento()}% este mes
                        </div>
                    </div>
                    <div className="icono-click">
                        <i className="fas fa-arrow-right"></i>
                    </div>
                    <div className="fondo-decorativo usuarios-bg"></div>
                </div>

                {/* 💎 USUARIOS PREMIUM */}
                <div className="tarjeta-metrica premium clickeable" onClick={() => navigate('/administrador/usuarios?filtro=premium')}>
                    <div className="icono-metrica">
                        <i className="fas fa-crown"></i>
                    </div>
                    <div className="contenido-metrica">
                        <div className="numero-principal">{formatearNumero(datos.usuariosPremium)}</div>
                        <div className="etiqueta-metrica">Usuarios Premium</div>
                        <div className="porcentaje-stat">{datos.porcentajePremium}% del total</div>
                    </div>
                    {datos.usuariosPremium === 0 && (
                        <div className="icono-click">
                            <i className="fas fa-info-circle"></i>
                        </div>
                    )}
                    <div className="fondo-decorativo premium-bg"></div>
                </div>

                {/* 📚 CONTENIDO TOTAL */}
                <div className="tarjeta-metrica contenido clickeable" onClick={() => navigate('/administrador/contenido')}>
                    <div className="icono-metrica">
                        <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div className="contenido-metrica">
                        <div className="numero-principal">{formatearNumero(datos.totalContenido)}</div>
                        <div className="etiqueta-metrica">Cursos y Tutoriales</div>
                        <div className="desglose-contenido">
                            <span
                                className="item-clickeable"
                                onClick={(e) => { e.stopPropagation(); handleVerContenido('cursos'); }}
                            >
                                {datos.cursosActivos} cursos
                            </span>
                            <span
                                className="item-clickeable"
                                onClick={(e) => { e.stopPropagation(); handleVerContenido('tutoriales'); }}
                            >
                                {datos.tutorialesActivos} tutoriales
                            </span>
                        </div>
                    </div>
                    <div className="icono-click">
                        <i className="fas fa-cog"></i>
                    </div>
                    <div className="fondo-decorativo contenido-bg"></div>
                </div>

                {/* 🚀 INSCRIPCIONES RECIENTES */}
                <div className="tarjeta-metrica crecimiento clickeable" onClick={() => navigate('/administrador/usuarios')}>
                    <div className="icono-metrica">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="contenido-metrica">
                        <div className="numero-principal">{formatearNumero(datos.inscripcionesRecientes)}</div>
                        <div className="etiqueta-metrica">Inscripciones Recientes</div>
                        <div className="indicador-crecimiento positivo">
                            <i className="fas fa-trending-up"></i>
                            Últimos 30 días
                        </div>
                    </div>
                    <div className="icono-click">
                        <i className="fas fa-arrow-right"></i>
                    </div>
                    <div className="fondo-decorativo crecimiento-bg"></div>
                </div>

                {/* 💰 VENTAS TOTALES DEL MES */}
                <div className="tarjeta-metrica ventas clickeable" onClick={() => navigate('/administrador/pagos')}>
                    <div className="icono-metrica">
                        <i className="fas fa-dollar-sign"></i>
                    </div>
                    <div className="contenido-metrica">
                        <div className="numero-principal">{formatearMoneda(datos.ventasTotalesMes || 0)}</div>
                        <div className="etiqueta-metrica">Ventas del Mes</div>
                        <div className="indicador-crecimiento positivo">
                            <i className="fas fa-coins"></i>
                            {datos.transaccionesDelMes || 0} transacciones
                        </div>
                    </div>
                    <div className="icono-click">
                        <i className="fas fa-arrow-right"></i>
                    </div>
                    <div className="fondo-decorativo ventas-bg"></div>
                </div>

            </div>
        </div>
    );
};

export default EstadisticasGenerales;
