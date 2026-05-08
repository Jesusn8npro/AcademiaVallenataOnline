import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Sliders } from 'lucide-react';
import './PanelEfectosAudio.css';

// Layout horizontal compacto (sin scroll) inspirado en apps móviles de
// acordeón vallenato. Cabe en pantallas ≥720px de ancho. Las 5 bandas del EQ
// son visualmente independientes pero internamente se mapean a las 3 bandas
// reales del motor (graves/medios/agudos) — los pares 60+230Hz alimentan
// `graves` y los pares 3.6k+14kHz alimentan `agudos`. Esto evita tocar el
// motor de audio (preserva latencia Android) pero le da al alumno control
// gradual sobre 5 zonas frecuenciales.

type PresetReverbId =
  | 'cuarto_mediano'
  | 'cuarto_grande'
  | 'vestibulo_mediano'
  | 'vestibulo_grande'
  | 'escenario_abierto';

interface PanelEfectosAudioProps {
  reverbActivo: boolean;
  reverbIntensidad: number;
  reverbPreset?: PresetReverbId;
  onCambiarReverbActivo: (activo: boolean) => void;
  onCambiarReverbIntensidad: (valor: number) => void;
  onCambiarReverbPreset?: (preset: PresetReverbId) => void;

  // Las 3 bandas reales del motor. Internamente las exponemos como 5 sliders.
  graves: number;
  medios: number;
  agudos: number;
  onCambiarGraves: (v: number) => void;
  onCambiarMedios: (v: number) => void;
  onCambiarAgudos: (v: number) => void;

  volumenTeclado: number;
  volumenBajos: number;
  volumenLoops: number;
  volumenMetronomo: number;
  onCambiarVolumenTeclado: (v: number) => void;
  onCambiarVolumenBajos: (v: number) => void;
  onCambiarVolumenLoops: (v: number) => void;
  onCambiarVolumenMetronomo: (v: number) => void;

  onPreviewTecladoIniciar?: () => void;
  onPreviewTecladoDetener?: () => void;
  onPreviewBajosIniciar?: () => void;
  onPreviewBajosDetener?: () => void;
  onPreviewLoopsIniciar?: () => void;
  onPreviewLoopsDetener?: () => void;
  onPreviewMetronomoIniciar?: () => void;
  onPreviewMetronomoDetener?: () => void;

  // Pan stereo: -50 izquierda, 0 centro, 50 derecha. Si el padre no los provee,
  // el componente cae a state local (compatibilidad con Práctica Libre que aún
  // no tiene buses con pan en el motor).
  panTeclado?: number;
  panBajos?: number;
  panLoops?: number;
  panMetronomo?: number;
  onCambiarPanTeclado?: (v: number) => void;
  onCambiarPanBajos?: (v: number) => void;
  onCambiarPanLoops?: (v: number) => void;
  onCambiarPanMetronomo?: (v: number) => void;

