import type { Contenido } from '../../../Paginas/Cursos/tipos';

interface Props {
    contenido: Contenido;
    objetivos: string[];
    cargando: boolean;
    onComprar: () => void;
}

const PreciosSection = ({ contenido, objetivos, cargando, onComprar }: Props) => (
    <div className="vista-premium-precios">
        <div className="vista-premium-precios-contenedor">
            <div className="vista-premium-precios-header">
                <p className="vista-premium-precios-mensaje">No pierdas esta oportunidad,</p>
                <p className="vista-premium-precios-mensaje">
                    ¡garantiza hoy <span className="vista-premium-precios-destacado">tu participación!</span>
                </p>
            </div>

            <div className="vista-premium-precios-card">
                <div className="vista-premium-precios-card-contenido">
                    <div className="vista-premium-precios-titulo-container">
                        <p className="vista-premium-precios-titulo">{contenido.titulo || 'Curso/Tutorial'}</p>
                        <p className="vista-premium-precios-descripcion">
                            {contenido.descripcion_corta || 'Accede a contenido premium y exclusivo.'}
                        </p>
                    </div>

                    <div className="vista-premium-precios-objetivos">
                        {objetivos.map((obj, i) => (
                            <div key={i} className="vista-premium-precios-objetivo">
                                <span className="vista-premium-precios-check">✓</span>
                                <p className="vista-premium-precios-objetivo-texto">{obj}</p>
                            </div>
                        ))}
                    </div>

                    {contenido.modulos_preview && contenido.modulos_preview.length > 0 && (
                        <div className="vista-premium-precios-modulos">
                            <h2 className="vista-premium-precios-modulos-titulo">Lecciones y módulos</h2>
                            <div className="vista-premium-precios-modulos-lista">
                                {contenido.modulos_preview.map((modulo, i) => (
                                    <div key={i} className="vista-premium-precios-modulo">
                                        <div className="vista-premium-precios-modulo-header">
                                            <h3 className="vista-premium-precios-modulo-titulo">Módulo {i + 1}: {modulo.titulo}</h3>
                                        </div>
                                        {modulo.descripcion && (
                                            <p className="vista-premium-precios-modulo-descripcion">{modulo.descripcion}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="vista-premium-precios-divisor" />

                    <div className="vista-premium-precios-precio-container">
                        {contenido.precio_normal && contenido.precio_rebajado && contenido.precio_normal > contenido.precio_rebajado ? (
                            <>
                                <p className="vista-premium-precios-precio-antes">De: ${contenido.precio_normal.toLocaleString()}</p>
                                <div className="vista-premium-precios-precio-flex">
                                    <span className="vista-premium-precios-precio-final">${contenido.precio_rebajado.toLocaleString()}</span>
                                    <span className="vista-premium-precios-descuento-badge">
                                        -{Math.round((1 - contenido.precio_rebajado / contenido.precio_normal) * 100)}%
                                    </span>
                                </div>
                                <p className="vista-premium-precios-detalle">Pago único - Acceso de por vida</p>
                            </>
                        ) : contenido.precio_normal ? (
                            <>
                                <p className="vista-premium-precios-precio-label">Precio:</p>
                                <span className="vista-premium-precios-precio-final">${contenido.precio_normal.toLocaleString()}</span>
                                <p className="vista-premium-precios-detalle">Pago único - Acceso de por vida</p>
                            </>
                        ) : (
                            <>
                                <span className="vista-premium-precios-precio-gratis">GRATIS</span>
                                <p className="vista-premium-precios-detalle">Contenido 100% gratuito</p>
                            </>
                        )}
                    </div>

                    <button className="vista-premium-precios-btn" onClick={onComprar} disabled={cargando}>
                        ¡QUIERO APROVECHAR ESTA PROMOCIÓN!
                    </button>

                    <div className="vista-premium-precios-metodos">
                        {['PayPal', 'Visa', 'Mastercard', 'AmEx'].map(m => (
                            <div key={m} className="vista-premium-precios-metodo">{m}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default PreciosSection;
