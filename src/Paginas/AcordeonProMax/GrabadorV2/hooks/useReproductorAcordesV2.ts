import React from 'react';

/**
 * Reproductor de acordes maestros — copia del original `useReproductorAcordesAdmin`. Maneja:
 *  - Tocar un acorde individual (autostop a 5s)
 *  - Reproducir el círculo completo (todos los acordes filtrados, secuencial, 3s c/u)
 *  - Editar acorde existente (cambia al tab Crear)
 *  - "+ Nuevo acorde" desde la biblioteca con tonalidad/modalidad pre-seleccionada
 */
export function useReproductorAcordesV2(
  logica: any,
  setAcordeAEditar: (a: any) => void,
  onNavegarACrear: () => void,
) {
  const [acordeMaestroActivo, setAcordeMaestroActivo] = React.useState(false);
  const [idSonandoCiclo, setIdSonandoCiclo] = React.useState<string | null>(null);
  const timerAutostopRef = React.useRef<any>(null);
  const cicloActivoRef = React.useRef(false);

  const onReproducirAcorde = React.useCallback((botones: string[], fuelle: string, id?: string) => {
    logica.limpiarTodasLasNotas();
    if (timerAutostopRef.current) clearTimeout(timerAutostopRef.current);

    const dirNueva = fuelle === 'abriendo' ? 'halar' : 'empujar';
    logica.setDireccion(dirNueva);
    setAcordeMaestroActivo(true);
    if (id) setIdSonandoCiclo(id);

    setTimeout(() => {
      botones.forEach((idNote: string) => {
        const originalParts = idNote.split('-');
        const esBajo = idNote.includes('bajo');
        const idFinal = `${originalParts[0]}-${originalParts[1]}-${dirNueva}${esBajo ? '-bajo' : ''}`;
        logica.actualizarBotonActivo(idFinal, 'add', null, false, undefined, true);
      });
    }, 50);

    timerAutostopRef.current = setTimeout(() => {
      logica.limpiarTodasLasNotas();
      setAcordeMaestroActivo(false);
      setIdSonandoCiclo(null);
    }, 5000);
  }, [logica]);

  const onDetener = React.useCallback(() => {
    if (timerAutostopRef.current) clearTimeout(timerAutostopRef.current);
    cicloActivoRef.current = false;
    logica.limpiarTodasLasNotas();
    setAcordeMaestroActivo(false);
    setIdSonandoCiclo(null);
  }, [logica]);

  const onEditarAcorde = React.useCallback((acorde: any) => {
    setAcordeAEditar(acorde);
    onNavegarACrear();
  }, [setAcordeAEditar, onNavegarACrear]);

  const onNuevoAcordeEnCirculo = React.useCallback((tonalidad?: string | null, modalidad?: 'Mayor' | 'Menor' | null) => {
    setAcordeAEditar({
      grado: tonalidad || '',
      modalidad_circulo: modalidad || 'Mayor',
    });
    onNavegarACrear();
  }, [setAcordeAEditar, onNavegarACrear]);

  const onReproducirCirculoCompleto = React.useCallback(async (acordes: any[]) => {
    if (cicloActivoRef.current) {
      cicloActivoRef.current = false;
      logica.limpiarTodasLasNotas();
      setAcordeMaestroActivo(false);
      return;
    }

    cicloActivoRef.current = true;
    setAcordeMaestroActivo(true);

    for (const ac of acordes) {
      setIdSonandoCiclo(ac.id);

      logica.limpiarTodasLasNotas();
      const dirNueva = ac.fuelle === 'abriendo' ? 'halar' : 'empujar';
      logica.setDireccion(dirNueva);

      await new Promise((r) => setTimeout(r, 50));
      if (!cicloActivoRef.current) break;

      ac.botones.forEach((id: string) => {
        const originalParts = id.split('-');
        const esBajo = id.includes('bajo');
        const idFinal = `${originalParts[0]}-${originalParts[1]}-${dirNueva}${esBajo ? '-bajo' : ''}`;
        logica.actualizarBotonActivo(idFinal, 'add', null, false, undefined, true);
      });

      await new Promise((r) => {
        timerAutostopRef.current = setTimeout(r, 3000);
      });
    }

    cicloActivoRef.current = false;
    logica.limpiarTodasLasNotas();
    setAcordeMaestroActivo(false);
    setIdSonandoCiclo(null);
  }, [logica]);

  return {
    idSonandoCiclo,
    acordeMaestroActivo,
    onReproducirAcorde,
    onDetener,
    onEditarAcorde,
    onNuevoAcordeEnCirculo,
    onReproducirCirculoCompleto,
  };
}
