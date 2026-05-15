import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF, Bounds } from '@react-three/drei';
import * as THREE from 'three';

// El Service Worker cachea /modelos3d/ con CacheFirst -> hay que cambiar este
// número cada vez que se re-exporta el GLB para forzar descarga fresca.
// nombre NUEVO + SW ya NO cachea /modelos3d/ (NetworkOnly en vite.config) ->
// los cambios del GLB siempre se ven, sin caché vieja.
const RUTA_GLB = '/modelos3d/acordeon_funcional_v1_h3.glb';
// fuelle: suavizado independiente de FPS + "respiración" idle (menos robótico)
const LAMBDA_CIERRE = 3.0;   // mayor = abre/cierra más rápido (suave por damp)
const RESPIRA_AMP = 0.022;   // amplitud de la respiración idle del fuelle
const RESPIRA_VEL = 1.2;     // velocidad de la respiración
const VEL_BRILLO = 0.25;
const TECLA_FUELLE = 'q'; // igual que AcordeonProMax: mantener = cerrar, soltar = abrir
// ===== TIPOS DE CIERRE (3 shape keys distintos en el GLB) =====
// Cada tipo usa su propio morph + el grupo móvil (caja bajos + marco + Boton_I)
// se mueve IGUAL que el morph para seguir pegado. Valores deben coincidir con
// los shape keys de Blender (yup: three.js X=Bworld X, Y=Bworld Z).
type TipoCierre = 'uniforme' | 'abajo' | 'arriba';
const TIPOS: { id: TipoCierre; label: string; morph: number }[] = [
  { id: 'uniforme', label: 'Uniforme (parejo)', morph: 0 },
  { id: 'abajo', label: 'Bisagra: abajo cierra', morph: 1 },
  { id: 'arriba', label: 'Bisagra: arriba cierra', morph: 2 },
];
const TRAVEL_U = 0.95;                                     // Cerr_uniforme: bass -X parejo
const THETA = (30 * Math.PI) / 180;                        // ángulo bisagra (= Blender)
const PIV_TOP = new THREE.Vector3(3.5595, 0.9902, 0);      // bisagra abajo (pivote arriba)
const PIV_BOT = new THREE.Vector3(3.5595, -0.9933, 0);     // bisagra arriba (pivote abajo)
const HINGE_AXIS = new THREE.Vector3(0, 0, 1);             // three.js Z
const _q = new THREE.Quaternion();

// Mueve un mesh móvil para seguir EXACTO al morph del tipo activo (sin hueco).
function aplicarMovil(mesh: THREE.Mesh, pos0: THREE.Vector3, quat0: THREE.Quaternion,
                      c: number, tipo: TipoCierre) {
  if (tipo === 'uniforme') {
    mesh.position.set(pos0.x - c * TRAVEL_U, pos0.y, pos0.z);
    mesh.quaternion.copy(quat0);
    return;
  }
  const ang = c * THETA;
  const piv = tipo === 'abajo' ? PIV_TOP : PIV_BOT;
  const dx = pos0.x - piv.x, dy = pos0.y - piv.y;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  let nx: number, ny: number, qs: number;
  if (tipo === 'abajo') {            // morph: nx=Px+dx*cos+dz*sin ; nz=Pz-dx*sin+dz*cos
    nx = piv.x + dx * ca + dy * sa; ny = piv.y - dx * sa + dy * ca; qs = -1;
  } else {                           // arriba: nx=Px+dx*cos-dz*sin ; nz=Pz+dx*sin+dz*cos
    nx = piv.x + dx * ca - dy * sa; ny = piv.y + dx * sa + dy * ca; qs = 1;
  }
  mesh.position.set(nx, ny, pos0.z);
  _q.setFromAxisAngle(HINGE_AXIS, qs * ang);
  mesh.quaternion.copy(_q).multiply(quat0);
}

