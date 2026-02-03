import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioPaquete from '../../../../componentes/paquetes/FormularioPaquete';
import type { PaqueteTutorial } from '../../../../servicios/paquetesService';
import './CrearPaquete.css';

const CrearPaquete: React.FC = () => {
  const navigate = useNavigate();
  const [mostrandoExito, setMostrandoExito] = useState(false);

  const manejarGuardado = (paquete: PaqueteTutorial) => {
    console.log('✅ Paquete creado exitosamente:', paquete);
    setMostrandoExito(true);

    // Mostrar mensaje de éxito por 2 segundos y luego redirigir
    setTimeout(() => {
      navigate('/administrador/paquetes');
    }, 2000);
  };

  const manejarError = (error: string) => {
    console.error('❌ Error creando paquete:', error);
    // Aquí podrías mostrar un toast o modal de error
    alert(`Error: ${error}`);
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
        <FormularioPaquete
          onGuardado={manejarGuardado}
          onError={manejarError}
        />
      </div>
    </div>
  );
};

export default CrearPaquete;
