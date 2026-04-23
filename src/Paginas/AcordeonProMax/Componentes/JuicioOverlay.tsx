import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EstadisticasPartida, EfectoGolpe } from '../TiposProMax';

interface JuicioOverlayProps {
  estadisticas: EstadisticasPartida;
  efectosVisuales: EfectoGolpe[];
}

const JuicioOverlay: React.FC<JuicioOverlayProps> = ({ estadisticas, efectosVisuales }) => {
  const ultimo = efectosVisuales.length > 0 ? efectosVisuales[efectosVisuales.length - 1] : null;

  return (
    <div className="hero-pro-judgment-overlay">
      <AnimatePresence mode="wait">
        {estadisticas.rachaActual >= 5 && (
          <motion.div
            key={`combo-${estadisticas.rachaActual}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="hero-pro-combo"
          >
            <span className="combo-label">COMBO</span>
            <span className="combo-num">{estadisticas.rachaActual}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {ultimo && ultimo.creado > Date.now() - 800 && (
          <motion.div
            key={ultimo.id}
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1.1 }}
            exit={{ y: -20, opacity: 0, scale: 1.3 }}
            className={`hero-pro-label ${ultimo.resultado}`}
          >
            {ultimo.resultado.toUpperCase()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(JuicioOverlay);
