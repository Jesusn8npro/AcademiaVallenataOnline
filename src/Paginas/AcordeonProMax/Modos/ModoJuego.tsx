import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import CuerpoAcordeon from '../../../Core/componentes/CuerpoAcordeon';
import PuenteNotas from '../Componentes/PuenteNotas';
import JuicioOverlay from '../Componentes/JuicioOverlay';
import { usePosicionProMax } from '../Hooks/usePosicionProMax';
import type { CancionHeroConTonalidad, EstadisticasPartida, EfectoGolpe } from '../TiposProMax';
import './ModoCompetitivo.css';
import './ModoLibre.css';

interface ModoJuegoProps {
  conPenalizacion: boolean;
  cancion: CancionHeroConTonalidad;
  tickActual: number;
  botonesActivosMaestro: Record<string, any>;
  direccionMaestro: 'halar' | 'empujar';
  logica: any;
  configTonalidad: any;
  estadisticas: EstadisticasPartida;
  efectosVisuales: EfectoGolpe[];
  notasImpactadas: Set<string>;
  imagenFondo: string;
  actualizarBotonActivo: (id: string, accion: 'add' | 'remove', inst?: any[] | null) => void;
  registrarPosicionGolpe: (x: number, y: number) => void;
  // Rango de la sección activa: PuenteNotas filtra notas fuera de él para no mostrar "fantasmas" durante el lead-in.
  rangoSeccion?: { inicio: number; fin: number } | null;
}

