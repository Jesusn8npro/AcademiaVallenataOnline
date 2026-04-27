import { useEffect, useMemo, useRef, useState } from 'react';
import type { EstadisticasPartida, CancionHeroConTonalidad } from '../TiposProMax';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { scoresHeroService, type ScoreRespuesta } from '../../../servicios/scoresHeroService';

function calcularEstrellas(notasPerfecto: number, notasBien: number, notasFalladas: number, notasPerdidas: number): number {
  const totalNotas = notasPerfecto + notasBien + notasFalladas + notasPerdidas;
  if (totalNotas === 0) return 0;
  const precision = (notasPerfecto + notasBien) / totalNotas;
  if (precision >= 0.9) return 3;
  if (precision >= 0.7) return 2;
  return 1;
}

function calcularPrecision(notasPerfecto: number, notasBien: number, notasFalladas: number, notasPerdidas: number): number {
  const totalNotas = notasPerfecto + notasBien + notasFalladas + notasPerdidas;
  if (totalNotas === 0) return 0;
  return Math.round(((notasPerfecto + notasBien) / totalNotas) * 100);
}

interface UsePantallaResultadosParams {
  estadisticas: EstadisticasPartida;
  cancion: CancionHeroConTonalidad;
  modo: string;
  mostrarGuardado: boolean;
  tituloSugeridoGrabacion: string;
  tituloGrabacionGuardada?: string | null;
  onGuardarGrabacion: (titulo: string, descripcion: string) => Promise<boolean> | boolean;
}

export function usePantallaResultados({
  estadisticas, cancion, modo, mostrarGuardado,
  tituloSugeridoGrabacion, tituloGrabacionGuardada, onGuardarGrabacion,
}: UsePantallaResultadosParams) {
  const { usuario } = useUsuario();
  const { puntos, notasPerfecto, notasBien, notasFalladas, notasPerdidas, rachaMasLarga, multiplicador } = estadisticas;
  const estrellas = useMemo(() => calcularEstrellas(notasPerfecto, notasBien, notasFalladas, notasPerdidas), [notasPerfecto, notasBien, notasFalladas, notasPerdidas]);
  const precision = useMemo(() => calcularPrecision(notasPerfecto, notasBien, notasFalladas, notasPerdidas), [notasPerfecto, notasBien, notasFalladas, notasPerdidas]);
  const totalNotas = notasPerfecto + notasBien + notasFalladas + notasPerdidas;

  const guardandoScoreRef = useRef(false);
  const [tituloGrabacion, setTituloGrabacion] = useState(tituloSugeridoGrabacion || `Mi mejor intento en ${cancion.titulo}`);
  const [descripcionGrabacion, setDescripcionGrabacion] = useState('');
  const [errorLocal, setErrorLocal] = useState('');
  const [modalGuardadoAbierto, setModalGuardadoAbierto] = useState(false);
  const [scoreRespuesta, setScoreRespuesta] = useState<ScoreRespuesta | null>(null);
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [animandoXP, setAnimandoXP] = useState(false);

  useEffect(() => {
    if (!usuario || !cancion.id || guardandoScoreRef.current) return;
    guardandoScoreRef.current = true;
    const guardar = async () => {
      const respuesta = await scoresHeroService.guardarScoreGame({
        usuario_id: usuario.id,
        cancion_id: cancion.id!,
        puntuacion: puntos,
        precision_porcentaje: precision,
        notas_totales: totalNotas,
        notas_correctas: notasPerfecto + notasBien,
        notas_falladas: notasFalladas + notasPerdidas,
        racha_maxima: rachaMasLarga,
        multiplicador_maximo: multiplicador,
        modo,
        tonalidad: cancion.tonalidad || 'N/A',
        duracion_ms: 0,
        abandono: false,
        porcentaje_completado: 100
      });
      if (respuesta) {
        setScoreRespuesta(respuesta);
        setTimeout(() => setAnimandoXP(true), 500);
      }
    };
    guardar();
  }, [usuario, cancion, puntos, precision, totalNotas, notasPerfecto, notasBien, notasFalladas, notasPerdidas, rachaMasLarga, multiplicador, modo]);

  useEffect(() => {
    if (mostrarGuardado) {
      setTituloGrabacion(tituloSugeridoGrabacion || `Mi mejor intento en ${cancion.titulo}`);
      setDescripcionGrabacion('');
      setErrorLocal('');
      setModalGuardadoAbierto(false);
    }
  }, [cancion.titulo, mostrarGuardado, tituloSugeridoGrabacion]);

  useEffect(() => {
    if (!mostrarGuardado) setModalGuardadoAbierto(false);
  }, [mostrarGuardado]);

  useEffect(() => {
    if (tituloGrabacionGuardada) setModalGuardadoAbierto(false);
  }, [tituloGrabacionGuardada]);

  const mensajeMotivacion = (() => {
    if (precision >= 95) return '¡Maestro del acordeón!';
    if (precision >= 85) return '¡Excelente ejecución!';
    if (precision >= 70) return '¡Muy bien! Sigue practicando.';
    if (precision >= 50) return 'Buen intento. ¡A practicar!';
    return 'Continúa practicando, ¡tú puedes!';
  })();

  const manejarGuardar = async () => {
    const tituloLimpio = tituloGrabacion.trim();
    if (!tituloLimpio) {
      setErrorLocal('Debes escribir un titulo para guardar esta ejecucion.');
      return;
    }
    setErrorLocal('');
    await onGuardarGrabacion(tituloLimpio, descripcionGrabacion);
  };

  return {
    usuario, puntos, notasPerfecto, notasBien, notasFalladas, notasPerdidas,
    rachaMasLarga, totalNotas, estrellas, precision,
    tituloGrabacion, setTituloGrabacion,
    descripcionGrabacion, setDescripcionGrabacion,
    errorLocal, modalGuardadoAbierto, setModalGuardadoAbierto,
    scoreRespuesta, modalHistorialAbierto, setModalHistorialAbierto,
    animandoXP, mensajeMotivacion, manejarGuardar,
  };
}
