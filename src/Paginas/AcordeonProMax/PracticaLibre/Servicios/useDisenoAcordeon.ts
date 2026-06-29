import { useState, useEffect } from 'react';
import { useUsuario } from '../../../../contextos/UsuarioContext';
import {
  leerMaterialesLocal, cargarMaterialesDB, type MaterialesAcordeon,
  leerNombresLocal, cargarNombresDB,
} from './servicioMaterialesAcordeon';
import { NOMBRES_CAJAS_DEFAULT, type NombresCajasConfig } from '../Componentes/VisorAcordeon3D';

// Diseño del acordeón del usuario (color por parte + nombres en las cajas) — el MISMO que se editó en
// la pestaña Acordeón de Pro Max. Lee localStorage (instantáneo) y confirma con la DB. Se usa en los
// modos/escenas que NO viven bajo EstudioPracticaLibre (Competitivo/Libre/Maestro/Synthesia/Mundo 3D)
// para que el acordeón se vea con el diseño guardado en todos lados.
const MATERIALES_DEFAULT: MaterialesAcordeon = {
  todos: { tinta: '#f5ead3', roughness: 0.55, metalness: 0.08, usarTexturaOriginal: true },
};

export function useDisenoAcordeon(): { materiales: MaterialesAcordeon; nombres: NombresCajasConfig } {
  const { usuario } = useUsuario();
  const [val, setVal] = useState<{ materiales: MaterialesAcordeon; nombres: NombresCajasConfig }>(() => ({
    materiales: leerMaterialesLocal() || MATERIALES_DEFAULT,
    nombres: leerNombresLocal() || NOMBRES_CAJAS_DEFAULT,
  }));
  useEffect(() => {
    const uid = usuario?.id;
    if (!uid) return;
    let vivo = true;
    Promise.all([cargarMaterialesDB(uid), cargarNombresDB(uid)]).then(([mats, noms]) => {
      if (!vivo) return;
      setVal((p) => ({
        materiales: (mats && Object.keys(mats).length) ? mats : p.materiales,
        nombres: noms || p.nombres,
      }));
    });
    return () => { vivo = false; };
  }, [usuario?.id]);
  return val;
}
