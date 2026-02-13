import React from 'react';
import { motion } from 'framer-motion';
import { mapaTeclas } from '../mapaTecladoYFrecuencias';
import type { AjustesAcordeon, ModoVista } from '../TiposAcordeon';

interface CuerpoAcordeonProps {
    imagenFondo: string;
    ajustes: AjustesAcordeon;
    direccion: 'halar' | 'empujar';
    configTonalidad: any;
    botonesActivos: Record<string, any>;
    modoAjuste: boolean;
    botonSeleccionado: string | null;
    modoVista: ModoVista;
    vistaDoble: boolean;
    setBotonSeleccionado: (id: string) => void;
    actualizarBotonActivo: (id: string, accion: 'add' | 'remove', inst?: any[] | null) => void;
}

const CIFRADO_AMERICANO: Record<string, string> = {
    'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
    'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
};

const NOTE_MAPPING: Record<string, string> = {
    'C': 'Do', 'D': 'Re', 'E': 'Mi', 'F': 'Fa', 'G': 'Sol', 'A': 'La', 'B': 'Si',
    'Cb': 'Dob', 'Db': 'Reb', 'Eb': 'Mib', 'Fb': 'Fab', 'Gb': 'Solb', 'Ab': 'Lab', 'Bb': 'Sib',
    'C#': 'Do#', 'D#': 'Re#', 'E#': 'Mi#', 'F#': 'Fa#', 'G#': 'Sol#', 'A#': 'La#', 'B#': 'Si#'
};

