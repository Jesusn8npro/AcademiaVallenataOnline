import React from 'react';
import { motion } from 'framer-motion';
import { GripHorizontal, X, Save } from 'lucide-react';
import PestanaDiseno from './PestanaDiseno';
import PestanaSonido from './PestanaSonido';
import type { AjustesAcordeon, SonidoVirtual } from '../../TiposAcordeon';

interface PanelAjustesProps {
    modoAjuste: boolean;
    setModoAjuste: (val: boolean) => void;
    pestanaActiva: 'diseno' | 'sonido';
    setPestanaActiva: (p: 'diseno' | 'sonido') => void;
    botonSeleccionado: string | null;
    setBotonSeleccionado: (id: string | null) => void;
    ajustes: AjustesAcordeon;
    setAjustes: (a: AjustesAcordeon) => void;
    tonalidadSeleccionada: string;
    setTonalidadSeleccionada: (v: string) => void;
    listaTonalidades: string[];
    setListaTonalidades: (l: string[]) => void;
    sonidosVirtuales: SonidoVirtual[];
    setSonidosVirtuales: (sv: SonidoVirtual[]) => void;
    eliminarTonalidad: (t: string) => void;
    mapaBotonesActual: any;
    playPreview: (r: string, p: number) => void;
    stopPreview: () => void;
    reproduceTono: (id: string) => { instances: any[] };
    samplesBrillante: string[];
    samplesBajos: string[];
    muestrasDB: any[];
    soundsPerKey: Record<string, string[]>;
    obtenerRutasAudio: (id: string) => string[];
    guardarAjustes: () => void;
    resetearAjustes: () => void;
    sincronizarAudios: () => void;
    guardarNuevoSonidoVirtual: (nombre: string, rutaBase: string, pitch: number, tipo: 'Bajos' | 'Brillante') => void;
}

const PanelAjustes: React.FC<PanelAjustesProps> = (props) => {
    const {
        modoAjuste, setModoAjuste, pestanaActiva, setPestanaActiva,
        botonSeleccionado, setBotonSeleccionado, ajustes, setAjustes,
        guardarAjustes, resetearAjustes, sincronizarAudios, playPreview, stopPreview,
        tonalidadSeleccionada, setTonalidadSeleccionada, sonidosVirtuales, setSonidosVirtuales
    } = props;

    if (!modoAjuste) return null;

    const exportarConfiguracion = () => {
        // Ahora exportamos el estado actual de la aplicación en lugar del localStorage
        const exportData: any = {
            sonidosVirtuales,
            tonalidades: {
                [`ajustes_acordeon_vPRO_${tonalidadSeleccionada}`]: ajustes
            }
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
        const dl = document.createElement('a');
        dl.setAttribute("href", dataStr);
        dl.setAttribute("download", `BACKUP_ACORDEON_${new Date().toISOString().slice(0, 10)}.json`);
        dl.click();
        alert('✅ ¡Copia de seguridad generada!');
    };

    return (
        <motion.div drag dragMomentum={false} className="panel-ajustes visible" style={{
            position: 'fixed', top: '140px', right: '120px', zIndex: 2000,
            background: '#0a0a0af2', padding: '25px', borderRadius: '32px',
            color: 'white',
            width: pestanaActiva === 'sonido' ? '780px' : '380px', // 🚀 Panel extendido para sonidos
            border: '1px solid rgba(59, 130, 246, 0.5)', backdropFilter: 'blur(25px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(59, 130, 246, 0.1)',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' // Animación suave de apertura
        } as any}>
            <div style={{ width: '100%', height: '28px', cursor: 'grab', display: 'flex', justifyContent: 'center', marginBottom: '15px', position: 'relative' }}>
                <GripHorizontal color="#3b82f6" />
                <button onClick={() => { setModoAjuste(false); setBotonSeleccionado(null); }} style={{ position: 'absolute', right: '-5px', top: '-15px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '50%', padding: '5px' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '14px' }}>
                <button onClick={() => setPestanaActiva('diseno')} className={`tab-ajuste ${pestanaActiva === 'diseno' ? 'activa' : ''}`} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '12px', background: pestanaActiva === 'diseno' ? '#3b82f6' : 'transparent', color: pestanaActiva === 'diseno' ? 'white' : '#777' }}>🎨 DISEÑO</button>
                <button onClick={() => setPestanaActiva('sonido')} className={`tab-ajuste ${pestanaActiva === 'sonido' ? 'activa' : ''}`} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '12px', background: pestanaActiva === 'sonido' ? '#3b82f6' : 'transparent', color: pestanaActiva === 'sonido' ? 'white' : '#777' }}>🎵 SONIDOS</button>
            </div>


            <div style={{
                display: pestanaActiva === 'sonido' ? 'flex' : 'block',
                gap: '20px',
                alignItems: 'flex-start'
            }}>
                <div style={{ flex: 1 }}>
                    {pestanaActiva === 'diseno' ? (
                        <PestanaDiseno ajustes={ajustes} setAjustes={setAjustes} />
                    ) : (
                        <PestanaSonido {...props} soundsPerKey={props.soundsPerKey} modoVista="controles" />
                    )}
                </div>

                {pestanaActiva === 'sonido' && (
                    <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                        <PestanaSonido {...props} soundsPerKey={props.soundsPerKey} modoVista="seleccion" />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => { stopPreview(); guardarAjustes(); }} style={{ background: '#22c55e', color: 'white', flex: 2, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                    <Save size={18} /> GUARDAR
                </button>
                <button onClick={() => { stopPreview(); resetearAjustes(); }} style={{ background: '#ef4444', color: 'white', flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>RESET</button>
                <button onClick={() => (sincronizarAudios as any)(true)} style={{ background: '#8b5cf6', color: 'white', flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>ACTUALIZAR AUDIOS</button>
            </div>

            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                <button onClick={exportarConfiguracion} style={{ background: '#3b82f6', color: 'white', flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}>⬇ EXPORTAR TODO</button>
                <label style={{ background: '#8b5cf6', color: 'white', flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px', textAlign: 'center' }}>
                    ⬆ IMPORTAR TODO
                    <input type="file" style={{ display: 'none' }} accept=".json" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            try {
                                const data = JSON.parse(ev.target?.result as string);
                                if (data.tonalidades) {
                                    // Al importar, cargamos la primera tonalidad encontrada en el archivo
                                    const keys = Object.keys(data.tonalidades);
                                    if (keys.length > 0) {
                                        const mappingKey = keys[0];
                                        const tNombre = mappingKey.replace('ajustes_acordeon_vPRO_', '');
                                        setAjustes(data.tonalidades[mappingKey]);
                                        setTonalidadSeleccionada(tNombre);
                                    }
                                }
                                if (data.sonidosVirtuales) {
                                    setSonidosVirtuales(data.sonidosVirtuales);
                                }
                                alert('✅ ¡Configuración cargada temporalmente! Dale a GUARDAR para persistir en la nube.');
                            } catch (e) { alert('❌ Error al importar'); }
                        };
                        reader.readAsText(file);
                    }} />
                </label>
            </div>
        </motion.div>
    );
};

export default PanelAjustes;
