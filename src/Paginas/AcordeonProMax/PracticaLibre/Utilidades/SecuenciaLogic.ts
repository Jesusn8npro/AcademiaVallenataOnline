import type { NotaHero } from '../../../../Core/hero/tipos_Hero';

export function formatearDuracion(ms: number): string {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

export function normalizarSecuenciaHero(valor: any): NotaHero[] {
  let secuencia = valor;

  if (typeof secuencia === 'string') {
    try {
      secuencia = JSON.parse(secuencia);
    } catch {
      secuencia = [];
    }
  }

  if (!Array.isArray(secuencia)) {
    return [];
  }

  return [...secuencia]
    .filter((nota) => nota && typeof nota.tick === 'number' && typeof nota.duracion === 'number' && typeof nota.botonId === 'string')
    .map((nota) => ({
      tick: Number(nota.tick),
      botonId: nota.botonId,
      duracion: Math.max(1, Math.floor(Number(nota.duracion) || 1)),
      fuelle: (nota.fuelle === 'abriendo' ? 'abriendo' : 'cerrando') as NotaHero['fuelle']
    }))
    .sort((a, b) => a.tick - b.tick);
}

export function calcularTotalTicksSecuencia(secuencia: NotaHero[]): number {
  return secuencia.reduce((maximo, nota) => Math.max(maximo, nota.tick + nota.duracion), 0);
}

export function calcularTicksDesdeSegundos(segundos: number, bpmActual: number): number {
  return Math.max(0, Math.round(segundos * (Math.max(1, bpmActual) / 60) * 192));
}

export function recortarNotasAntesDeTick(secuencia: NotaHero[], tickLimite: number): NotaHero[] {
  return secuencia.flatMap((nota) => {
    const fin = nota.tick + nota.duracion;

    if (fin <= tickLimite) {
      return [nota];
    }

    if (nota.tick < tickLimite) {
      return [{ ...nota, duracion: Math.max(1, tickLimite - nota.tick) }];
    }

    return [];
  });
}

export function recortarNotasDespuesDeTick(secuencia: NotaHero[], tickLimite: number): NotaHero[] {
  return secuencia.flatMap((nota) => {
    const fin = nota.tick + nota.duracion;

    if (nota.tick >= tickLimite) {
      return [nota];
    }

    if (fin > tickLimite) {
      return [{ ...nota, tick: tickLimite, duracion: Math.max(1, fin - tickLimite) }];
    }

    return [];
  });
}

export function combinarSecuenciasPorPunch(
  secuenciaOriginal: NotaHero[],
  secuenciaGrabada: NotaHero[],
  tickInicio: number,
  tickFin: number
): NotaHero[] {
  const antes = recortarNotasAntesDeTick(secuenciaOriginal, tickInicio);
  const tramoNuevo = secuenciaGrabada.flatMap((nota) => {
    const fin = nota.tick + nota.duracion;

    if (fin <= tickInicio || nota.tick >= tickFin) {
      return [];
    }

    const tickNormalizado = Math.max(nota.tick, tickInicio);
    const finNormalizado = Math.min(fin, tickFin);

    return [{
      ...nota,
      tick: tickNormalizado,
      duracion: Math.max(1, finNormalizado - tickNormalizado)
    }];
  });
  const despues = recortarNotasDespuesDeTick(secuenciaOriginal, tickFin);

  return [...antes, ...tramoNuevo, ...despues].sort((a, b) => a.tick - b.tick);
}

export function formatearTickComoTiempo(tick: number, bpmActual: number = 120): string {
  if (tick === null || tick === undefined) return "0:00";
  const segundosTotales = tick / (192 * (Math.max(1, bpmActual) / 60));
  const minutos = Math.floor(segundosTotales / 60);
  const segundosRestantes = Math.floor(segundosTotales % 60);
  return `${minutos}:${segundosRestantes.toString().padStart(2, "0")}`;
}
