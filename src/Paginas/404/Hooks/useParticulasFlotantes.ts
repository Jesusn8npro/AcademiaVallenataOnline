import { useEffect } from 'react';

export const useParticulasFlotantes = () => {
  useEffect(() => {
    const container = document.querySelector('.academia-particulas-container');
    if (!container) return;

    container.innerHTML = '';
    const particulas = ['🎵', '🎶', '🎼', '🎤', '🎸', '🥁'];

    for (let i = 0; i < 15; i++) {
      const particula = document.createElement('div');
      particula.className = 'academia-particula-flotante';
      particula.textContent = particulas[Math.floor(Math.random() * particulas.length)];
      particula.style.left = Math.random() * 100 + '%';
      particula.style.animationDelay = Math.random() * 10 + 's';
      particula.style.animationDuration = (Math.random() * 10 + 10) + 's';
      container.appendChild(particula);
    }
  }, []);
};