const ModoJuego: React.FC<ModoJuegoProps> = ({
  conPenalizacion,
  cancion,
  tickActual,
  botonesActivosMaestro,
  direccionMaestro,
  logica,
  configTonalidad,
  estadisticas,
  efectosVisuales,
  notasImpactadas,
  imagenFondo,
  actualizarBotonActivo,
  registrarPosicionGolpe,
  rangoSeccion,
}) => {
  const { refMaestro, refAlumno, obtenerPosicionMaestro, obtenerPosicionAlumno } = usePosicionProMax();
  const ajustesDuelo = useMemo(() => ({
    ...logica.ajustes,
    tamano: 'var(--duelo-acordeon-tamano, min(70vh, 32vw))',
    x: 'var(--duelo-acordeon-x, 50%)',
    y: 'var(--duelo-acordeon-y, 50%)',
  }), [logica.ajustes]);

  // — Competitivo: flash de pantalla al recibir daño
  const vidaPreviaRef = useRef(estadisticas.vida);
  const [mostrarFlash, setMostrarFlash] = useState(false);
  useEffect(() => {
    if (!conPenalizacion) return;
    if (estadisticas.vida < vidaPreviaRef.current) {
      setMostrarFlash(true);
      setTimeout(() => setMostrarFlash(false), 600);
    }
    vidaPreviaRef.current = estadisticas.vida;
  }, [estadisticas.vida, conPenalizacion]);

  // — Libre: banner de bienvenida temporal
  const [mostrarBanner, setMostrarBanner] = useState(!conPenalizacion);

  const getColorVida = () => {
    if (estadisticas.vida > 60) return 'verde';
    if (estadisticas.vida > 30) return 'amarillo';
    return 'rojo';
  };

  const getMensajeDinamico = () => {
    if (estadisticas.rachaActual >= 10) return '¡Vas excelente! Cuando domines esta canción, prueba el Modo Competitivo 🚀';
    if (estadisticas.rachaActual >= 5) return '¡Muy bien! Mantén la racha, vas en buen camino 🎵';
    if (estadisticas.notasFalladas > 10) return 'Sin presión, cada nota cuenta. Sigue practicando 💪';
    return 'Practica con tranquilidad, aprendes al ritmo que necesites 🎼';
  };

  return (
    <div className={conPenalizacion ? 'competitivo-modo' : 'libre-modo'}>

      {conPenalizacion ? (
        /* ── HUD COMPETITIVO ── */
        <motion.div
          className="competitivo-hud-superior"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`competitivo-hud-container ${mostrarFlash ? 'dano-flash' : ''}`}>
            <div className="competitivo-vida-section">
              <span className="competitivo-label">VIDA</span>
              <div className={`competitivo-health-bar ${getColorVida()}`}>
                <div className="competitivo-health-fill" style={{ width: `${estadisticas.vida}%` }} />
              </div>
              <span className="competitivo-vida-porcentaje">{Math.ceil(estadisticas.vida)}%</span>
            </div>
            <div className="competitivo-divider" />
            <div className="competitivo-puntos-section">
              <span className="competitivo-label">PUNTOS</span>
              <motion.span
                className="competitivo-puntos-valor"
                key={estadisticas.puntos}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {estadisticas.puntos}
              </motion.span>
            </div>
            <div className="competitivo-divider" />
            <AnimatePresence>
              {estadisticas.multiplicador >= 2 && (
                <motion.div
                  className="competitivo-multiplicador-section"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <span className="competitivo-label">MULTI</span>
                  <div className={`competitivo-multi-badge multi-${estadisticas.multiplicador}`}>
                    ×{estadisticas.multiplicador}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {estadisticas.rachaActual >= 5 && (
                <motion.div
                  className="competitivo-racha-section"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <span className="competitivo-label">RACHA</span>
                  <motion.span
                    className="competitivo-racha-valor"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    {estadisticas.rachaActual}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        /* ── HUD LIBRE ── */
        <>
          <AnimatePresence>
            {mostrarBanner && (
              <motion.div
                className="libre-banner-bienvenida"
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                onAnimationComplete={() => { setTimeout(() => setMostrarBanner(false), 8000); }}
              >
                <div className="libre-banner-content">
                  <div className="libre-banner-header">
                    <span className="libre-banner-titulo">🎵 Practica sin presión</span>
                    <button className="libre-banner-close" onClick={() => setMostrarBanner(false)}>
                      <X size={18} />
                    </button>
                  </div>
                  <p className="libre-banner-texto">
                    Toca la melodía con tranquilidad. No hay vida, no hay penalizaciones.
                    Cuando domines la canción, prueba el <strong>Modo Competitivo</strong> para un desafío real.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            className="libre-hud-superior"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="libre-badge-modo">🎵 MODO LIBRE</div>
            <div className="libre-estadisticas-container">
              <div className="libre-stat-item">
                <span className="stat-label">PERFECTAS</span>
                <span className="stat-valor perfecto">{estadisticas.notasPerfecto}</span>
              </div>
              <div className="libre-stat-item">
                <span className="stat-label">BIEN</span>
                <span className="stat-valor bien">{estadisticas.notasBien}</span>
              </div>
              <div className="libre-stat-item">
                <span className="stat-label">FALLADAS</span>
                <span className="stat-valor fallada">{estadisticas.notasFalladas}</span>
              </div>
              <div className="libre-stat-divider" />
              <div className="libre-stat-item">
                <span className="stat-label">RACHA</span>
                <motion.span
                  className="stat-valor racha"
                  key={estadisticas.rachaActual}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  {estadisticas.rachaActual}
                </motion.span>
              </div>
              <div className="libre-stat-item">
                <span className="stat-label">PUNTOS</span>
                <span className="stat-valor puntos">{estadisticas.puntos}</span>
              </div>
            </div>
            <motion.div
              className="libre-mensaje-dinamico"
              key={estadisticas.rachaActual}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {getMensajeDinamico()}
            </motion.div>
          </motion.div>
        </>
      )}

      {/* ── Escenario Maestro / Alumno (compartido) ── */}
      <div className="hero-escenario">
        <div className="hero-acordeon-wrap maestro" ref={refMaestro}>
          <span className="hero-acordeon-label">Maestro</span>
          {logica.disenoCargado && (
            <CuerpoAcordeon
              imagenFondo={'/Acordeon Jugador.webp'}
              ajustes={ajustesDuelo}
              direccion={direccionMaestro}
              configTonalidad={configTonalidad}
              botonesActivos={botonesActivosMaestro}
              modoAjuste={false}
              botonSeleccionado={null}
              modoVista={logica.modoVista}
              vistaDoble={false}
              setBotonSeleccionado={() => {}}
              actualizarBotonActivo={() => {}}
              listo={true}
            />
          )}
        </div>
        <div
          className="hero-acordeon-wrap alumno"
          ref={refAlumno}
          onPointerMove={(e) => registrarPosicionGolpe(e.clientX, e.clientY)}
        >
          <span className="hero-acordeon-label">Alumno</span>
          {logica.disenoCargado && (
            <CuerpoAcordeon
              imagenFondo={imagenFondo}
              ajustes={ajustesDuelo}
              direccion={logica.direccion}
              configTonalidad={configTonalidad}
              botonesActivos={logica.botonesActivos}
              modoAjuste={false}
              botonSeleccionado={null}
              modoVista={logica.modoVista}
              vistaDoble={false}
              setBotonSeleccionado={() => {}}
              actualizarBotonActivo={actualizarBotonActivo}
              listo={true}
            />
          )}
        </div>
      </div>

      <PuenteNotas
        cancion={cancion}
        tickActual={tickActual}
        obtenerPosicionMaestro={obtenerPosicionMaestro}
        obtenerPosicionAlumno={obtenerPosicionAlumno}
        modoVista={logica.modoVista}
        configTonalidad={configTonalidad}
        notasImpactadas={notasImpactadas}
        rangoSeccion={rangoSeccion}
      />

      <JuicioOverlay estadisticas={estadisticas} efectosVisuales={efectosVisuales} />
    </div>
  );
};

export default React.memo(ModoJuego);
