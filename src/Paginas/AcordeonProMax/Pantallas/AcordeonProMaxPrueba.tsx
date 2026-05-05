import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogicaProMax } from '../Hooks/useLogicaProMax';
import { useCancionesProMax } from '../Hooks/useCancionesProMax';
import ModoMaestroSolo from '../Modos/ModoMaestroSolo';
import type { CancionHeroConTonalidad } from '../TiposProMax';
import '../Modos/_BaseSimulador.css';

/**
 * Página de prueba aislada para validar sincronización MP3↔notas. Reusa useLogicaProMax (la lógica
 * que SÍ sincroniza bien en modo maestro del simulador) y la pinta directamente con ModoMaestroSolo.
 * Sin BarraTimelineProMax, sin useEstudioAdmin, sin useEditorSecuenciaAdmin: si acá sincroniza, el
 * bug está en la integración del estudio, no en useLogicaProMax.
 */
const AcordeonProMaxPrueba: React.FC = () => {
  const navigate = useNavigate();
  const hero = useLogicaProMax();
  const { canciones, cargando, error } = useCancionesProMax();

  const reproducir = (cancion: CancionHeroConTonalidad) => {
    hero.seleccionarCancion(cancion);
    hero.setModoPractica('maestro_solo');
    // Delay corto para que los refs internos (modoPracticaRef, cancionRef) se actualicen antes
    // de que iniciarJuego los lea. Mismo patrón usado en PantallaResultados.onJugarSiguienteSeccion.
    setTimeout(() => {
      hero.iniciarJuego(cancion, true, 'maestro_solo');
    }, 50);
  };

  const volverALista = () => {
    hero.volverASeleccion();
  };

  const enJuego = hero.estadoJuego === 'jugando' || hero.estadoJuego === 'pausado';

  if (!enJuego) {
    return (
      <div style={{ padding: 24, color: '#fff', minHeight: '100vh', background: '#0a0a14', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>Prueba de sincronización — Modo Maestro</h1>
          <button
            onClick={() => navigate('/acordeon-pro-max')}
            style={{
              background: 'transparent', color: '#fff', border: '1px solid #444',
              padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}
          >Volver al menú</button>
        </div>
        <p style={{ color: '#888', marginBottom: 20, fontSize: 13, lineHeight: 1.5, maxWidth: 720 }}>
          Reusa la lógica del simulador (modo maestro) en aislamiento. Si acá las notas y el MP3 suenan
          sincronizados, confirma que el bug del estudio admin viene de la integración con BarraTimelineProMax
          o useEstudioAdmin, no de useLogicaProMax.
        </p>
        {error && <p style={{ color: '#ef4444' }}>Error: {error}</p>}
        {cargando ? (
          <p style={{ color: '#888' }}>Cargando canciones…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {canciones.map(c => (
              <button
                key={c.id}
                onClick={() => reproducir(c)}
                style={{
                  background: '#1a1a2e', color: '#fff', border: '1px solid #2a2a40',
                  padding: 14, borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.titulo || 'Sin título'}</div>
                <div style={{ fontSize: 11, color: '#888' }}>
                  BPM {c.bpm} · {c.tonalidad || 'N/A'}
                  {c.audio_fondo_url ? ' · MP3 ✓' : ' · sin MP3'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="promax-simulador-container" style={{ position: 'fixed', inset: 0, background: '#0a0a14' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 100 }}>
        <button
          onClick={volverALista}
          style={{
            background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid #444',
            padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
          }}
        >← Volver a la lista</button>
      </div>
      <ModoMaestroSolo
        estadoJuego={hero.estadoJuego}
        tickActual={hero.tickActual}
        totalTicks={hero.totalTicks}
        reproduciendo={hero.reproduciendo}
        pausado={hero.pausado}
        botonesActivosMaestro={hero.botonesActivosMaestro}
        direccionMaestro={hero.direccionMaestro}
        logica={hero.logica}
        buscarTick={hero.buscarTick}
        alternarPausa={hero.alternarPausaReproduccion}
        maestroSuena={hero.maestroSuena}
        setMaestroSuena={hero.setMaestroSuena}
        mp3Silenciado={hero.mp3Silenciado}
        setMp3Silenciado={hero.setMp3Silenciado}
        modoGuiado={hero.modoGuiado}
        setModoGuiado={hero.setModoGuiado}
        bpm={hero.bpm}
        cambiarBpm={hero.cambiarBpm}
        loopAB={hero.loopAB}
        marcarLoopInicio={hero.marcarLoopInicio}
        marcarLoopFin={hero.marcarLoopFin}
        actualizarLoopInicioTick={hero.actualizarLoopInicioTick}
        actualizarLoopFinTick={hero.actualizarLoopFinTick}
        alternarLoopAB={hero.alternarLoopAB}
        limpiarLoopAB={hero.limpiarLoopAB}
      />
    </div>
  );
};

export default AcordeonProMaxPrueba;
