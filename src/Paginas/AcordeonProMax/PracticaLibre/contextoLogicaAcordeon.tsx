'use client';

import * as React from 'react';

/**
 * Context para exponer el objeto `logica` del acordeón a componentes profundos del árbol
 * (ej. ReproductorPistaUsuario, dentro de la sección Pistas y Estudio) sin tener que
 * propagarlo por 4 niveles de props.
 *
 * IMPORTANTE — value estable: el objeto `logica` cambia en cada render del padre (es el
 * return de un hook que produce objetos nuevos). Si pasáramos `value={logica}` directo,
 * todos los consumers + sus hijos re-renderizarían en cada render del padre, lo que
 * dispara bugs latentes en componentes hermanos (PanelEfectosSimulador tiene un useEffect
 * con onCambiarGraves como dep → "Maximum update depth exceeded").
 *
 * Solución: el value del provider es UN MISMO OBJETO siempre (`{ ref }`). Los consumers
 * llaman `useLogicaAcordeonCtx().current` o `getLogicaAcordeon()` para leer la lógica
 * actual. Sin re-renders en cascada.
 */

const LogicaAcordeonCtx = React.createContext<React.MutableRefObject<any> | null>(null);

export const LogicaAcordeonProvider: React.FC<{ logica: any; children: React.ReactNode }> = ({ logica, children }) => {
  const ref = React.useRef<any>(logica);
  // Mantenemos el ref sincronizado con la lógica más reciente, pero el value pasado al
  // provider sigue siendo el MISMO ref (estable) → no triggerea re-renders en consumers.
  ref.current = logica;
  return <LogicaAcordeonCtx.Provider value={ref}>{children}</LogicaAcordeonCtx.Provider>;
};

/**
 * Devuelve el ref con la lógica actual del acordeón. Para leer: `useLogicaAcordeonCtx()?.current`.
 * (Devolvemos el ref, no el valor, para no causar re-render cuando logica cambia.)
 */
export function useLogicaAcordeonCtx(): React.MutableRefObject<any> | null {
  return React.useContext(LogicaAcordeonCtx);
}
