import React from 'react';
import type { AjustesAcordeon } from '../../TiposAcordeon';

interface PestanaDisenoProps {
    ajustes: AjustesAcordeon;
    setAjustes: (ajustes: AjustesAcordeon) => void;
}

const PestanaDiseno: React.FC<PestanaDisenoProps> = ({ ajustes, setAjustes }) => {
    const handleUpdate = (campo: keyof AjustesAcordeon, valor: string) => {
        setAjustes({ ...ajustes, [campo]: valor });
    };

    return (
        <>
            <h3 style={{ marginBottom: '15px', color: '#3b82f6', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>HERRAMIENTAS DE ESTILO</h3>

            <div className="grupo-ajuste" style={{ marginBottom: '20px' }}>
                <label>ESCALA ACORDEÓN: {ajustes.tamano}</label>
                <input type="range" min="40" max="110" value={parseFloat(ajustes.tamano)} onChange={(e) => handleUpdate('tamano', `${e.target.value}vh`)} />

                <div style={{ display: 'flex', gap: '15px', marginTop: '12px' }}>
                    <div style={{ flex: 1 }} className="grupo-ajuste">
                        <label style={{ fontSize: '9px' }}>HORIZONTAL (X)</label>
                        <input type="range" min="0" max="100" step="0.1" value={parseFloat(ajustes.x)} onChange={(e) => handleUpdate('x', `${e.target.value}%`)} />
                    </div>
                    <div style={{ flex: 1 }} className="grupo-ajuste">
                        <label style={{ fontSize: '9px' }}>VERTICAL (Y)</label>
                        <input type="range" min="0" max="100" step="0.1" value={parseFloat(ajustes.y)} onChange={(e) => handleUpdate('y', `${e.target.value}%`)} />
                    </div>
                </div>
            </div>

            <div className="grupo-estilo-avanzado" style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '15px', paddingRight: '8px' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '12px', borderRadius: '16px', marginBottom: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <p style={{ color: '#22c55e', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px' }}>🎹 PITOS (DERECHA)</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }} className="grupo-ajuste">
                            <label style={{ fontSize: '8px' }}>BOTÓN</label>
                            <input type="range" min="1" max="10" step="0.1" value={parseFloat(ajustes.pitosBotonTamano)} onChange={(e) => handleUpdate('pitosBotonTamano', `${e.target.value}vh`)} />
                        </div>
                        <div style={{ flex: 1 }} className="grupo-ajuste">
                            <label style={{ fontSize: '8px' }}>LETRA</label>
                            <input type="range" min="0.5" max="5" step="0.1" value={parseFloat(ajustes.pitosFuenteTamano)} onChange={(e) => handleUpdate('pitosFuenteTamano', `${e.target.value}vh`)} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <div style={{ flex: 1 }} className="grupo-ajuste">
                            <label style={{ fontSize: '8px' }}>POS. H</label>
                            <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.teclasLeft)} onChange={(e) => handleUpdate('teclasLeft', `${e.target.value}%`)} />
                        </div>
                        <div style={{ flex: 1 }} className="grupo-ajuste">
                            <label style={{ fontSize: '8px' }}>POS. V</label>
                            <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.teclasTop)} onChange={(e) => handleUpdate('teclasTop', `${e.target.value}%`)} />
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgba(234, 179, 8, 0.08)', padding: '12px', borderRadius: '16px', marginBottom: '12px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                    <p style={{ color: '#eab308', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px' }}>🎸 BAJOS (IZQUIERDA)</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }} className="grupo-ajuste">
                            <label style={{ fontSize: '8px' }}>BOTÓN</label>
                            <input type="range" min="1" max="10" step="0.1" value={parseFloat(ajustes.bajosBotonTamano)} onChange={(e) => handleUpdate('bajosBotonTamano', `${e.target.value}vh`)} />
                        </div>
                        <div style={{ flex: 1 }} className="grupo-ajuste">
                            <label style={{ fontSize: '8px' }}>LETRA</label>
                            <input type="range" min="0.5" max="5" step="0.1" value={parseFloat(ajustes.bajosFuenteTamano)} onChange={(e) => handleUpdate('bajosFuenteTamano', `${e.target.value}vh`)} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <div style={{ flex: 1 }} className="grupo-ajuste">
                            <label style={{ fontSize: '8px' }}>POS. H</label>
                            <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.bajosLeft)} onChange={(e) => handleUpdate('bajosLeft', `${e.target.value}%`)} />
                        </div>
                        <div style={{ flex: 1 }} className="grupo-ajuste">
                            <label style={{ fontSize: '8px' }}>POS. V</label>
                            <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.bajosTop)} onChange={(e) => handleUpdate('bajosTop', `${e.target.value}%`)} />
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};

export default PestanaDiseno;
