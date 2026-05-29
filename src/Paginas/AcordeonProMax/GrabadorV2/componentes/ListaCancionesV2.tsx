import * as React from 'react'
import { Music, RotateCw, Plus, Trash2, Pencil, Download } from 'lucide-react';
import type { CancionV2 } from '../tipos';

interface Props {
  canciones: CancionV2[];
  cancionActivaId: string | null;
  cargando: boolean;
  onSeleccionar(c: CancionV2): void;
  onNueva(): void;
  onRefrescar(): void;
  onEliminar(c: CancionV2): void;
  /** Si se proveen, muestran botones de editar/descargar por fila (estudiante). */
  onEditar?(c: CancionV2): void;
  onDescargar?(c: CancionV2): void;
}

const ListaCancionesV2: React.FC<Props> = ({
  canciones, cancionActivaId, cargando, onSeleccionar, onNueva, onRefrescar, onEliminar,
  onEditar, onDescargar,
}) => {
  return (
    <div className="grabv2-lista">
      <div className="grabv2-panel-titulo">
        <span>Canciones</span>
        <span className="grabv2-panel-contador">{canciones.length}</span>
        <button className="grabv2-btn-mini" onClick={onRefrescar} title="Refrescar" disabled={cargando}>
          <RotateCw size={12} />
        </button>
      </div>

      <button className="grabv2-btn-nueva" onClick={onNueva}>
        <Plus size={14} /> Grabar canción nueva
      </button>

      <div className="grabv2-lista-items">
        {cargando && <div className="grabv2-lista-vacio">Cargando…</div>}
        {!cargando && canciones.length === 0 && (
          <div className="grabv2-lista-vacio">Aún no hay canciones. Creá la primera arriba.</div>
        )}
        {canciones.map((c) => (
          <div
            key={c.id}
            className={`grabv2-lista-item ${c.id === cancionActivaId ? 'activa' : ''}`}
            onClick={() => onSeleccionar(c)}
          >
            <Music size={13} className="grabv2-lista-icono" />
            <div className="grabv2-lista-info">
              <span className="grabv2-lista-titulo">{c.titulo || '(sin título)'}</span>
              <span className="grabv2-lista-meta">
                {c.bpm} BPM · {c.secuencia_json.length} notas · {c.secciones.length} sec.
              </span>
            </div>
            {onDescargar && (
              <button
                className="grabv2-btn-mini"
                onClick={(e) => { e.stopPropagation(); onDescargar(c); }}
                title="Descargar pista completa (MP3 mezclado)"
              >
                <Download size={11} />
              </button>
            )}
            {onEditar && (
              <button
                className="grabv2-btn-mini"
                onClick={(e) => { e.stopPropagation(); onEditar(c); }}
                title="Editar / entrar a grabar"
              >
                <Pencil size={11} />
              </button>
            )}
            <button
              className="grabv2-btn-mini grabv2-btn-del"
              onClick={(e) => { e.stopPropagation(); onEliminar(c); }}
              title="Eliminar canción"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaCancionesV2;
