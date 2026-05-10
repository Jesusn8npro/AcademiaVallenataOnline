import { useCallback, useEffect, useRef, useState } from 'react';
import { motorAudioPro } from '../../audio/AudioEnginePro';
import { mapaTeclas, tono } from '../../acordeon/mapaTecladoYFrecuencias';
import { mapaTeclasBajos, cambiarFuelle } from '../../acordeon/notasAcordeonDiatonico';
import { VOL_PITOS, VOL_BAJOS } from '../_utilidadesAcordeon';

/**
 * useAcordeonHardware
 * --------------------
 * Encapsula la conectividad del acordeon con el mundo fisico:
 *  - Teclado del PC (mapaTeclas + mapaTeclasBajos)
 *  - ESP32 vía Web Serial API (lectura de eventos H1/H2/BA + fuelle)
 *
 * Recibe callbacks y refs del hook orquestador (useLogicaAcordeon).
 * No maneja audio internamente; delega en `actualizarBotonActivo`,
 * `ejecutarSwapDireccion` y `reproducirTono`.
 */
type Direccion = 'halar' | 'empujar';

interface Args {
  // Refs compartidos del orquestador
  botonesActivosRef: React.MutableRefObject<Record<string, any>>;
  direccionRef: React.MutableRefObject<Direccion>;
  hardwareMapRef: React.MutableRefObject<Map<string, string>>;
  deshabilitarRef: React.MutableRefObject<boolean>;
  tipoFuelleActivoRef: React.MutableRefObject<'US' | 'SL'>;
  mapaBotonesActualRef: React.MutableRefObject<Record<string, any>>;
  ajustesRef: React.MutableRefObject<any>;
  teclasFastMapRef: React.MutableRefObject<Record<string, any>>;
  // Estado y setters externos
  modoAjuste: boolean;
  setDireccion: (d: Direccion) => void;
  setBotonesActivos: (val: Record<string, any>) => void;
  setBotonSeleccionado: (id: string | null) => void;
  // Callbacks
  actualizarBotonActivo: (id: string, accion: 'add' | 'remove', instancias?: any[] | null, silencioso?: boolean) => void;
  ejecutarSwapDireccion: (nuevaDir: Direccion) => void;
  reproducirTono: (id: string) => { instances: any[] };
  detenerTono: (id: string) => void;
  instrumentoId: string;
}

