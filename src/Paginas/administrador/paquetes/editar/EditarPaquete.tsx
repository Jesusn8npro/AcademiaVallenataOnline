import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormularioPaquete from '../../../../componentes/paquetes/FormularioPaquete';
import type { PaqueteTutorial } from '../../../../servicios/paquetesService';
import './EditarPaquete.css';

const EditarPaquete: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrandoExito, setMostrandoExito] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ID de paquete no proporcionado');
      setCargando(false);
      return;
    }
    // El FormularioPaquete se encarga de cargar los datos
    setCargando(false);
  }, [id]);

  const manejarGuardado = (paquete: PaqueteTutorial) => {
    console.log('✅ Paquete actualizado exitosamente:', paquete);
    setMostrandoExito(true);

    // Mostrar mensaje de éxito por 2 segundos y luego redirigir
    setTimeout(() => {
      navigate('/administrador/paquetes');
    }, 2000);
  };

  const manejarError = (error: string) => {
    console.error('❌ Error actualizando paquete:', error);
    setError(error);
  };

  if (cargando) {
    return (
      <div className="editar-paquete-paquetes">
        <div className="editar-paquete-paquetes__cargando">
          <div className="editar-paquete-paquetes__spinner"></div>
          <p>Cargando paquete...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editar-paquete-paquetes">
        <div className="editar-paquete-paquetes__error">
          <div className="editar-paquete-paquetes__error-icono">❌</div>
          <h2>Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate('/administrador/paquetes')}
            className="editar-paquete-paquetes__btn-volver"
          >
            Volver a Paquetes
          </button>
        </div>
      </div>
    );
  }

  if (mostrandoExito) {
    return (
      <div className="editar-paquete-paquetes">
        <div className="editar-paquete-paquetes__exito">
          <div className="editar-paquete-paquetes__exito-icono">✅</div>
          <h2>¡Paquete Actualizado Exitosamente!</h2>
          <p>Los cambios han sido guardados correctamente.</p>
          <div className="editar-paquete-paquetes__exito-acciones">
            <button
              onClick={() => navigate('/administrador/paquetes')}
              className="editar-paquete-paquetes__btn-primario"
            >
              Ver Lista de Paquetes
            </button>
            <button
              onClick={() => setMostrandoExito(false)}
              className="editar-paquete-paquetes__btn-secundario"
            >
              Continuar Editando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editar-paquete-paquetes">
      <div className="editar-paquete-paquetes__cabecera">
        <div className="editar-paquete-paquetes__navegacion">
          <button
            onClick={() => navigate('/administrador/paquetes')}
            className="editar-paquete-paquetes__btn-volver"
          >
            ← Volver a Paquetes
          </button>
        </div>

        <div className="editar-paquete-paquetes__titulo">
          <h1>✏️ Editar Paquete</h1>
          <p>Modifica la información del paquete de tutoriales</p>
        </div>
      </div>

      <div className="editar-paquete-paquetes__contenido">
        <FormularioPaquete
          paqueteId={id}
          onGuardado={manejarGuardado}
          onError={manejarError}
        />
      </div>
    </div>
  );
};

export default EditarPaquete;
