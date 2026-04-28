import React from 'react';
import type { EstadisticasPartida, CancionHeroConTonalidad } from '../TiposProMax';
import type { Seccion } from '../Admin/Componentes/EditorSecuencia/tiposEditor';
import ModalHistorialHero from './ModalHistorialHero';
import { usePantallaResultados } from './usePantallaResultados';
import './PantallaResultados.css';

interface PropsPantallaResultados {
  estadisticas: EstadisticasPartida;
  cancion: CancionHeroConTonalidad;
  esModoCompetencia: boolean;
  modo: string;
  mostrarGuardado: boolean;
  guardandoGrabacion: boolean;
  errorGuardado: string | null;
  tituloSugeridoGrabacion: string;
  tituloGrabacionGuardada?: string | null;
  umbralGuardado?: number;
  onGuardarGrabacion: (titulo: string, descripcion: string) => Promise<boolean> | boolean;
  onDescartarGuardado: () => void;
  onJugarDeNuevo: () => void;
  onVolverSeleccion: () => void;
  seccionSeleccionada?: Seccion | null;
  onJugarSiguienteSeccion?: (seccion: Seccion) => void;
}

const PantallaResultados: React.FC<PropsPantallaResultados> = ({
  estadisticas, cancion, esModoCompetencia, mostrarGuardado,
  guardandoGrabacion, errorGuardado, tituloSugeridoGrabacion,
  tituloGrabacionGuardada, umbralGuardado = 60,
  onGuardarGrabacion, onDescartarGuardado, onJugarDeNuevo, onVolverSeleccion, modo,
  seccionSeleccionada, onJugarSiguienteSeccion,
}) => {
  const {
    usuario, puntos, notasPerfecto, notasBien, notasFalladas, notasPerdidas,
    rachaMasLarga, totalNotas, estrellas, precision,
    tituloGrabacion, setTituloGrabacion, descripcionGrabacion, setDescripcionGrabacion,
    errorLocal, modalGuardadoAbierto, setModalGuardadoAbierto,
    scoreRespuesta, modalHistorialAbierto, setModalHistorialAbierto,
    animandoXP, mensajeMotivacion, manejarGuardar, estadoSeccion, siguienteSeccion,
  } = usePantallaResultados({ estadisticas, cancion, modo, mostrarGuardado, tituloSugeridoGrabacion, tituloGrabacionGuardada, onGuardarGrabacion, seccionSeleccionada });

  const umbralSeccion = typeof (cancion as any)?.umbral_precision_seccion === 'number' ? (cancion as any).umbral_precision_seccion : 80;
  const intentosMaxSeccion = typeof (cancion as any)?.intentos_para_moneda === 'number' ? (cancion as any).intentos_para_moneda : 3;

  return (
    <div className="hero-resultados-overlay">
      <div className="hero-resultados-panel">
        {seccionSeleccionada && estadoSeccion?.completada && (
          <div className="hero-banner-seccion-completada">
            <div className="hero-banner-seccion-icono">🎉</div>
            <div className="hero-banner-seccion-titulo">¡SECCIÓN COMPLETADA!</div>
            <div className="hero-banner-seccion-nombre">{seccionSeleccionada.nombre}</div>
            {Number(estadoSeccion.monedas_ganadas) > 0 ? (
              <div className="hero-banner-seccion-moneda">
                🪙 +{estadoSeccion.monedas_ganadas} moneda{Number(estadoSeccion.monedas_ganadas) !== 1 ? 's' : ''} ganada{Number(estadoSeccion.monedas_ganadas) !== 1 ? 's' : ''}
              </div>
            ) : (
              <div className="hero-banner-seccion-moneda sin-premio">
                Sin premio · superaste los {intentosMaxSeccion} intentos
              </div>
            )}
            {siguienteSeccion && (
              <div className="hero-banner-siguiente-desbloqueada">
                🔓 Desbloqueaste: <strong>{siguienteSeccion.nombre}</strong>
              </div>
            )}
          </div>
        )}

        <div className="hero-resultados-encabezado">
          <h2 className="hero-resultados-titulo">Resultado Final</h2>
          <p className="hero-resultados-cancion">
            {cancion.titulo} — {cancion.autor}
            {seccionSeleccionada && (
              <span className="hero-resultados-seccion-tag"> · {seccionSeleccionada.nombre}</span>
            )}
          </p>
          {scoreRespuesta?.es_mejor_personal && !scoreRespuesta?.es_nuevo && (
            <div className="hero-record-badge">🏆 ¡Nuevo Récord Personal!</div>
          )}
        </div>

        {seccionSeleccionada && estadoSeccion && !estadoSeccion.completada && (
          <div className="hero-feedback-seccion">
            <div className="hero-feedback-seccion-fila pendiente">
              Intento {estadoSeccion.intentos} · necesitas ≥{umbralSeccion}% para completar (mejor: {estadoSeccion.mejor_precision}%)
            </div>
          </div>
        )}
        <div className="hero-resultados-estrellas">
          {[1, 2, 3].map(i => <span key={i} className={`hero-estrella ${i <= estrellas ? 'ganada' : 'vacia'}`}>★</span>)}
        </div>
        <div className="hero-resultados-puntos">
          <span className="hero-puntos-valor">{puntos.toLocaleString('es-CO')}</span>
          <span className="hero-puntos-label">puntos</span>
        </div>
        <p className="hero-resultados-motivacion">{mensajeMotivacion}</p>

        {scoreRespuesta && (
          <div className={`hero-gamificacion-panel ${animandoXP ? 'animar' : ''}`}>
            <div className="hero-xp-partida">
              {scoreRespuesta.xp_ganado > 0 && (
                <div className="hero-xp-positivo">
                  <span className="hero-xp-icono">⬆️</span>
                  <span className="hero-xp-texto">+{scoreRespuesta.xp_ganado} XP</span>
                </div>
              )}
              {scoreRespuesta.xp_ganado < 0 && (
                <div className="hero-xp-negativo">
                  <span className="hero-xp-icono">⬇️</span>
                  <span className="hero-xp-texto">{scoreRespuesta.xp_ganado} XP</span>
                  <span className="hero-xp-mensaje">¡Necesitas practicar más!</span>
                </div>
              )}
              {scoreRespuesta.xp_ganado === 0 && scoreRespuesta.xp_acumulado_cancion === 100 && (
                <div className="hero-xp-neutro">
                  <span className="hero-xp-icono">🔒</span>
                  <span className="hero-xp-texto">0 XP (Ya dominaste esta canción)</span>
                </div>
              )}
              {scoreRespuesta.xp_ganado === 0 && scoreRespuesta.xp_acumulado_cancion < 100 && (
                <div className="hero-xp-neutro">
                  <span className="hero-xp-icono">⚠️</span>
                  <span className="hero-xp-texto">0 XP en este intento</span>
                </div>
              )}
            </div>

            <div className="hero-xp-acumulado-cancion">
              <h4>Progreso en {cancion.titulo}</h4>
              {scoreRespuesta.xp_acumulado_cancion === 100 ? (
                <div className="hero-cancion-dominada-badge">🏆 Canción dominada — 100/100 XP</div>
              ) : scoreRespuesta.xp_acumulado_cancion < 0 ? (
                <div className="hero-xp-acumulado-negativo">
                  ⚠️ XP: {scoreRespuesta.xp_acumulado_cancion} en esta canción
                  <div className="hero-barra-xp-cancion negativa">
                    <div className="hero-barra-xp-relleno" style={{ width: `${Math.min(100, Math.abs((scoreRespuesta.xp_acumulado_cancion / 50) * 100))}%` }} />
                  </div>
                </div>
              ) : (
                <div className="hero-barra-xp-cancion activa">
                  <div className="hero-barra-xp-relleno" style={{ width: `${scoreRespuesta.xp_acumulado_cancion}%` }} />
                  <span className="hero-barra-xp-texto">{scoreRespuesta.xp_acumulado_cancion} / 100 XP</span>
                </div>
              )}
            </div>

            <div className="hero-monedas-recompensa">
              {scoreRespuesta.monedas_ganadas > 0 && (
                <div className="hero-monedas-ganadas">
                  <span className="hero-monedas-icono">🪙</span>
                  <span className="hero-monedas-texto">+{scoreRespuesta.monedas_ganadas} Monedas!</span>
                </div>
              )}
              <div className="hero-monedas-saldo-actual">
                <span>Saldo Total:</span>
                <span className="hero-monedas-oro">🪙 {scoreRespuesta.saldo_monedas}</span>
              </div>
            </div>
          </div>
        )}

        <div className="hero-resultados-stats">
          <div className="hero-stat-fila">
            <span className="hero-stat-icono" style={{ color: '#22c55e' }}>✦</span>
            <span className="hero-stat-nombre">Perfectas</span>
            <span className="hero-stat-valor" style={{ color: '#22c55e' }}>{notasPerfecto}</span>
          </div>
          <div className="hero-stat-fila">
            <span className="hero-stat-icono" style={{ color: '#3b82f6' }}>✦</span>
            <span className="hero-stat-nombre">Bien</span>
            <span className="hero-stat-valor" style={{ color: '#3b82f6' }}>{notasBien}</span>
          </div>
          <div className="hero-stat-fila">
            <span className="hero-stat-icono" style={{ color: '#f59e0b' }}>✦</span>
            <span className="hero-stat-nombre">Falladas</span>
            <span className="hero-stat-valor" style={{ color: '#f59e0b' }}>{notasFalladas}</span>
          </div>
          <div className="hero-stat-fila">
            <span className="hero-stat-icono" style={{ color: '#6b7280' }}>✦</span>
            <span className="hero-stat-nombre">Perdidas</span>
            <span className="hero-stat-valor" style={{ color: '#6b7280' }}>{notasPerdidas}</span>
          </div>
          <div className="hero-stat-separador" />
          <div className="hero-stat-fila">
            <span className="hero-stat-nombre">Precisión</span>
            <span className="hero-stat-valor hero-stat-precision">{precision}%</span>
          </div>
          <div className="hero-stat-fila">
            <span className="hero-stat-nombre">Racha máxima</span>
            <span className="hero-stat-valor">×{rachaMasLarga}</span>
          </div>
          <div className="hero-stat-fila">
            <span className="hero-stat-nombre">Total notas</span>
            <span className="hero-stat-valor">{totalNotas}</span>
          </div>
        </div>
        <div className="hero-barra-precision">
          <div className="hero-barra-precision-relleno" style={{ width: `${precision}%` }} />
        </div>

        {esModoCompetencia && tituloGrabacionGuardada && (
          <div className="hero-resultados-guardado hero-resultados-guardado-exito">
            <span className="hero-resultados-guardado-badge">Guardada</span>
            <p className="hero-resultados-guardado-texto">
              Tu ejecucion <strong>{tituloGrabacionGuardada}</strong> ya esta en Mis grabaciones.
            </p>
          </div>
        )}

        {esModoCompetencia && !mostrarGuardado && !tituloGrabacionGuardada && precision < umbralGuardado && (
          <div className="hero-resultados-guardado hero-resultados-guardado-bloqueado">
            <h3>Guardar esta ejecucion</h3>
            <p className="hero-resultados-guardado-texto">
              Necesitas al menos <strong>{umbralGuardado}%</strong> de precision para guardar intentos de competencia.
            </p>
          </div>
        )}

        <div className="hero-resultados-botones">
          {esModoCompetencia && mostrarGuardado && !tituloGrabacionGuardada && (
            <button className="hero-btn-seleccion hero-btn-guardar-inline" onClick={() => setModalGuardadoAbierto(true)}>
              Guardar grabacion
            </button>
          )}
          <button className="hero-btn-seleccion hero-btn-historial-inline" onClick={() => setModalHistorialAbierto(true)}>
            Ver mi historial en esta canción
          </button>
          {siguienteSeccion && onJugarSiguienteSeccion && (
            <button
              className="hero-btn-siguiente-seccion"
              onClick={() => onJugarSiguienteSeccion(siguienteSeccion)}
            >
              ▶ Continuar con: {siguienteSeccion.nombre}
            </button>
          )}
          <button className="hero-btn-jugar-nuevo" onClick={onJugarDeNuevo}>↺ Jugar de nuevo</button>
          <button className="hero-btn-seleccion" onClick={onVolverSeleccion}>← Elegir canción</button>
        </div>
      </div>

      {esModoCompetencia && mostrarGuardado && modalGuardadoAbierto && (
        <div className="hero-resultados-modal-backdrop" onClick={() => setModalGuardadoAbierto(false)}>
          <div className="hero-resultados-modal-guardar" onClick={(event) => event.stopPropagation()}>
            <div className="hero-resultados-modal-guardar-encabezado">
              <div>
                <p className="hero-resultados-modal-etiqueta">Guardar ejecucion</p>
                <h3>Guardar esta ejecucion</h3>
              </div>
              <span className="hero-resultados-guardado-badge">{precision}%</span>
            </div>

            <div className="hero-resultados-guardado-resumen">
              <span>{cancion.titulo}</span>
              <span>{puntos.toLocaleString('es-CO')} pts</span>
            </div>

            <label className="hero-resultados-campo">
              <span>Titulo</span>
              <input
                type="text"
                value={tituloGrabacion}
                onChange={(event) => setTituloGrabacion(event.target.value)}
                placeholder="Ej: Mi mejor intento en Do mayor"
                maxLength={120}
              />
            </label>

            <label className="hero-resultados-campo">
              <span>Descripcion opcional</span>
              <textarea
                value={descripcionGrabacion}
                onChange={(event) => setDescripcionGrabacion(event.target.value)}
                placeholder="Que practicaste, en que parte mejoraste, notas para despues..."
                maxLength={500}
              />
            </label>

            {(errorLocal || errorGuardado) && (
              <p className="hero-resultados-guardado-error">{errorLocal || errorGuardado}</p>
            )}

            <div className="hero-resultados-guardado-acciones">
              <button
                className="hero-btn-seleccion hero-btn-seleccion-secundario"
                onClick={() => setModalGuardadoAbierto(false)}
                disabled={guardandoGrabacion}
              >
                Ahora no
              </button>
              <button
                className="hero-btn-jugar-nuevo hero-btn-guardar-grabacion"
                onClick={manejarGuardar}
                disabled={guardandoGrabacion}
              >
                {guardandoGrabacion ? 'Guardando...' : 'Guardar en mis grabaciones'}
              </button>
            </div>

            <p className="hero-resultados-guardado-ayuda">
              Despues podras compartirla en comunidad desde Mis grabaciones.
            </p>
          </div>
        </div>
      )}

      {modalHistorialAbierto && usuario && (
        <ModalHistorialHero
          cancion={cancion}
          usuarioId={usuario.id}
          onCerrar={() => setModalHistorialAbierto(false)}
        />
      )}
    </div>
  );
};

export default PantallaResultados;
