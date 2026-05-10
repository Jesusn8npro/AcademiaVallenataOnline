import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import { mapaTeclas } from '../../../Core/acordeon/mapaTecladoYFrecuencias';

const RUTA_GLB = '/modelos3d/acordeon_diapason.glb?v=6';
const VELOCIDAD_LERP = 0.4;

// ===== PRESETS DE TEXTURAS =====

interface Preset {
  id: string;
  nombre: string;
  swatch: string;        // color CSS para la miniatura
  textura: string | null; // ruta del PNG, o null = sin textura
  tinte?: string;         // color que multiplica la textura (default #fff)
}

const PRESETS_DIAPASON: Preset[] = [
  { id: 'solido_negro', nombre: 'Negro sólido', swatch: '#0a0a0a', textura: null },
  { id: 'celuloide_negro', nombre: 'Celuloide negro', swatch: '#1a1a1a', textura: '/modelos3d/textures/diapason_celuloide_negro.webp' },
  { id: 'celuloide_rojo', nombre: 'Celuloide rojo', swatch: '#7a0e1c', textura: '/modelos3d/textures/diapason_celuloide_rojo.webp' },
  { id: 'celuloide_azul', nombre: 'Celuloide azul', swatch: '#1a3a6e', textura: '/modelos3d/textures/diapason_celuloide_negro.webp', tinte: '#3a6ed8' },
  { id: 'celuloide_azul_real', nombre: 'Celuloide azul (foto real)', swatch: '#0f2868', textura: '/modelos3d/textures/diapason_celuloide_azul_real.jpg' },
  { id: 'celuloide_verde', nombre: 'Celuloide verde', swatch: '#0e4a2a', textura: '/modelos3d/textures/diapason_celuloide_negro.webp', tinte: '#3eb878' },
  { id: 'celuloide_dorado', nombre: 'Celuloide dorado', swatch: '#a07020', textura: '/modelos3d/textures/diapason_celuloide_negro.webp', tinte: '#d4a040' },
  { id: 'celuloide_morado', nombre: 'Celuloide morado', swatch: '#3a1a5a', textura: '/modelos3d/textures/diapason_celuloide_negro.webp', tinte: '#7c40c8' },
  { id: 'rojo_intenso', nombre: 'Rojo intenso', swatch: '#a00010', textura: '/modelos3d/textures/diapason_celuloide_rojo.webp', tinte: '#ff5060' },
];

const PRESETS_BOTON: Preset[] = [
  { id: 'solido_blanco', nombre: 'Blanco sólido', swatch: '#f5f5ee', textura: null },
  { id: 'nacar_blanco', nombre: 'Nácar blanco', swatch: '#fafaee', textura: '/modelos3d/textures/boton_nacar.webp' },
  { id: 'nacar_crema', nombre: 'Nácar crema', swatch: '#f0e0c0', textura: '/modelos3d/textures/boton_nacar.webp', tinte: '#fff0c8' },
  { id: 'nacar_negro', nombre: 'Nácar negro', swatch: '#2a2a2a', textura: '/modelos3d/textures/boton_nacar.webp', tinte: '#404040' },
  { id: 'nacar_dorado', nombre: 'Nácar dorado', swatch: '#c8a040', textura: '/modelos3d/textures/boton_nacar.webp', tinte: '#e8c060' },
  { id: 'nacar_rosa', nombre: 'Nácar rosado', swatch: '#e0a0b0', textura: '/modelos3d/textures/boton_nacar.webp', tinte: '#ffb0c0' },
  { id: 'solido_negro', nombre: 'Negro sólido', swatch: '#1a1a1a', textura: null },
  { id: 'solido_rojo', nombre: 'Rojo sólido', swatch: '#a02030', textura: null },
];

interface ConfigEditor {
  presetDiapason: string;
  roughnessDiapason: number;
  metalnessDiapason: number;
  coatDiapason: number;
  presetBoton: string;
  roughnessBoton: number;
  metalnessBoton: number;
  coatBoton: number;
  sheenBoton: number;
  escalaBotones: number;
  espaciadoBotones: number;
  profundidadPresionMm: number;
  colorPresion: string;
  intensidadEmissive: number;
  intensidadLuz: number;
  rotarAuto: boolean;
}

