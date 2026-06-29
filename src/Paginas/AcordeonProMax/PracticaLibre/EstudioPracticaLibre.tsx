import * as React from 'react'
import dynamic from 'next/dynamic';
import PanelAjustes from '../../../Core/componentes/PanelAjustes/PanelAjustes';
import { TONALIDADES } from '../../../Core/acordeon/notasAcordeonDiatonico';
import { obtenerModeloVisualPorId } from './Datos/modelosVisualesAcordeon';
import { useEstudioPracticaLibre } from './Hooks/useEstudioPracticaLibre';
import { useMetronomoEstudiante } from './Hooks/useMetronomoEstudiante';
import BarraSuperiorPracticaLibre from './Componentes/BarraSuperiorPracticaLibre';
import PanelLateralEstudiante from './Componentes/PanelLateralEstudiante';
import ModalGuardarPracticaLibre from './Componentes/ModalGuardarPracticaLibre';
import ReproductorCancionHero from './Componentes/ReproductorCancionHero';
import { VARIANTES_3D, type VarianteId } from './Componentes/SeccionPL3D';
import { NOMBRES_CAJAS_DEFAULT, baseDePieza, grupoDePieza } from './Componentes/VisorAcordeon3D';
import type { AnimShapeKeyId, AnimProgramaticaId, InfoPieza, MaterialPieza, NombresCajasConfig, NombreCajaConfig } from './Componentes/VisorAcordeon3D';
import { formatearDuracion } from './Utilidades/SecuenciaLogic';
import { LogicaAcordeonProvider } from './contextoLogicaAcordeon';
import { PersonajeEstudioProvider } from './contextoPersonajeEstudio';
import { useEncuadreAcordeon } from '../Modos/acordeon3dCompartido';
import EditorEncuadreAcordeon from '../Componentes/EditorEncuadreAcordeon';
import { useUsuario } from '../../../contextos/UsuarioContext';
import {
  leerMaterialesLocal, guardarMaterialesLocal, cargarMaterialesDB, guardarMaterialesDB,
  leerNombresLocal, guardarNombresLocal, cargarNombresDB, guardarNombresDB,
} from './Servicios/servicioMaterialesAcordeon';
import { listarPresets, guardarPreset, actualizarPreset, borrarPreset, guardarPresetsLocal, type PresetAcordeon } from './Servicios/servicioPresetsAcordeon';
import './EstudioPracticaLibre.css';

// Three.js es pesado (~500KB) — cargar solo cuando el alumno abre la pestaña 3D.
const VisorAcordeon3D = dynamic(
  () => import('./Componentes/VisorAcordeon3D'),
  { ssr: false, loading: () => <div className="visor-acordeon-3d-cargando">Cargando visor 3D…</div> }
);

// Acordeón principal de Práctica Libre: mismo encuadre RESPONSIVE que el modo competitivo (camaraFija
// + EncuadreJuego) → se ve centrado y al tamaño correcto en cualquier pantalla, y se puede NAVEGAR
// (orbitar). El admin ajusta su tamaño/posición inicial con el botón "Posición" (encuadre 'estudio').
// NO se le pasa `skin` a propósito: así el sistema de pintado por partes (materialPorMesh) gobierna los
// materiales sobre las texturas baked reales de Blender (el usuario recolorea cada parte y se guarda).
const AcordeonPrincipal3D: React.FC<React.ComponentProps<typeof VisorAcordeon3D>> = (props) => {
  const enc = useEncuadreAcordeon('estudio');
  return (
    <VisorAcordeon3D
      {...props}
      camaraFija
      navegable
      zoomLibre
      rotacionModelo={enc.rotacion}
      fillModelo={enc.fill}
      offsetRelXModelo={enc.offX}
      offsetRelYModelo={enc.offY}
    />
  );
};