// ===== MODOS DE ANIMACIÓN =====
// Todos reusan el MISMO morph+bisagra (probado) -> funcionan perfecto.
// c = cierre 0..1 (0 = fuelle abierto/extendido, 1 = cerrado/abanico).
type AnimMode = 'manual' | 'abanico' | 'respira' | 'tocar' | 'vaiven' | 'majestuosa';
const ANIMS: { id: AnimMode; label: string }[] = [
  { id: 'manual', label: 'Manual (Q / barra)' },
  { id: 'abanico', label: 'Abanico (abre y cierra)' },
  { id: 'respira', label: 'Respiración (idle)' },
  { id: 'tocar', label: 'Tocando (vallenato)' },
  { id: 'vaiven', label: 'Vaivén corto' },
  { id: 'majestuosa', label: 'Apertura majestuosa' },
];
function targetCierre(mode: AnimMode, t: number, manual: number): number {
  switch (mode) {
    case 'abanico':   return 0.5 - 0.5 * Math.cos(t * 0.7);
    case 'respira':   return 0.08 + 0.10 * (0.5 - 0.5 * Math.cos(t * 1.5));
    case 'tocar':     return 0.30 + 0.32 * Math.pow(Math.abs(Math.sin(t * 2.4)), 0.6);
    case 'vaiven':    return 0.35 + 0.22 * Math.sin(t * 4.2);
    case 'majestuosa': {
      const p = (t % 16) / 16;
      if (p < 0.40) return 1 - p / 0.40;          // cerrado -> abierto (lento)
      if (p < 0.60) return 0;                     // abierto (sostiene)
      if (p < 0.95) return (p - 0.60) / 0.35;     // abierto -> cerrado (lento)
      return 1;                                   // cerrado (breve)
    }
    default:          return manual;              // 'manual' = Q / barra
  }
}

// three.js (GLTFLoader) reemplaza ESPACIOS por "_" en los nombres de objeto.
// Por eso comparamos siempre con esta forma normalizada (minúsculas + cualquier
// secuencia no alfanumérica -> "_"), robusta a espacios/comas/guiones.
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_');

const CAJA_BAJOS_N = norm('Caja izquierda del acordeon, bajos');
const MARCO_2_N = norm('marco Fuelle 2');

// ===== GRUPOS =====

type GrupoId = 'cuerpo' | 'botonesD' | 'botonesI' | 'fuelle' | 'marcos' | 'parrilla';
const NOMBRES_PARRILLA = ['Cube_006', 'Cube_010', 'Cube_011', 'Cube_014', 'Tornillos'];

function grupoDe(nombre: string): GrupoId {
  if (nombre.startsWith('Boton_D')) return 'botonesD';
  if (nombre.startsWith('Boton_I')) return 'botonesI';
  if (nombre === 'Fuelle') return 'fuelle';
  if (norm(nombre).startsWith('marco_fuelle')) return 'marcos';
  if (NOMBRES_PARRILLA.includes(nombre)) return 'parrilla';
  return 'cuerpo';
}

// caja de bajos + marco Fuelle 2 + Boton_I siguen al fuelle al cerrar
function esMovil(nombre: string): boolean {
  const n = norm(nombre);
  return n === CAJA_BAJOS_N || n === MARCO_2_N || nombre.startsWith('Boton_I');
}

const GRUPOS: { id: GrupoId; label: string }[] = [
  { id: 'cuerpo', label: 'Cuerpo / Cajas' },
  { id: 'botonesD', label: 'Botones derecha (pitos)' },
  { id: 'botonesI', label: 'Botones izquierda (bajos)' },
  { id: 'fuelle', label: 'Fuelle' },
  { id: 'marcos', label: 'Marcos del fuelle' },
  { id: 'parrilla', label: 'Parrilla / tornillos' },
];

// ===== PRESETS =====

interface Preset { id: string; nombre: string; swatch: string; textura: string | null }
const PRESETS: Preset[] = [
  { id: 'original', nombre: 'Textura original', swatch: '#8a7a5a', textura: '__ORIG__' },
  { id: 'negro', nombre: 'Negro', swatch: '#101015', textura: null },
  { id: 'blanco', nombre: 'Blanco', swatch: '#f2f2ea', textura: null },
  { id: 'azul', nombre: 'Azul', swatch: '#243f73', textura: null },
  { id: 'rojo', nombre: 'Rojo', swatch: '#7c1322', textura: null },
  { id: 'celuloide_negro', nombre: 'Celuloide', swatch: '#1a1a1a', textura: '/modelos3d/textures/diapason_celuloide_negro.webp' },
  { id: 'celuloide_rojo', nombre: 'Celuloide rojo', swatch: '#7a0e1c', textura: '/modelos3d/textures/diapason_celuloide_rojo.webp' },
  { id: 'nacar', nombre: 'Nácar', swatch: '#fafaee', textura: '/modelos3d/textures/boton_nacar.webp' },
];

