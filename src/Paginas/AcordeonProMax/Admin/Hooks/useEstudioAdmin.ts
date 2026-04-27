import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMetronomoGlobal } from '../../../../Core/hooks/useMetronomoGlobal';
import { obtenerModeloVisualPorId, resolverImagenModeloAcordeon } from '../../PracticaLibre/Datos/modelosVisualesAcordeon';
import { useEstudioPracticaLibre } from '../../PracticaLibre/Hooks/useEstudioPracticaLibre';
import { useLogicaProMax } from '../../Hooks/useLogicaProMax';
import { useReproductorAcordesAdmin } from './useReproductorAcordesAdmin';
import { useCancionLibreria } from './useCancionLibreria';
import { useEditorSecuenciaAdmin } from './useEditorSecuenciaAdmin';
import { usePosicionProMax } from '../../Hooks/usePosicionProMax';
import { useAudioFondoPracticaLibre } from '../../PracticaLibre/Hooks/useAudioFondoPracticaLibre';

const IMG_ACORDEON = '/Acordeon PRO MAX.png';

export function useEstudioAdmin() {
  const navigate = useNavigate();
  const hero = useLogicaProMax();
  const logica = hero.logica;

  const [modoAjuste, setModoAjuste] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState<'diseno' | 'sonido'>('diseno');
  const [modalCreadorAcordesVisible, setModalCreadorAcordesVisible] = useState(false);
  const [modalListaAcordesVisible, setModalListaAcordesVisible] = useState(false);
  const [acordeAEditar, setAcordeAEditar] = useState<any>(null);

  const estudio = useEstudioPracticaLibre({
    tonalidadSeleccionada: logica.tonalidadSeleccionada,
    instrumentoId: logica.instrumentoId,
    grabando: hero.grabaciones.grabando,
    volumenAcordeon: hero.volumenAcordeon,
    setVolumenAcordeon: hero.setVolumenAcordeon,
  });

  const libreria = useCancionLibreria({
    bpm: hero.bpm,
    onCambiarBpm: hero.cambiarBpm,
    logica,
    reproduciendo: hero.reproduciendo,
    pausado: hero.pausado,
    onAlternarPausa: hero.alternarPausaReproduccion,
    onBuscarTick: hero.buscarTick,
    onReproducirSecuencia: hero.reproducirSecuencia,
  });

  const { metronomoActivo, setMetronomoActivo } = useMetronomoGlobal({
    bpmHero: libreria.bpmHero,
    reproduciendo: hero.reproduciendo,
  });

  const rec = useEditorSecuenciaAdmin({
    bpm: hero.bpm,
    grabandoSesion: hero.grabaciones.grabando,
    logica,
    metronomoActivo,
    reproduciendo: hero.reproduciendo,
    pausado: hero.pausado,
    tickActual: hero.tickActual,
    loopAB: hero.loopAB,
    secuencia: hero.secuencia,
    totalTicks: hero.totalTicks,
    onAlternarPausa: hero.alternarPausaReproduccion,
    onAlternarLoop: hero.alternarLoopAB,
    onBuscarTick: hero.buscarTick,
    onReproducirSecuencia: hero.reproducirSecuencia,
    onLimpiarLoop: hero.limpiarLoopAB,
    onCambiarBpm: hero.cambiarBpm,
    libreria,
  });

  const { idSonandoCiclo, acordeMaestroActivo, onReproducirAcorde, onDetener, onEditarAcorde, onNuevoAcordeEnCirculo, onReproducirCirculoCompleto } = useReproductorAcordesAdmin(
    logica,
    setModalListaAcordesVisible,
    setAcordeAEditar,
    setModalCreadorAcordesVisible
  );

  const { refAlumno, obtenerPosicionAlumno } = usePosicionProMax();

  const audioRef = useAudioFondoPracticaLibre({
    reproduciendo: hero.reproduciendo,
    pausado: hero.pausado,
    bpm: hero.bpm,
    tickActual: hero.tickActual,
    cancionData: { bpm: libreria.bpmOriginalGrabacion, resolucion: 192, audio_fondo_url: libreria.pistaUrl },
    audioUrl: libreria.pistaUrl,
    volumen: 0.8,
  });

  const modeloActivo = useMemo(
    () => obtenerModeloVisualPorId(estudio.preferencias.modeloVisualId),
    [estudio.preferencias.modeloVisualId]
  );

  const ajustesPractica = useMemo(() => ({
    ...logica.ajustes,
    tamano: 'var(--estudio-acordeon-tamano)',
    x: 'var(--estudio-acordeon-x)',
    y: 'var(--estudio-acordeon-y)',
  }), [logica.ajustes]);

  const nombreInstrumento = useMemo(() => {
    const actual = logica.listaInstrumentos?.find((i: any) => i.id === logica.instrumentoId);
    return actual?.nombre || 'Acordeon original';
  }, [logica.instrumentoId, logica.listaInstrumentos]);

  const botonesActivosAcordeon = useMemo(
    () => (hero.reproduciendo && hero.botonesActivosMaestro ? hero.botonesActivosMaestro : logica.botonesActivos),
    [hero.reproduciendo, hero.botonesActivosMaestro, logica.botonesActivos]
  );

  const direccionAcordeon = useMemo(
    () => (hero.reproduciendo && hero.direccionMaestro ? hero.direccionMaestro : logica.direccion),
    [hero.reproduciendo, hero.direccionMaestro, logica.direccion]
  );

  const imagenFondoAcordeon = useMemo(
    () => resolverImagenModeloAcordeon(estudio.preferencias.modeloVisualId, IMG_ACORDEON),
    [estudio.preferencias.modeloVisualId]
  );

  useEffect(() => {
    if (typeof logica.guardarAjustes !== 'function') return;
    const timer = window.setTimeout(() => void logica.guardarAjustes(), 420);
    return () => window.clearTimeout(timer);
  }, [logica.ajustes?.timbre, logica.guardarAjustes, logica.instrumentoId, logica.modoVista, logica.tonalidadSeleccionada]);

  const onGuardarHero = useCallback(async (datos: {
    titulo: string; autor: string; descripcion: string;
    tipo: 'secuencia' | 'cancion' | 'ejercicio';
    dificultad: 'basico' | 'intermedio' | 'profesional';
  }) => {
    const secuenciaFinal = rec.grabadorLocal.secuencia;
    if (!secuenciaFinal?.length) {
      rec.setMensajeEdicionSecuencia('No hay notas grabadas. Presiona algunos botones del acordeon antes de guardar.');
      return;
    }
    try {
      const resultado = await rec.grabadorLocal.guardarSecuencia({
        titulo: datos.titulo, autor: datos.autor, descripcion: datos.descripcion,
        tipo: datos.tipo, dificultad: datos.dificultad,
        usoMetronomo: rec.usoMetronomoRef.current,
        tonalidad: logica.tonalidadSeleccionada, pistaFile: libreria.pistaFile,
      });
      if (resultado.error) {
        const msg = typeof resultado.error === 'string' ? resultado.error : (resultado.error as any)?.message || 'Error al guardar';
        rec.setMensajeEdicionSecuencia('Error al guardar: ' + msg);
      } else {
        rec.setModalGuardarHeroVisible(false);
      }
    } catch (error: any) {
      rec.setMensajeEdicionSecuencia('Error: ' + error?.message);
    }
  }, [rec, logica.tonalidadSeleccionada, libreria.pistaFile]);

  const manejarGrabacionSesion = useCallback(async () => {
    if (rec.grabandoRecPro || rec.esperandoPunchIn) return;
    if (hero.grabaciones.grabando) { hero.grabaciones.detenerGrabacionPracticaLibre(); return; }
    if (estudio.pistaActiva) await estudio.prepararPistaParaGrabar();
    hero.grabaciones.iniciarGrabacionPracticaLibre();
  }, [rec.grabandoRecPro, rec.esperandoPunchIn, hero.grabaciones, estudio]);

  const acordes = { idSonandoCiclo, acordeMaestroActivo, onReproducirAcorde, onDetener, onEditarAcorde, onNuevoAcordeEnCirculo, onReproducirCirculoCompleto };

  const modalesProps = {
    logica, rec, libreria, heroGrabaciones: hero.grabaciones, acordes,
    modoAjuste, setModoAjuste,
    pestanaActiva, setPestanaActiva,
    modalCreadorAcordesVisible, setModalCreadorAcordesVisible,
    modalListaAcordesVisible, setModalListaAcordesVisible,
    acordeAEditar, setAcordeAEditar,
    onGuardarHero,
  };

  return {
    navigate,
    hero,
    logica,
    estudio,
    libreria,
    rec,
    acordes,
    refAlumno,
    obtenerPosicionAlumno,
    audioRef,
    modeloActivo,
    ajustesPractica,
    nombreInstrumento,
    botonesActivosAcordeon,
    direccionAcordeon,
    imagenFondoAcordeon,
    metronomoActivo,
    setMetronomoActivo,
    modoAjuste,
    setModoAjuste,
    pestanaActiva,
    setPestanaActiva,
    manejarGrabacionSesion,
    modalesProps,
  };
}
