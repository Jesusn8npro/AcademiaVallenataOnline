interface Props {
    cargando: boolean;
    onComprar: () => void;
}

const LOGROS = [
    'Más de 15 años de experiencia enseñando acordeón vallenato',
    'Metodología exclusiva paso a paso para principiantes y avanzados',
    'Más de 10,000 estudiantes satisfechos en todo el mundo',
];

const MentorSection = ({ cargando, onComprar }: Props) => (
    <div className="vista-premium-mentor">
        <div className="vista-premium-mentor-contenedor">
            <div className="vista-premium-mentor-grid">
                <div className="vista-premium-mentor-imagen-container">
                    <div className="vista-premium-mentor-imagen-fondo" />
                    <div className="vista-premium-mentor-imagen-wrapper">
                        <img
                            src="/images/Foto-maestro-oficial-JESUS-GONZALEZ.jpg"
                            alt="Jesús González - Maestro de Acordeón"
                            className="vista-premium-mentor-imagen"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/Home/Jesus-Gonzalez--Profesor-de-acordeon.jpg'; }}
                        />
                    </div>
                </div>

                <div className="vista-premium-mentor-info">
                    <div>
                        <h2 className="vista-premium-mentor-nombre">JESÚS GONZÁLEZ</h2>
                        <h3 className="vista-premium-mentor-titulo">¿Quién será tu mentor?</h3>
                    </div>
                    <p className="vista-premium-mentor-descripcion">
                        Clases con un Maestro experto y de larga trayectoria en la música vallenata.
                        Jesús González ha compartido escenario con las más grandes estrellas del vallenato como
                        Jorge Celedón, Felipe Peláez y muchos más.
                    </p>
                    <div className="vista-premium-mentor-logros">
                        {LOGROS.map((logro, i) => (
                            <div key={i} className="vista-premium-mentor-logro">
                                <svg className="vista-premium-mentor-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <p>{logro}</p>
                            </div>
                        ))}
                    </div>
                    <button className="vista-premium-mentor-btn" onClick={onComprar} disabled={cargando}>
                        ¡GARANTIZA TU CUPO AHORA!
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default MentorSection;
