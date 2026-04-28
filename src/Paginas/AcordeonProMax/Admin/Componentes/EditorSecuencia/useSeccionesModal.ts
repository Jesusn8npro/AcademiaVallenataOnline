import { useEffect, useRef, useState, useCallback } from 'react';
import type { NotaHero } from '../../../TiposProMax';
import { actualizarCancionHeroCompleta } from '../../../../../servicios/cancionesHeroService';
import { motorAudioPro } from '../../../../../Core/audio/AudioEnginePro';
import type { Seccion } from './tiposEditor';

function slugificar(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'seccion';
}

function generarIdSeccion(nombre: string): string {
  const sufijo = Math.random().toString(36).slice(2, 7);
  return `${slugificar(nombre)}-${sufijo}`;
}

function normalizarSeccion(s: any): Seccion {
  return {
    id: typeof s?.id === 'string' && s.id.length > 0 ? s.id : generarIdSeccion(s?.nombre || 'seccion'),
    nombre: s?.nombre ?? '',
    tickInicio: Number(s?.tickInicio ?? 0),
    tickFin: Number(s?.tickFin ?? 0),
    tipo: s?.tipo === 'acompanamiento' ? 'acompanamiento' : 'melodia',
    monedas: typeof s?.monedas === 'number' && s.monedas >= 0 ? s.monedas : 1,
  };
}

interface Params {
  cancion: any;
  audioRef: { current: HTMLAudioElement | null };
  duracionAudio: number;
  reproduciendoLocal: boolean;
  setReproduciendoLocal: (v: boolean) => void;
  rAFLocalRef: { current: number };
  inicioLocalRef: { current: { ts: number; tick: number } | null };
  onCerrar: () => void;
  secuenciaEditada: NotaHero[];
}