  onCerrar?: () => void;
  onRestaurar?: () => void;
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

interface KnobProps {
  valor: number;
  min: number;
  max: number;
  etiqueta?: string;
  acento?: 'naranja' | 'azul' | 'verde' | 'morado' | 'cyan';
  deshabilitado?: boolean;
  onCambiar: (v: number) => void;
  // Preview opcional: si se proveen, al mantener presionado el knob se dispara
  // un sample de la sección correspondiente para escuchar el cambio en vivo.
  onPreviewIniciar?: () => void;
  onPreviewDetener?: () => void;
}

const Knob: React.FC<KnobProps> = ({
  valor, min, max, etiqueta, acento = 'cyan', deshabilitado, onCambiar,
  onPreviewIniciar, onPreviewDetener,
}) => {
  const rango = max - min;
  const proporcion = rango > 0 ? (valor - min) / rango : 0;
  // -135deg a +135deg = 270 grados de barrido (típico de knobs reales)
  const rotacion = -135 + proporcion * 270;

  // Mismo patrón que Fader para que el preview no se duplique con eventos
  // simultáneos de pointer + touch en mobile.
  const enPreviewRef = useRef(false);
  const arrancar = useCallback(() => {
    if (enPreviewRef.current) return;
    enPreviewRef.current = true;
    onPreviewIniciar?.();
  }, [onPreviewIniciar]);
  const detener = useCallback(() => {
    if (!enPreviewRef.current) return;
    enPreviewRef.current = false;
    onPreviewDetener?.();
  }, [onPreviewDetener]);

  return (
    <div className={`pea-knob pea-acento-${acento} ${deshabilitado ? 'pea-knob-disabled' : ''}`}>
      <div className="pea-knob-cuerpo">
        <div className="pea-knob-disco" style={{ transform: `rotate(${rotacion}deg)` }}>
          <div className="pea-knob-marca" />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={valor}
          disabled={deshabilitado}
          onChange={(e) => onCambiar(parseInt(e.target.value, 10))}
          onPointerDown={arrancar}
          onPointerUp={detener}
          onPointerLeave={detener}
          onPointerCancel={detener}
          aria-label={etiqueta}
        />
      </div>
      {etiqueta && <span className="pea-knob-etiqueta">{etiqueta}</span>}
    </div>
  );
};

interface SwitchProps {
  activo: boolean;
  onCambiar: (activo: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ activo, onCambiar }) => (
  <button
    type="button"
    role="switch"
    aria-checked={activo}
    className={`pea-switch ${activo ? 'activo' : ''}`}
    onClick={() => onCambiar(!activo)}
  >
    <span />
  </button>
);

interface FaderProps {
  valor: number;
  min?: number;
  max?: number;
  acento?: 'naranja' | 'azul' | 'verde' | 'morado' | 'rojo';
  // Pan -50..50: define qué tan pronunciada es la diferencia entre la barra
  // izquierda y derecha del visualizador estéreo. 0 = ambas iguales.
  pan?: number;
  onCambiar: (v: number) => void;
  onPreviewIniciar?: () => void;
  onPreviewDetener?: () => void;
}

const Fader: React.FC<FaderProps> = ({
  valor, min = 0, max = 100, acento = 'naranja', pan = 0,
  onCambiar, onPreviewIniciar, onPreviewDetener,
}) => {
  // Una sola ref evita arranques duplicados si llegan pointerdown + touchstart
  const enPreviewRef = useRef(false);

  const arrancar = useCallback(() => {
    if (enPreviewRef.current) return;
    enPreviewRef.current = true;
    onPreviewIniciar?.();
  }, [onPreviewIniciar]);

  const detener = useCallback(() => {
    if (!enPreviewRef.current) return;
    enPreviewRef.current = false;
    onPreviewDetener?.();
  }, [onPreviewDetener]);

  // Visualizador estéreo: dos barras paralelas L/R cuya altura = volumen
  // ajustado por pan. PAN +50 → solo derecha; PAN -50 → solo izquierda.
  const proporcionVol = Math.max(0, Math.min(1, (valor - min) / (max - min)));
  const proporcionPan = Math.max(-1, Math.min(1, pan / 50));
  const factorL = proporcionPan <= 0 ? 1 : 1 - proporcionPan;
  const factorR = proporcionPan >= 0 ? 1 : 1 + proporcionPan;
  const alturaL = proporcionVol * factorL * 100;
  const alturaR = proporcionVol * factorR * 100;

  return (
    <div className={`pea-fader pea-acento-${acento}`}>
      <div className="pea-fader-canales" aria-hidden="true">
        <div className="pea-fader-canal pea-fader-canal-l" style={{ height: `${alturaL}%` }} />
        <div className="pea-fader-canal pea-fader-canal-r" style={{ height: `${alturaR}%` }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={valor}
        onChange={(e) => onCambiar(parseInt(e.target.value, 10))}
        onPointerDown={arrancar}
        onPointerUp={detener}
        onPointerLeave={detener}
        onPointerCancel={detener}
        style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
      />
    </div>
  );
};

// ─── Componente principal ───────────────────────────────────────────────────

const PanelEfectosAudio: React.FC<PanelEfectosAudioProps> = ({
  reverbActivo, reverbIntensidad, reverbPreset, onCambiarReverbActivo, onCambiarReverbIntensidad, onCambiarReverbPreset,
  graves, medios, agudos, onCambiarGraves, onCambiarMedios, onCambiarAgudos,
  volumenTeclado, volumenBajos, volumenLoops, volumenMetronomo,
  onCambiarVolumenTeclado, onCambiarVolumenBajos, onCambiarVolumenLoops, onCambiarVolumenMetronomo,
  onPreviewTecladoIniciar, onPreviewTecladoDetener,
  onPreviewBajosIniciar, onPreviewBajosDetener,
  onPreviewLoopsIniciar, onPreviewLoopsDetener,
  onPreviewMetronomoIniciar, onPreviewMetronomoDetener,
  panTeclado: panTecladoExt, panBajos: panBajosExt, panLoops: panLoopsExt, panMetronomo: panMetronomoExt,
  onCambiarPanTeclado, onCambiarPanBajos, onCambiarPanLoops, onCambiarPanMetronomo,
  onCerrar, onRestaurar,
}) => {
  // Estados de toggles para Eco y Distors (UI funcional pero sin backend audio
  // hoy — se conectarán a DelayNode + WaveShaperNode en una fase posterior).
  const [ecoActivo, setEcoActivo] = useState(false);
  const [ecoIntensidad, setEcoIntensidad] = useState(30);
  const [ecoTiempo, setEcoTiempo] = useState(40);
  const [distorsActivo, setDistorsActivo] = useState(false);
  const [distorsIntensidad, setDistorsIntensidad] = useState(25);

  // EQ de 5 bandas. Internamente mantiene los 5 valores propios; en useEffect
  // los promedia y empuja a las 3 props reales (graves/medios/agudos).
  // Inicialización SOLO al montar — después la fuente de verdad son los 5 locales.
  const [eq60, setEq60] = useState(graves);
  const [eq230, setEq230] = useState(graves);
  const [eq910, setEq910] = useState(medios);
  const [eq3600, setEq3600] = useState(agudos);
  const [eq14k, setEq14k] = useState(agudos);

  useEffect(() => {
    onCambiarGraves(Math.round((eq60 + eq230) / 2));
  }, [eq60, eq230, onCambiarGraves]);
  useEffect(() => {
    onCambiarMedios(eq910);
  }, [eq910, onCambiarMedios]);
  useEffect(() => {
    onCambiarAgudos(Math.round((eq3600 + eq14k) / 2));
  }, [eq3600, eq14k, onCambiarAgudos]);

  // Tabs TECLAS / LOOPS — placeholder visual (los valores reales del motor son
  // globales por ahora). Cuando separemos buses por sección esto controlará
  // los presets independientes.
  const [eqContexto, setEqContexto] = useState<'teclas' | 'loops'>('teclas');

  // PAN por sección. Si el padre los pasa como controlled (panTecladoExt no es
  // undefined), usamos esos valores y empujamos cambios via onCambiar*. Si no,
  // caemos a state local (Práctica Libre — sin pan real en el motor todavía).
  const [panTecladoLocal, setPanTecladoLocal] = useState(0);
  const [panBajosLocal, setPanBajosLocal] = useState(0);
  const [panLoopsLocal, setPanLoopsLocal] = useState(0);
  const [panMetronomoLocal, setPanMetronomoLocal] = useState(0);
  const panTeclado = panTecladoExt ?? panTecladoLocal;
  const panBajos = panBajosExt ?? panBajosLocal;
  const panLoops = panLoopsExt ?? panLoopsLocal;
  const panMetronomo = panMetronomoExt ?? panMetronomoLocal;
  const setPanTeclado = onCambiarPanTeclado ?? setPanTecladoLocal;
  const setPanBajos = onCambiarPanBajos ?? setPanBajosLocal;
  const setPanLoops = onCambiarPanLoops ?? setPanLoopsLocal;
  const setPanMetronomo = onCambiarPanMetronomo ?? setPanMetronomoLocal;

  // Presets de Reverb: cada uno regenera el impulse response del ConvolverNode
  // con un perfil distinto (duración, decay, pre-delay, brillo) y aplica una
  // intensidad sugerida acorde al espacio. El padre maneja la lógica de motor.
  const presetsReverb: Array<{ id: PresetReverbId; nombre: string; intensidad: number }> = [
    { id: 'cuarto_mediano',     nombre: 'Cuarto Mediano',     intensidad: 30 },
    { id: 'cuarto_grande',      nombre: 'Cuarto Grande',      intensidad: 45 },
    { id: 'vestibulo_mediano',  nombre: 'Vestíbulo Mediano',  intensidad: 60 },
    { id: 'vestibulo_grande',   nombre: 'Vestíbulo Grande',   intensidad: 75 },
    { id: 'escenario_abierto',  nombre: 'Escenario Abierto',  intensidad: 65 },
  ];
  const presetActualReverb: PresetReverbId | 'manual' = reverbPreset ?? 'cuarto_grande';

  const handleRestaurarTodo = () => {
    setEcoActivo(false);
    setDistorsActivo(false);
    setEq60(0); setEq230(0); setEq910(0); setEq3600(0); setEq14k(0);
    setPanTeclado(0); setPanBajos(0); setPanLoops(0); setPanMetronomo(0);
    setPanTecladoLocal(0); setPanBajosLocal(0); setPanLoopsLocal(0); setPanMetronomoLocal(0);
    onRestaurar?.();
  };

  return (
    <div className="pea-root" role="dialog" aria-label="Panel de efectos de audio">
      <header className="pea-header">
        <div className="pea-header-titulo">
          <Sliders size={18} />
          <h2>Efectos de Audio</h2>
        </div>
        <div className="pea-header-acciones">
          <button type="button" className="pea-btn-secundario" disabled title="Próximamente">
            Avanzado
          </button>
          {onCerrar && (
            <button
              type="button"
              className="pea-btn-cerrar"
              onClick={onCerrar}
              aria-label="Cerrar panel"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="pea-fila-procesadores">
        <div className="pea-procesador">
          <div className="pea-procesador-cabecera">
            <span className="pea-procesador-nombre">Reverb</span>
            <Switch activo={reverbActivo} onCambiar={onCambiarReverbActivo} />
          </div>
          <div className="pea-procesador-control">
            <label className="pea-preset-row">
              <span>Preaj.</span>
              <select
                value={presetActualReverb}
                disabled={!reverbActivo}
                onChange={(e) => {
                  const preset = presetsReverb.find((p) => p.id === e.target.value);
                  if (!preset) return;
                  // Cambia el IR del ConvolverNode (timbre del espacio) y
                  // aplica la intensidad sugerida de ese preset.
                  onCambiarReverbPreset?.(preset.id);
                  onCambiarReverbIntensidad(preset.intensidad);
                }}
              >
                {presetsReverb.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
            <Knob
              valor={reverbIntensidad}
              min={0}
              max={100}
              etiqueta="Intensidad"
              acento="cyan"
              deshabilitado={!reverbActivo}
              onCambiar={onCambiarReverbIntensidad}
            />
          </div>
        </div>

        <div className="pea-procesador">
          <div className="pea-procesador-cabecera">
            <span className="pea-procesador-nombre">Eco</span>
            <Switch activo={ecoActivo} onCambiar={setEcoActivo} />
          </div>
          <div className="pea-procesador-control pea-procesador-knobs">
            <Knob
              valor={ecoIntensidad}
              min={0}
              max={100}
              etiqueta="Intensidad"
              acento="azul"
              deshabilitado={!ecoActivo}
              onCambiar={setEcoIntensidad}
            />
            <Knob
              valor={ecoTiempo}
              min={0}
              max={100}
              etiqueta="Tiempo"
              acento="azul"
              deshabilitado={!ecoActivo}
              onCambiar={setEcoTiempo}
            />
          </div>
        </div>

        <div className="pea-procesador">
          <div className="pea-procesador-cabecera">
            <span className="pea-procesador-nombre">Distors.</span>
            <Switch activo={distorsActivo} onCambiar={setDistorsActivo} />
          </div>
          <div className="pea-procesador-control">
            <label className="pea-preset-row">
              <span>Preaj.</span>
              <select disabled={!distorsActivo} defaultValue="drum">
                <option value="drum">Drum room</option>
                <option value="vocal">Vocal warm</option>
                <option value="hard">Hard rock</option>
              </select>
            </label>
            <Knob
              valor={distorsIntensidad}
              min={0}
              max={100}
              etiqueta="Intensidad"
              acento="naranja"
              deshabilitado={!distorsActivo}
              onCambiar={setDistorsIntensidad}
            />
          </div>
        </div>

        <div className="pea-eq">
          <div className="pea-eq-cabecera">
            <span className="pea-procesador-nombre">Ecualizador</span>
            <div className="pea-eq-tabs">
              <button
                type="button"
                className={`pea-eq-tab ${eqContexto === 'teclas' ? 'activo' : ''}`}
                onClick={() => setEqContexto('teclas')}
              >Teclas</button>
              <button
                type="button"
                className={`pea-eq-tab ${eqContexto === 'loops' ? 'activo' : ''}`}
                onClick={() => setEqContexto('loops')}
              >Loops</button>
            </div>
          </div>
          <div className="pea-eq-grid-controles">
            <div className="pea-eq-banda">
              <input
                type="range" min={-12} max={12} value={eq60}
                onChange={(e) => setEq60(parseInt(e.target.value, 10))}
                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
                aria-label="60 Hz"
              />
              <span className="pea-eq-frec">60</span>
            </div>
            <div className="pea-eq-banda">
              <input
                type="range" min={-12} max={12} value={eq230}
                onChange={(e) => setEq230(parseInt(e.target.value, 10))}
                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
                aria-label="230 Hz"
              />
              <span className="pea-eq-frec">230</span>
            </div>
            <div className="pea-eq-banda">
              <input
                type="range" min={-12} max={12} value={eq910}
                onChange={(e) => setEq910(parseInt(e.target.value, 10))}
                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
                aria-label="910 Hz"
              />
              <span className="pea-eq-frec">910</span>
            </div>
            <div className="pea-eq-banda">
              <input
                type="range" min={-12} max={12} value={eq3600}
                onChange={(e) => setEq3600(parseInt(e.target.value, 10))}
                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
                aria-label="3.6 kHz"
              />
              <span className="pea-eq-frec">3.6k</span>
            </div>
            <div className="pea-eq-banda">
              <input
                type="range" min={-12} max={12} value={eq14k}
                onChange={(e) => setEq14k(parseInt(e.target.value, 10))}
                style={{ writingMode: 'vertical-rl' as any, direction: 'rtl' as any }}
                aria-label="14 kHz"
              />
              <span className="pea-eq-frec">14k</span>
            </div>
          </div>
          <div className="pea-eq-escala">
            <span>+12</span>
            <span>0 dB</span>
            <span>−12</span>
          </div>
        </div>
      </div>

      <div className="pea-volumenes-cabecera">
        <h3>Volúmenes</h3>
        <button type="button" className="pea-btn-secundario" onClick={handleRestaurarTodo}>
          Restaurar
        </button>
      </div>

      <div className="pea-fila-volumenes">
        <div className="pea-canal pea-acento-naranja">
          <span className="pea-canal-titulo">Teclado</span>
          <Fader
            valor={volumenTeclado}
            pan={panTeclado}
            acento="naranja"
            onCambiar={onCambiarVolumenTeclado}
            onPreviewIniciar={onPreviewTecladoIniciar}
            onPreviewDetener={onPreviewTecladoDetener}
          />
          <Knob
            valor={panTeclado}
            min={-50}
            max={50}
            etiqueta="Pan"
            acento="naranja"
            onCambiar={setPanTeclado}
            onPreviewIniciar={onPreviewTecladoIniciar}
            onPreviewDetener={onPreviewTecladoDetener}
          />
          <div className="pea-canal-pan-labels"><span>I</span><span>D</span></div>
        </div>

        <div className="pea-canal pea-acento-azul">
          <span className="pea-canal-titulo">Bajos</span>
          <Fader
            valor={volumenBajos}
            pan={panBajos}
            acento="azul"
            onCambiar={onCambiarVolumenBajos}
            onPreviewIniciar={onPreviewBajosIniciar}
            onPreviewDetener={onPreviewBajosDetener}
          />
          <Knob
            valor={panBajos}
            min={-50}
            max={50}
            etiqueta="Pan"
            acento="azul"
            onCambiar={setPanBajos}
            onPreviewIniciar={onPreviewBajosIniciar}
            onPreviewDetener={onPreviewBajosDetener}
          />
          <div className="pea-canal-pan-labels"><span>I</span><span>D</span></div>
        </div>

        <div className="pea-canal pea-acento-verde">
          <span className="pea-canal-titulo">Loops</span>
          <Fader
            valor={volumenLoops}
            pan={panLoops}
            acento="verde"
            onCambiar={onCambiarVolumenLoops}
            onPreviewIniciar={onPreviewLoopsIniciar}
            onPreviewDetener={onPreviewLoopsDetener}
          />
          <Knob
            valor={panLoops}
            min={-50}
            max={50}
            etiqueta="Pan"
            acento="verde"
            onCambiar={setPanLoops}
            onPreviewIniciar={onPreviewLoopsIniciar}
            onPreviewDetener={onPreviewLoopsDetener}
          />
          <div className="pea-canal-pan-labels"><span>I</span><span>D</span></div>
        </div>

        <div className="pea-canal pea-acento-morado">
          <span className="pea-canal-titulo">Metrónomo</span>
          <Fader
            valor={volumenMetronomo}
            pan={panMetronomo}
            acento="morado"
            onCambiar={onCambiarVolumenMetronomo}
            onPreviewIniciar={onPreviewMetronomoIniciar}
            onPreviewDetener={onPreviewMetronomoDetener}
          />
          <Knob
            valor={panMetronomo}
            min={-50}
            max={50}
            etiqueta="Pan"
            acento="morado"
            onCambiar={setPanMetronomo}
            onPreviewIniciar={onPreviewMetronomoIniciar}
            onPreviewDetener={onPreviewMetronomoDetener}
          />
          <div className="pea-canal-pan-labels"><span>I</span><span>D</span></div>
        </div>
      </div>
    </div>
  );
};

export default PanelEfectosAudio;