const CONFIG_DEFAULT: ConfigEditor = {
  presetDiapason: 'celuloide_negro',
  roughnessDiapason: 0.22,
  metalnessDiapason: 0,
  coatDiapason: 0.6,
  presetBoton: 'nacar_blanco',
  roughnessBoton: 0.15,
  metalnessBoton: 0.2,
  coatBoton: 0.8,
  sheenBoton: 0.3,
  escalaBotones: 1.0,
  espaciadoBotones: 1.0,
  profundidadPresionMm: 4,
  colorPresion: '#00aaff',
  intensidadEmissive: 0.8,
  intensidadLuz: 1.4,
  rotarAuto: false,
};

// ===== CACHE DE TEXTURAS =====

class CacheTexturas {
  loader = new THREE.TextureLoader();
  cache: Record<string, THREE.Texture> = {};

  cargar(url: string, onReady?: (tex: THREE.Texture) => void): THREE.Texture | null {
    if (this.cache[url]) {
      onReady?.(this.cache[url]);
      return this.cache[url];
    }
    this.loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      this.cache[url] = tex;
      onReady?.(tex);
    });
    return null;
  }
}

// ===== MODELO =====

interface ModeloProps {
  config: ConfigEditor;
  presionados: Set<string>;
  onPresion: (nombre: string, accion: 'add' | 'remove') => void;
}

interface DatosBoton {
  obj: THREE.Object3D;
  origX: number;
  origY: number;
  origZ: number;
  origScaleX: number;
  origScaleY: number;
  origScaleZ: number;
  mat: THREE.MeshStandardMaterial;
}

