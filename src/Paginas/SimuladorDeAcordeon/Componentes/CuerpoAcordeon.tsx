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
    listo?: boolean; // Prop para el fade-in inicial
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
    modoVista, vistaDoble, setBotonSeleccionado, actualizarBotonActivo,
    listo = true
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
        <motion.div
            className="disposicion-acordeon"
            initial={{ opacity: 0 }}
            animate={{ opacity: listo ? 1 : 0 }}
            transition={{
                opacity: { duration: 0.3 },
                default: { duration: 0 } // Para que x e y cambien INSTANTÁNEAMENTE sin deslizarse
            }}
            style={{
                '--imagen-fondo-acordeon': `url('${imagenFondo}')`,
                '--sim-tamano': ajustes.tamano,
                '--sim-x': ajustes.x,
                '--sim-y': ajustes.y,
                '--sim-pitos-boton-tamano-val': parseFloat(ajustes.pitosBotonTamano),
                '--sim-pitos-fuente-tamano-val': parseFloat(ajustes.pitosFuenteTamano),
                '--sim-bajos-boton-tamano-val': parseFloat(ajustes.bajosBotonTamano),
                '--sim-bajos-fuente-tamano-val': parseFloat(ajustes.bajosFuenteTamano),
                '--sim-teclas-left': ajustes.teclasLeft,
                '--sim-teclas-top': ajustes.teclasTop,
                '--sim-bajos-left': ajustes.bajosLeft,
                '--sim-bajos-top': ajustes.bajosTop
            } as any}
        >
            <div className="lado-teclas">
                {filas.map(f => (
                    <div key={f} className={`fila ${f === 'primeraFila' ? 'tres' : f === 'segundaFila' ? 'dos' : 'uno'}`}>
                        {configTonalidad[f].filter((b: any) => b.id.includes(direccion)).map((b: any) => {
                            const [fila, col, dir] = b.id.split('-');
                            const idHalar = `${fila}-${col}-halar`;
                            const idEmpujar = `${fila}-${col}-empujar`;

                            const handleSelect = (id: string) => {
                                if (modoAjuste) setBotonSeleccionado(id);
                                actualizarBotonActivo(id, 'add');
                            };

                            return (
                                <div key={b.id}
                                    className={`boton ${botonesActivos[b.id] ? 'activo' : ''} ${direccion} ${botonSeleccionado === b.id ? 'seleccionado-ajuste' : ''}`}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        if (vistaDoble) {
                                            // En vista doble, el contenedor no hace nada, dejamos que los spans manejen el clic
                                            // Pero por si acaso, si clicas en el borde, usamos el ID actual
                                            handleSelect(b.id);
                                        } else {
                                            handleSelect(b.id);
                                        }
                                    }}
                                    onPointerUp={() => actualizarBotonActivo(b.id, 'remove')}
                                    onPointerLeave={() => actualizarBotonActivo(b.id, 'remove')}
                                    style={{ border: (modoAjuste && botonSeleccionado === b.id) ? '2px solid gold' : undefined }}
                                >
                                    {!vistaDoble ? (
                                        <span style={{ color: direccion === 'halar' ? '#3b82f6' : '#f97316', fontWeight: '900' }}>
                                            {modoVista === 'teclas' ? (Object.keys(mapaTeclas).find(k => mapaTeclas[k].fila === parseInt(fila) && mapaTeclas[k].columna === parseInt(col)) || '').toUpperCase() :
                                                modoVista === 'numeros' ? col : obtenerEtiquetaBoton(b.id, b.nombre)}
                                        </span>
                                    ) : (
                                        <div style={{
                                            display: 'flex', flexDirection: 'column', lineHeight: '1.2',
                                            fontSize: '0.75em', justifyContent: 'center', height: '100%', width: '100%'
                                        }}>
                                            <span
                                                onPointerDown={(e) => { e.stopPropagation(); handleSelect(idHalar); }}
                                                style={{
                                                    color: (modoAjuste && botonSeleccionado === idHalar) ? '#fff' : '#3b82f6',
                                                    background: (modoAjuste && botonSeleccionado === idHalar) ? '#3b82f6' : 'transparent',
                                                    fontWeight: '900', borderRadius: '4px', cursor: 'pointer'
                                                }}
                                            >
                                                {obtenerEtiquetaBoton(idHalar, configTonalidad[f].find((x: any) => x.id === idHalar)?.nombre || '')}
                                            </span>
                                            <span
                                                onPointerDown={(e) => { e.stopPropagation(); handleSelect(idEmpujar); }}
                                                style={{
                                                    color: (modoAjuste && botonSeleccionado === idEmpujar) ? '#fff' : '#f97316',
                                                    background: (modoAjuste && botonSeleccionado === idEmpujar) ? '#f97316' : 'transparent',
                                                    fontWeight: '900', borderRadius: '4px', cursor: 'pointer'
                                                }}
                                            >
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
                            const [fila, col, dir] = b.id.split('-');
                            const idHalar = `${fila}-${col}-halar-bajo`;
                            const idEmpujar = `${fila}-${col}-empujar-bajo`;

                            const handleSelect = (id: string) => {
                                if (modoAjuste) setBotonSeleccionado(id);
                                actualizarBotonActivo(id, 'add');
                            };

                            return (
                                <div key={b.id}
                                    className={`boton ${botonesActivos[b.id] ? 'activo' : ''} ${direccion} ${botonSeleccionado === b.id ? 'seleccionado-ajuste' : ''}`}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(b.id);
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
                                            display: 'flex', flexDirection: 'column', lineHeight: '1.1',
                                            fontSize: '0.7em', justifyContent: 'center', height: '100%', width: '100%'
                                        }}>
                                            <span
                                                onPointerDown={(e) => { e.stopPropagation(); handleSelect(idHalar); }}
                                                style={{
                                                    color: (modoAjuste && botonSeleccionado === idHalar) ? '#fff' : '#3b82f6',
                                                    background: (modoAjuste && botonSeleccionado === idHalar) ? '#3b82f6' : 'transparent',
                                                    fontWeight: '900', borderRadius: '3px', padding: '1px'
                                                }}
                                            >
                                                {obtenerEtiquetaBoton(idHalar, (configTonalidad.disposicionBajos as any)[f].find((x: any) => x.id === idHalar)?.nombre || '')}
                                            </span>
                                            <span
                                                onPointerDown={(e) => { e.stopPropagation(); handleSelect(idEmpujar); }}
                                                style={{
                                                    color: (modoAjuste && botonSeleccionado === idEmpujar) ? '#fff' : '#f97316',
                                                    background: (modoAjuste && botonSeleccionado === idEmpujar) ? '#f97316' : 'transparent',
                                                    fontWeight: '900', borderRadius: '3px', padding: '1px'
                                                }}
                                            >
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
