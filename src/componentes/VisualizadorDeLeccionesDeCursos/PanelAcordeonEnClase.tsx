import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLogicaAcordeon } from '../../Core/hooks/useLogicaAcordeon';
import CuerpoAcordeon from '../../Core/componentes/CuerpoAcordeon';
import SeccionPLSonido from '../../Paginas/AcordeonProMax/PracticaLibre/Componentes/SeccionPLSonido';
import { TONALIDADES } from '../../Core/acordeon/notasAcordeonDiatonico';
import './PanelAcordeonEnClase.css';

interface PanelAcordeonEnClaseProps {
  onCerrar: () => void;
}

const IMAGEN_ACORDEON_DEFAULT = '/Acordeon PRO MAX.png';
const TONALIDAD_DEFAULT = 'BES';

const MODOS_VISTA = [
  { valor: 'notas', label: 'T' },
  { valor: 'numeros', label: '123' },
  { valor: 'cifrado', label: '♪' },
  { valor: 'teclas', label: 'ABC' },
];

const ANCHO_MIN = 560;
const ANCHO_MAX = 920;
const ANCHO_DEFAULT = 760;

const PanelAcordeonEnClase: React.FC<PanelAcordeonEnClaseProps> = ({ onCerrar }) => {
  const logica = useLogicaAcordeon();
  const [pestanaActiva, setPestanaActiva] = useState<'acordeon' | 'sonido'>('acordeon');
  const [anchoPanel, setAnchoPanel] = useState(ANCHO_DEFAULT);

  // El acordeón virtual usa porcentajes internos basados en `--sim-tamano`. Si el
  // tamaño es porcentaje (`100%`), --unit termina siendo `1%` y los botones se
  // calculan respecto al padre directo, no al cuadro completo — quedan invisibles.
  // Solución (igual que ModalReplay): tamaño FIJO en píxeles.
  const tamanoAcordeon = anchoPanel - 32; // descuenta paddings horizontales del cuerpo

  // Variables CSS globales para que el sidebar se ensanche y el cuadrado del
  // acordeón se ajuste al ancho real del panel.
  useEffect(() => {
    document.documentElement.style.setProperty('--ancho-panel-acordeon', `${anchoPanel}px`);
    document.documentElement.style.setProperty('--tamano-acordeon-clase', `${tamanoAcordeon}px`);
    return () => {
      document.documentElement.style.removeProperty('--ancho-panel-acordeon');
      document.documentElement.style.removeProperty('--tamano-acordeon-clase');
    };
  }, [anchoPanel, tamanoAcordeon]);

  // En clases siempre arrancamos en BES (afinación vallenata estándar). Lo aplicamos
  // una sola vez tras montar — si el alumno cambia luego, su elección queda activa.
  const tonalidadInicializadaRef = useRef(false);
  useEffect(() => {
    if (tonalidadInicializadaRef.current) return;
    tonalidadInicializadaRef.current = true;
    if (logica.tonalidadSeleccionada !== TONALIDAD_DEFAULT) {
      logica.setTonalidadSeleccionada(TONALIDAD_DEFAULT);
    }
  }, []);

  const listaTonalidades = useMemo(
    () => (logica.listaTonalidades.length ? logica.listaTonalidades : Object.keys(TONALIDADES)),
    [logica.listaTonalidades]
  );

  // tamaño en PX (no porcentaje) — clave para que --unit del CSS interno se
  // calcule correctamente y los botones queden visibles.
  const ajustesEmbed = useMemo(() => ({
    ...logica.ajustes,
    tamano: `${tamanoAcordeon}px`,
    x: '50%',
    y: '50%',
  }), [logica.ajustes, tamanoAcordeon]);

  return (
    <div className="panel-acordeon-clase">
      <div className="panel-acordeon-clase-header">
        <h2>Acordeón virtual</h2>
        <div className="panel-acordeon-clase-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={pestanaActiva === 'acordeon'}
            onClick={() => setPestanaActiva('acordeon')}
            className={`panel-acordeon-clase-tab ${pestanaActiva === 'acordeon' ? 'activa' : ''}`}
          >
            Acordeón
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestanaActiva === 'sonido'}
            onClick={() => setPestanaActiva('sonido')}
            className={`panel-acordeon-clase-tab ${pestanaActiva === 'sonido' ? 'activa' : ''}`}
          >
            Sonido
          </button>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="panel-acordeon-clase-cerrar"
          aria-label="Cerrar acordeón"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="panel-acordeon-clase-contenido">
        {pestanaActiva === 'acordeon' ? (
          <div className="panel-acordeon-clase-cuerpo">
            <div className="panel-acordeon-clase-instrumento">
              <CuerpoAcordeon
                imagenFondo={IMAGEN_ACORDEON_DEFAULT}
                ajustes={ajustesEmbed as any}
                direccion={logica.direccion}
                configTonalidad={logica.configTonalidad}
                botonesActivos={logica.botonesActivos}
                modoAjuste={false}
                botonSeleccionado={null}
                modoVista={logica.modoVista}
                vistaDoble={false}
                setBotonSeleccionado={() => {}}
                actualizarBotonActivo={logica.actualizarBotonActivo}
                listo
              />
            </div>

            <button
              type="button"
              className={`panel-acordeon-clase-fuelle ${logica.direccion}`}
              onClick={() => logica.setDireccion(logica.direccion === 'halar' ? 'empujar' : 'halar')}
              aria-label="Cambiar fuelle"
            >
              {logica.direccion === 'halar' ? '◀ Halando' : 'Empujando ▶'}
              <span className="panel-acordeon-clase-fuelle-tip">Espacio</span>
            </button>

            <div className="panel-acordeon-clase-tonalidad">
              <label htmlFor="select-tonalidad-clase">Tonalidad</label>
              <select
                id="select-tonalidad-clase"
                value={logica.tonalidadSeleccionada}
                onChange={(e) => logica.setTonalidadSeleccionada(e.target.value)}
              >
                {listaTonalidades.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="panel-acordeon-clase-zoom">
              <div className="panel-acordeon-clase-zoom-cabecera">
                <label htmlFor="slider-zoom-acordeon">Tamaño</label>
                <span>{anchoPanel}px</span>
              </div>
              <div className="panel-acordeon-clase-zoom-control">
                <button
                  type="button"
                  aria-label="Reducir tamaño"
                  onClick={() => setAnchoPanel((v) => Math.max(ANCHO_MIN, v - 40))}
                >−</button>
                <input
                  id="slider-zoom-acordeon"
                  type="range"
                  min={ANCHO_MIN}
                  max={ANCHO_MAX}
                  step={20}
                  value={anchoPanel}
                  onChange={(e) => setAnchoPanel(parseInt(e.target.value, 10))}
                />
                <button
                  type="button"
                  aria-label="Aumentar tamaño"
                  onClick={() => setAnchoPanel((v) => Math.min(ANCHO_MAX, v + 40))}
                >+</button>
              </div>
            </div>

            <p className="panel-acordeon-clase-tip">
              Toca los botones o usa tu teclado QWERTY para practicar.
            </p>
          </div>
        ) : (
          <div className="panel-acordeon-clase-sonido">
            <SeccionPLSonido
              tonalidadSeleccionada={logica.tonalidadSeleccionada}
              listaTonalidades={listaTonalidades}
              timbreActivo={logica.ajustes?.timbre || 'Brillante'}
              onSeleccionarTonalidad={logica.setTonalidadSeleccionada}
              onSeleccionarTimbre={(timbre) => logica.setAjustes((prev: any) => ({ ...prev, timbre }))}
              instrumentoId={logica.instrumentoId}
              listaInstrumentos={logica.listaInstrumentos || []}
              onSeleccionarInstrumento={logica.setInstrumentoId}
              modoVista={logica.modoVista}
              modosVista={MODOS_VISTA}
              onSeleccionarVista={logica.setModoVista}
              onAbrirEditorAvanzado={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelAcordeonEnClase;