// Escribe un color/acabado en el diseño SIN globales destructivos. El pintado es por PARTE:
//  • Pieza suelta → clave BASE (sin sufijo) y borra variantes viejas de ESA misma pieza (evita que un
//    clic viejo con sufijo .007/.008 la pise por ambigüedad).
//  • Grupo (ej. "Caja melodía") → su id, y borra los clics por-pieza que caen en ese grupo, así el color
//    del grupo se ve uniforme. NUNCA toca otras partes → no aplana el diseño.
// (Se eliminó el "Todo el acordeón"/global: hacía cambios masivos que borraban los detalles del diseño.)
function escribirColor(
  prev: Record<string, MaterialPieza>,
  piezaSeleccionada: string | null,
  grupoActivo: string,
  patch: Partial<MaterialPieza>,
): Record<string, MaterialPieza> {
  if (piezaSeleccionada) {
    const base = baseDePieza(piezaSeleccionada);
    const next: Record<string, MaterialPieza> = {};
    for (const k of Object.keys(prev)) if (baseDePieza(k) !== base) next[k] = prev[k];
    next[base] = { ...(prev[base] ?? prev['todos']), ...patch };
    return next;
  }
  // "Cintas del fuelle" = TODOS los aros (cuero + metal) de una. Escribimos los DOS grupos de aros y
  // limpiamos los aros pintados sueltos, para que toda la cinta visible tome el color.
  if (grupoActivo === 'fuelle-aros') {
    const next: Record<string, MaterialPieza> = {};
    for (const k of Object.keys(prev)) {
      if (/^Aro/i.test(k) || k === 'fuelle-cueros' || k === 'fuelle-codos') continue;
      next[k] = prev[k];
    }
    next['fuelle-cueros'] = { ...(prev['fuelle-cueros'] ?? prev['todos']), ...patch };
    next['fuelle-codos'] = { ...(prev['fuelle-codos'] ?? prev['todos']), ...patch };
    return next;
  }
  const next: Record<string, MaterialPieza> = {};
  // Los anillos del fuelle ('Aro 16.x') y el paño ('fuelle'/'fuelle_2') NO se clasifican por nombre
  // (grupoDePieza los manda a 'otros' sin el material), así que un anillo pintado suelto se quedaba
  // pisando el color del GRUPO. Al pintar un grupo del fuelle, limpiamos también esas claves por nombre.
  const limpiaAros = grupoActivo === 'fuelle-cueros' || grupoActivo === 'fuelle-codos';
  const limpiaFondo = grupoActivo === 'fuelle-cintas';
  for (const k of Object.keys(prev)) {
    if (k === grupoActivo) continue;
    if (grupoDePieza(k) === grupoActivo) continue; // limpiar override por-pieza de este grupo
    if (limpiaAros && /^Aro/i.test(k)) continue;
    if (limpiaFondo && /^fuelle(_|$)/i.test(k)) continue;
    next[k] = prev[k];
  }
  next[grupoActivo] = { ...(prev[grupoActivo] ?? prev['todos']), ...patch };
  return next;
}

// Personaje 3D con acordeón: GLB pesado, cargar solo al abrir la pestaña Personaje.
const VisorPersonaje3D = dynamic(
  () => import('./Componentes/VisorPersonaje3D'),
  { ssr: false, loading: () => <div className="visor-acordeon-3d-cargando">Cargando personaje 3D…</div> }
);

interface EstudioPracticaLibreProps {
  logica: any;
  modoAjuste: boolean;
  setModoAjuste: React.Dispatch<React.SetStateAction<boolean>>;
  pestanaActiva: 'diseno' | 'sonido';
  setPestanaActiva: React.Dispatch<React.SetStateAction<'diseno' | 'sonido'>>;
  imagenFondo: string;
  modosVista: Array<{ valor: any; label: string }>;
  grabando: boolean;
  tiempoGrabacionMs: number;
  mostrarModalGuardar: boolean;
  guardandoGrabacion: boolean;
  errorGuardadoGrabacion: string | null;
  tituloSugeridoGrabacion: string;
  resumenGrabacionPendiente: { duracionMs: number; bpm: number; tonalidad: string | null; notas: number } | null;
  ultimaGrabacionGuardada: { id: string; titulo: string } | null;
  onIniciarGrabacion: (tipo?: 'practica_libre' | 'competencia') => void;
  onDetenerGrabacion: (metadataExtra?: Record<string, any>) => void;
  onGuardarGrabacion: (datos: any) => Promise<boolean>;
  onCancelarGuardado: () => void;
  volumenAcordeon: number;
  setVolumenAcordeon: (v: number) => void;
  onVolver?: () => void;
  esp32Conectado?: boolean;
  conectarESP32?: () => Promise<void>;
  hero?: any;
}

