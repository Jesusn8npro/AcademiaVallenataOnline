import React, { useState, useEffect } from 'react';
import { Play, Square, Search, Filter } from 'lucide-react';
import { supabase } from '../../../../servicios/clienteSupabase';
import './PanelAdminListaAcordes.css';

interface PanelListaAcordesAdminProps {
  onReproducirAcorde: (botones: string[], fuelle: string, id?: string) => void;
  onDetener: () => void;
  idSonando: string | null;
  onEditarAcorde?: (acorde: any) => void;
  tonalidadActual?: string;
}

const PanelListaAcordesAdmin: React.FC<PanelListaAcordesAdminProps> = ({
  onReproducirAcorde,
  onDetener,
  idSonando,
  onEditarAcorde,
  tonalidadActual = 'GCF'
}) => {
  const [acordes, setAcordes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [hileraFiltro, setHileraFiltro] = useState<number | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [modalidadFiltro, setModalidadFiltro] = useState<'Mayor' | 'Menor' | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarAcordes();
  }, []);

  const cargarAcordes = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('acordes_hero')
        .select('*')
        .order('orden_circulo', { ascending: true })
        .order('creado_en', { ascending: true });

      if (!error && data) setAcordes(data);
    } catch (error) {
      console.error('Error cargando acordes:', error);
    } finally {
      setCargando(false);
    }
  };

  const filtrados = acordes.filter(a => {
    const busq = busqueda.toLowerCase();
    const matchSearch =
      a.nombre.toLowerCase().includes(busq) ||
      (a.grado && a.grado.toLowerCase().includes(busq)) ||
      (a.modalidad_circulo && a.modalidad_circulo.toLowerCase().includes(busq)) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(busq));

    const matchHilera = hileraFiltro === null || a.hilera_lider === hileraFiltro;
    const matchModalidad = modalidadFiltro === null || a.modalidad_circulo === modalidadFiltro;

    let matchCategoria = true;
    if (categoriaFiltro === 'Transporte') {
      matchCategoria = a.hilera_lider === 0;
    } else if (categoriaFiltro === 'Nativo') {
      matchCategoria = a.hilera_lider > 0;
    }

    return matchSearch && matchHilera && matchCategoria && matchModalidad;
  });

  const reproducirAcorde = (acorde: any) => {
    try {
      const botones = JSON.parse(acorde.botones_presionados || '[]');
      const fuelle = acorde.fuelle || 'halar';
      onReproducirAcorde(botones, fuelle, acorde.id);
    } catch {
      console.error('Error reproduciendo acorde:', acorde.id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Buscador */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '8px', color: '#999' }} />
        <input
          type="text"
          placeholder="Buscar acorde..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 32px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '12px',
            outline: 'none'
          }}
        />
      </div>

      {/* Filtros compactos */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {/* Hilera */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Filter size={12} style={{ color: '#999' }} />
          {[null, 1, 2, 3].map(h => (
            <button
              key={h || 'all'}
              onClick={() => setHileraFiltro(h)}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                background: hileraFiltro === h ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                color: hileraFiltro === h ? '#fff' : '#999',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (hileraFiltro !== h) e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                if (hileraFiltro !== h) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
            >
              {h === null ? 'T' : h}
            </button>
          ))}
        </div>

        {/* Categoría */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[null, 'Nativo', 'Transporte'].map(c => (
            <button
              key={c || 'all'}
              onClick={() => setCategoriaFiltro(c)}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                background: categoriaFiltro === c ? '#a855f7' : 'rgba(255,255,255,0.08)',
                color: categoriaFiltro === c ? '#fff' : '#999',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (categoriaFiltro !== c) e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                if (categoriaFiltro !== c) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
            >
              {c === null ? 'C' : c.charAt(0)}
            </button>
          ))}
        </div>

        {/* Modalidad */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[null, 'Mayor', 'Menor'].map(m => (
            <button
              key={m || 'all'}
              onClick={() => setModalidadFiltro(m as any)}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                background: modalidadFiltro === m ? (m === 'Mayor' ? '#3b82f6' : '#a855f7') : 'rgba(255,255,255,0.08)',
                color: modalidadFiltro === m ? '#fff' : '#999',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (modalidadFiltro !== m) e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                if (modalidadFiltro !== m) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
            >
              {m === null ? 'M' : m.charAt(0)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de acordes */}
      <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Cargando acordes...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px', fontSize: '12px' }}>Sin resultados</div>
        ) : (
          filtrados.map(acorde => (
            <div
              key={acorde.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: idSonando === acorde.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (idSonando !== acorde.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (idSonando !== acorde.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
            >
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {acorde.nombre}
                </div>
                <div style={{ fontSize: '9px', color: '#999' }}>
                  {acorde.grado} • {acorde.modalidad_circulo || 'Mayor'}
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {idSonando === acorde.id ? (
                  <button
                    onClick={onDetener}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '5px',
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '10px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
                  >
                    <Square size={13} fill="white" />
                  </button>
                ) : (
                  <button
                    onClick={() => reproducirAcorde(acorde)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '5px',
                      border: 'none',
                      background: '#3b82f6',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '10px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}
                  >
                    <Play size={13} fill="white" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PanelListaAcordesAdmin;