interface ConfigGrupo { preset: string; color: string; roughness: number; metalness: number }
type EstadoConfig = Record<string, ConfigGrupo>;

// look agradable por defecto (clásico, sin el rojo brusco de entrada)
function configInicial(): EstadoConfig {
  return {
    cuerpo: { preset: 'azul', color: '#243f73', roughness: 0.35, metalness: 0.15 },
    botonesD: { preset: 'nacar', color: '#f5ecd6', roughness: 0.2, metalness: 0.1 },
    botonesI: { preset: 'nacar', color: '#f5ecd6', roughness: 0.2, metalness: 0.1 },
    fuelle: { preset: 'negro', color: '#16171c', roughness: 0.6, metalness: 0.05 },
    marcos: { preset: 'negro', color: '#1d1f26', roughness: 0.5, metalness: 0.2 },
    parrilla: { preset: 'blanco', color: '#c9ccd2', roughness: 0.35, metalness: 0.6 },
  };
}

// ===== CACHE TEXTURAS =====

const cacheTex: Record<string, THREE.Texture> = {};
const loaderTex = new THREE.TextureLoader();
function cargarTextura(url: string, cb: (t: THREE.Texture) => void) {
  if (cacheTex[url]) { cb(cacheTex[url]); return; }
  loaderTex.load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    cacheTex[url] = t;
    cb(t);
  });
}

// ===== MODELO =====

interface DatosMesh {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  mapOrig: THREE.Texture | null;
  grupo: GrupoId;
  esBoton: boolean;
  movil: boolean;   // caja de bajos + marco Fuelle 2 + Boton_I: rotan con la bisagra
  pos0: THREE.Vector3;      // posición original (para rotar rígido sobre el pivote)
  quat0: THREE.Quaternion;  // orientación original
}

interface ModeloProps {
  config: EstadoConfig;
  individuales: EstadoConfig;
  seleccion: string | null;
  cierreObjetivo: number;
  animMode: AnimMode;
  tipoCierre: TipoCierre;
  presionados: Set<string>;
  onSeleccion: (n: string) => void;
  onPress: (n: string, a: 'add' | 'remove') => void;
}

