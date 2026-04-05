import React from 'react';

interface ModalGuardarPracticaLibreProps {
  visible: boolean;
  guardando: boolean;
  error: string | null;
  tituloSugerido: string;
  resumen: { duracionMs: number; bpm: number; tonalidad: string | null; notas: number } | null;
  onCancelar: () => void;
  onGuardar: (titulo: string, descripcion: string) => Promise<boolean> | boolean;
}

function formatearDuracion(ms: number) {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

const ModalGuardarPracticaLibre: React.FC<ModalGuardarPracticaLibreProps> = ({
  visible,
  guardando,
  error,
  tituloSugerido,
  resumen,
  onCancelar,
  onGuardar,
}) => {
  const [titulo, setTitulo] = React.useState(tituloSugerido || 'Practica libre');
  const [descripcion, setDescripcion] = React.useState('');
  const [errorLocal, setErrorLocal] = React.useState('');

  React.useEffect(() => {
    if (!visible) return;
    setTitulo(tituloSugerido || 'Practica libre');
    setDescripcion('');
    setErrorLocal('');
  }, [tituloSugerido, visible]);

  if (!visible) return null;

  const manejarGuardar = async () => {
    if (!titulo.trim()) {
      setErrorLocal('Debes escribir un titulo para guardar la practica.');
      return;
    }

    setErrorLocal('');
    await onGuardar(titulo, descripcion);
  };

  return (
    <div className="estudio-practica-libre-modal-overlay">
      <div className="estudio-practica-libre-modal">
        <div className="estudio-practica-libre-modal-head">
          <div>
            <span className="estudio-practica-libre-modal-kicker">Practica libre</span>
            <h3>Guardar sesion</h3>
          </div>
          {resumen && <span className="estudio-practica-libre-modal-chip">{formatearDuracion(resumen.duracionMs)}</span>}
        </div>

        {resumen && (
          <div className="estudio-practica-libre-modal-resumen">
            <span>{resumen.tonalidad || 'Sin tono'}</span>
            <span>{resumen.bpm} BPM</span>
            <span>{resumen.notas} notas</span>
          </div>
        )}

        <label className="estudio-practica-libre-modal-campo">
          <span>Titulo</span>
          <input
            type="text"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            maxLength={120}
            placeholder="Ej: Paseo en La con pista suave"
          />
        </label>

        <label className="estudio-practica-libre-modal-campo">
          <span>Descripcion</span>
          <textarea
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            maxLength={500}
            placeholder="Notas de la sesion, ideas, fraseos o lo que quieras recordar despues..."
          />
        </label>

        {(errorLocal || error) && (
          <p className="estudio-practica-libre-modal-error">{errorLocal || error}</p>
        )}

        <div className="estudio-practica-libre-modal-acciones">
          <button className="estudio-practica-libre-modal-btn secundaria" onClick={onCancelar} disabled={guardando}>
            Descartar
          </button>
          <button className="estudio-practica-libre-modal-btn primaria" onClick={manejarGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar en mis grabaciones'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalGuardarPracticaLibre;