export function useSeccionesModal({
  cancion, audioRef, duracionAudio, reproduciendoLocal,
  setReproduciendoLocal, rAFLocalRef, inicioLocalRef, onCerrar, secuenciaEditada,
}: Params) {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionNombre, setSeccionNombre] = useState('');
  const [seccionTickInicio, setSeccionTickInicio] = useState(0);
  const [seccionTickFin, setSeccionTickFin] = useState(0);
  const [seccionMonedas, setSeccionMonedas] = useState(1);
  const [seccionEditandoIndex, setSeccionEditandoIndex] = useState<number | null>(null);
  const [seccionCursorSeg, setSeccionCursorSeg] = useState(0);
  const [reproduciendoSeccion, setReproduciendoSeccion] = useState(false);
  const [guardandoSecciones, setGuardandoSecciones] = useState(false);
  const [duracionSegundosModal, setDuracionSegundosModal] = useState<number>(cancion?.duracion_segundos || 30);
  const [duracionGuardada, setDuracionGuardada] = useState<number>(cancion?.duracion_segundos || 30);
  const [guardandoDuracion, setGuardandoDuracion] = useState(false);
  const [mensajeGuardar, setMensajeGuardar] = useState<string | null>(null);
  const [desbloqueoSecuencial, setDesbloqueoSecuencial] = useState<boolean>(true);
  const [umbralPrecisionSeccion, setUmbralPrecisionSeccion] = useState<number>(80);
  const [intentosParaMoneda, setIntentosParaMoneda] = useState<number>(3);
  const [guardandoConfigSecciones, setGuardandoConfigSecciones] = useState(false);
  const rAFSeccionRef = useRef<number>(0);

  useEffect(() => {
    if (!cancion) return;
    let secs = cancion.secciones || [];
    if (typeof secs === 'string') try { secs = JSON.parse(secs); } catch { secs = []; }
    setSecciones(Array.isArray(secs) ? secs.map(normalizarSeccion) : []);
    const dur = cancion.duracion_segundos || 30;
    setDuracionSegundosModal(dur);
    setDuracionGuardada(dur);
    setDesbloqueoSecuencial(cancion.desbloqueo_secuencial !== false);
    setUmbralPrecisionSeccion(typeof cancion.umbral_precision_seccion === 'number' ? cancion.umbral_precision_seccion : 80);
    setIntentosParaMoneda(typeof cancion.intentos_para_moneda === 'number' ? cancion.intentos_para_moneda : 3);
  }, [cancion]);

  useEffect(() => {
    if (!reproduciendoSeccion) { cancelAnimationFrame(rAFSeccionRef.current); return; }
    const loop = () => {
      if (audioRef.current) {
        const t = audioRef.current.currentTime;
        setSeccionCursorSeg(t);
        if (t >= (duracionAudio || duracionSegundosModal)) { setReproduciendoSeccion(false); return; }
      }
      rAFSeccionRef.current = requestAnimationFrame(loop);
    };
    rAFSeccionRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rAFSeccionRef.current);
  }, [reproduciendoSeccion, duracionAudio, duracionSegundosModal, audioRef]);

  const togglePlaySeccion = useCallback(() => {
    if (!audioRef.current) return;
    if (reproduciendoSeccion) { audioRef.current.pause(); setReproduciendoSeccion(false); }
    else {
      if (reproduciendoLocal) { cancelAnimationFrame(rAFLocalRef.current); inicioLocalRef.current = null; setReproduciendoLocal(false); }
      motorAudioPro.activarContexto();
      audioRef.current.currentTime = seccionCursorSeg;
      audioRef.current.play().catch(() => {});
      setReproduciendoSeccion(true);
    }
  }, [reproduciendoSeccion, reproduciendoLocal, seccionCursorSeg, audioRef, rAFLocalRef, inicioLocalRef, setReproduciendoLocal]);

  const stopSeccion = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setReproduciendoSeccion(false); setSeccionCursorSeg(0);
  }, [audioRef]);

  const saltarSeccion = useCallback((delta: number) => {
    if (!audioRef.current) return;
    const nuevo = Math.max(0, Math.min(duracionAudio || duracionSegundosModal, (audioRef.current.currentTime || seccionCursorSeg) + delta));
    audioRef.current.currentTime = nuevo; setSeccionCursorSeg(nuevo);
  }, [audioRef, duracionAudio, duracionSegundosModal, seccionCursorSeg]);

  const limpiarFormulario = useCallback(() => {
    setSeccionNombre('');
    setSeccionTickInicio(0);
    setSeccionTickFin(0);
    setSeccionMonedas(1);
    setSeccionEditandoIndex(null);
  }, []);

  const agregarSeccion = () => {
    if (!seccionNombre.trim()) return;
    const nombreFinal = seccionNombre.trim();
    const monedasFinales = Number.isFinite(seccionMonedas) && seccionMonedas >= 0 ? seccionMonedas : 1;

    if (seccionEditandoIndex !== null) {
      // Modo edición: actualizar la sección existente
      setSecciones(prev => prev.map((s, i) =>
        i === seccionEditandoIndex
          ? {
              ...s,
              nombre: nombreFinal,
              tickInicio: seccionTickInicio,
              tickFin: seccionTickFin,
              monedas: monedasFinales,
            }
          : s
      ));
    } else {
      // Modo creación: agregar una nueva
      setSecciones(prev => [...prev, {
        id: generarIdSeccion(nombreFinal),
        nombre: nombreFinal,
        tickInicio: seccionTickInicio,
        tickFin: seccionTickFin,
        tipo: 'melodia',
        monedas: monedasFinales,
      }]);
    }
    limpiarFormulario();
  };

  const iniciarEdicionSeccion = useCallback((index: number) => {
    setSecciones(prev => {
      const s = prev[index];
      if (!s) return prev;
      setSeccionNombre(s.nombre);
      setSeccionTickInicio(s.tickInicio);
      setSeccionTickFin(s.tickFin);
      setSeccionMonedas(typeof s.monedas === 'number' ? s.monedas : 1);
      setSeccionEditandoIndex(index);
      return prev;
    });
  }, []);

  const cancelarEdicionSeccion = useCallback(() => {
    limpiarFormulario();
  }, [limpiarFormulario]);

  const actualizarMonedasSeccion = useCallback((index: number, monedas: number) => {
    setSecciones(prev => prev.map((s, i) =>
      i === index ? { ...s, monedas: Number.isFinite(monedas) && monedas >= 0 ? monedas : 0 } : s
    ));
  }, []);

  const handleGuardarDuracion = useCallback(async () => {
    if (!cancion?.id) return;
    setGuardandoDuracion(true);
    try {
      await actualizarCancionHeroCompleta(cancion.id, { duracion_segundos: duracionSegundosModal });
      setDuracionGuardada(duracionSegundosModal);
    } catch (e: any) { setMensajeGuardar('Error al guardar duración: ' + e.message); }
    finally { setGuardandoDuracion(false); }
  }, [cancion?.id, duracionSegundosModal]);

  const handleGuardarSecciones = useCallback(async () => {
    if (!cancion?.id) return;
    setGuardandoSecciones(true);
    try {
      await actualizarCancionHeroCompleta(cancion.id, { secciones });
      setMensajeGuardar('Secciones guardadas');
    } catch (e: any) { setMensajeGuardar('Error al guardar secciones: ' + e.message); }
    finally { setGuardandoSecciones(false); }
  }, [cancion?.id, secciones]);

  const handleGuardarConfigSecciones = useCallback(async () => {
    if (!cancion?.id) return;
    setGuardandoConfigSecciones(true);
    try {
      const umbralLimpio = Math.max(0, Math.min(100, Math.round(umbralPrecisionSeccion)));
      const intentosLimpios = Math.max(1, Math.min(99, Math.round(intentosParaMoneda)));
      await actualizarCancionHeroCompleta(cancion.id, {
        desbloqueo_secuencial: desbloqueoSecuencial,
        umbral_precision_seccion: umbralLimpio,
        intentos_para_moneda: intentosLimpios,
      });
      setMensajeGuardar('Configuración de secciones guardada');
    } catch (e: any) {
      setMensajeGuardar('Error al guardar configuración: ' + e.message);
    } finally {
      setGuardandoConfigSecciones(false);
    }
  }, [cancion?.id, desbloqueoSecuencial, umbralPrecisionSeccion, intentosParaMoneda]);

  const handleGuardar = async () => {
    try {
      const umbralLimpio = Math.max(0, Math.min(100, Math.round(umbralPrecisionSeccion)));
      const intentosLimpios = Math.max(1, Math.min(99, Math.round(intentosParaMoneda)));
      await actualizarCancionHeroCompleta(cancion.id, {
        secuencia_json: secuenciaEditada,
        secciones,
        duracion_segundos: duracionSegundosModal,
        desbloqueo_secuencial: desbloqueoSecuencial,
        umbral_precision_seccion: umbralLimpio,
        intentos_para_moneda: intentosLimpios,
      });
      setDuracionGuardada(duracionSegundosModal);
      onCerrar();
    } catch (e: any) { setMensajeGuardar('Error al guardar: ' + e.message); }
  };

  const duracionCambiada = Math.abs(duracionSegundosModal - duracionGuardada) > 0.05;

  return {
    secciones, setSecciones, seccionNombre, setSeccionNombre,
    seccionTickInicio, setSeccionTickInicio, seccionTickFin, setSeccionTickFin,
    seccionMonedas, setSeccionMonedas, actualizarMonedasSeccion,
    seccionEditandoIndex, iniciarEdicionSeccion, cancelarEdicionSeccion,
    seccionCursorSeg, setSeccionCursorSeg, reproduciendoSeccion, setReproduciendoSeccion,
    guardandoSecciones, duracionSegundosModal, setDuracionSegundosModal,
    duracionGuardada, guardandoDuracion, mensajeGuardar, setMensajeGuardar,
    desbloqueoSecuencial, setDesbloqueoSecuencial,
    umbralPrecisionSeccion, setUmbralPrecisionSeccion,
    intentosParaMoneda, setIntentosParaMoneda,
    guardandoConfigSecciones, handleGuardarConfigSecciones,
    togglePlaySeccion, stopSeccion, saltarSeccion, agregarSeccion,
    handleGuardarDuracion, handleGuardarSecciones, handleGuardar, duracionCambiada,
  };
}
