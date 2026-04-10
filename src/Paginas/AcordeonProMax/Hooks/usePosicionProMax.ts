/**
 * ACORDEÓN PRO MAX — Hook de Posiciones de Botones (Stand-alone)
 * ─────────────────────────────────────────────────────────────
 * Calcula las coordenadas en pantalla (viewport) para dibujar el puente de notas.
 */

import { useRef, useCallback } from 'react';

export interface PosicionBoton {
  x: number;
  y: number;
}

function parsearBotonId(botonId: string): { hilera: number; numero: number } | null {
  const partes = botonId.split('-');
  if (partes.length < 2) return null;
  const hilera = parseInt(partes[0]);
  const numero = parseInt(partes[1]);
  if (isNaN(hilera) || isNaN(numero)) return null;
  return { hilera, numero };
}

function obtenerPosicionEnContenedor(contenedor: HTMLDivElement | null, botonId: string): PosicionBoton | null {
  if (!contenedor) return null;
  const parsed = parsearBotonId(botonId);
  if (!parsed) return null;
  const { hilera, numero } = parsed;
  const esBajo = botonId.includes('bajo');
  const selectorLado = esBajo ? '.lado-bajos' : '.lado-teclas';
  const filas = contenedor.querySelectorAll(`${selectorLado} .fila`);
  if (hilera < 1 || hilera > filas.length) return null;
  const fila = filas[hilera - 1];
  const botones = fila.querySelectorAll(':scope > .boton');
  const indice = numero - 1;
  if (indice < 0 || indice >= botones.length) return null;
  const boton = botones[indice] as HTMLElement;
  const rect = boton.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function usePosicionProMax() {
  const refMaestro = useRef<HTMLDivElement>(null);
  const refAlumno = useRef<HTMLDivElement>(null);

  const obtenerPosicionMaestro = useCallback((botonId: string): PosicionBoton | null => obtenerPosicionEnContenedor(refMaestro.current, botonId), []);
  const obtenerPosicionAlumno = useCallback((botonId: string): PosicionBoton | null => obtenerPosicionEnContenedor(refAlumno.current, botonId), []);

  return { refMaestro, refAlumno, obtenerPosicionMaestro, obtenerPosicionAlumno };
}
