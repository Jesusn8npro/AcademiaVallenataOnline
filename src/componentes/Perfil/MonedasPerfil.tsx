import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../servicios/clienteSupabase';
import './MonedasPerfil.css';

interface Props {
  usuarioId: string;
}

interface Transaccion {
  id: string;
  monto: number;
  razon: string;
  referencia_id: string;
  created_at: string;
}

const VALOR_MONEDA_COP = 100;

export default function MonedasPerfil({ usuarioId }: Props) {
  const [saldo, setSaldo] = useState<number>(0);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalCanje, setModalCanje] = useState(false);
  const [modalInfo, setModalInfo] = useState(false);

  useEffect(() => {
    let channelUsuario: any;
    let channelTransacciones: any;

    const cargarDatos = async () => {
      setCargando(true);
      
      // 1. Obtener saldo
      const { data: saldoData } = await supabase
        .from('monedas_usuario')
        .select('saldo')
        .eq('usuario_id', usuarioId)
        .single();
        
      if (saldoData) setSaldo((saldoData as any).saldo);

      // 2. Obtener historial
      const { data: txData } = await supabase
        .from('monedas_transacciones')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (txData) setTransacciones(txData as any);
      
      setCargando(false);

      // 3. Suscribirse a cambios de saldo
      channelUsuario = supabase.channel('cambios-monedas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'monedas_usuario', filter: `usuario_id=eq.${usuarioId}` }, (payload) => {
          const newState = payload.new as any;
          if (newState && newState.saldo !== undefined) {
            setSaldo(newState.saldo);
          }
        })
        .subscribe();

      // 4. Suscribirse a nuevas transacciones
      channelTransacciones = supabase.channel('cambios-tx-monedas')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'monedas_transacciones', filter: `usuario_id=eq.${usuarioId}` }, (payload) => {
          if (payload.new) {
            setTransacciones(prev => [payload.new as Transaccion, ...prev].slice(0, 10));
          }
        })
        .subscribe();
    };

    if (usuarioId) {
      cargarDatos();
    }

    return () => {
      if (channelUsuario) supabase.removeChannel(channelUsuario);
      if (channelTransacciones) supabase.removeChannel(channelTransacciones);
    };
  }, [usuarioId]);

  const dineroCop = saldo * VALOR_MONEDA_COP;

  if (cargando) {
    return (
      <div className="monedas-perfil-card">
        <div className="monedas-loading">Cargando billetera...</div>
      </div>
    );
  }

  return (
    <div className="monedas-perfil-card">
      <div className="monedas-header">
        <h3>Billetera Pro Max</h3>
        <div className="monedas-header-botones">
          <button className="monedas-btn-info" onClick={() => setModalInfo(true)}>
            ℹ️ ¿Cómo ganar monedas?
          </button>
          <button className="monedas-btn-canjear" onClick={() => setModalCanje(true)}>
            Canjear Monedas
          </button>
        </div>
      </div>

      <div className="monedas-saldo-container">
        <div className="monedas-icono-grande">🪙</div>
        <div className="monedas-saldo-info">
          <span className="monedas-saldo-numero">{saldo.toLocaleString('es-CO')}</span>
          <span className="monedas-saldo-label">Monedas Disponibles</span>
        </div>
        <div className="monedas-saldo-conversor">
          <span className="monedas-cop-label">Equivalente a:</span>
          <span className="monedas-cop-valor">${dineroCop.toLocaleString('es-CO')} COP</span>
        </div>
      </div>

      <div className="monedas-historial">
        <h4>Últimos Movimientos</h4>
        {transacciones.length === 0 ? (
          <p className="monedas-historial-vacio">Aún no tienes movimientos de monedas.</p>
        ) : (
          <ul className="monedas-lista-tx">
            {transacciones.map(tx => (
              <li key={tx.id} className="monedas-tx-item">
                <div className="monedas-tx-info">
                  <span className="monedas-tx-razon">{tx.razon}</span>
                  <span className="monedas-tx-fecha">
                    {new Date(tx.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`monedas-tx-monto ${tx.monto >= 0 ? 'positivo' : 'negativo'}`}>
                  {tx.monto > 0 ? '+' : ''}{tx.monto} 🪙
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalCanje && createPortal(
        <div className="monedas-modal-backdrop" onClick={() => setModalCanje(false)}>
          <div className="monedas-modal-content" onClick={e => e.stopPropagation()}>
            <div className="monedas-modal-header">
              <h3>Canjear Monedas</h3>
              <button className="monedas-modal-close" onClick={() => setModalCanje(false)}>✕</button>
            </div>
            <div className="monedas-modal-body">
              <p>Tienes <strong>{saldo} monedas</strong> (${dineroCop.toLocaleString('es-CO')} COP).</p>
              <p className="monedas-modal-instruccion">
                Las monedas virtuales se pueden utilizar para adquirir tutoriales premium, skins exclusivos para tu acordeón en el simulador, o desbloquear validaciones con profesores.
              </p>
              
              <div className="monedas-prox-features">
                <div className="monedas-feature-item">
                  <span className="feature-icon">🎓</span>
                  <div className="feature-text">
                    <strong>Validar tarea con profesor</strong>
                    <p>Próximamente</p>
                  </div>
                  <span className="feature-costo">150 🪙</span>
                </div>
                <div className="monedas-feature-item">
                  <span className="feature-icon">✨</span>
                  <div className="feature-text">
                    <strong>Acordeón Cinco Letras Pro (Skin)</strong>
                    <p>Efectos visuales premium</p>
                  </div>
                  <span className="feature-costo">500 🪙</span>
                </div>
              </div>

              <div className="monedas-modal-footer">
                <button className="monedas-btn-secundario" onClick={() => setModalCanje(false)}>Cerrar</button>
                <button className="monedas-btn-canjear">Ir a la Tienda</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {modalInfo && createPortal(
        <div className="monedas-modal-backdrop" onClick={() => setModalInfo(false)}>
          <div className="monedas-modal-content info-content" onClick={e => e.stopPropagation()}>
            <div className="monedas-modal-header">
              <h3>¿Cómo funciona la economía?</h3>
              <button className="monedas-modal-close" onClick={() => setModalInfo(false)}>✕</button>
            </div>
            <div className="monedas-modal-body">
              <p className="monedas-modal-instruccion">
                Las monedas son tu dinero virtual en <strong>Acordeón Pro Max</strong>. Equivalen a dinero real de la academia (1 🪙 = $100 COP) y se ganan por tu constancia y excelente ejecución musical.
              </p>

              <h4>Gana monedas tocando el acordeón:</h4>
              <ul className="monedas-reglas-lista">
                <li><span className="regla-premio">+3 🪙</span> <span>Precisión del 95-100% en modo competencia (max 1 por día por canción).</span></li>
                <li><span className="regla-premio">+10 🪙</span> <span>Dominar una canción (llegar a 100 XP acumulados en la barra).</span></li>
                <li><span className="regla-premio">+15 🪙</span> <span>Mantener una racha de práctica de 7 días seguidos.</span></li>
                <li><span className="regla-premio">+80 🪙</span> <span>Completar un curso completo.</span></li>
              </ul>

              <h4>Gana monedas en Comunidad y Validación:</h4>
              <ul className="monedas-reglas-lista">
                <li><span className="regla-premio">+2 🪙</span> <span>Compartir tu grabación en la comunidad de alumnos.</span></li>
                <li><span className="regla-premio">+0.1 🪙</span> <span>Recibir un 'Like' en una de tus publicaciones.</span></li>
                <li><span className="regla-premio">+5 🪙</span> <span>Subir un video evaluativo (Fase 1).</span></li>
                <li><span className="regla-premio">+5 🪙</span> <span>El profesor aprueba tu video (Fase 2).</span></li>
              </ul>
              
              <div className="monedas-modal-footer">
                <button className="monedas-btn-secundario" onClick={() => setModalInfo(false)}>¡Entendido!</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