function ModeloAcordeon({ config, presionados, onPresion }: ModeloProps) {
  const { scene } = useGLTF(RUTA_GLB);
  const cacheTex = useRef(new CacheTexturas());
  const [, forceRender] = useState(0);

  const refs = useMemo(() => {
    const botones: Record<string, DatosBoton> = {};
    let diapason: THREE.MeshStandardMaterial | null = null;

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      if (obj.name === 'Diapason' || obj.name === 'Cubo') {
        const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
        const matClone = mat.clone();
        mesh.material = matClone;
        diapason = matClone;
      }

      if (obj.name.startsWith('btn_')) {
        const matOrig = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
        const matClone = matOrig.clone();
        matClone.emissive = new THREE.Color(0x000000);
        matClone.emissiveIntensity = 0;
        mesh.material = matClone;

        botones[obj.name] = {
          obj: mesh,
          origX: mesh.position.x,
          origY: mesh.position.y,
          origZ: mesh.position.z,
          origScaleX: mesh.scale.x,
          origScaleY: mesh.scale.y,
          origScaleZ: mesh.scale.z,
          mat: matClone,
        };
      }
    });

    return { botones, diapason };
  }, [scene]);

  // Aplicar preset diapason
  useEffect(() => {
    if (!refs.diapason) return;
    const preset = PRESETS_DIAPASON.find(p => p.id === config.presetDiapason) ?? PRESETS_DIAPASON[0];
    const mat = refs.diapason;
    mat.roughness = config.roughnessDiapason;
    mat.metalness = config.metalnessDiapason;

    if (preset.textura) {
      // Tinte (multiplica la textura)
      const tinte = preset.tinte ?? '#ffffff';
      mat.color.set(tinte);
      cacheTex.current.cargar(preset.textura, (tex) => {
        mat.map = tex;
        mat.needsUpdate = true;
        forceRender(n => n + 1);
      });
    } else {
      // Sin textura, color sólido
      mat.color.set(preset.swatch);
      mat.map = null;
      mat.needsUpdate = true;
    }
  }, [config.presetDiapason, config.roughnessDiapason, config.metalnessDiapason, refs.diapason]);

  // Aplicar preset botones (afecta a TODOS los botones - todos comparten material? no, los clonamos)
  useEffect(() => {
    const preset = PRESETS_BOTON.find(p => p.id === config.presetBoton) ?? PRESETS_BOTON[0];
    Object.values(refs.botones).forEach((b) => {
      b.mat.roughness = config.roughnessBoton;
      b.mat.metalness = config.metalnessBoton;

      if (preset.textura) {
        const tinte = preset.tinte ?? '#ffffff';
        b.mat.color.set(tinte);
        cacheTex.current.cargar(preset.textura, (tex) => {
          b.mat.map = tex;
          b.mat.needsUpdate = true;
        });
      } else {
        b.mat.color.set(preset.swatch);
        b.mat.map = null;
        b.mat.needsUpdate = true;
      }
    });
  }, [config.presetBoton, config.roughnessBoton, config.metalnessBoton, refs.botones]);

  // Aplicar transformaciones (escala / espaciado)
  useEffect(() => {
    Object.values(refs.botones).forEach((b) => {
      b.obj.scale.set(
        b.origScaleX * config.escalaBotones,
        b.origScaleY * config.escalaBotones,
        b.origScaleZ * config.escalaBotones,
      );
      b.obj.position.x = b.origX * config.espaciadoBotones;
      b.obj.position.z = b.origZ * config.espaciadoBotones;
    });
  }, [config.escalaBotones, config.espaciadoBotones, refs.botones]);

  // Color emisivo de presión
  useEffect(() => {
    const c = new THREE.Color(config.colorPresion);
    Object.values(refs.botones).forEach((b) => {
      b.mat.emissive.copy(c);
    });
  }, [config.colorPresion, refs.botones]);

  // Animacion frame
  useFrame((state, delta) => {
    const profundidadM = config.profundidadPresionMm / 1000;
    const objIntensity = config.intensidadEmissive;
    Object.entries(refs.botones).forEach(([nombre, b]) => {
      const presionado = presionados.has(nombre);
      const objY = presionado ? b.origY - profundidadM : b.origY;
      b.obj.position.y = THREE.MathUtils.lerp(b.obj.position.y, objY, VELOCIDAD_LERP);
      const objE = presionado ? objIntensity : 0;
      b.mat.emissiveIntensity = THREE.MathUtils.lerp(b.mat.emissiveIntensity, objE, VELOCIDAD_LERP);
    });

    if (config.rotarAuto && scene) {
      scene.rotation.y += delta * 0.3;
    }
  });

  const manejar = (e: ThreeEvent<PointerEvent>, accion: 'add' | 'remove') => {
    const nombre = e.object.name;
    if (!nombre.startsWith('btn_')) return;
    e.stopPropagation();
    onPresion(nombre, accion);
  };

  return (
    <primitive
      object={scene}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => manejar(e, 'add')}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => manejar(e, 'remove')}
      onPointerLeave={(e: ThreeEvent<PointerEvent>) => manejar(e, 'remove')}
    />
  );
}

useGLTF.preload(RUTA_GLB);

// ===== COMPONENTE PRINCIPAL =====

