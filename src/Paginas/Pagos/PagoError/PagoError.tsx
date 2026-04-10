import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PagoError.css';

interface DatosError {
    referencia: string;
    codigo: string;
    descripcion: string;
    fecha: string;
    hora: string;
}

const PagoError: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [datosError, setDatosError] = useState<DatosError | null>(null);

    useEffect(() => {
        try {
            // Obtener parámetros de la URL
            const refPayco = searchParams.get('ref_payco');
            const codigo = searchParams.get('cod_response');
            const descripcion = searchParams.get('response_reason_text');

            setDatosError({
                referencia: refPayco || 'No disponible',
                codigo: codigo || '0',
                descripcion: descripcion || 'Error desconocido',
                fecha: new Date().toLocaleDateString('es-CO'),
                hora: new Date().toLocaleTimeString('es-CO')
            });

            setLoading(false);
        } catch (err) {
            console.error('Error cargando datos del error:', err);
            setLoading(false);
        }
    }, [searchParams]);

    const intentarDeNuevo = () => {
        // Volver a la página anterior
        window.history.back();
    };

    const irAInicio = () => {
        navigate('/');
    };

    const contactarSoporte = () => {
        window.open('https://wa.me/573001234567?text=Hola, tuve un problema con mi pago. Referencia: ' + (datosError?.referencia || ''), '_blank');
    };

    return (
        <div className="pago-error-container">
            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Verificando información del error...</p>
                </div>
            ) : (
                <div className="error-card">
                    {/* Icono de error */}
                    <div className="error-icon">
                        <div className="x-mark">✕</div>
                    </div>

                    {/* Título principal */}
                    <h1>¡Oops! Algo salió mal</h1>
                    <p className="subtitle">Tu pago no pudo ser procesado correctamente</p>

                    {/* Información del error */}
                    {datosError && (
                        <div className="error-info">
                            <h2>Detalles del error</h2>

                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">Referencia:</span>
                                    <span className="value">{datosError.referencia}</span>
                                </div>

                                <div className="info-item">
                                    <span className="label">Código de error:</span>
                                    <span className="value error-code">{datosError.codigo}</span>
                                </div>

                                <div className="info-item">
                                    <span className="label">Descripción:</span>
                                    <span className="value">{datosError.descripcion}</span>
                                </div>

                                <div className="info-item">
                                    <span className="label">Fecha del intento:</span>
                                    <span className="value">{datosError.fecha} - {datosError.hora}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Posibles causas */}
                    <div className="causes-info">
                        <h3>Posibles causas:</h3>
                        <ul>
                            <li>Fondos insuficientes en la tarjeta</li>
                            <li>Datos de la tarjeta incorrectos</li>
                            <li>Tarjeta bloqueada o vencida</li>
                            <li>Problema temporal con el procesador de pagos</li>
                            <li>Límites de transacción excedidos</li>
                        </ul>
                    </div>

                    {/* Acciones */}
                    <div className="actions">
                        <button onClick={intentarDeNuevo} className="btn btn-primary">
                            🔄 Intentar de Nuevo
                        </button>

                        <button onClick={contactarSoporte} className="btn btn-support">
                            💬 Contactar Soporte
                        </button>

                        <button onClick={irAInicio} className="btn btn-secondary">
                            🏠 Volver al Inicio
                        </button>
                    </div>

                    {/* Mensaje de ayuda */}
                    <div className="help-info">
                        <p>
                            <strong>¿Necesitas ayuda?</strong><br />
                            No te preocupes, estos errores son comunes y tienen solución.
                            Puedes intentar nuevamente con otra tarjeta o contactar a nuestro
                            equipo de soporte para recibir asistencia personalizada.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PagoError;
