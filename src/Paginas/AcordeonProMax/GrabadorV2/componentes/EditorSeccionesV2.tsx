import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Flag, Coins, Mic, Pencil, X, Check } from 'lucide-react';
import type { SeccionV2 } from '../tipos';

interface Props {
  secciones: SeccionV2[];
  tickActual: number;
  bpm: number;
  resolucion: number;
  /** Si el grabador puede entrar en punch-in para regrabar una sección. */
  puedeGrabar: boolean;
  onAgregar(seccion: Omit<SeccionV2, 'id'>): void;
  onActualizar(id: string, cambios: Partial<SeccionV2>): void;
  onEliminar(id: string): void;
  onSeek(tick: number): void;
  /** Inicia grabación punch-in en el rango de la sección. */
  onGrabarSeccion(seccion: SeccionV2): void;
}

function fmt(seg: number) {
  const m = Math.floor(seg / 60);
  const s = (seg - m * 60).toFixed(1);
  return `${m}:${s.padStart(4, '0')}`;
}

const EditorSeccionesV2: React.FC<Props> = ({
  secciones, tickActual, bpm, resolucion, puedeGrabar,
  onAgregar, onActualizar, onEliminar, onSeek, onGrabarSeccion,
}) => {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoInicio, setNuevoInicio] = useState<number | null>(null);
  const [nuevoFin, setNuevoFin] = useState<number | null>(null);
  const [nuevoMonedas, setNuevoMonedas] = useState(1);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicionTemp, setEdicionTemp] = useState<{ nombre: string; monedas: number }>({ nombre: '', monedas: 1 });

  const segPorTick = 60 / bpm / resolucion;

  const marcarInicio = () => setNuevoInicio(Math.max(0, Math.round(tickActual)));
  const marcarFin = () => setNuevoFin(Math.max(0, Math.round(tickActual)));
  const puedeAgregar = !!nuevoNombre.trim() && nuevoInicio != null && nuevoFin != null && nuevoFin > nuevoInicio;

  const agregar = () => {
    if (!puedeAgregar || nuevoInicio == null || nuevoFin == null) return;
    onAgregar({
      nombre: nuevoNombre.trim(),
      tickInicio: nuevoInicio,
      tickFin: nuevoFin,
      monedas: Math.max(0, nuevoMonedas),
    });
    setNuevoNombre('');
    setNuevoInicio(null);
    setNuevoFin(null);
    setNuevoMonedas(1);
  };

  const iniciarEdicion = (s: SeccionV2) => {
    setEditandoId(s.id);
    setEdicionTemp({ nombre: s.nombre, monedas: s.monedas });
  };
  const guardarEdicion = (id: string) => {
    onActualizar(id, { nombre: edicionTemp.nombre.trim() || 'Sin nombre', monedas: Math.max(0, edicionTemp.monedas) });
    setEditandoId(null);
  };

  return (
    <div className="grabv2-secciones">
      <div className="grabv2-panel-titulo">
        <span>Secciones de la canción</span>
        <span className="grabv2-panel-contador">{secciones.length}</span>
      </div>

      <div className="grabv2-secciones-lista">
        {secciones.length === 0 && (
          <div className="grabv2-secciones-vacio">
            Sin secciones aún. Marcá inicio y fin abajo, ponele nombre y agregá.
          </div>
        )}
        {secciones.map((s) => {
          const enEdicion = editandoId === s.id;
          return (
            <div key={s.id} className="grabv2-seccion-item">
              <div className="grabv2-seccion-info">
                {enEdicion ? (
                  <input
                    className="grabv2-seccion-nombre-edit"
                    value={edicionTemp.nombre}
                    onChange={(e) => setEdicionTemp(prev => ({ ...prev, nombre: e.target.value }))}
                    autoFocus
                  />
                ) : (
                  <span className="grabv2-seccion-nombre">{s.nombre}</span>
                )}
                <span className="grabv2-seccion-tiempo">
                  {fmt(s.tickInicio * segPorTick)} → {fmt(s.tickFin * segPorTick)}
                </span>
              </div>

              <div className="grabv2-seccion-monedas">
                <Coins size={11} />
                {enEdicion ? (
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    className="grabv2-seccion-monedas-edit"
                    value={edicionTemp.monedas}
                    onChange={(e) => setEdicionTemp(prev => ({ ...prev, monedas: Number(e.target.value) }))}
                  />
                ) : (
                  <span>{s.monedas}</span>
                )}
              </div>

              <div className="grabv2-seccion-acciones">
                <button className="grabv2-btn-mini" onClick={() => onSeek(s.tickInicio)} title="Ir al inicio">⤴</button>
                {puedeGrabar && !enEdicion && (
                  <button
                    className="grabv2-btn-mini grabv2-btn-grabar-sec"
                    onClick={() => onGrabarSeccion(s)}
                    title="Grabar/Regrabar esta sección (punch-in)"
                  >
                    <Mic size={12} />
                  </button>
                )}
                {enEdicion ? (
                  <>
                    <button className="grabv2-btn-mini grabv2-btn-ok" onClick={() => guardarEdicion(s.id)} title="Guardar">
                      <Check size={12} />
                    </button>
                    <button className="grabv2-btn-mini" onClick={() => setEditandoId(null)} title="Cancelar">
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <button className="grabv2-btn-mini" onClick={() => iniciarEdicion(s)} title="Editar">
                    <Pencil size={12} />
                  </button>
                )}
                <button className="grabv2-btn-mini grabv2-btn-del" onClick={() => onEliminar(s.id)} title="Eliminar">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grabv2-seccion-nueva">
        <div className="grabv2-seccion-nueva-titulo">📍 Marcar nueva sección</div>
        <input
          className="grabv2-input"
          type="text"
          placeholder="Nombre (ej: Intro, Estrofa, Pase final…)"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
        />
        <div className="grabv2-seccion-marcadores">
          <button
            className={`grabv2-btn-marca ${nuevoInicio != null ? 'marcado' : ''}`}
            onClick={marcarInicio}
            title="Marcar inicio en posición actual"
          >
            <MapPin size={12} /> Inicio
            <span className="grabv2-btn-marca-tiempo">
              {nuevoInicio != null ? fmt(nuevoInicio * segPorTick) : '--:--'}
            </span>
          </button>
          <button
            className={`grabv2-btn-marca ${nuevoFin != null ? 'marcado' : ''}`}
            onClick={marcarFin}
            title="Marcar fin en posición actual"
          >
            <Flag size={12} /> Fin
            <span className="grabv2-btn-marca-tiempo">
              {nuevoFin != null ? fmt(nuevoFin * segPorTick) : '--:--'}
            </span>
          </button>
        </div>
        <label className="grabv2-input-monedas">
          <Coins size={12} />
          <span>Monedas</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={nuevoMonedas}
            onChange={(e) => setNuevoMonedas(Number(e.target.value))}
          />
        </label>
        <button className="grabv2-btn-agregar" onClick={agregar} disabled={!puedeAgregar}>
          <Plus size={12} /> Agregar sección
        </button>
        {nuevoFin != null && nuevoInicio != null && nuevoFin <= nuevoInicio && (
          <div className="grabv2-error">⚠ El fin debe ser mayor que el inicio.</div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EditorSeccionesV2);