const AcordeonDiapason3D: React.FC = () => {
  const [presionados, setPresionados] = useState<Set<string>>(new Set());
  const [ultimo, setUltimo] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfigEditor>(CONFIG_DEFAULT);
  const [panelAbierto, setPanelAbierto] = useState(true);

  const onPresion = useCallback((nombre: string, accion: 'add' | 'remove') => {
    if (accion === 'add') setUltimo(nombre);
    setPresionados((prev) => {
      const sig = new Set(prev);
      if (accion === 'add') sig.add(nombre);
      else sig.delete(nombre);
      return sig;
    });
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      const m = mapaTeclas[k];
      if (m) {
        e.preventDefault();
        onPresion(`btn_${m.fila}_${m.columna}`, 'add');
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const m = mapaTeclas[k];
      if (m) onPresion(`btn_${m.fila}_${m.columna}`, 'remove');
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [onPresion]);

  const set = <K extends keyof ConfigEditor>(k: K, v: ConfigEditor[K]) =>
    setConfig((prev) => ({ ...prev, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0e1a', zIndex: 9999, overflow: 'hidden' }}>
      {/* HUD */}
      <div style={hudStyle}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: '#7ee5ff', fontSize: 13 }}>
          Test 3D — Diapasón Pro Max (31 botones)
        </div>
        <div>Botón: <span style={{ color: '#7ee5ff' }}>{ultimo ?? '(ninguno)'}</span></div>
        <div>Activos: {presionados.size}</div>
        <div style={{ marginTop: 8, opacity: 0.7, fontSize: 11, lineHeight: 1.5 }}>
          <b>Mouse:</b> click+arrastrar = rotar · rueda = zoom<br/>
          <b>Teclado:</b><br/>
          &nbsp;Afuera (1): <b>z x c v b n m , . -</b><br/>
          &nbsp;Medio (2):&nbsp; <b>a s d f g h j k l ñ '</b><br/>
          &nbsp;Adentro (3): <b>w e r t y u i o p +</b>
        </div>
      </div>

      {/* Editor */}
      {panelAbierto ? (
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ color: '#7ee5ff', fontSize: 13 }}>Editor de estilos</strong>
            <button onClick={() => setPanelAbierto(false)} style={btnX}>×</button>
          </div>

          <Section title="DIAPASÓN — preset (click para cambiar)">
            <Galeria
              presets={PRESETS_DIAPASON}
              activo={config.presetDiapason}
              onSelect={(id) => set('presetDiapason', id)}
            />
            <Slider label="Rugosidad" min={0} max={1} step={0.01}
              value={config.roughnessDiapason} onChange={(v) => set('roughnessDiapason', v)} />
            <Slider label="Metálico" min={0} max={1} step={0.01}
              value={config.metalnessDiapason} onChange={(v) => set('metalnessDiapason', v)} />
            <Slider label="Coat (laca)" min={0} max={1} step={0.01}
              value={config.coatDiapason} onChange={(v) => set('coatDiapason', v)} />
          </Section>

          <Section title="BOTONES — preset (click para cambiar)">
            <Galeria
              presets={PRESETS_BOTON}
              activo={config.presetBoton}
              onSelect={(id) => set('presetBoton', id)}
            />
            <Slider label="Rugosidad" min={0} max={1} step={0.01}
              value={config.roughnessBoton} onChange={(v) => set('roughnessBoton', v)} />
            <Slider label="Metálico" min={0} max={1} step={0.01}
              value={config.metalnessBoton} onChange={(v) => set('metalnessBoton', v)} />
            <Slider label="Coat (laca)" min={0} max={1} step={0.01}
              value={config.coatBoton} onChange={(v) => set('coatBoton', v)} />
            <Slider label="Sheen (iridiscencia)" min={0} max={1} step={0.01}
              value={config.sheenBoton} onChange={(v) => set('sheenBoton', v)} />
            <Slider label="Tamaño (×)" min={0.5} max={2} step={0.05}
              value={config.escalaBotones} onChange={(v) => set('escalaBotones', v)} />
            <Slider label="Espaciado (×)" min={0.5} max={2} step={0.05}
              value={config.espaciadoBotones} onChange={(v) => set('espaciadoBotones', v)} />
          </Section>

          <Section title="ANIMACIÓN DE PRESIÓN">
            <Slider label="Profundidad (mm)" min={1} max={15} step={0.5}
              value={config.profundidadPresionMm} onChange={(v) => set('profundidadPresionMm', v)} />
            <Slider label="Intensidad brillo" min={0} max={3} step={0.05}
              value={config.intensidadEmissive} onChange={(v) => set('intensidadEmissive', v)} />
            <Row label="Color al presionar">
              <input type="color" value={config.colorPresion}
                onChange={(e) => set('colorPresion', e.target.value)} style={colorInput} />
            </Row>
          </Section>

          <Section title="ESCENA">
            <Slider label="Intensidad luz principal" min={0} max={4} step={0.05}
              value={config.intensidadLuz} onChange={(v) => set('intensidadLuz', v)} />
            <Row label="Rotación automática">
              <input type="checkbox" checked={config.rotarAuto}
                onChange={(e) => set('rotarAuto', e.target.checked)} />
            </Row>
          </Section>

          <button onClick={() => setConfig(CONFIG_DEFAULT)} style={btnRestaurar}>
            Restaurar valores
          </button>
        </div>
      ) : (
        <button onClick={() => setPanelAbierto(true)} style={btnAbrirEditor}>
          ⚙ Editor
        </button>
      )}

      <Canvas camera={{ position: [0.25, 0.35, 0.4], fov: 28 }} dpr={[1, 2]}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[1, 2, 1]} intensity={config.intensidadLuz} />
        <directionalLight position={[-1, 0.5, -1]} intensity={config.intensidadLuz * 0.3} />
        <directionalLight position={[0, -1, 0.5]} intensity={config.intensidadLuz * 0.15} />

        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.3}>
            <ModeloAcordeon config={config} presionados={presionados} onPresion={onPresion} />
          </Bounds>
        </Suspense>

        <OrbitControls makeDefault enablePan={false} minDistance={0.15} maxDistance={1.5} />
      </Canvas>
    </div>
  );
};

