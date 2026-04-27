import { mapaTeclas } from '../../../Core/acordeon/mapaTecladoYFrecuencias';
import type { ModoVista } from '../../../Core/acordeon/TiposAcordeon';
import type { PosicionBoton } from '../Hooks/usePosicionProMax';

export function hileraDeBotonId(botonId: string): number {
  return parseInt(botonId.split('-')[0]) || 1;
}

export function bezier(t: number, p0: PosicionBoton, p1: PosicionBoton, p2: PosicionBoton, p3: PosicionBoton): PosicionBoton {
  const mt = 1 - t;
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

export function obtenerControlPoints(p0: PosicionBoton, p3: PosicionBoton): { p1: PosicionBoton; p2: PosicionBoton } {
  const dx = p3.x - p0.x;
  return { p1: { x: p0.x + dx * 0.42, y: p0.y }, p2: { x: p3.x - dx * 0.42, y: p3.y } };
}

export function construirPath(p0: PosicionBoton, p1: PosicionBoton, p2: PosicionBoton, p3: PosicionBoton): string {
  return `M ${p0.x},${p0.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
}

export function obtenerEtiqueta(botonId: string, modoVista: ModoVista, configTonalidad: any): string {
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
