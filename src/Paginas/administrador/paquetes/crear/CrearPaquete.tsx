import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioPaquete from '../../../../componentes/paquetes/FormularioPaquete';
import type { PaqueteTutorial } from '../../../../servicios/paquetesService';
import './CrearPaquete.css';

const CrearPaquete: React.FC = () => {
  const navigate = useNavigate();
  const [mostrandoExito, setMostrandoExito] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');

  const manejarGuardado = (_paquete: PaqueteTutorial) => {
    setMostrandoExito(true);
    setTimeout(() => navigate('/administrador/paquetes'), 2000);
  };

  const manejarError = (error: string) => {
    setErrorCrear(error);
  };

  if (mostrandoExito) {
    return (
      <div className="crear-paquete-paquetes">
        <div className="crear-paquete-paquetes__exito">
          <div className="crear-paquete-paquetes__exito-icono">✅</div>
          <h2>¡Paquete Creado Exitosamente!</h2>
          <p>El paquete ha sido guardado y está listo para ser publicado.</p>
          <div className="crear-paquete-paquetes__exito-acciones">
            <button
              onClick={() => navigate('/administrador/paquetes')}
              className="crear-paquete-paquetes__btn-primario"
            >
              Ver Lista de Paquetes
            </button>
            <button
              onClick={() => setMostrandoExito(false)}
              className="crear-paquete-paquetes__btn-secundario"
            >
              Crear Otro Paquete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="crear-paquete-paquetes">
      <div className="crear-paquete-paquetes__cabecera">
        <div className="crear-paquete-paquetes__navegacion">
          <button
            onClick={() => navigate('/administrador/paquetes')}
            className="crear-paquete-paquetes__btn-volver"
          >
            ← Volver a Paquetes
          </button>
        </div>

        <div className="crear-paquete-paquetes__titulo">
          <h1>🎵 Crear Nuevo Paquete</h1>
          <p>Completa la información para crear un nuevo paquete de tutoriales</p>
        </div>
      </div>

      <div className="crear-paquete-paquetes__contenido">
        {errorCrear && <p style={{ color: '#e53e3e', marginBottom: '1rem' }}>{errorCrear}</p>}
        <FormularioPaquete
          onGuardado={manejarGuardado}
          onError={manejarError}
        />
      </div>
    </div>
  );
};

export default CrearPaquete;