function Modelo({
  config, individuales, seleccion, cierreObjetivo, animMode, tipoCierre,
  presionados, onSeleccion, onPress,
}: ModeloProps) {
  const { scene } = useGLTF(RUTA_GLB);
  const [, force] = useState(0);
  const cierreAnim = useRef(0);

  // SIN reparentar (attach falla durante el render). En su lugar: la caja de
  // bajos + marco Fuelle 2 + Boton_I son un "grupo móvil"; cada frame se mueven
  // TODOS con el MISMO offset (sin lerps distintos) -> bloque rígido pegado.
  const { meshes, fuelleMesh } = useMemo(() => {
    const lista: Record<string, DatosMesh> = {};
    let fuelle: THREE.Mesh | null = null;

    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (!m.isMesh) return;
      const base = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
      const clon = base.clone();
      m.material = clon;
      const grupo = grupoDe(obj.name);
      const movil = esMovil(obj.name);
      lista[obj.name] = {
        mesh: m, mat: clon, mapOrig: clon.map, grupo,
        esBoton: grupo === 'botonesD' || grupo === 'botonesI',
        movil, pos0: m.position.clone(), quat0: m.quaternion.clone(),
      };
      if (obj.name === 'Fuelle') fuelle = m;
    });

    return { meshes: lista, fuelleMesh: fuelle as THREE.Mesh | null };
  }, [scene]);

  // materiales
  useEffect(() => {
    Object.entries(meshes).forEach(([nombre, d]) => {
      const cfg = individuales[nombre] ?? config[d.grupo];
      if (!cfg) return;
      const preset = PRESETS.find((p) => p.id === cfg.preset) ?? PRESETS[0];
      d.mat.roughness = cfg.roughness;
      d.mat.metalness = cfg.metalness;
      if (preset.textura === '__ORIG__') {
        d.mat.map = d.mapOrig; d.mat.color.set('#ffffff'); d.mat.needsUpdate = true;
      } else if (preset.textura) {
        d.mat.color.set(cfg.color);
        cargarTextura(preset.textura, (t) => { d.mat.map = t; d.mat.needsUpdate = true; force((n) => n + 1); });
      } else {
        d.mat.map = null; d.mat.color.set(cfg.color); d.mat.needsUpdate = true;
      }
    });
  }, [meshes, config, individuales]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05) || 0.016;
    const t = state.clock.elapsedTime;
    const k = 1 - Math.exp(-LAMBDA_CIERRE * dt);
    // objetivo según el modo de animación (manual = Q / barra)
    const objetivo = THREE.MathUtils.clamp(targetCierre(animMode, t, cierreObjetivo), 0, 1);
    cierreAnim.current += (objetivo - cierreAnim.current) * k;
    const base = cierreAnim.current;
    // respiración sutil SOLO en manual (los otros modos definen su propio movimiento)
    const respira = animMode === 'manual'
      ? (1 - base) * RESPIRA_AMP * (0.5 - 0.5 * Math.cos(t * RESPIRA_VEL))
      : 0;
    const c = THREE.MathUtils.clamp(base + respira, 0, 1);

    // morph del TIPO de cierre activo (el resto de morphs a 0)
    const tipo = TIPOS.find((tp) => tp.id === tipoCierre) ?? TIPOS[0];
    if (fuelleMesh?.morphTargetInfluences) {
      const inf = fuelleMesh.morphTargetInfluences;
      for (let i = 0; i < inf.length; i++) inf[i] = i === tipo.morph ? c : 0;
    }

    Object.entries(meshes).forEach(([nombre, d]) => {
      if (d.movil) aplicarMovil(d.mesh, d.pos0, d.quat0, c, tipo.id);
      if (d.esBoton) {
        const activo = presionados.has(nombre);
        d.mat.emissiveIntensity = THREE.MathUtils.lerp(d.mat.emissiveIntensity, activo ? 0.7 : 0, VEL_BRILLO);
        if (activo) d.mat.emissive.set('#39d0ff');
      } else {
        const sel = seleccion === nombre;
        d.mat.emissive.set('#39d0ff');
        d.mat.emissiveIntensity = THREE.MathUtils.lerp(d.mat.emissiveIntensity, sel ? 0.22 : 0, VEL_BRILLO);
      }
    });
  });

  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (meshes[e.object.name]) onSeleccion(e.object.name);
  };
  const down = (e: ThreeEvent<PointerEvent>) => {
    if (meshes[e.object.name]?.esBoton) { e.stopPropagation(); onPress(e.object.name, 'add'); }
  };
  const up = (e: ThreeEvent<PointerEvent>) => {
    if (meshes[e.object.name]?.esBoton) onPress(e.object.name, 'remove');
  };

  return (
    <primitive object={scene} onClick={click} onPointerDown={down} onPointerUp={up} onPointerLeave={up} />
  );
}

useGLTF.preload(RUTA_GLB);

// ===== PRINCIPAL =====

