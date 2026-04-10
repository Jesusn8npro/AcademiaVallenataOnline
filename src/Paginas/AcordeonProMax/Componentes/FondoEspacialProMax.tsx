import React, { useEffect, useRef } from 'react';

/**
 * FONDO ESPACIAL PRO MAX
 * Recrea exactamente el efecto de "PurpleSpace" de Rhythm+ Music Game.
 * Consta de un campo de estrellas en movimiento y un degradado radial pulsante.
 */
const FondoEspacialProMax: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<any[]>([]);
  const prevTimeRef = useRef<number>(0);
  const currentBgRef = useRef<number[]>([27, 63, 171]);
  const nextBgIdxRef = useRef<number>(1);
  
  const bgColors = [
    [27, 63, 171],
    [10, 166, 201],
    [169, 10, 201],
  ];

  // Configuración de estrellas
  const makeStars = (count: number) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push({
        x: Math.random() * 1600 - 800,
        y: Math.random() * 900 - 450,
        z: Math.random() * 1000,
        vWeight: Math.random(),
        color: 'white',
      });
    }
    return out;
  };

  useEffect(() => {
    starsRef.current = makeStars(700);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    let animationFrameId: number;

    const render = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;
      
      // Simular volumen pulsante (ya que estamos en el Home)
      const v = 0.5 + Math.sin(time * 0.002) * 0.2; 
      
      // 1. Limpiar fondo con opacidad baja para rastro de estrellas
      ctx.fillStyle = 'rgba(10, 10, 44, 0.2)';
      ctx.fillRect(0, 0, w, h);

      // 2. Dibujar Degradado Radial Pulsante (Lógica de Rhythm+)
      const centerX = w / 2;
      const centerY = h / 2;
      const outerRadius = Math.max(w, h);
      const blackColorStop = h < w ? 0.15 : 0.1;

      const grd = ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, outerRadius);
      grd.addColorStop(blackColorStop, 'black');
      grd.addColorStop(1, `rgba(${currentBgRef.current[0]}, ${currentBgRef.current[1]}, ${currentBgRef.current[2]}, ${Math.max(v - 0.25, 0.1)})`);
      
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // 3. Mover y Dibujar Estrellas
      if (!prevTimeRef.current) prevTimeRef.current = time;
      const elapsed = time - prevTimeRef.current;
      prevTimeRef.current = time;

      const distance = elapsed * 0.02 + v;
      
      starsRef.current.forEach(star => {
        star.z -= distance + distance * v * star.vWeight;
        if (star.z <= 1) star.z += 1000;

        const x = centerX + star.x / (star.z * 0.001);
        const y = centerY + star.y / (star.z * 0.001);

        if (x >= 0 && x < w && y >= 0 && y < h) {
          const d = star.z / 1000.0;
          const b = 1 - d * d;
          const intensity = b * (Math.max(v * 2, 0.3) + 0.2);
          
          ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.6})`;
          ctx.fillRect(x, y, 3, 3);
        }
      });

      // 4. Actualizar colores del degradado (transición suave)
      const moveBgColor = () => {
        const newVal = (from: number, to: number) => {
          const delta = from - to > 0 ? -0.2 : 0.2;
          return Math.abs(from - to) < 0.5 ? to : from + delta;
        };
        const nextBg = bgColors[nextBgIdxRef.current];
        currentBgRef.current[0] = newVal(currentBgRef.current[0], nextBg[0]);
        currentBgRef.current[1] = newVal(currentBgRef.current[1], nextBg[1]);
        currentBgRef.current[2] = newVal(currentBgRef.current[2], nextBg[2]);

        if (
          Math.abs(currentBgRef.current[0] - nextBg[0]) < 1 &&
          Math.abs(currentBgRef.current[1] - nextBg[1]) < 1 &&
          Math.abs(currentBgRef.current[2] - nextBg[2]) < 1
        ) {
          nextBgIdxRef.current = (nextBgIdxRef.current + 1) % bgColors.length;
        }
      };
      moveBgColor();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
      {/* Imagen base */}
      <img 
        src="/assets/purpleSpace.jpg" 
        alt="espacio"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          objectFit: 'cover',
          opacity: 0.6,
          // Animación de zoom lento
          animation: 'zoomEspacial 30s ease-in-out infinite alternate'
        }}
      />
      <canvas 
        ref={canvasRef} 
        style={{ position: 'absolute', inset: 0, opacity: 1 }}
      />
      
      <style>{`
        @keyframes zoomEspacial {
          from { transform: scale(1); }
          to { transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
};

export default FondoEspacialProMax;