const EstudioPracticaLibre: React.FC<EstudioPracticaLibreProps> = ({
  logica, modoAjuste, setModoAjuste, pestanaActiva, setPestanaActiva,
  modosVista, grabando, tiempoGrabacionMs,
  mostrarModalGuardar, guardandoGrabacion, errorGuardadoGrabacion,
  tituloSugeridoGrabacion, resumenGrabacionPendiente, ultimaGrabacionGuardada,
  onIniciarGrabacion, onDetenerGrabacion, onGuardarGrabacion, onCancelarGuardado,
  volumenAcordeon, setVolumenAcordeon, onVolver, esp32Conectado = false, conectarESP32,
  hero,
}) => {
  // Canción hero seleccionada para reproducir inline (sin salir de Práctica Libre).
  const [cancionEnReproductor, setCancionEnReproductor] = React.useState<any>(null);
  const [seccionInicialPendiente, setSeccionInicialPendiente] = React.useState<any>(null);

  const onSeleccionarCancionHero = React.useCallback((cancion: any) => {
    setCancionEnReproductor(cancion);
    setSeccionInicialPendiente(null);
  }, []);

  const onSeleccionarSeccionHero = React.useCallback((cancion: any, seccion: any) => {
    setCancionEnReproductor(cancion);
    setSeccionInicialPendiente(seccion);
  }, []);

  const cerrarReproductor = React.useCallback(() => {
    setCancionEnReproductor(null);
    setSeccionInicialPendiente(null);
  }, []);

  const estudio = useEstudioPracticaLibre({
    tonalidadSeleccionada: logica.tonalidadSeleccionada,
    instrumentoId: logica.instrumentoId,
    grabando,
    volumenAcordeon,
    setVolumenAcordeon,
  });
  const metronomo = useMetronomoEstudiante();

  // ─── Visor 3D ───────────────────────────────────────────────────────
  // Material por mesh: clave 'todos' es default, claves de grupo (ej 'botones-melodia')
  // sobrescriben para ese grupo, claves de nombre exacto (ej 'Boton_D_05') ganan a todo lo demás.
  // Default cálido: textura baked tintada en un crema marfil (no blanco plano).
  // Cuando el usuario aplique cualquier color del panel, se desactiva la textura y va
  // sólido. Cuando vuelva a "Original" (#ffffff), se restaura este look cálido.
  const [materialPorMesh, setMaterialPorMesh] = React.useState<Record<string, MaterialPieza>>({
    todos: { tinta: '#f5ead3', roughness: 0.55, metalness: 0.08, usarTexturaOriginal: true },
  });

  // ─── Modelo seleccionado en la pestaña Diseños (galería tipo Personaje) ────────────────
  // '' = "Mi diseño" (el pintado por partes, EDITABLE; materialPorMesh gobierna). 'original'/'1'..'7' =
  // piel de fábrica (textura PBR, NO editable). Al pintar un color volvemos a '' para que el edit se vea.
  const [skinAcordeon, setSkinAcordeon] = React.useState<string>('');
  // Id del preset actualmente cargado en el pintado (para resaltarlo y mostrar "Editando: <nombre>").
  const [presetAplicadoId, setPresetAplicadoId] = React.useState<string | null>(null);
  // Elegir un modelo de la galería: 'Mi diseño' ('') o una piel de fábrica. Sale de cualquier preset.
  const seleccionarModeloAcordeon = React.useCallback((skin: string) => {
    const DEF = { todos: { tinta: '#f5ead3', roughness: 0.55, metalness: 0.08, usarTexturaOriginal: true } };
    if (skin) {
      // Piel de fábrica → partir LIMPIO (sin el diseño anterior) para que la piel se vea PURA. Al pintar
      // una parte se agrega ENCIMA de la piel; el resto sigue siendo la piel.
      setMaterialPorMesh(DEF);
    } else {
      // "Mi diseño" → recargar tu diseño en vivo guardado (no el sobrante de una piel que estabas viendo).
      const live = leerMaterialesLocal();
      setMaterialPorMesh(live && Object.keys(live).length ? live : DEF);
    }
    setSkinAcordeon(skin);
    setPresetAplicadoId(null);
  }, []);

  // ─── Persistencia del pintado por partes (por usuario) ──────────────────────────────
  // localStorage primero (instantáneo) + columna perfiles.acordeon_materiales si hay sesión. Igual
  // patrón que el "personaje fichado": no guardar hasta terminar de hidratar (no pisar lo guardado).
  const { usuario } = useUsuario();
  const materialesHidratadoRef = React.useRef(false);
  React.useEffect(() => {
    let vivo = true;
    materialesHidratadoRef.current = false;
    const local = leerMaterialesLocal();
    if (local && Object.keys(local).length) setMaterialPorMesh(local);
    const uid = usuario?.id;
    if (uid) {
      cargarMaterialesDB(uid)
        .then((db) => { if (vivo && db && Object.keys(db).length) { setMaterialPorMesh(db); guardarMaterialesLocal(db); } })
        .finally(() => { materialesHidratadoRef.current = true; });
    } else {
      materialesHidratadoRef.current = true;
    }
    return () => { vivo = false; };
  }, [usuario?.id]);
  React.useEffect(() => {
    if (!materialesHidratadoRef.current) return;
    // Sobre una PIEL de fábrica, materialPorMesh son overrides de esa piel (no "Mi diseño") → NO lo
    // guardamos como Mi diseño (si no, ver una piel pisaría tu diseño). El diseño de piel se guarda como
    // preset (con _piel) al darle Guardar.
    if (skinAcordeon) return;
    guardarMaterialesLocal(materialPorMesh);
    // Aviso GLOBAL: el acordeón del Personaje/Mundo escucha esto y re-aplica el diseño en vivo.
    window.dispatchEvent(new Event('acordeon-diseno-cambio'));
    const uid = usuario?.id;
    if (!uid) return;
    const t = setTimeout(() => { void guardarMaterialesDB(uid, materialPorMesh); }, 600);
    return () => clearTimeout(t);
  }, [materialPorMesh, usuario?.id, skinAcordeon]);

  // ─── Nombres sobre las cajas (melodía/bajos), por usuario ─────────────────────────────
  const [nombresCajas, setNombresCajas] = React.useState<NombresCajasConfig>(NOMBRES_CAJAS_DEFAULT);
  const nombresHidratadoRef = React.useRef(false);
  React.useEffect(() => {
    let vivo = true;
    nombresHidratadoRef.current = false;
    const local = leerNombresLocal();
    if (local) setNombresCajas(local);
    const uid = usuario?.id;
    if (uid) {
      cargarNombresDB(uid)
        .then((db) => { if (vivo && db) { setNombresCajas(db); guardarNombresLocal(db); } })
        .finally(() => { nombresHidratadoRef.current = true; });
    } else {
      nombresHidratadoRef.current = true;
    }
    return () => { vivo = false; };
  }, [usuario?.id]);
  React.useEffect(() => {
    if (!nombresHidratadoRef.current) return;
    guardarNombresLocal(nombresCajas);
    const uid = usuario?.id;
    if (!uid) return;
    const t = setTimeout(() => { void guardarNombresDB(uid, nombresCajas); }, 600);
    return () => clearTimeout(t);
  }, [nombresCajas, usuario?.id]);
  const cambiarNombreCaja = React.useCallback((caja: 'melodia' | 'bajos', patch: Partial<NombreCajaConfig>) => {
    setNombresCajas((prev) => ({ ...prev, [caja]: { ...prev[caja], ...patch } }));
  }, []);

  // ─── Colores REALES de cada parte (muestreados de la textura) → semilla del editor ────
  const [coloresBase, setColoresBase] = React.useState<Record<string, string>>({});

  // ─── Presets: diseños guardados con nombre, reutilizables ─────────────────────────────
  const [presets, setPresets] = React.useState<PresetAcordeon[]>([]);
  React.useEffect(() => {
    const uid = usuario?.id;
    if (!uid) { setPresets([]); return; }
    listarPresets(uid).then(setPresets);
  }, [usuario?.id]);
  // Caché local de presets → el Mundo/Personaje muestra el diseño guardado AL INSTANTE (sin esperar la DB).
  React.useEffect(() => { guardarPresetsLocal(presets); }, [presets]);
  // Mini-captura del acordeón 3D para usarla de miniatura del diseño (preserveDrawingBuffer activo).
  const capturarThumbnail = React.useCallback((): string | null => {
    try {
      const canvas = document.querySelector('.estudio-practica-libre-acordeon canvas') as HTMLCanvasElement | null;
      if (!canvas || !canvas.width) return null;
      const out = document.createElement('canvas');
      const w = 160; const h = Math.max(1, Math.round((w * canvas.height) / canvas.width));
      out.width = w; out.height = h;
      const ctx = out.getContext('2d'); if (!ctx) return null;
      ctx.drawImage(canvas, 0, 0, w, h);
      return out.toDataURL('image/jpeg', 0.7);
    } catch { return null; }
  }, []);
  const guardarComoPreset = React.useCallback(async (nombre: string) => {
    const uid = usuario?.id;
    if (!uid) return { ok: false, error: 'inicia sesión para guardar diseños' };
    const thumb = capturarThumbnail();
    // Si el diseño está sobre una PIEL de fábrica, guardamos esa piel como base (_piel) → al re-seleccionarlo
    // vuelve la piel + tus cambios encima. Sin piel (Mi diseño/preset normal) quitamos _piel.
    const mats: Record<string, MaterialPieza> = { ...materialPorMesh };
    delete (mats as any)._piel;
    if (skinAcordeon) (mats as any)._piel = { tinta: skinAcordeon, roughness: 0, metalness: 0, usarTexturaOriginal: true };
    // refresca el selector (misma pestaña) + ping cross-tab → otras pestañas (Mundo/Personaje) recargan.
    const avisar = () => {
      window.dispatchEvent(new Event('acordeon-presets-cambio'));
      try { localStorage.setItem('acordeon3d:ping', String(Date.now())); } catch { /* storage bloqueado */ }
    };
    // Si ya existe un diseño con ESE nombre → ACTUALIZARLO (mismo id), no crear duplicado. Así "guardar"
    // sobre tu modelo actualiza el que el personaje tiene seleccionado, en vez de mostrar siempre el viejo.
    const existente = presets.find((p) => p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
    if (existente) {
      const r = await actualizarPreset(existente.id, mats, nombresCajas, thumb);
      if (r.ok) {
        setPresets((p) => p.map((x) => x.id === existente.id
          ? { ...x, materiales: mats, nombres: nombresCajas, thumbnail: thumb ?? x.thumbnail } : x));
        setPresetAplicadoId(existente.id);
        avisar();
      }
      return r;
    }
    const r = await guardarPreset(uid, nombre, mats, nombresCajas, thumb);
    if (r.ok && r.preset) {
      setPresets((p) => [r.preset!, ...p]);
      setPresetAplicadoId(r.preset.id);
      avisar();
    }
    return r;
  }, [usuario?.id, materialPorMesh, nombresCajas, capturarThumbnail, presets, skinAcordeon]);
  const aplicarPreset = React.useCallback((preset: PresetAcordeon) => {
    if (preset.materiales) setMaterialPorMesh(preset.materiales);
    if (preset.nombres) setNombresCajas(preset.nombres);
    // Si el diseño se guardó sobre una piel de fábrica, la restauramos de base; si no, '' (Mi diseño).
    const piel = (preset.materiales as any)?._piel?.tinta as string | undefined;
    setSkinAcordeon(piel ?? '');
    setPresetAplicadoId(preset.id);
  }, []);
  const eliminarPreset = React.useCallback(async (id: string) => {
    const r = await borrarPreset(id);
    if (r.ok) {
      setPresets((p) => p.filter((x) => x.id !== id));
      window.dispatchEvent(new Event('acordeon-presets-cambio'));
    }
    return r;
  }, []);
  const [visor3dPiezas, setVisor3dPiezas] = React.useState<InfoPieza[]>([]);
  const [piezaSeleccionada, setPiezaSeleccionada] = React.useState<string | null>(null);
  // Arranca en una parte REAL (ya no en el global "Todo el acordeón", que se eliminó por destructivo).
  const [grupoActivo, setGrupoActivo] = React.useState<string>('caja-melodia');

  // ─── Copiar/pegar color entre partes ────────────────────────────────────────────────
  const [colorCopiado, setColorCopiado] = React.useState<MaterialPieza | null>(null);
  const copiarColor = React.useCallback(() => {
    // Pieza suelta → clave BASE (sin sufijo de versión) para que el edit calce en cualquier export del
    // acordeón (tab y personaje numeran las mallas distinto). Grupo → su id tal cual.
    const target = piezaSeleccionada ? baseDePieza(piezaSeleccionada) : grupoActivo;
    setColorCopiado(materialPorMesh[target] ?? materialPorMesh['todos']);
  }, [piezaSeleccionada, grupoActivo, materialPorMesh]);
  const pegarColor = React.useCallback(() => {
    if (!colorCopiado) return;
    // NO salimos de la piel: si hay una piel puesta, se pinta ENCIMA solo esta parte (coexisten).
    setMaterialPorMesh((prev) => escribirColor(prev, piezaSeleccionada, grupoActivo, colorCopiado));
  }, [colorCopiado, piezaSeleccionada, grupoActivo]);
  const [visor3dShapeKey, setVisor3dShapeKey] = React.useState<{ id: AnimShapeKeyId; epoch: number } | null>(null);
  const [visor3dProgramatica, setVisor3dProgramatica] = React.useState<{ id: AnimProgramaticaId; epoch: number } | null>(null);
  const [pulseEpoch, setPulseEpoch] = React.useState<{ mesh: string; epoch: number } | null>(null);

  // Q key (control continuo del fuelle). Usamos ref para que el visor lo lea en useFrame sin re-renderizar.
  const fuelleCerrandoRef = React.useRef(false);
  React.useEffect(() => {
    if (estudio.panelActivo !== 'visor3d') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') fuelleCerrandoRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') fuelleCerrandoRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      fuelleCerrandoRef.current = false;
    };
  }, [estudio.panelActivo]);

  // Click en una pieza del visor → la deja seleccionada y dispara pulse visual.
  const onClickPieza = React.useCallback((nombre: string) => {
    setPiezaSeleccionada(nombre);
    setPulseEpoch({ mesh: nombre, epoch: Date.now() });
  }, []);

  // Aplicar color al target actual: pieza individual gana, sino grupo.
  // hex === '#ffffff' = boton "Original" del panel → vuelve a mostrar la textura baked
  // del GLB. Cualquier otro color → mostramos solido sin textura para que el cambio se
  // vea limpio (sin la textura baked filtrando el color).
  const aplicarTinta = React.useCallback((hex: string) => {
    // NO salimos de la piel: si hay una piel puesta, se pinta ENCIMA solo esta parte (coexisten).
    // SIEMPRE conservamos la textura real (usarTexturaOriginal: true): el color se MULTIPLICA sobre la
    // textura baked de Blender → recolor SUTIL que mantiene el relieve/grano (no reemplaza la textura).
    // '#ffffff' (Original) = tinte blanco = sin tinte = textura pura.
    setMaterialPorMesh((prev) => escribirColor(prev, piezaSeleccionada, grupoActivo, { tinta: hex, usarTexturaOriginal: true }));
  }, [piezaSeleccionada, grupoActivo]);

  const aplicarVariante = React.useCallback((id: VarianteId) => {
    const v = VARIANTES_3D.find((x) => x.id === id) ?? VARIANTES_3D[1];
    // NO salimos de la piel: si hay una piel puesta, se pinta ENCIMA solo esta parte (coexisten).
    setMaterialPorMesh((prev) => escribirColor(prev, piezaSeleccionada, grupoActivo, { roughness: v.roughness, metalness: v.metalness, usarTexturaOriginal: true }));
  }, [piezaSeleccionada, grupoActivo]);

  const dispararVisor3DShapeKey = React.useCallback((id: AnimShapeKeyId) => {
    setVisor3dShapeKey({ id, epoch: Date.now() });
  }, []);
  const dispararVisor3DProgramatica = React.useCallback((id: AnimProgramaticaId) => {
    setVisor3dProgramatica({ id, epoch: Date.now() });
  }, []);
  const detenerVisor3DProgramatica = React.useCallback(() => {
    setVisor3dProgramatica(null);
  }, []);
  // Solo las animaciones programáticas en loop (Respira) deben mostrarse como "activas"
  // — las one-shot terminan solas y el botón Stop no aplica para ellas.
  const programaticaActiva = visor3dProgramatica?.id === 'Respira' ? visor3dProgramatica.id : null;

  const modeloActivo = React.useMemo(
    () => obtenerModeloVisualPorId(estudio.preferencias.modeloVisualId),
    [estudio.preferencias.modeloVisualId]
  );

  const nombreInstrumento = React.useMemo(() => {
    const actual = logica.listaInstrumentos?.find((i: any) => i.id === logica.instrumentoId);
    return actual?.nombre || 'Acordeon original';
  }, [logica.instrumentoId, logica.listaInstrumentos]);

  React.useEffect(() => {
    if (typeof logica.guardarAjustes !== 'function') return;
    const timer = window.setTimeout(() => void logica.guardarAjustes(), 420);
    return () => window.clearTimeout(timer);
  }, [logica.ajustes?.timbre, logica.guardarAjustes, logica.instrumentoId, logica.modoVista, logica.tonalidadSeleccionada]);

  // Cuando el alumno cambia de modo (sin estar grabando), apagamos todo lo del modo
  // anterior. Sino, si activó pista en modo "pista" y cambia a "metronomo", la pista
  // sigue sonando y se mete en su sesión de metrónomo → modos enredados.
  React.useEffect(() => {
    if (grabando) return;
    estudio.pausarPista();
    if (metronomo.activo) metronomo.setActivo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudio.modoGrabacion]);

  const manejarGrabacionSesion = async () => {
    if (grabando) {
      // Al detener: silenciar todo lo que estaba sonando como guía + snapshot del metrónomo
      // para que el replay lo reconstruya con la misma config (bpm, compás, sonido, etc).
      const metadataExtra: Record<string, any> = {};
      if (estudio.modoGrabacion === 'metronomo') {
        metadataExtra.metronomo = {
          activo: true,
          bpm: metronomo.bpm,
          compas: metronomo.compas,
          subdivision: metronomo.subdivision,
          sonido: metronomo.sonido,
          volumen: metronomo.volumen,
        };
      }
      if (metronomo.activo) metronomo.setActivo(false);
      estudio.pausarPista();
      onDetenerGrabacion(metadataExtra);
      return;
    }
    // ARRANQUE — aislamiento estricto: apagamos TODO antes de activar SÓLO el guía del
    // modo elegido. Si el alumno había manualmente puesto play a la pista, o el metrónomo
    // venía activo de antes, lo paramos. Cada modo arranca limpio.
    estudio.pausarPista();
    if (metronomo.activo) metronomo.setActivo(false);

    if (estudio.modoGrabacion === 'pista') {
      // Sólo prepara/arranca la pista si hay una seleccionada. Si no, la grabación va
      // muda (mismo efecto que modo 'libre') — el alumno ve el aviso en el panel.
      if (estudio.pistaActiva) await estudio.prepararPistaParaGrabar();
    } else if (estudio.modoGrabacion === 'metronomo') {
      metronomo.setActivo(true);
    }
    // 'libre' no hace nada — solo acordeón.
    onIniciarGrabacion('practica_libre');
  };

  // El botón REC superior NO inicia/detiene la grabación: solo es atajo para abrir el panel
  // "Pistas y Estudio", donde el alumno elige el modo y luego graba con el botón REC interno.
  // Así forzamos que la elección de modo (libre / pista / metrónomo) sea siempre explícita.
  const abrirPanelGrabacion = () => {
    if (estudio.panelActivo !== 'pistas') estudio.alternarPanel('pistas');
  };

  return (
    <LogicaAcordeonProvider logica={logica}>
    <PersonajeEstudioProvider>
    <section className="estudio-practica-libre">
      <BarraSuperiorPracticaLibre
        panelActivo={estudio.panelActivo}
        onAlternarPanel={estudio.alternarPanel}
        tonalidad={logica.tonalidadSeleccionada}
        timbre={logica.ajustes?.timbre || 'Brillante'}
        nombreInstrumento={nombreInstrumento}
        nombreModelo={modeloActivo.nombre}
        nombrePista={estudio.pistaActiva?.nombre || estudio.preferencias.pistaNombre}
        grabandoSesion={grabando}
        tiempoGrabacionSesion={formatearDuracion(tiempoGrabacionMs)}
        onAlternarGrabacion={abrirPanelGrabacion}
        onVolver={onVolver}
      />

      {!mostrarModalGuardar && errorGuardadoGrabacion && (
        <div className="estudio-practica-libre-alerta">{errorGuardadoGrabacion}</div>
      )}

      <div className="estudio-practica-libre-contenido">
        <div className="estudio-practica-libre-escenario">
          <div className="estudio-practica-libre-escenario-head">
            <div className="estudio-practica-libre-escenario-chip">Modelo {modeloActivo.nombre}</div>
            <div className="estudio-practica-libre-escenario-chip">Vista {modosVista.find(({ valor }) => valor === logica.modoVista)?.label || 'T'}</div>
            <div className="estudio-practica-libre-escenario-chip">Instrumento {nombreInstrumento}</div>
            {estudio.pistaActiva && <div className="estudio-practica-libre-escenario-chip">Pista {estudio.pistaActiva.nombre}</div>}
            {ultimaGrabacionGuardada && !grabando && (
              <div className="estudio-practica-libre-escenario-chip">Guardada {ultimaGrabacionGuardada.titulo}</div>
            )}
          </div>

          <div className={`estudio-practica-libre-area-acordeon${estudio.panelActivo === 'personaje3d' ? ' modo-personaje' : ''}`}>
            <div className="estudio-practica-libre-acordeon">
              {estudio.panelActivo === 'personaje3d' ? (
                <VisorPersonaje3D />
              ) : (
                // El acordeón 3D es el principal de siempre: tocable (clic/tap suena la
                // nota real), con teclas que se hunden y glow de la nota pisada. Muestra la PIEL
                // que el usuario eligió (AcordeonPrincipal3D lee el skin del contexto).
                <AcordeonPrincipal3D
                  skin={skinAcordeon}
                  materialPorMesh={materialPorMesh}
                  piezaSeleccionada={piezaSeleccionada}
                  onClickPieza={onClickPieza}
                  onMallasDetectadas={setVisor3dPiezas}
                  fuelleCerrandoRef={fuelleCerrandoRef}
                  animShapeKey={visor3dShapeKey}
                  animProgramatica={visor3dProgramatica}
                  pulseEpoch={pulseEpoch}
                  onTocarBoton={(id, accion) => logica.actualizarBotonActivo(id, accion === 'down' ? 'add' : 'remove')}
                  direccion={logica.direccion}
                  nombresCajas={nombresCajas}
                  onColoresBase={setColoresBase}
                />
              )}
            </div>
          </div>
        </div>

        <PanelLateralEstudiante
          visible={Boolean(estudio.panelActivo)}
          seccionActiva={estudio.panelActivo}
          tonalidadSeleccionada={logica.tonalidadSeleccionada}
          listaTonalidades={logica.listaTonalidades?.length ? logica.listaTonalidades : Object.keys(TONALIDADES)}
          timbreActivo={logica.ajustes?.timbre || 'Brillante'}
          onSeleccionarTonalidad={logica.setTonalidadSeleccionada}
          onSeleccionarTimbre={(timbre) => logica.setAjustes((prev: any) => ({ ...prev, timbre }))}
          instrumentoId={logica.instrumentoId}
          listaInstrumentos={logica.listaInstrumentos || []}
          onSeleccionarInstrumento={logica.setInstrumentoId}
          modoVista={logica.modoVista}
          modosVista={modosVista}
          onSeleccionarVista={logica.setModoVista}
          onAbrirEditorAvanzado={() => { setPestanaActiva('sonido'); setModoAjuste(true); }}
          modeloActivo={modeloActivo}
          onSeleccionarModelo={estudio.seleccionarModeloVisual}
          preferencias={estudio.preferencias}
          pistaActiva={estudio.pistaActiva}
          pistasDisponibles={estudio.pistasDisponibles}
          cargandoPistas={estudio.cargandoPistas}
          reproduciendoPista={estudio.reproduciendoPista}
          tiempoPista={formatearDuracion(estudio.tiempoPistaActual * 1000)}
          duracionPista={formatearDuracion(estudio.duracionPista * 1000)}
          onSeleccionarPista={estudio.seleccionarPista}
          onLimpiarPista={estudio.limpiarPistaSeleccionada}
          onAlternarReproduccionPista={estudio.alternarReproduccionPista}
          onReiniciarPista={() => void estudio.reiniciarPista(estudio.reproduciendoPista)}
          onCargarArchivoLocal={estudio.cargarArchivoLocal}
          onAlternarCapa={estudio.alternarCapa}
          onActualizarEfectos={estudio.actualizarEfectos}
          volumenAcordeon={estudio.volumenAcordeon}
          onAjustarVolumenAcordeon={estudio.ajustarVolumenAcordeon}
          onSeleccionarCancionHero={onSeleccionarCancionHero}
          onSeleccionarSeccionHero={onSeleccionarSeccionHero}
          modoGrabacion={estudio.modoGrabacion}
          onCambiarModoGrabacion={estudio.setModoGrabacion}
          metronomo={metronomo}
          grabando={grabando}
          tiempoGrabacionTexto={formatearDuracion(tiempoGrabacionMs)}
          onAlternarGrabacion={manejarGrabacionSesion}
          visor3dPiezaSeleccionada={piezaSeleccionada}
          visor3dPiezas={visor3dPiezas}
          visor3dGrupoActivo={grupoActivo}
          onCambiarVisor3DGrupo={(g) => { setPiezaSeleccionada(null); setGrupoActivo(g); }}
          onAplicarVisor3DTinta={aplicarTinta}
          onAplicarVisor3DVariante={aplicarVariante}
          onDispararVisor3DShapeKey={dispararVisor3DShapeKey}
          onDispararVisor3DProgramatica={dispararVisor3DProgramatica}
          onDetenerVisor3DProgramatica={detenerVisor3DProgramatica}
          visor3dProgramaticaActiva={programaticaActiva}
          onCopiarVisor3DColor={copiarColor}
          onPegarVisor3DColor={pegarColor}
          hayVisor3DColorCopiado={colorCopiado !== null}
          visor3dNombresCajas={nombresCajas}
          onCambiarVisor3DNombreCaja={cambiarNombreCaja}
          visor3dColoresBase={coloresBase}
          visor3dPresets={presets}
          onGuardarVisor3DPreset={guardarComoPreset}
          onAplicarVisor3DPreset={aplicarPreset}
          onEliminarVisor3DPreset={eliminarPreset}
          visor3dSkinSeleccionado={skinAcordeon}
          visor3dPresetAplicadoId={presetAplicadoId}
          onSeleccionarVisor3DModelo={seleccionarModeloAcordeon}
          logica={logica}
        />
      </div>

      {/* Editor de tamaño/posición del acordeón de la pestaña Acordeón (solo admin). Encuadre 'estudio'. */}
      {estudio.panelActivo !== 'personaje3d' && (
        <EditorEncuadreAcordeon encuadreId="estudio" titulo="Tamaño del acordeón (admin)" />
      )}

      <PanelAjustes
        modoAjuste={modoAjuste} setModoAjuste={setModoAjuste}
        pestanaActiva={pestanaActiva} setPestanaActiva={setPestanaActiva}
        botonSeleccionado={logica.botonSeleccionado} setBotonSeleccionado={logica.setBotonSeleccionado}
        ajustes={logica.ajustes} setAjustes={logica.setAjustes}
        tonalidadSeleccionada={logica.tonalidadSeleccionada} setTonalidadSeleccionada={logica.setTonalidadSeleccionada}
        listaTonalidades={logica.listaTonalidades} setListaTonalidades={logica.setListaTonalidades}
        nombresTonalidades={logica.nombresTonalidades} actualizarNombreTonalidad={logica.actualizarNombreTonalidad}
        sonidosVirtuales={logica.sonidosVirtuales} setSonidosVirtuales={logica.setSonidosVirtuales}
        eliminarTonalidad={logica.eliminarTonalidad} mapaBotonesActual={logica.mapaBotonesActual}
        playPreview={logica.playPreview} stopPreview={logica.stopPreview} reproduceTono={logica.reproduceTono}
        samplesBrillante={logica.samplesBrillante} samplesBajos={logica.samplesBajos} samplesArmonizado={logica.samplesArmonizado}
        muestrasDB={logica.muestrasDB} soundsPerKey={logica.soundsPerKey} obtenerRutasAudio={logica.obtenerRutasAudio}
        guardarAjustes={logica.guardarAjustes} resetearAjustes={logica.resetearAjustes}
        sincronizarAudios={logica.sincronizarAudios} guardarNuevoSonidoVirtual={logica.guardarNuevoSonidoVirtual}
        instrumentoId={logica.instrumentoId} setInstrumentoId={logica.setInstrumentoId} listaInstrumentos={logica.listaInstrumentos}
      />

      <ModalGuardarPracticaLibre
        visible={mostrarModalGuardar} guardando={guardandoGrabacion} error={errorGuardadoGrabacion}
        tituloSugerido={tituloSugeridoGrabacion} resumen={resumenGrabacionPendiente}
        onCancelar={onCancelarGuardado}
        onGuardar={(titulo, descripcion) => onGuardarGrabacion({ titulo, descripcion })}
      />

      {cancionEnReproductor && (
        <ReproductorCancionHero
          cancion={cancionEnReproductor}
          logica={logica}
          seccionInicial={seccionInicialPendiente}
          onCerrar={cerrarReproductor}
        />
      )}

    </section>
    </PersonajeEstudioProvider>
    </LogicaAcordeonProvider>
  );
};

export default EstudioPracticaLibre;
