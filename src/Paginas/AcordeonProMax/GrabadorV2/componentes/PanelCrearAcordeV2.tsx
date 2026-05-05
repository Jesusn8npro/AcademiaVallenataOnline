import React from 'react';
import { Save, ListMusic, Layers } from 'lucide-react';
import { useModalCreadorAcordes } from '../../../../Core/componentes/useModalCreadorAcordes';
import './PanelCrearAcordeV2.css';

interface PanelAdminGestorAcordesProps {
  botonesSeleccionados: string[];
  fuelleActual: 'abriendo' | 'cerrando';
  tonalidadActual: string;
  acordeAEditar?: any;
  onExitoUpdate?: () => void;
  onVerTodos: () => void;
}

const modalitiesColor: Record<string, string> = { Mayor: '#3b82f6', Menor: '#a855f7' };

const PanelCrearAcordeV2: React.FC<PanelAdminGestorAcordesProps> = ({
  botonesSeleccionados, fuelleActual, tonalidadActual, acordeAEditar, onExitoUpdate, onVerTodos,
}) => {
  const {
    nombre, setNombre, grado, setGrado, tipo, setTipo,
    invAbriendo, setInvAbriendo, invCerrando, setInvCerrando,
    hilera, setHilera, botonesCapturados, fuelleGrabado,
    guardando, descripcion, setDescripcion, nombreCirculo, setNombreCirculo,
    referenciaMaestro, setReferenciaMaestro, modalidadCirculo, setModalidadCirculo,
    mensajeCreador, handleGuardar, reiniciarBotones,
  } = useModalCreadorAcordes({
    visible: true,
    botonesSeleccionados,
    fuelleActual,
    tonalidadActual,
    acordeAEditar,
    onExitoUpdate,
    onCerrar: () => {},
  });

  const s = {
    label: { fontSize: '9px', fontWeight: '900' as const, textTransform: 'uppercase' as const },
    input: { backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '10px 12px', color: 'white', fontSize: '13px', outline: 'none', width: '100%' },
    select: { backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '10px', color: 'white', width: '100%' },
  };

  return (
    <div className="panel-admin-gestor-acordes">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#3b82f620', padding: '6px', borderRadius: '10px' }}>
            <Layers size={16} color="#3b82f6" />
          </div>
          <span style={{ color: 'white', fontSize: '13px', fontWeight: 900 }}>
            {acordeAEditar ? 'Editar Acorde' : 'Nuevo Acorde'}
          </span>
        </div>
        <button onClick={onVerTodos} className="panel-admin-gestor-acordes-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px' }}>
          <ListMusic size={14} /> Biblioteca
        </button>
      </div>

      {/* Nombre + Grado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ ...s.label, color: '#3b82f6' }}>Nombre del Acorde</label>
          <input style={s.input} type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Sol Mayor" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ ...s.label, color: '#a1a1aa' }}>Grado</label>
          <select style={s.select} value={grado} onChange={e => setGrado(e.target.value)}>
            <option value="">- Sin grado -</option>
            {['I', 'IV', 'V', 'II', 'III', 'VI', 'VII'].map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Inversiones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Inv. Abriendo', color: '#ef4444', val: invAbriendo, set: setInvAbriendo },
          { label: 'Inv. Cerrando', color: '#22c55e', val: invCerrando, set: setInvCerrando },
        ].map(({ label, color, val, set }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ ...s.label, color }}>{label}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {[0, 1, 2, 3, 4].map(inv => (
                <button key={inv} onClick={() => set(inv)} style={{ padding: '6px 2px', borderRadius: '8px', fontSize: '9px', fontWeight: 900, cursor: 'pointer', backgroundColor: val === inv ? color : '#09090b', color: val === inv ? 'white' : '#71717a', border: val === inv ? 'none' : '1px solid #27272a' }}>
                  {inv === 0 ? 'NAT.' : `${inv}ª`}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hilera + Estructura */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ ...s.label, color: '#a1a1aa' }}>Hilera líder</label>
          <select style={s.select} value={hilera} onChange={e => setHilera(parseInt(e.target.value) as any)}>
            <option value={1}>1. Afuera</option>
            <option value={2}>2. Medio</option>
            <option value={3}>3. Adentro</option>
            <option value={0}>F.H.</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ ...s.label, color: '#a1a1aa' }}>Estructura</label>
          <select style={s.select} value={tipo} onChange={e => setTipo(e.target.value as any)}>
            <option>Mayor</option><option>Menor</option><option>Septima</option>
          </select>
        </div>
      </div>

      {/* Círculo + Referencia */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ ...s.label, color: '#a855f7' }}>Círculo / Tonalidad</label>
          <select style={s.select} value={nombreCirculo} onChange={e => setNombreCirculo(e.target.value)}>
            <option value="">- Tono -</option>
            {['DO', 'DO#', 'RE', 'RE#', 'MIB', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'SIB', 'SI'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ ...s.label, color: '#3b82f6' }}>Referencia maestro</label>
          <input style={s.input} type="text" value={referenciaMaestro} onChange={e => setReferenciaMaestro(e.target.value)} placeholder="+1/2 Tono Medio (2)" />
        </div>
      </div>

      {/* Modalidad */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ ...s.label, color: modalitiesColor[modalidadCirculo] }}>Modalidad del círculo</label>
        <div style={{ display: 'flex', background: '#09090b', borderRadius: '10px', padding: '3px', border: '1px solid #3f3f46' }}>
          {(['Mayor', 'Menor'] as const).map(m => (
            <button key={m} onClick={() => setModalidadCirculo(m)} style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', border: 'none', backgroundColor: modalidadCirculo === m ? modalitiesColor[m] : 'transparent', color: modalidadCirculo === m ? 'white' : '#71717a' }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Nota pedagógica */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ ...s.label, color: '#a1a1aa' }}>Indicación de transporte</label>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Nota pedagógica..." style={{ ...s.input, height: '54px', minHeight: '54px', maxHeight: '54px', resize: 'none' }} />
      </div>

      {/* Notas capturadas */}
      <div style={{ backgroundColor: '#09090b', borderRadius: '14px', padding: '12px', border: '1px solid #27272a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#71717a' }}>NOTAS CAPTURADAS ({fuelleGrabado.toUpperCase()})</span>
          <button onClick={reiniciarBotones} style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '9px', cursor: 'pointer', fontWeight: 900 }}>REINICIAR</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {botonesCapturados.length === 0
            ? <span style={{ color: '#3f3f46', fontSize: '11px' }}>Toca las notas para grabar...</span>
            : botonesCapturados.map(b => (
              <span key={b} style={{ fontSize: '9px', backgroundColor: '#3b82f615', color: '#3b82f6', border: '1px solid #3b82f630', padding: '3px 7px', borderRadius: '6px' }}>{b}</span>
            ))}
        </div>
      </div>

      {/* Mensaje */}
      {mensajeCreador && (
        <div style={{ padding: '9px 12px', borderRadius: '10px', background: mensajeCreador.exito ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${mensajeCreador.exito ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: mensajeCreador.exito ? '#6ee7b7' : '#fca5a5', fontSize: '12px', fontWeight: 700 }}>
          {mensajeCreador.texto}
        </div>
      )}

      {/* Guardar */}
      <button disabled={guardando} onClick={handleGuardar} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', fontWeight: 900, fontSize: '13px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: acordeAEditar ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', opacity: guardando ? 0.7 : 1 }}>
        <Save size={16} /> {guardando ? 'GUARDANDO...' : (acordeAEditar ? 'ACTUALIZAR ACORDE' : 'GUARDAR ACORDE MAESTRO')}
      </button>
    </div>
  );
};

export default PanelCrearAcordeV2;
