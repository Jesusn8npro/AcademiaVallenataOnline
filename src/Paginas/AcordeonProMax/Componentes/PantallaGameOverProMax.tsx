import React from 'react';
import { motion } from 'framer-motion';
import type { EstadisticasPartida, CancionHeroConTonalidad } from '../TiposProMax';
import { calcularPrecision } from '../TiposProMax';
import './PantallaGameOverProMax.css';

interface PropsPantallaGameOver {
  estadisticas: EstadisticasPartida;
  cancion: CancionHeroConTonalidad;
  onReintentar: () => void;
  onVolverSeleccion: () => void;
}

const PantallaGameOverProMax: React.FC<PropsPantallaGameOver> = ({
  estadisticas,
  cancion,
  onReintentar,
  onVolverSeleccion,
}) => {
  const { notasPerfecto, notasBien, notasFalladas, notasPerdidas, puntos, rachaMasLarga } = estadisticas;
  const precision = calcularPrecision(notasPerfecto, notasBien, notasFalladas, notasPerdidas);

  return (
    <div className="hero-gameover-overlay">
      <video
        className="hero-gameover-video"
        src="/videos/fondo_blue_paint.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="hero-gameover-video-dim" />

      <motion.div 
        className="hero-gameover-panel glass-morphism"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="hero-gameover-titulo-wrap">
          <h1 className="hero-gameover-titulo">GAME OVER</h1>
          <p className="hero-gameover-subtitulo">
            {cancion.titulo} — {cancion.autor}
          </p>
        </div>

        <div className="hero-gameover-stats">
          <div className="hero-gameover-stat-fila">
            <span className="stat-label" style={{ color: '#22c55e' }}>✦ Perfectas</span>
            <span className="stat-value" style={{ color: '#22c55e' }}>{notasPerfecto}</span>
          </div>
          <div className="hero-gameover-stat-fila">
            <span className="stat-label" style={{ color: '#3b82f6' }}>✦ Bien</span>
            <span className="stat-value" style={{ color: '#3b82f6' }}>{notasBien}</span>
          </div>
          <div className="hero-gameover-stat-fila">
            <span className="stat-label" style={{ color: '#f59e0b' }}>✦ Falladas</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>{notasFalladas}</span>
          </div>
          <div className="hero-gameover-stat-fila">
            <span className="stat-label" style={{ color: '#9ca3af' }}>✦ Perdidas</span>
            <span className="stat-value" style={{ color: '#9ca3af' }}>{notasPerdidas}</span>
          </div>
          <div className="hero-gameover-separador" />
          <div className="hero-gameover-stat-fila destaca">
            <span>Precisión</span>
            <span className="precision-valor">{precision}%</span>
          </div>
          <div className="hero-gameover-stat-fila">
            <span>Racha máxima</span>
            <span className="stat-value">×{rachaMasLarga}</span>
          </div>
          <div className="hero-gameover-stat-fila destaca-puntos">
            <span>Puntos</span>
            <span className="puntos-valor">{puntos.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="hero-gameover-botones">
          <button className="hero-gameover-btn reintentar" onClick={onReintentar}>
            ↺ Reintentar
          </button>
          <button className="hero-gameover-btn seleccion" onClick={onVolverSeleccion}>
            ← Volver
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PantallaGameOverProMax;