const CuerpoAcordeon: React.FC<CuerpoAcordeonProps> = ({
    imagenFondo, ajustes, direccion, configTonalidad,
    botonesActivos, modoAjuste, botonSeleccionado,
    modoVista, vistaDoble, setBotonSeleccionado, actualizarBotonActivo
}) => {

    const formatearNota = (nombre: string) => {
        if (!nombre) return '';
        let base = nombre.trim().split(' ')[0].replace(/([a-z])([A-Z])/g, '$1 $2').split(' ')[0];
        base = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
        if (modoVista === 'cifrado') return CIFRADO_AMERICANO[base] || base;
        return base;
    };

    const extraerNombreNotaDeArchivo = (ruta: string): string => {
        if (!ruta) return '';
        const nombreArchivo = ruta.split('/').pop() || '';
        if (nombreArchivo.startsWith('Bajo')) {
            const sinPrefijo = nombreArchivo.replace('Bajo', '');
            let nota = (sinPrefijo.length >= 2 && (sinPrefijo[1] === 'b' || sinPrefijo[1] === '#')) ? sinPrefijo.substring(0, 2) : sinPrefijo.substring(0, 1);
            return NOTE_MAPPING[nota] || nota;
        }
        const partes = nombreArchivo.split('-');
        if (partes.length > 0) {
            const nota = partes[0];
            return NOTE_MAPPING[nota] || nota;
        }
        return '';
    };

    const obtenerEtiquetaBoton = (id: string, nombreOriginal: string) => {
        if (ajustes.mapeoPersonalizado?.[id]?.length > 0) {
            const ruta = ajustes.mapeoPersonalizado[id][0];
            const nuevoNombre = extraerNombreNotaDeArchivo(ruta);
            return nuevoNombre || formatearNota(nombreOriginal);
        }
        return formatearNota(nombreOriginal);
    }

    const getFilaDisplay = (f: string) => {
        if (f === 'primeraFila') return 'Afuera (1)';
        if (f === 'segundaFila') return 'Medio (2)';
        if (f === 'terceraFila') return 'Adentro (3)';
        return f;
    };

    const filas = ['primeraFila', 'segundaFila', 'terceraFila'];
    const filasBajos = ['una', 'dos'];

    return (
        <motion.div className="disposicion-acordeon" style={{
            '--imagen-fondo-acordeon': `url('${imagenFondo}')`,
            '--sim-tamano': ajustes.tamano, '--sim-x': ajustes.x, '--sim-y': ajustes.y,
            '--sim-pitos-boton-tamano': ajustes.pitosBotonTamano, '--sim-pitos-fuente-tamano': ajustes.pitosFuenteTamano,
            '--sim-bajos-boton-tamano': ajustes.bajosBotonTamano, '--sim-bajos-fuente-tamano': ajustes.bajosFuenteTamano,
            '--sim-teclas-left': ajustes.teclasLeft, '--sim-teclas-top': ajustes.teclasTop,
            '--sim-bajos-left': ajustes.bajosLeft, '--sim-bajos-top': ajustes.bajosTop
        } as any}>
            <div className="lado-teclas">
                {filas.map(f => (
                    <div key={f} className={`fila ${f === 'primeraFila' ? 'tres' : f === 'segundaFila' ? 'dos' : 'uno'}`}>
                        {configTonalidad[f].filter((b: any) => b.id.includes(direccion)).map((b: any) => {
                            const baseId = b.id.replace('-halar', '').replace('-empujar', '');
                            const idHalar = `${baseId}-halar`;
                            const idEmpujar = `${baseId}-empujar`;

                            return (
                                <div key={b.id}
                                    className={`boton ${botonesActivos[b.id] ? 'activo' : ''} ${direccion} ${botonSeleccionado === b.id ? 'seleccionado-ajuste' : ''}`}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        if (modoAjuste) setBotonSeleccionado(b.id);
                                        actualizarBotonActivo(b.id, 'add');
                                    }}
                                    onPointerUp={() => actualizarBotonActivo(b.id, 'remove')}
                                    onPointerLeave={() => actualizarBotonActivo(b.id, 'remove')}
                                    style={{ border: (modoAjuste && botonSeleccionado === b.id) ? '2px solid gold' : undefined }}
                                >
                                    {!vistaDoble ? (
                                        <span style={{ color: direccion === 'halar' ? '#3b82f6' : '#f97316', fontWeight: '900' }}>
                                            {modoVista === 'teclas' ? (Object.keys(mapaTeclas).find(k => mapaTeclas[k].fila === parseInt(b.id.split('-')[0]) && mapaTeclas[k].columna === parseInt(b.id.split('-')[1])) || '').toUpperCase() :
                                                modoVista === 'numeros' ? b.id.split('-')[1] : obtenerEtiquetaBoton(b.id, b.nombre)}
                                        </span>
                                    ) : (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            lineHeight: '1.1',
                                            fontSize: '0.75em',
                                            gap: '4px',
                                            justifyContent: 'center',
                                            height: '100%',
                                            width: '100%',
                                            padding: '2px'
                                        }}>
                                            <span style={{
                                                color: '#3b82f6',
                                                fontWeight: '900',
                                                textShadow: '0 0 5px rgba(0,0,0,0.5)',
                                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                paddingBottom: '2px'
                                            }}>
                                                {obtenerEtiquetaBoton(idHalar, configTonalidad[f].find((x: any) => x.id === idHalar)?.nombre || '')}
                                            </span>
                                            <span style={{
                                                color: '#f97316',
                                                fontWeight: '900',
                                                textShadow: '0 0 5px rgba(0,0,0,0.5)'
                                            }}>
                                                {obtenerEtiquetaBoton(idEmpujar, configTonalidad[f].find((x: any) => x.id === idEmpujar)?.nombre || '')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <h4 style={{ margin: '5px 0', fontSize: '9px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px 2px black' }}>{getFilaDisplay(f)}</h4>
                    </div>
                ))}
            </div>
            <div className="lado-bajos">
                {filasBajos.map(f => (
                    <div key={f} className={`fila ${f}`}>
                        {(configTonalidad.disposicionBajos as any)[f].filter((b: any) => b.id.includes(direccion)).map((b: any) => {
                            const baseId = b.id.replace('-halar-bajo', '').replace('-empujar-bajo', '');
                            const idHalar = `${baseId}-halar-bajo`;
                            const idEmpujar = `${baseId}-empujar-bajo`;

                            return (
                                <div key={b.id}
                                    className={`boton ${botonesActivos[b.id] ? 'activo' : ''} ${direccion} ${botonSeleccionado === b.id ? 'seleccionado-ajuste' : ''}`}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        if (modoAjuste) setBotonSeleccionado(b.id);
                                        actualizarBotonActivo(b.id, 'add');
                                    }}
                                    onPointerUp={() => actualizarBotonActivo(b.id, 'remove')}
                                    onPointerLeave={() => actualizarBotonActivo(b.id, 'remove')}
                                    style={{ border: (modoAjuste && botonSeleccionado === b.id) ? '2px solid gold' : undefined }}
                                >
                                    {!vistaDoble ? (
                                        <span style={{ color: direccion === 'halar' ? '#3b82f6' : '#f97316', fontWeight: '900', fontSize: '0.9em' }}>
                                            {obtenerEtiquetaBoton(b.id, b.nombre)}
                                        </span>
                                    ) : (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            lineHeight: '1',
                                            fontSize: '0.7em',
                                            gap: '3px',
                                            justifyContent: 'center',
                                            padding: '2px'
                                        }}>
                                            <span style={{
                                                color: '#3b82f6',
                                                fontWeight: '900',
                                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                                paddingBottom: '1px'
                                            }}>
                                                {obtenerEtiquetaBoton(idHalar, (configTonalidad.disposicionBajos as any)[f].find((x: any) => x.id === idHalar)?.nombre || '')}
                                            </span>
                                            <span style={{
                                                color: '#f97316',
                                                fontWeight: '900'
                                            }}>
                                                {obtenerEtiquetaBoton(idEmpujar, (configTonalidad.disposicionBajos as any)[f].find((x: any) => x.id === idEmpujar)?.nombre || '')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default CuerpoAcordeon;
