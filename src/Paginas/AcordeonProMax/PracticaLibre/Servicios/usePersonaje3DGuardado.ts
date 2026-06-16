import { useState, useEffect } from 'react';
import { useUsuario } from '../../../../contextos/UsuarioContext';
import { leerPersonaje3DLocal, cargarPersonaje3DDB } from './servicioPersonaje3D';

// Elección 3D del usuario (skin del ACORDEÓN + ESCENARIO) — la MISMA que muestran el Mundo 3D, la
// pestaña Personaje y los modos de juego (localStorage + columna perfiles.personaje_3d). Lee local
// (instantáneo, cubre anónimos) y luego confirma con la DB (multi-dispositivo). Se usa en los modos
// de Pro Max que NO viven bajo PersonajeEstudioProvider (Competitivo/Libre/Maestro/Synthesia).
export function usePersonaje3DGuardado(skinFallback: string): { skin: string; escenario: string } {
  const { usuario } = useUsuario();
  const [val, setVal] = useState<{ skin: string; escenario: string }>(() => {
    const l = leerPersonaje3DLocal();
    return { skin: l.skin || skinFallback, escenario: l.escenarioId || 'estudio' };
  });
  useEffect(() => {
    const uid = usuario?.id;
    if (!uid) return;
    let vivo = true;
    cargarPersonaje3DDB(uid).then((d) => {
      if (vivo && d) setVal((p) => ({ skin: d.skin || p.skin, escenario: d.escenarioId || p.escenario }));
    });
    return () => { vivo = false; };
  }, [usuario?.id]);
  return val;
}
