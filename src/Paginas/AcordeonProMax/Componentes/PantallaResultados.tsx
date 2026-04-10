/**
 * ACORDEÓN PRO MAX — Pantalla de Resultados (Stand-alone)
 * ──────────────────────────────────────────────────────
 * Independizada de la carpeta Hero.
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import type { EstadisticasPartida, CancionHeroConTonalidad } from '../TiposProMax';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { scoresHeroService, type ScoreRespuesta } from '../../../servicios/scoresHeroService';
import ModalHistorialHero from './ModalHistorialHero';
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

const PantallaResultados: React.FC<PropsPantallaResultados> = ({
  estadisticas,
  cancion,
  esModoCompetencia,
  mostrarGuardado,
  guardandoGrabacion,
  errorGuardado,
  tituloSugeridoGrabacion,
  tituloGrabacionGuardada,
  umbralGuardado = 60,
  onGuardarGrabacion,
  onDescartarGuardado,
  onJugarDeNuevo,
  onVolverSeleccion,
  modo,
}) => {
  const { usuario } = useUsuario();
  const { puntos, notasPerfecto, notasBien, notasFalladas, notasPerdidas, rachaMasLarga, multiplicador } = estadisticas;
  const estrellas = useMemo(() => calcularEstrellas(notasPerfecto, notasBien, notasFalladas, notasPerdidas), [notasPerfecto, notasBien, notasFalladas, notasPerdidas]);
  const precision = useMemo(() => calcularPrecision(notasPerfecto, notasBien, notasFalladas, notasPerdidas), [notasPerfecto, notasBien, notasFalladas, notasPerdidas]);
  const totalNotas = notasPerfecto + notasBien + notasFalladas + notasPerdidas;
  const [tituloGrabacion, setTituloGrabacion] = useState(tituloSugeridoGrabacion || `Mi mejor intento en ${cancion.titulo}`);
  const [descripcionGrabacion, setDescripcionGrabacion] = useState('');
  const [errorLocal, setErrorLocal] = useState('');
  const [modalGuardadoAbierto, setModalGuardadoAbierto] = useState(false);
  
  // States for XP and History
  const guardandoScoreRef = useRef(false);
  const [scoreRespuesta, setScoreRespuesta] = useState<ScoreRespuesta | null>(null);
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [animandoXP, setAnimandoXP] = useState(false);

  useEffect(() => {
    // Save Score to DB when component mounts
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
        duracion_ms: 0, // Simplificado
        abandono: false,
        porcentaje_completado: 100 // Finalizado normalmente
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
    if (!mostrarGuardado) {
      setModalGuardadoAbierto(false);
    }
  }, [mostrarGuardado]);

  useEffect(() => {
    if (tituloGrabacionGuardada) {
      setModalGuardadoAbierto(false);
    }
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

  return (
    <div className="hero-resultados-overlay">
      <div className="hero-resultados-panel">
        <div className="hero-resultados-encabezado">
          <h2 className="hero-resultados-titulo">Resultado Final</h2>
          <p className="hero-resultados-cancion">{cancion.titulo} — {cancion.autor}</p>
          {scoreRespuesta?.es_mejor_personal && !scoreRespuesta?.es_nuevo && (
            <div className="hero-record-badge">🏆 ¡Nuevo Récord Personal!</div>
          )}
        </div>
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
            
            {/* 1. XP Ganado / Perdido en esta partida */}
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

            {/* 2. Barra de Progreso XP de la Cancion */}
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


            {/* 3. Recompensas (Monedas) */}
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
