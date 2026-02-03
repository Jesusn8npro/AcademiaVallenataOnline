// =====================================================
// 🎮 TIPOS ESPECÍFICOS PARA EL SIMULADOR DE ACORDEÓN
// =====================================================

export interface AudioContextType extends AudioContext {
  webkitAudioContext?: typeof AudioContext;
}

export interface ActiveButton {
  oscillator: OscillatorNode | OscillatorNode[];
  frecuencia: number | number[];
  nombre: string;
  id: string;
}

export interface ActiveButtonMap {
  [key: string]: ActiveButton;
}

export interface ButtonData {
  id: string;
  nombre: string;
  frecuencia: number | number[];
}

export interface FilaData {
  [key: string]: ButtonData[];
}

export interface DisposicionData {
  primeraFila: ButtonData[];
  segundaFila: ButtonData[];
  terceraFila: ButtonData[];
}

export interface DisposicionBajosData {
  una: ButtonData[];
  dos: ButtonData[];
}

export interface MapaTeclasData {
  [key: string]: {
    fila: number;
    columna: number;
  };
}

export interface MapaBotonesPorIdData {
  [key: string]: ButtonData;
}

export interface TonosFilasData {
  [afinacion: string]: {
    [fila: string]: string;
  };
}

export interface EscalasData {
  [scale: string]: {
    [type: string]: string[][];
  };
}

export interface WindowWithAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export type DirectionType = 'halar' | 'empujar';
export type AfinacionType = 'FBE' | 'GCF' | 'ADG';
export type ModoType = 'practica' | 'lecciones' | 'canciones' | 'desafios'; 