// ===== SUB-COMPONENTES =====

const Galeria: React.FC<{ presets: Preset[]; activo: string; onSelect: (id: string) => void }> = ({ presets, activo, onSelect }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
    {presets.map((p) => (
      <button
        key={p.id}
        onClick={() => onSelect(p.id)}
        title={p.nombre}
        style={{
          background: p.swatch,
          border: activo === p.id ? '2px solid #7ee5ff' : '2px solid transparent',
          borderRadius: 6,
          aspectRatio: '1 / 1',
          cursor: 'pointer',
          padding: 0,
          position: 'relative',
        }}
      >
        {activo === p.id && (
          <div style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 10, color: '#7ee5ff', textShadow: '0 0 3px black' }}>✓</div>
        )}
      </button>
    ))}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #1f2937' }}>
    <div style={{ fontWeight: 600, marginBottom: 8, opacity: 0.85, fontSize: 11, letterSpacing: 0.5 }}>{title}</div>
    {children}
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <span>{label}</span>
    {children}
  </div>
);

const Slider: React.FC<{ label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }> = ({ label, min, max, step, value, onChange }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span>{label}</span>
      <span style={{ opacity: 0.7 }}>{value.toFixed(2)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: '100%' }} />
  </div>
);

// ===== ESTILOS =====

const hudStyle: React.CSSProperties = {
  position: 'absolute', top: 16, left: 16, color: '#fff', zIndex: 10,
  fontFamily: 'monospace', fontSize: 12, background: 'rgba(0,0,0,0.75)',
  padding: '12px 16px', borderRadius: 8, pointerEvents: 'none', maxWidth: 380,
};

const panelStyle: React.CSSProperties = {
  position: 'absolute', top: 16, right: 16, color: '#fff', zIndex: 10,
  background: 'rgba(0,0,0,0.88)', padding: 16, borderRadius: 8, width: 310,
  fontFamily: 'system-ui, sans-serif', fontSize: 12,
  maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
};

const btnX: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#fff', fontSize: 20,
  cursor: 'pointer', padding: 0, lineHeight: 1, width: 24, height: 24,
};

const btnRestaurar: React.CSSProperties = {
  width: '100%', marginTop: 4, padding: '8px 12px', background: '#1f2937',
  color: '#fff', border: '1px solid #374151', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'system-ui', fontSize: 12,
};

const btnAbrirEditor: React.CSSProperties = {
  position: 'absolute', top: 16, right: 16, zIndex: 10,
  padding: '8px 12px', background: 'rgba(0,0,0,0.85)', color: '#fff',
  border: '1px solid #374151', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'system-ui', fontSize: 12,
};

const colorInput: React.CSSProperties = {
  width: 50, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
};

export default AcordeonDiapason3D;