const AcordeonFuncionalV1: React.FC = () => {
  const [config, setConfig] = useState<EstadoConfig>(configInicial);
  const [individuales, setIndividuales] = useState<EstadoConfig>({});
  const [grupoSel, setGrupoSel] = useState<GrupoId>('cuerpo');
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [cierreSlider, setCierreSlider] = useState(0);
  const [cierreTecla, setCierreTecla] = useState(false);
  const [animMode, setAnimMode] = useState<AnimMode>('manual');
  const [tipoCierre, setTipoCierre] = useState<TipoCierre>('uniforme');
  const [presionados, setPresionados] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState(true);

  const cierreObjetivo = cierreTecla ? 1 : cierreSlider;

  const onPress = useCallback((n: string, a: 'add' | 'remove') => {
    setPresionados((prev) => {
      const s = new Set(prev);
      if (a === 'add') s.add(n); else s.delete(n);
      return s;
    });
  }, []);

  // Q = fuelle (mantener cierra / soltar abre, como AcordeonProMax).
  // Otras teclas = botones, funcionan AL MISMO TIEMPO que la Q.
  useEffect(() => {
    const teclasD = 'wertyuiopasdfghjklzxcvbnm1234567890'.split(''); // sin 'q'
    const teclasI = '!"#$%&/()='.split('');
    const onDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === TECLA_FUELLE) { setCierreTecla(true); return; }
      if (e.repeat) return;
      const iD = teclasD.indexOf(e.key.toLowerCase());
      if (iD >= 0 && iD < 31) onPress(`Boton_D_${String(iD + 1).padStart(2, '0')}`, 'add');
      const iI = teclasI.indexOf(e.key);
      if (iI >= 0 && iI < 12) onPress(`Boton_I_${String(iI + 1).padStart(2, '0')}`, 'add');
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === TECLA_FUELLE) { setCierreTecla(false); return; }
      const iD = teclasD.indexOf(e.key.toLowerCase());
      if (iD >= 0 && iD < 31) onPress(`Boton_D_${String(iD + 1).padStart(2, '0')}`, 'remove');
      const iI = teclasI.indexOf(e.key);
      if (iI >= 0 && iI < 12) onPress(`Boton_I_${String(iI + 1).padStart(2, '0')}`, 'remove');
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [onPress]);

  const editandoIndividual = !!seleccion;
  const cfgActual: ConfigGrupo = editandoIndividual
    ? (individuales[seleccion!] ?? config[grupoDe(seleccion!)])
    : config[grupoSel];

  const setCfg = (patch: Partial<ConfigGrupo>) => {
    if (editandoIndividual) {
      const baseSel = individuales[seleccion!] ?? config[grupoDe(seleccion!)];
      setIndividuales((prev) => ({ ...prev, [seleccion!]: { ...baseSel, ...patch } }));
    } else {
      setConfig((prev) => ({ ...prev, [grupoSel]: { ...prev[grupoSel], ...patch } }));
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0e1a', zIndex: 9999, overflow: 'hidden' }}>
      <div style={hud}>
        <div style={{ fontWeight: 700, color: '#7ee5ff', fontSize: 13, marginBottom: 4 }}>
          Acordeón Funcional · versión 1
        </div>
        <div style={{ opacity: 0.75, fontSize: 11, lineHeight: 1.5 }}>
          <b>Q</b> = fuelle (mantener cierra · soltar abre) — toca botones a la vez<br />
          Click en una pieza para editarla · teclas = botones · arrastra/rueda = cámara
        </div>
        {seleccion && (
          <div style={{ marginTop: 6, color: '#7ee5ff', fontSize: 11 }}>
            Editando: <b>{seleccion}</b>{' '}
            <button onClick={() => setSeleccion(null)} style={btnMini}>editar grupo</button>
          </div>
        )}
      </div>

      {panel ? (
        <div style={panelBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ color: '#7ee5ff', fontSize: 13 }}>Editor</strong>
            <button onClick={() => setPanel(false)} style={btnX}>×</button>
          </div>

          {!editandoIndividual && (
            <Section title="GRUPO A EDITAR">
              <select value={grupoSel} onChange={(e) => setGrupoSel(e.target.value as GrupoId)} style={sel}>
                {GRUPOS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </Section>
          )}

          <Section title={editandoIndividual ? `OBJETO: ${seleccion}` : 'TEXTURA / COLOR'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 8 }}>
              {PRESETS.map((p) => (
                <button key={p.id} title={p.nombre} onClick={() => setCfg({ preset: p.id })}
                  style={{
                    background: p.swatch, aspectRatio: '1', borderRadius: 6, cursor: 'pointer', padding: 0,
                    border: cfgActual.preset === p.id ? '2px solid #7ee5ff' : '2px solid transparent',
                  }} />
              ))}
            </div>
            <Row label="Tinte / color">
              <input type="color" value={cfgActual.color}
                onChange={(e) => setCfg({ color: e.target.value })} style={colorIn} />
            </Row>
            <Slider label="Rugosidad" min={0} max={1} step={0.01} value={cfgActual.roughness}
              onChange={(v) => setCfg({ roughness: v })} />
            <Slider label="Metálico" min={0} max={1} step={0.01} value={cfgActual.metalness}
              onChange={(v) => setCfg({ metalness: v })} />
          </Section>

          <Section title="ANIMACIÓN DEL FUELLE">
            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>Tipo de cierre</div>
            <select value={tipoCierre} onChange={(e) => setTipoCierre(e.target.value as TipoCierre)}
              style={{ ...sel, marginBottom: 8 }}>
              {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>Movimiento</div>
            <select value={animMode} onChange={(e) => setAnimMode(e.target.value as AnimMode)} style={sel}>
              {ANIMS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            {animMode === 'manual' && (
              <div style={{ marginTop: 8 }}>
                <Slider label="Cierre manual (o tecla Q)" min={0} max={1} step={0.01}
                  value={cierreSlider} onChange={setCierreSlider} />
              </div>
            )}
          </Section>

          <button onClick={() => {
            setConfig(configInicial()); setIndividuales({}); setSeleccion(null);
            setCierreSlider(0); setAnimMode('manual'); setTipoCierre('uniforme');
          }} style={btnReset}>Restaurar todo</button>
        </div>
      ) : (
        <button onClick={() => setPanel(true)} style={btnAbrir}>⚙ Editor</button>
      )}

      <Canvas camera={{ position: [3, 2, 5], fov: 32 }} dpr={[1, 2]}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} />
        <directionalLight position={[-3, 2, -3]} intensity={0.5} />
        <directionalLight position={[0, -2, 2]} intensity={0.25} />
        <Suspense fallback={null}>
          <Bounds fit clip margin={1.2}>
            <Modelo
              config={config}
              individuales={individuales}
              seleccion={seleccion}
              cierreObjetivo={cierreObjetivo}
              animMode={animMode}
              tipoCierre={tipoCierre}
              presionados={presionados}
              onSeleccion={setSeleccion}
              onPress={onPress}
            />
          </Bounds>
        </Suspense>
        <OrbitControls makeDefault enablePan={false} />
      </Canvas>
    </div>
  );
};

