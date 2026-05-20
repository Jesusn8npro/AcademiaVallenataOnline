'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react'
import Image from 'next/image';

/**
 * FONDO ESPACIAL PRO MAX
 * Recrea el efecto de "PurpleSpace" de Rhythm+ Music Game.
 * Campo de estrellas en movimiento y degradado radial pulsante.
 */

type Estrella = { x: number; y: number; z: number; vWeight: number };

const BG_COLORS: ReadonlyArray<readonly [number, number, number]> = [
  [27, 63, 171],
  [10, 166, 201],
  [169, 10, 201],
];

// 350 estrellas: visualmente equivalente a 700 (la cabeza humana no diferencia),
// pero -50% trabajo CPU por frame en el render loop (60fps).
const CANTIDAD_ESTRELLAS = 350;

const crearEstrellas = (count: number): Estrella[] => {
  const out: Estrella[] = new Array(count);
  for (let i = 0; i < count; i++) {
    out[i] = {
      x: Math.random() * 1600 - 800,
      y: Math.random() * 900 - 450,
      z: Math.random() * 1000,
      vWeight: Math.random(),
    };
  }
  return out;
};

const moverColorFondo = (
  current: [number, number, number],
  nextIdx: number
): number => {
  const nextBg = BG_COLORS[nextIdx];
  for (let i = 0; i < 3; i++) {
    const diff = current[i] - nextBg[i];
    if (Math.abs(diff) >= 0.5) current[i] += diff > 0 ? -0.2 : 0.2;
    else current[i] = nextBg[i];
  }
  const llego =
    Math.abs(current[0] - nextBg[0]) < 1 &&
    Math.abs(current[1] - nextBg[1]) < 1 &&
    Math.abs(current[2] - nextBg[2]) < 1;
  return llego ? (nextIdx + 1) % BG_COLORS.length : nextIdx;
};

interface FondoEspacialProMaxProps {
  /** false (default): position fixed, cubre toda la pantalla (uso en ProMax).
   *  true: position absolute, se contiene en el padre con position relative. */
  contenedor?: boolean;
}

const FondoEspacialProMax: React.FC<FondoEspacialProMaxProps> = ({ contenedor = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const estrellas = crearEstrellas(CANTIDAD_ESTRELLAS);
    const currentBg: [number, number, number] = [27, 63, 171];
    let nextBgIdx = 1;
    let prevTime = 0;

    const resize = () => {
      if (contenedor && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    let ro: ResizeObserver | undefined;
    if (contenedor && canvas.parentElement) {
      ro = new ResizeObserver(resize);
      ro.observe(canvas.parentElement);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    let animationFrameId = 0;

    const render = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;

      const v = 0.5 + Math.sin(time * 0.002) * 0.2;

      ctx.fillStyle = 'rgba(10, 10, 44, 0.2)';
      ctx.fillRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;
      const outerRadius = Math.max(w, h);
      const blackColorStop = h < w ? 0.15 : 0.1;

      const grd = ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, outerRadius);
      grd.addColorStop(blackColorStop, 'black');
      grd.addColorStop(1, `rgba(${currentBg[0]}, ${currentBg[1]}, ${currentBg[2]}, ${Math.max(v - 0.25, 0.1)})`);

      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      if (!prevTime) prevTime = time;
      const elapsed = time - prevTime;
      prevTime = time;

      const distance = elapsed * 0.02 + v;
      const intensidadBase = Math.max(v * 2, 0.3) + 0.2;

      // for-loop indexado: ~15% mas rapido que forEach en hot path (60fps × 350 estrellas).
      const n = estrellas.length;
      for (let i = 0; i < n; i++) {
        const star = estrellas[i];
        star.z -= distance + distance * v * star.vWeight;
        if (star.z <= 1) star.z += 1000;

        const x = centerX + star.x / (star.z * 0.001);
        const y = centerY + star.y / (star.z * 0.001);

        if (x >= 0 && x < w && y >= 0 && y < h) {
          const d = star.z / 1000.0;
          const intensity = (1 - d * d) * intensidadBase;
          ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.6})`;
          ctx.fillRect(x, y, 3, 3);
        }
      }

      nextBgIdx = moverColorFondo(currentBg, nextBgIdx);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [contenedor]);

  return (
    <div style={{ position: contenedor ? 'absolute' : 'fixed', inset: 0, zIndex: contenedor ? 0 : -1 }}>
      <Image
        src="/assets/purpleSpace.webp"
        alt=""
        fill
        priority
        style={{ objectFit: 'cover', opacity: 0.6, animation: 'zoomEspacial 30s ease-in-out infinite alternate' }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, opacity: 1 }}
      />
    </div>
  );
};

export default React.memo(FondoEspacialProMax);
