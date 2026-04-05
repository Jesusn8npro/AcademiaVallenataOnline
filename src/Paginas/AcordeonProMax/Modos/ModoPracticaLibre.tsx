import React from 'react';
import EstudioPracticaLibre from '../PracticaLibre/EstudioPracticaLibre';

interface ModoPracticaLibreProps {
  logica: any;
  modoAjuste: boolean;
  setModoAjuste: React.Dispatch<React.SetStateAction<boolean>>;
  pestanaActiva: 'diseno' | 'sonido';
  setPestanaActiva: React.Dispatch<React.SetStateAction<'diseno' | 'sonido'>>;
  onVolver: () => void;
  imagenFondo: string;
  modosVista: Array<{ valor: any; label: string }>;
  grabando: boolean;
  tiempoGrabacionMs: number;
  mostrarModalGuardar: boolean;
  guardandoGrabacion: boolean;
  errorGuardadoGrabacion: string | null;
  tituloSugeridoGrabacion: string;
  resumenGrabacionPendiente: { duracionMs: number; bpm: number; tonalidad: string | null; notas: number } | null;
  ultimaGrabacionGuardada: { id: string; titulo: string } | null;
  onIniciarGrabacion: () => void;
  onDetenerGrabacion: () => void;
  onGuardarGrabacion: (titulo: string, descripcion: string) => Promise<boolean> | boolean;
  onCancelarGuardado: () => void;
  volumenAcordeon: number;
  setVolumenAcordeon: React.Dispatch<React.SetStateAction<number>>;
}

const ModoPracticaLibre: React.FC<ModoPracticaLibreProps> = ({
  logica,
  modoAjuste,
  setModoAjuste,
  pestanaActiva,
  setPestanaActiva,
  imagenFondo,
  modosVista,
  grabando,
  tiempoGrabacionMs,
  mostrarModalGuardar,
  guardandoGrabacion,
  errorGuardadoGrabacion,
  tituloSugeridoGrabacion,
  resumenGrabacionPendiente,
  ultimaGrabacionGuardada,
  onIniciarGrabacion,
  onDetenerGrabacion,
  onGuardarGrabacion,
  onCancelarGuardado,
  volumenAcordeon,
  setVolumenAcordeon,
}) => {
  return (
    <EstudioPracticaLibre
      logica={logica}
      modoAjuste={modoAjuste}
      setModoAjuste={setModoAjuste}
      pestanaActiva={pestanaActiva}
      setPestanaActiva={setPestanaActiva}
      imagenFondo={imagenFondo}
      modosVista={modosVista}
      grabando={grabando}
      tiempoGrabacionMs={tiempoGrabacionMs}
      mostrarModalGuardar={mostrarModalGuardar}
      guardandoGrabacion={guardandoGrabacion}
      errorGuardadoGrabacion={errorGuardadoGrabacion}
      tituloSugeridoGrabacion={tituloSugeridoGrabacion}
      resumenGrabacionPendiente={resumenGrabacionPendiente}
      ultimaGrabacionGuardada={ultimaGrabacionGuardada}
      onIniciarGrabacion={onIniciarGrabacion}
      onDetenerGrabacion={onDetenerGrabacion}
      onGuardarGrabacion={onGuardarGrabacion}
      onCancelarGuardado={onCancelarGuardado}
      volumenAcordeon={volumenAcordeon}
      setVolumenAcordeon={setVolumenAcordeon}
    />
  );
};

export default ModoPracticaLibre;
