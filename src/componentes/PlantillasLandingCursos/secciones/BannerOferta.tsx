interface Props {
    tiempoRestante: { dias: number; horas: number; minutos: number; segundos: number };
    descuento: number;
    volver: () => void;
}

const UNIDADES = ['Días', 'Horas', 'Min', 'Seg'] as const;

const BannerOferta = ({ tiempoRestante, descuento, volver }: Props) => {
    const vals = [tiempoRestante.dias, tiempoRestante.horas, tiempoRestante.minutos, tiempoRestante.segundos];
    return (
        <>
            <div className="vista-premium-banner-oferta">
                <div className="vista-premium-banner-contenido">
                    <div className="vista-premium-banner-izquierda">
                        <button className="vista-premium-btn-volver" onClick={volver}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="vista-premium-icono-volver" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <span>Volver</span>
                        </button>
                        <div className="vista-premium-badge-oferta">
                            <svg className="vista-premium-icono-reloj" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="vista-premium-texto-oferta">¡OFERTA EXCLUSIVA!</span>
                        </div>
                        {descuento > 0 && <span className="vista-premium-badge-descuento">-{descuento}%</span>}
                    </div>
                    <div className="vista-premium-contador-container">
                        <div className="vista-premium-contador-label">La oferta termina en:</div>
                        <div className="vista-premium-contador-grid">
                            {UNIDADES.map((lbl, i) => (
                                <div key={lbl} className="vista-premium-contador-item">
                                    <div className="vista-premium-contador-valor">{vals[i]}</div>
                                    <div className="vista-premium-contador-unidad">{lbl}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="vista-premium-espaciador" />
        </>
    );
};

export default BannerOferta;