export function useAcordeonHardware({
  botonesActivosRef,
  direccionRef,
  hardwareMapRef,
  deshabilitarRef,
  tipoFuelleActivoRef,
  mapaBotonesActualRef,
  ajustesRef,
  teclasFastMapRef,
  modoAjuste,
  setDireccion,
  setBotonesActivos,
  setBotonSeleccionado,
  actualizarBotonActivo,
  ejecutarSwapDireccion,
  reproducirTono,
  detenerTono,
  instrumentoId,
}: Args) {
  const [midiActivado] = useState(false);
  const [esp32Conectado, setEsp32Conectado] = useState(false);
  const esp32PortRef = useRef<any>(null);

  /** Maneja teclado fisico (keydown/keyup). */
  const manejarEventoTeclado = useCallback((e: KeyboardEvent | React.KeyboardEvent, esPresionada: boolean) => {
    if (deshabilitarRef.current) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    const tecla = e.key.toLowerCase();

    if (tecla === cambiarFuelle) {
      const nuevaDireccion: Direccion = esPresionada ? 'empujar' : 'halar';
      if (nuevaDireccion !== direccionRef.current) ejecutarSwapDireccion(nuevaDireccion);
      return;
    }

    const d = mapaTeclas[tecla] || mapaTeclasBajos[tecla];
    if (!d) return;
    const esBajo = !!mapaTeclasBajos[tecla];
    const id = `${d.fila}-${d.columna}-${direccionRef.current}${esBajo ? '-bajo' : ''}`;

    if (esPresionada && !(e as KeyboardEvent).repeat) {
      if (modoAjuste) setBotonSeleccionado(id);

      const fastData = teclasFastMapRef.current[tecla];
      if (fastData) {
        const dir = direccionRef.current;
        const rawRutas = dir === 'halar' ? fastData.rutasHalar : fastData.rutasEmpujar;
        const userPitch = dir === 'halar' ? fastData.userPitchHalar : fastData.userPitchEmpujar;
        const vol = fastData.esBajo ? VOL_BAJOS : VOL_PITOS;
        const instanciasFast = rawRutas.map((rRaw: string) => {
          let r = rRaw; let pBase = 0;
          if (rRaw.startsWith('pitch:')) {
            const parts = rRaw.replace('pitch:', '').split('|');
            pBase = parseInt(parts[0]); r = parts[1];
          }
          const gPitch = ajustesRef.current.pitchGlobal || 0;
          return motorAudioPro.reproducir(r, instrumentoId, vol, gPitch + userPitch + pBase);
        }).filter(Boolean);
        actualizarBotonActivo(id, 'add', instanciasFast);
      } else {
        actualizarBotonActivo(id, 'add');
      }
    } else if (!esPresionada) {
      actualizarBotonActivo(id, 'remove');
    }
  }, [actualizarBotonActivo, ejecutarSwapDireccion, modoAjuste, instrumentoId]);

  // Listeners globales de teclado
  useEffect(() => {
    const hKD = (e: KeyboardEvent) => manejarEventoTeclado(e, true);
    const hKU = (e: KeyboardEvent) => manejarEventoTeclado(e, false);
    window.addEventListener('keydown', hKD);
    window.addEventListener('keyup', hKU);
    return () => {
      window.removeEventListener('keydown', hKD);
      window.removeEventListener('keyup', hKU);
    };
  }, [manejarEventoTeclado]);

  /** Conexion directa al ESP32 (Web Serial API, sin Hairless ni loopMIDI). */
  const conectarESP32 = useCallback(async () => {
    if (!(navigator as any).serial) return;
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      esp32PortRef.current = port;
      setEsp32Conectado(true);

      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      const activeTimeouts: Record<string, any> = {};
      let partialLine = '';

      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const lines = (partialLine + value).split('\n');
            partialLine = lines.pop() || '';
            let huboCambio = false;

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              const parts = trimmed.split(',');
              if (parts.length < 2) continue;

              const tipo = parts[0];
              const val = parts[1];
              const estadoStr = parts[2];

              if (tipo === 'F_US' || tipo === 'F_SL' || tipo === 'FUELLE') {
                if ((tipo === 'F_US' && tipoFuelleActivoRef.current !== 'US') ||
                    (tipo === 'F_SL' && tipoFuelleActivoRef.current !== 'SL')) continue;

                const nuevaDir: Direccion = val === 'ABRIR' ? 'halar' : 'empujar';
                if (nuevaDir !== direccionRef.current) {
                  const prev = { ...botonesActivosRef.current };
                  const next: Record<string, any> = {};
                  Object.keys(prev).forEach(oldId => {
                    const idParts = oldId.split('-');
                    if (idParts.length < 3) return;
                    const esBajo = oldId.includes('bajo');
                    const newId = `${idParts[0]}-${idParts[1]}-${nuevaDir}${esBajo ? '-bajo' : ''}`;
                    if (newId !== oldId) {
                      detenerTono(oldId);
                      const { instances } = reproducirTono(newId);
                      if (instances?.length) next[newId] = { instances, ...mapaBotonesActualRef.current[newId] };
                    } else next[oldId] = prev[oldId];
                  });
                  hardwareMapRef.current.forEach((logicalId, physicalKey) => {
                    const idParts = logicalId.split('-');
                    if (idParts.length >= 3) {
                      const esBajo = logicalId.includes('bajo');
                      hardwareMapRef.current.set(physicalKey, `${idParts[0]}-${idParts[1]}-${nuevaDir}${esBajo ? '-bajo' : ''}`);
                    }
                  });
                  direccionRef.current = nuevaDir;
                  botonesActivosRef.current = next;
                  setDireccion(nuevaDir);
                  huboCambio = true;
                }
              } else if (['H1', 'H2', 'BA'].includes(tipo)) {
                const idx = parseInt(val);
                const physicalKey = `${tipo}-${idx}`;
                let note = 0;
                if (tipo === 'H1') note = (idx < 6) ? 48 + (5 - idx) : 60 + (idx - 6);
                else if (tipo === 'H2') note = (idx >= 11) ? 54 + (15 - idx) : 71 + (10 - idx);
                else if (tipo === 'BA') note = (idx <= 11) ? 30 + idx : (idx === 12 ? 81 : 0);
                if (note === 0) continue;

                if (estadoStr !== undefined) {
                  const isOn = estadoStr === '1';
                  if (isOn) {
                    let idBoton: string | null = null;
                    if (note >= 60 && note <= 70) idBoton = `1-${note - 59}-${direccionRef.current}`;
                    else if (note >= 48 && note <= 59) idBoton = `2-${note - 47}-${direccionRef.current}`;
                    else if (note >= 71 && note <= 82) idBoton = `3-${note - 70}-${direccionRef.current}`;
                    if (note >= 30 && note <= 41) {
                      const map: Record<number, string> = {
                        30: '2-6', 31: '2-5', 32: '2-4', 33: '2-3', 34: '1-2', 35: '1-1',
                        36: '1-6', 37: '1-5', 38: '1-4', 39: '1-3', 40: '2-2', 41: '2-1'
                      };
                      const base = map[note];
                      if (base) idBoton = `${base}-${direccionRef.current}-bajo`;
                    } else if (note === 81) idBoton = `3-11-${direccionRef.current}`;
                    if (idBoton) {
                      hardwareMapRef.current.set(physicalKey, idBoton);
                      actualizarBotonActivo(idBoton, 'add', null, true);
                      huboCambio = true;
                    }
                  } else {
                    const logicalId = hardwareMapRef.current.get(physicalKey);
                    if (logicalId) {
                      actualizarBotonActivo(logicalId, 'remove', null, true);
                      hardwareMapRef.current.delete(physicalKey);
                      huboCambio = true;
                    }
                  }
                } else {
                  // Modo compatibilidad: hardware viejo manda pulsos sin estado on/off.
                  let idBoton: string | null = null;
                  if (note >= 60 && note <= 70) idBoton = `1-${note - 59}-${direccionRef.current}`;
                  else if (note >= 48 && note <= 59) idBoton = `2-${note - 47}-${direccionRef.current}`;
                  else if (note >= 71 && note <= 82) idBoton = `3-${note - 70}-${direccionRef.current}`;
                  if (note >= 30 && note <= 41) {
                    const base = { 30: '2-6', 31: '2-5', 32: '2-4', 33: '2-3', 34: '1-2', 35: '1-1', 36: '1-6', 37: '1-5', 38: '1-4', 39: '1-3', 40: '2-2', 41: '2-1' }[note];
                    if (base) idBoton = `${base}-${direccionRef.current}-bajo`;
                  } else if (note === 81) idBoton = `3-11-${direccionRef.current}`;
                  if (idBoton) {
                    if (activeTimeouts[idBoton]) clearTimeout(activeTimeouts[idBoton]);
                    else { actualizarBotonActivo(idBoton, 'add', null, true); huboCambio = true; }
                    const currentId = idBoton;
                    activeTimeouts[idBoton] = setTimeout(() => {
                      actualizarBotonActivo(currentId, 'remove');
                      delete activeTimeouts[currentId];
                    }, 400);
                  }
                }
              }
            }
            // Sync unico por paquete serial.
            if (huboCambio) setBotonesActivos({ ...botonesActivosRef.current });
          }
        } catch (err) {
          setEsp32Conectado(false);
        } finally {
          reader.releaseLock();
        }
      };
      readLoop();
    } catch (err) {
      setEsp32Conectado(false);
    }
  }, [actualizarBotonActivo, reproducirTono, detenerTono]);

  return { midiActivado, esp32Conectado, conectarESP32, manejarEventoTeclado };
}
