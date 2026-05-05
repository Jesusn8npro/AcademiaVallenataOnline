import { useEffect, useMemo, useRef, useState } from 'react';
import type { EstadisticasPartida, CancionHeroConTonalidad, EstadoSeccionUsuario } from '../TiposProMax';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { scoresHeroService, type ScoreRespuesta } from '../../../servicios/scoresHeroService';
import { cargarProgresoSecciones } from '../../../servicios/seccionesProgresoService';
import type { Seccion } from '../tiposSecciones';

function parsearSecciones(raw: any): Seccion[] {
  let secs = raw;
  if (typeof secs === 'string') {
    try { secs = JSON.parse(secs); } catch { secs = []; }
  }
  if (!Array.isArray(secs)) return [];
  return secs
    .filter((s: any) => s && typeof s.id === 'string' && s.id.length > 0)
    .sort((a: any, b: any) => (a.tickInicio ?? 0) - (b.tickInicio ?? 0));
}

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
  seccionSeleccionada?: Seccion | null;
}

export function usePantallaResultados({
  estadisticas, cancion, modo, mostrarGuardado,
  tituloSugeridoGrabacion, tituloGrabacionGuardada, onGuardarGrabacion,
  seccionSeleccionada,
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
  const [estadoSeccion, setEstadoSeccion] = useState<EstadoSeccionUsuario | null>(null);
  const [siguienteSeccion, setSiguienteSeccion] = useState<Seccion | null>(null);
  const [progresoSecciones, setProgresoSecciones] = useState<Record<string, EstadoSeccionUsuario>>({});

  // Secciones ordenadas de la canción
  const seccionesCancion = useMemo(() => parsearSecciones((cancion as any)?.secciones), [cancion]);
  const desbloqueoSecuencial = (cancion as any)?.desbloqueo_secuencial !== false;

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
        porcentaje_completado: 100,
        seccion_id: seccionSeleccionada?.id ?? null,
        seccion_nombre: seccionSeleccionada?.nombre ?? null,
      });
      if (respuesta) {
        setScoreRespuesta(respuesta);
        setTimeout(() => setAnimandoXP(true), 500);
      }
      // Si fue intento de sección, recargar progreso completo para mostrar feedback y desbloquear siguiente
      if (seccionSeleccionada?.id && cancion.id) {
        try {
          const progreso = await cargarProgresoSecciones(usuario.id, cancion.id);
          setProgresoSecciones(progreso);
          const nuevo = progreso[seccionSeleccionada.id] || null;
          setEstadoSeccion(nuevo);

          // Calcular siguiente sección a sugerir si la actual quedó completada
          if (nuevo?.completada && seccionesCancion.length > 0) {
            const idxActual = seccionesCancion.findIndex(s => s.id === seccionSeleccionada.id);
            if (idxActual !== -1 && idxActual < seccionesCancion.length - 1) {
              // Buscar la siguiente sección no completada
              for (let i = idxActual + 1; i < seccionesCancion.length; i++) {
                const sigSeccion = seccionesCancion[i];
                const sigEstado = progreso[sigSeccion.id];
                if (!sigEstado?.completada) {
                  // En desbloqueo secuencial sólo se sugiere la inmediatamente siguiente
                  // (que ya queda disponible al completarse la actual)
                  if (desbloqueoSecuencial && i !== idxActual + 1) break;
                  setSiguienteSeccion(sigSeccion);
                  break;
                }
              }
            }
          }
        } catch (_) {}
      }
    };
    guardar();
  }, [usuario, cancion, puntos, precision, totalNotas, notasPerfecto, notasBien, notasFalladas, notasPerdidas, rachaMasLarga, multiplicador, modo, seccionSeleccionada?.id, seccionSeleccionada?.nombre, seccionesCancion, desbloqueoSecuencial]);

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
    // `guardarGrabacionPendiente` espera un objeto `datos` con .titulo y .descripcion
    // (lee `datos.titulo?.trim()`). Antes llamábamos con dos strings sueltos → datos.titulo
    // era undefined → error "Debes escribir un titulo." aunque el campo estuviera lleno.
    await onGuardarGrabacion({ titulo: tituloLimpio, descripcion: descripcionGrabacion } as any);
  };

  return {
    usuario, puntos, notasPerfecto, notasBien, notasFalladas, notasPerdidas,
    rachaMasLarga, totalNotas, estrellas, precision,
    tituloGrabacion, setTituloGrabacion,
    descripcionGrabacion, setDescripcionGrabacion,
    errorLocal, modalGuardadoAbierto, setModalGuardadoAbierto,
    scoreRespuesta, modalHistorialAbierto, setModalHistorialAbierto,
    animandoXP, mensajeMotivacion, manejarGuardar,
    estadoSeccion, siguienteSeccion, progresoSecciones,
  };
}
