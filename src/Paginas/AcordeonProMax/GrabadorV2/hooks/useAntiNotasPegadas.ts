import { useEffect, type MutableRefObject } from 'react';
import { mapaTeclas } from '../../../../Core/acordeon/mapaTecladoYFrecuencias';
import { mapaTeclasBajos } from '../../../../Core/acordeon/notasAcordeonDiatonico';

/**
 * ANTI-NOTAS-PEGADAS: tracker global de TODOS los inputs físicos activos (punteros + teclas).
 *
 * El problema: cuando el usuario cambia el fuelle, useLogicaAcordeon desmonta los botones
 * de la dirección vieja y monta los de la nueva (las React keys = `b.id` incluyen la
 * dirección). En la ventana de mount/unmount, si el usuario suelta el dedo físicamente, el
 * pointerup puede ir a un elemento "stale" que ya no está en `botonesActivos`. El check
 * `if (!botonesActivosRef.current[id]) return;` lo descarta → la nota nueva (empujar) queda
 * colgada con audio sonando.
 *
 * Igualmente para teclado: si holdás una tecla, cambiás fuelle (con la tecla espaciadora /
 * shift que esté mapeada en `cambiarFuelle`), y soltás la tecla original, en algunos casos
 * el id reconstruido no matchea el que quedó activo en botonesActivos → release no aplica.
 *
 * Solución: contamos punteros y teclas activas a nivel window. Cuando NO queda nada
 * presionado, después de un grace period de 80ms recorremos `botonesActivos` y forzamos
 * 'remove' a las notas con instancias reales (presses del usuario). Las notas del playback
 * de secuencia (instances=[]) NO se tocan — siguen su propio ciclo de timeout.
 *
 * Durante ejecución rápida (siempre hay al menos un dedo o una tecla apretada) el contador
 * nunca llega a 0 → este cleanup no interfiere con la grabación. Solo limpia cuando hay un
 * silencio real → notas fantasmas se cortan limpiamente.
 */
export function useAntiNotasPegadas(logicaRef: MutableRefObject<any>) {
  useEffect(() => {
    const punteros = new Set<number>();
    const teclas = new Set<string>();
    let cleanupTimeout = 0;
    let reconcileTimeout = 0;

    const cancelarCleanup = () => {
      if (cleanupTimeout) { window.clearTimeout(cleanupTimeout); cleanupTimeout = 0; }
    };
    const cancelarReconcile = () => {
      if (reconcileTimeout) { window.clearTimeout(reconcileTimeout); reconcileTimeout = 0; }
    };

    // Cleanup "todo soltado": cuando NO queda nada pisado (ni pointer ni tecla), después de
    // 80ms barre cualquier nota con instances que haya quedado colgada.
    const intentarCleanup = () => {
      if (punteros.size > 0 || teclas.size > 0) return;
      cancelarCleanup();
      cleanupTimeout = window.setTimeout(() => {
        cleanupTimeout = 0;
        if (punteros.size > 0 || teclas.size > 0) return;
        try {
          const l = logicaRef.current;
          const botones = l.botonesActivos as Record<string, any>;
          Object.entries(botones).forEach(([id, val]) => {
            const tieneInstancias = Array.isArray(val?.instances) && val.instances.length > 0;
            if (tieneInstancias) {
              try { l.actualizarBotonActivo(id, 'remove'); } catch (_) {}
            }
          });
        } catch (_) {}
      }, 80);
    };

    // Reconciliador: tras un keyup, si todavía hay OTRAS teclas pisadas, calcula qué ids
    // DEBERÍAN estar activos según `teclas` + dirección actual. Cualquier id de teclado en
    // botonesActivos que no esté en el set esperado es huérfano → fuera.
    //
    // Por qué: cuando el usuario tiene varias teclas pisadas + cambia el fuelle,
    // ejecutarSwapDireccion rota TODAS las activas a la nueva dirección. Si el grabador o el
    // estado quedan con un id que ninguna tecla pisa realmente, este reconciliador lo detecta.
    //
    // Solo toca ids que provendrían de teclado (presentes en mapaTeclas/mapaTeclasBajos). Las
    // notas pulsadas con pointer/touch (no derivables de teclas) las ignora — esas se limpian
    // por `intentarCleanup` cuando soltás los pointers.
    const teclaToPos: Record<string, { fila: number; columna: number; esBajo: boolean }> = {};
    Object.entries(mapaTeclas).forEach(([k, v]: [string, any]) => {
      teclaToPos[k.toLowerCase()] = { fila: v.fila, columna: v.columna, esBajo: false };
    });
    Object.entries(mapaTeclasBajos).forEach(([k, v]: [string, any]) => {
      teclaToPos[k.toLowerCase()] = { fila: v.fila, columna: v.columna, esBajo: true };
    });
    // Set de TODOS los ids que un teclado podría producir (en cualquier dirección). Sirve para
    // distinguir "esto es de teclado" vs "esto es de pointer/ESP32" al limpiar.
    const idsDeTeclado = new Set<string>();
    Object.values(teclaToPos).forEach(({ fila, columna, esBajo }) => {
      ['halar', 'empujar'].forEach(dir => {
        idsDeTeclado.add(`${fila}-${columna}-${dir}${esBajo ? '-bajo' : ''}`);
      });
    });

    const reconciliar = () => {
      try {
        const l = logicaRef.current;
        const dir = l.direccion;
        // Construir el set de ids que DEBERÍAN estar activos por las teclas pisadas ahora.
        const idsEsperados = new Set<string>();
        teclas.forEach(tecla => {
          const pos = teclaToPos[tecla];
          if (!pos) return;
          idsEsperados.add(`${pos.fila}-${pos.columna}-${dir}${pos.esBajo ? '-bajo' : ''}`);
        });
        const botones = l.botonesActivos as Record<string, any>;
        Object.entries(botones).forEach(([id, val]) => {
          // Solo reconciliar ids que vendrían de teclado (no tocar pointer/ESP32).
          if (!idsDeTeclado.has(id)) return;
          // Solo notas con instances reales (no las del playback de secuencia).
          const tieneInstancias = Array.isArray(val?.instances) && val.instances.length > 0;
          if (!tieneInstancias) return;
          if (!idsEsperados.has(id)) {
            try { l.actualizarBotonActivo(id, 'remove'); } catch (_) {}
          }
        });
      } catch (_) {}
    };
    const programarReconcile = () => {
      cancelarReconcile();
      // 50ms de margen para que React procese el keyup + el swap interno antes de reconciliar.
      reconcileTimeout = window.setTimeout(() => {
        reconcileTimeout = 0;
        reconciliar();
      }, 50);
    };

    const onPointerDown = (e: PointerEvent) => {
      punteros.add(e.pointerId);
      cancelarCleanup();
    };
    const onPointerUp = (e: PointerEvent) => {
      punteros.delete(e.pointerId);
      intentarCleanup();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.repeat) return;
      teclas.add(e.key.toLowerCase());
      cancelarCleanup();
      // El usuario tocó algo nuevo: cancela reconcile pendiente para no barrer la nota recién
      // agregada (su id puede no estar todavía en idsEsperados si la dirección está en transit).
      cancelarReconcile();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      teclas.delete(e.key.toLowerCase());
      // Si quedan teclas pisadas → reconciliar para barrer orphans del swap.
      // Si NO quedan teclas → caer al cleanup global (intentarCleanup).
      if (teclas.size > 0) programarReconcile();
      else intentarCleanup();
    };
    const onBlurWindow = () => {
      teclas.clear();
      intentarCleanup();
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlurWindow);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlurWindow);
      cancelarCleanup();
      cancelarReconcile();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
