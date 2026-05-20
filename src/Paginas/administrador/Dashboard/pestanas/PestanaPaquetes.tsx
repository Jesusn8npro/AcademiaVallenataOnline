
import GestionPaquetes from './GestionPaquetes';
import { Plus } from 'lucide-react';
import './PestanaPaquetes.css';

const PestanaPaquetes = () => {
    const irACrearPaquete = () => {
        window.location.href = '/administrador/paquetes/crear'; // O usar router
    };

    return (
        <div className="pestana-paquetes">
            <div className="encabezado-pestaña">
                <div className="header-content">
                    <div className="header-text">
                        <h2>📦 Gestión de Paquetes</h2>
                        <p>Administración de paquetes de tutoriales y cursos</p>
                    </div>
                    <button className="btn-crear-paquete" onClick={irACrearPaquete}>
                        <Plus size={16} />
                        Crear Paquete
                    </button>
                </div>
            </div>

            <div className="contenido-paquetes">
                <GestionPaquetes />
            </div>
        </div>
    );
};

export default PestanaPaquetes;
