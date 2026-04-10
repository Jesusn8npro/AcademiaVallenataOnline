/**
 * ACORDEÓN PRO MAX — Puente de Notas (SVG Overlay)
 * ──────────────────────────────────────────────
 * Componente SVG de posición fixed que dibuja la carretera de notas.
 * Independizado de la carpeta Hero.
 */

import React, { useMemo } from 'react';
import { mapaTeclas } from '../../SimuladorDeAcordeon/mapaTecladoYFrecuencias';
import type { ModoVista } from '../../SimuladorDeAcordeon/TiposAcordeon';
import type { CancionHeroConTonalidad } from '../TiposProMax';
import {
  TICKS_VIAJE,
  COLORES_SOMBRA_HILERA,
  COLOR_ABRIENDO,
  COLOR_CERRANDO,
} from '../TiposProMax';
import type { PosicionBoton } from '../Hooks/usePosicionProMax';

interface PropsPuenteNotas {
  cancion: CancionHeroConTonalidad;
  tickActual: number;
  obtenerPosicionMaestro: (botonId: string) => PosicionBoton | null;
  obtenerPosicionAlumno: (botonId: string) => PosicionBoton | null;
  modoVista: ModoVista;
  configTonalidad: any;
  notasImpactadas: Set<string>;
}

interface DatosNota {
  id: string;
  botonId: string;
  tick: number;
  duracion: number;
  fuelle: 'abriendo' | 'cerrando';
  progreso: number;
  progresoFinal: number; // Para la cola de la nota larga
  posMaestro: PosicionBoton;
  posAlumno: PosicionBoton;
  hilera: number;
  etiqueta: string;
  impactada: boolean;
}

function hileraDeBotonId(botonId: string): number {
  return parseInt(botonId.split('-')[0]) || 1;
}