// ===== SUBCOMPONENTES / ESTILOS =====

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #1f2937' }}>
    <div style={{ fontWeight: 600, marginBottom: 8, opacity: 0.85, fontSize: 11, letterSpacing: 0.5 }}>{title}</div>
    {children}
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <span>{label}</span>{children}
  </div>
);

const Slider: React.FC<{ label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }> =
  ({ label, min, max, step, value, onChange }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span>{label}</span><span style={{ opacity: 0.7 }}>{value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: '100%' }} />
    </div>
  );

const hud: React.CSSProperties = {
  position: 'absolute', top: 16, left: 16, color: '#fff', zIndex: 10,
  fontFamily: 'monospace', fontSize: 12, background: 'rgba(0,0,0,0.75)',
  padding: '12px 16px', borderRadius: 8, maxWidth: 380,
};
const panelBox: React.CSSProperties = {
  position: 'absolute', top: 16, right: 16, color: '#fff', zIndex: 10,
  background: 'rgba(0,0,0,0.88)', padding: 16, borderRadius: 8, width: 300,
  fontFamily: 'system-ui, sans-serif', fontSize: 12,
  maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
};
const btnX: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#fff', fontSize: 20,
  cursor: 'pointer', padding: 0, lineHeight: 1, width: 24, height: 24,
};
const btnReset: React.CSSProperties = {
  width: '100%', marginTop: 4, padding: '8px 12px', background: '#1f2937',
  color: '#fff', border: '1px solid #374151', borderRadius: 4, cursor: 'pointer', fontSize: 12,
};
const btnAbrir: React.CSSProperties = {
  position: 'absolute', top: 16, right: 16, zIndex: 10, padding: '8px 12px',
  background: 'rgba(0,0,0,0.85)', color: '#fff', border: '1px solid #374151',
  borderRadius: 4, cursor: 'pointer', fontSize: 12,
};
const btnMini: React.CSSProperties = {
  background: '#1f2937', color: '#7ee5ff', border: '1px solid #374151',
  borderRadius: 4, cursor: 'pointer', fontSize: 10, padding: '2px 6px', marginLeft: 4,
};
const sel: React.CSSProperties = {
  width: '100%', padding: '6px 8px', background: '#1f2937', color: '#fff',
  border: '1px solid #374151', borderRadius: 4, fontSize: 12,
};
const colorIn: React.CSSProperties = {
  width: 50, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
};

export default AcordeonFuncionalV1;