function bezier(t: number, p0: PosicionBoton, p1: PosicionBoton, p2: PosicionBoton, p3: PosicionBoton): PosicionBoton {
  const mt = 1 - t;
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

function obtenerControlPoints(p0: PosicionBoton, p3: PosicionBoton): { p1: PosicionBoton; p2: PosicionBoton } {
  const dx = p3.x - p0.x;
  return { p1: { x: p0.x + dx * 0.42, y: p0.y }, p2: { x: p3.x - dx * 0.42, y: p3.y } };
}

function construirPath(p0: PosicionBoton, p1: PosicionBoton, p2: PosicionBoton, p3: PosicionBoton): string {
  return `M ${p0.x},${p0.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
}

function obtenerEtiqueta(botonId: string, modoVista: ModoVista, configTonalidad: any): string {
  const partes = botonId.split('-');
  if (partes.length < 3) return partes[1] || '?';
  const hilera = parseInt(partes[0]);
  const numero = partes[1];
  if (modoVista === 'numeros') return numero;
  if (modoVista === 'teclas') {
    const tecla = Object.keys(mapaTeclas).find(k => mapaTeclas[k].fila === hilera && mapaTeclas[k].columna === parseInt(numero));
    return tecla ? tecla.toUpperCase() : numero;
  }
  const filaKey = hilera === 1 ? 'primeraFila' : hilera === 2 ? 'segundaFila' : 'terceraFila';
  const fila: any[] = configTonalidad?.[filaKey] || [];
  const boton = fila.find((b: any) => b.id === botonId);
  if (!boton) return numero;
  const nombre: string = (String(boton.nombre) || numero).replace(/\d/g, '');
  if (modoVista === 'cifrado') {
    const CIFRADO: Record<string, string> = { Do: 'C', Reb: 'Db', Re: 'D', Mib: 'Eb', Mi: 'E', Fa: 'F', Solb: 'Gb', Sol: 'G', Lab: 'Ab', La: 'A', Sib: 'Bb', Si: 'B' };
    return CIFRADO[nombre] || nombre;
  }
  return nombre;
}

const PuenteNotas: React.FC<PropsPuenteNotas> = ({ cancion, tickActual, obtenerPosicionMaestro, obtenerPosicionAlumno, modoVista, configTonalidad, notasImpactadas }) => {
  const notasEnVuelo = useMemo<DatosNota[]>(() => {
    const resultado: DatosNota[] = [];
    const windowStart = tickActual - 60; // Dejamos ver un poco más hacia atrás
    const windowEnd = tickActual + TICKS_VIAJE + 40;

    for (const nota of cancion.secuencia) {
      if (nota.tick < windowStart || (nota.tick - TICKS_VIAJE) > windowEnd) continue;

      const posMaestro = obtenerPosicionMaestro(nota.botonId);
      const posAlumno = obtenerPosicionAlumno(nota.botonId);
      if (!posMaestro || !posAlumno) continue;

      const tickSalida = nota.tick - TICKS_VIAJE;
      const progreso = Math.max(0, Math.min((tickActual - tickSalida) / TICKS_VIAJE, 1.05));
      
      // La cola termina 'duracion' ticks después de que la cabeza llega
      const dur = nota.duracion || 0;
      const progresoFinal = Math.max(0, Math.min(((tickActual - tickSalida) - dur) / TICKS_VIAJE, 1.0));

      const impactada = notasImpactadas.has(`${nota.tick}-${nota.botonId}`);

      resultado.push({
        id: `${nota.tick}-${nota.botonId}`,
        botonId: nota.botonId,
        tick: nota.tick,
        duracion: dur,
        fuelle: nota.fuelle === 'abriendo' ? 'abriendo' : 'cerrando',
        progreso,
        progresoFinal,
        posMaestro,
        posAlumno,
        hilera: hileraDeBotonId(nota.botonId),
        etiqueta: obtenerEtiqueta(nota.botonId, modoVista, configTonalidad),
        impactada 
      });
    }
    return resultado;
  }, [tickActual, cancion, obtenerPosicionMaestro, obtenerPosicionAlumno, modoVista, configTonalidad, notasImpactadas]);

  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 15, overflow: 'visible' }}>
      <defs>
        {[1, 2, 3].map(h => (
          <filter key={h} id={`brillo-hilera-${h}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
        {/* Brillo de impacto (Nota perfecta) */}
        <filter id="brillo-impacto">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 0.8  0 0 0 18 -7" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>

        {/* Gradiente para los pilares de luz */}
        <linearGradient id="gradiente-pilar-azul" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradiente-pilar-rojo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
            <stop offset="50%" stopColor="#ef4444" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
      </defs>
      {notasEnVuelo.map(datos => {
        const { p1, p2 } = obtenerControlPoints(datos.posMaestro, datos.posAlumno);
        
        // CORRECCIÓN: Evitamos que la nota pase de largo. Si se falla, se detiene sobre el botón (progreso = 1.0) y muestra la X
        const currentT = Math.min(datos.progreso, 1.0);
        const pos頭 = bezier(currentT, datos.posMaestro, p1, p2, datos.posAlumno);
        
        // Opacidad: Se desvanece rápido si ya fue impactada o si pasó de largo
        const opacidad = datos.progreso < 0.05 ? datos.progreso / 0.05 : 
                         (datos.impactada && datos.progreso >= 1.0) ? Math.max(0, 1 - (datos.progreso - 1.0) / 0.08) :
                         datos.progreso > 1.1 ? Math.max(0, 1 - (datos.progreso - 1.1) / 0.05) : 1;
        
        // Estética Premium: El tamaño de la nota crece al acercarse al Alumno
        // Si está impactada, mantenemos el tamaño de impacto (28px) durante el brillo
        const radioComp = datos.impactada ? 28 :
                         (datos.progreso > 0.8 && datos.progreso <= 1.0) ? 20 + (datos.progreso - 0.8) * 40 : 20;
        
        // Cambio de color al fallar
        const esFallada = datos.progreso > 1.0 && !datos.impactada;
        const colorFuelle = esFallada ? '#444' : (datos.fuelle === 'abriendo' ? COLOR_ABRIENDO : COLOR_CERRANDO);
        const colorSombra = COLORES_SOMBRA_HILERA[datos.hilera] || '#ffffff';

        // Longitud aproximada de la curva Bezier (muy ruda para performance)
        const dx = datos.posAlumno.x - datos.posMaestro.x;
        const dy = datos.posAlumno.y - datos.posMaestro.y;
        const L = Math.sqrt(dx*dx + dy*dy) * 1.15; // Factor de curvatura

        // Estela sostendida (Sustain)
        const tieneSustain = datos.duracion > 30;
        const d_progress = datos.progreso - datos.progresoFinal; // cuánto del path ocupa la nota
        const dashLen = d_progress * L;
        const dashOffset = (1 - datos.progreso) * L;

        return (
          <g key={datos.id} style={{ opacity: opacidad }}>
            {/* 🔦 PILAR DE LUZ (Hit Effect - Solo cuando la nota llega al Alumno e impacta) */}
            {datos.impactada && datos.progreso >= 0.98 && (
                <rect
                    x={datos.posAlumno.x - 25}
                    y={datos.posAlumno.y - 400}
                    width={50}
                    height={800}
                    fill={`url(#gradiente-pilar-${datos.fuelle === 'abriendo' ? 'azul' : 'rojo'})`}
                    className="hero-hit-pillar"
                />
            )}

            {/* 💥 ANILLO DE EXPANSIÓN (Onda de choque al impactar) */}
            {datos.impactada && datos.progreso >= 1.0 && datos.progreso < 1.05 && (
                <circle
                    cx={datos.posAlumno.x}
                    cy={datos.posAlumno.y}
                    r={28 + (datos.progreso - 1.0) * 200}
                    fill="none"
                    stroke={colorFuelle}
                    strokeWidth={3}
                    strokeOpacity={Math.max(0, 1 - (datos.progreso - 1.0) * 20)}
                />
            )}

            {/* 🛤️ LA GUÍA (Camino sombreado sutil) */}
            <path
                d={construirPath(datos.posMaestro, p1, p2, datos.posAlumno)}
                fill="none"
                stroke={colorFuelle}
                strokeWidth={3}
                strokeOpacity={0.25}
                strokeDasharray="6 8"
            />

            {/* 🐍 ESTELA DE SOSTENIDO (Sustain Trail) */}
            {tieneSustain && (
                <path 
                    d={construirPath(datos.posMaestro, p1, p2, datos.posAlumno)} 
                    fill="none" 
                    stroke={colorFuelle} 
                    strokeWidth={radioComp * 0.9} 
                    strokeLinecap="round"
                    strokeOpacity={0.4}
                    strokeDasharray={`${dashLen} ${L}`} // Dibuja solo el segmento ocupado por la nota
                    strokeDashoffset={-dashOffset} // Lo posiciona en la cabeza
                    className={datos.progreso >= 1.0 && !datos.impactada ? 'activo' : ''}
                    style={{ filter: `drop-shadow(0 0 8px ${colorFuelle})` }}
                />
            )}

            {/* 🎯 PRE-AVISO Y GAUGE DE DURACIÓN (Sustain Bar) */}
            {datos.progreso > 0.6 && !esFallada && (
                <g transform={`translate(${datos.posAlumno.x}, ${datos.posAlumno.y})`}>
                    {/* Halo de zona destino (cuando la nota está 60-100% del camino) */}
                    {datos.progreso > 0.6 && datos.progreso < 1.0 && !datos.impactada && (
                        <circle
                            r={26}
                            fill={colorFuelle}
                            fillOpacity={0.15 * (datos.progreso - 0.6) / 0.4}
                            stroke={colorFuelle}
                            strokeWidth={2}
                            strokeOpacity={0.4 * (datos.progreso - 0.6) / 0.4}
                        />
                    )}

                    {/* Anillo de pre-aviso (solo antes del impacto) */}
                    {datos.progreso < 1.0 && !datos.impactada && (
                        <>
                            <circle
                                r={24 + Math.sin(tickActual * 0.05) * 5}
                                fill="none"
                                stroke={colorFuelle}
                                strokeWidth={4}
                                strokeOpacity={0.4}
                            />
                            {datos.progreso > 0.9 && (
                                <circle r={28} fill="none" stroke={colorFuelle} strokeWidth={2} strokeOpacity={0.8} />
                            )}
                        </>
                    )}

                    {/* 🕒 BARRA CIRCULAR DE DURACIÓN (Solo para notas largas impactadas) */}
                    {datos.impactada && tieneSustain && datos.progreso >= 1.0 && (() => {
                        const ticksRestantes = (datos.tick + datos.duracion) - tickActual;
                        const porcentajeRestante = Math.max(0, Math.min(ticksRestantes / datos.duracion, 1));
                        
                        // Perímetro del círculo (r=32): 2 * PI * 32 ≈ 201
                        const circunf = 201;
                        const offset = circunf * (1 - porcentajeRestante);

                        return (
                            <g>
                                {/* Fondo del gauge */}
                                <circle r={32} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={6} />
                                {/* El Gauge que se reduce */}
                                <circle 
                                    r={32} 
                                    fill="none" 
                                    stroke={colorFuelle} 
                                    strokeWidth={6} 
                                    strokeDasharray={circunf}
                                    strokeDashoffset={-offset}
                                    strokeLinecap="round"
                                    transform="rotate(-90)"
                                    style={{ filter: `drop-shadow(0 0 8px ${colorFuelle})` }}
                                />
                                {/* Texto de instrucción */}
                                <text 
                                    textAnchor="middle" 
                                    y={50} 
                                    fontSize={12} 
                                    fontWeight="900" 
                                    fill="#fff"
                                    style={{ textShadow: '0 0 5px #000' }}
                                >
                                    ¡SOTÉN!
                                </text>
                            </g>
                        );
                    })()}
                </g>
            )}

            {/* 💎 LA NOTA (Gema de alta visibilidad) */}
            <g transform={`translate(${pos頭.x}, ${pos頭.y})`} filter={datos.impactada ? 'url(#brillo-impacto)' : (esFallada ? 'none' : `url(#brillo-hilera-${datos.hilera})`)}>
              {/* Resplandor exterior */}
              {!esFallada && <circle r={radioComp + 12} fill={colorFuelle} fillOpacity={0.15} />}
              
              {/* Cuerpo principal */}
              <circle r={radioComp} fill={datos.impactada ? '#fff' : (esFallada ? '#222' : colorFuelle)} stroke={esFallada ? '#444' : '#fff'} strokeWidth={2.5} />
              
              {/* Núcleo de Cristal */}
              {!datos.impactada && !esFallada && (
                <circle 
                    r={radioComp * 0.45} 
                    fill="#fff" 
                    fillOpacity={0.9} 
                    style={{ filter: 'blur(1px)' }}
                />
              )}

              {/* Marca visual suave de error si se pasó */}
              {esFallada && (
                <>
                  <circle r={radioComp + 5} fill="none" stroke="#f59e0b" strokeWidth={3} strokeOpacity={0.95} />
                  <circle r={radioComp * 0.45} fill="#f59e0b" fillOpacity={0.88} />
                </>
              )}

              {/* Etiqueta */}
              {datos.progreso > 0.1 && datos.progreso < 0.99 && (
                <text 
                    textAnchor="middle" 
                    dominantBaseline="central" 
                    fontSize={radioComp * 0.7} 
                    fontWeight="1000" 
                    fill={datos.fuelle === 'abriendo' ? '#000' : '#fff'}
                    style={{ 
                        userSelect: 'none', 
                        fontFamily: '"Raleway", sans-serif', 
                        pointerEvents: 'none'
                    }}
                >
                    {datos.etiqueta}
                </text>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
};

export default React.memo(PuenteNotas);
