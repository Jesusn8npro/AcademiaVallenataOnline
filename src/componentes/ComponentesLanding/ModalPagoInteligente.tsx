import React, { useState } from 'react'
import './ModalPagoInteligente.css'

interface Props {
  mostrar: boolean
  contenido: any
  tipoContenido: 'curso' | 'tutorial' | 'paquete' | 'membresia'
  onCerrar: () => void
}

const ModalPagoInteligente: React.FC<Props> = ({ mostrar, contenido, tipoContenido, onCerrar }) => {
  const [pasoActual, setPasoActual] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [procesandoPago, setProcesandoPago] = useState(false)
  const [error, setError] = useState('')
  const [pagoExitoso, setPagoExitoso] = useState(false)
  const [usuarioEstaRegistrado, setUsuarioEstaRegistrado] = useState(false)

  const [datosPago, setDatosPago] = useState({
    nombre: '', apellido: '', email: '', telefono: '', whatsapp: '', tipo_documento: 'CC', numero_documento: '', direccion: '', ciudad: '', pais: 'Colombia', codigo_postal: '', password: '', confirmarPassword: ''
  })

  const [erroresValidacion, setErroresValidacion] = useState({ email: '', telefono: '', documento: '', password: '' })

  const precioFinal = contenido?.precio_rebajado || contenido?.precio_normal || 0
  const esGratis = precioFinal === 0
  const hayDescuento = contenido?.precio_rebajado && contenido?.precio_rebajado < contenido?.precio_normal

  const formatearPrecio = (precio: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio)

  const cerrarModal = () => { onCerrar(); setPasoActual(1); setError(''); setCargando(false); setProcesandoPago(false); setPagoExitoso(false); setUsuarioEstaRegistrado(false); setErroresValidacion({ email: '', telefono: '', documento: '', password: '' }) }

  const validarEmail = (email: string) => { const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; if (!email) { setErroresValidacion(p => ({ ...p, email: 'El email es requerido' })); return false } if (!emailRegex.test(email)) { setErroresValidacion(p => ({ ...p, email: 'Email inválido' })); return false } setErroresValidacion(p => ({ ...p, email: '' })); return true }
  const validarTelefono = (telefono: string) => { const t = telefono.replace(/[\s\-\(\)]/g, ''); if (!telefono) { setErroresValidacion(p => ({ ...p, telefono: 'El teléfono es requerido' })); return false } if (!/^\d{7,15}$/.test(t)) { setErroresValidacion(p => ({ ...p, telefono: 'Teléfono inválido (7-15 dígitos)' })); return false } setErroresValidacion(p => ({ ...p, telefono: '' })); return true }
  const validarDocumento = (doc: string) => { if (!doc) { setErroresValidacion(p => ({ ...p, documento: 'El documento es requerido' })); return false } if (!/^\d{6,15}$/.test(doc)) { setErroresValidacion(p => ({ ...p, documento: 'Documento inválido' })); return false } setErroresValidacion(p => ({ ...p, documento: '' })); return true }
  const validarPassword = (pwd: string) => { if (!usuarioEstaRegistrado) { if (!pwd) { setErroresValidacion(p => ({ ...p, password: 'La contraseña es requerida' })); return false } if (pwd.length < 6) { setErroresValidacion(p => ({ ...p, password: 'Mínimo 6 caracteres' })); return false } if (pwd !== datosPago.confirmarPassword) { setErroresValidacion(p => ({ ...p, password: 'Las contraseñas no coinciden' })); return false } } setErroresValidacion(p => ({ ...p, password: '' })); return true }

  const handleInputChange = (field: string, value: string) => { setDatosPago(prev => ({ ...prev, [field]: value })); if (field === 'email') validarEmail(value); if (field === 'telefono') validarTelefono(value); if (field === 'numero_documento') validarDocumento(value); if (field === 'password' || field === 'confirmarPassword') validarPassword(field === 'password' ? value : datosPago.password) }

  const procesarInscripcionGratuita = async () => { try { setCargando(true); setError(''); if (!datosPago.nombre || !datosPago.email || !datosPago.telefono) { setError('Por favor, completa todos los campos requeridos'); return } await new Promise(r => setTimeout(r, 2000)); setPagoExitoso(true); setPasoActual(3); setTimeout(() => { cerrarModal(); window.location.reload() }, 3000) } catch { setError('Error al procesar la inscripción. Inténtalo de nuevo.') } finally { setCargando(false) } }
  const procesarPago = async () => { try { setProcesandoPago(true); setError(''); if (!datosPago.nombre || !datosPago.email || !datosPago.telefono || !datosPago.numero_documento) { setError('Por favor, completa todos los campos requeridos'); return } await new Promise(r => setTimeout(r, 3000)); setPagoExitoso(true); setPasoActual(3); setTimeout(() => { cerrarModal(); window.location.reload() }, 3000) } catch { setError('Error al procesar el pago. Inténtalo de nuevo.') } finally { setProcesandoPago(false) } }
  const continuarAlSiguientePaso = () => { if (esGratis) procesarInscripcionGratuita(); else setPasoActual(2) }

  if (!mostrar) return null

  return (
    <div className="modal-overlay" onClick={cerrarModal}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-titulo">{pasoActual === 1 ? (usuarioEstaRegistrado ? 'Confirmar Compra' : 'Completar Compra') : 'Datos de Facturación'}</h2>
          <button className="btn-cerrar" onClick={cerrarModal}>✕</button>
        </div>
        <div className="modal-contenido">
          <div className="producto-info">
            <div className="producto-imagen">{contenido?.imagen_portada ? (<img src={contenido.imagen_portada} alt={contenido.titulo} />) : (<div className="placeholder-imagen">📚</div>)}</div>
            <div className="producto-detalles">
              <h3 className="producto-titulo">{contenido?.titulo}</h3>
              <p className="producto-tipo">{tipoContenido.charAt(0).toUpperCase() + tipoContenido.slice(1)}</p>
              <div className="producto-precio">{esGratis ? (<span className="precio-gratis">¡GRATIS!</span>) : (<>{hayDescuento && (<span className="precio-original">{formatearPrecio(contenido.precio_normal)}</span>)}<span className="precio-final">{formatearPrecio(precioFinal)}</span></>)}</div>
            </div>
          </div>

          <div className="pasos-indicador">
            <div className={`paso ${pasoActual >= 1 ? 'activo' : ''}`}><span className="paso-numero">1</span><span className="paso-texto">Datos</span></div>
            {!esGratis && (<div className={`paso ${pasoActual >= 2 ? 'activo' : ''}`}><span className="paso-numero">2</span><span className="paso-texto">Pago</span></div>)}
            <div className={`paso ${pasoActual >= 3 ? 'activo' : ''}`}><span className="paso-numero">{esGratis ? '2' : '3'}</span><span className="paso-texto">Confirmación</span></div>
          </div>

          {error && (<div className="error-mensaje"><span className="error-icono">⚠️</span>{error}</div>)}

          {pasoActual === 1 && (
            <div className="paso-contenido">
              <div className="formulario-grid" style={{gridTemplateColumns:'1fr'}}>
                <div className="campo-grupo">
                  <div className="error-mensaje" style={{background:'rgba(59,130,246,0.15)',borderColor:'#3b82f6',color:'#bfdbfe'}}>
                    <span className="error-icono">🆕</span>
                    <div>
                      <div style={{fontWeight:700}}>Crear tu cuenta es fácil y rápido</div>
                      <div style={{fontSize:'0.8rem'}}>Completa tus datos y tendrás acceso inmediato</div>
                    </div>
                  </div>
                  <p style={{color:'#9ca3af',fontSize:'0.8rem'}}>Al completar tu compra, crearemos automáticamente tu cuenta con acceso completo a la plataforma.</p>
                </div>
              </div>
              <div className="formulario-grid">
                <div className="campo-grupo"><label className="campo-label">Nombre *</label><input type="text" className="campo-input" value={datosPago.nombre} onChange={e => handleInputChange('nombre', e.target.value)} placeholder="Tu nombre" /></div>
                <div className="campo-grupo"><label className="campo-label">Apellido</label><input type="text" className="campo-input" value={datosPago.apellido} onChange={e => handleInputChange('apellido', e.target.value)} placeholder="Tu apellido" /></div>
                <div className="campo-grupo"><label className="campo-label">Email *</label><input type="email" className={`campo-input ${erroresValidacion.email ? 'error' : ''}`} value={datosPago.email} onChange={e => handleInputChange('email', e.target.value)} placeholder="tu@email.com" />{erroresValidacion.email && (<span className="campo-error">{erroresValidacion.email}</span>)}</div>
                <div className="campo-grupo"><label className="campo-label">Teléfono *</label><input type="tel" className={`campo-input ${erroresValidacion.telefono ? 'error' : ''}`} value={datosPago.telefono} onChange={e => handleInputChange('telefono', e.target.value)} placeholder="3001234567" />{erroresValidacion.telefono && (<span className="campo-error">{erroresValidacion.telefono}</span>)}</div>
                <div className="campo-grupo"><label className="campo-label">Tipo de Documento *</label><select className="campo-input" value={datosPago.tipo_documento} onChange={e => handleInputChange('tipo_documento', e.target.value)}><option value="CC">Cédula de Ciudadanía</option><option value="CE">Cédula de Extranjería</option><option value="NIT">NIT</option><option value="Pasaporte">Pasaporte</option></select></div>
                <div className="campo-grupo"><label className="campo-label">Número de Documento *</label><input type="text" className={`campo-input ${erroresValidacion.documento ? 'error' : ''}`} value={datosPago.numero_documento} onChange={e => handleInputChange('numero_documento', e.target.value)} placeholder="12345678" />{erroresValidacion.documento && (<span className="campo-error">{erroresValidacion.documento}</span>)}</div>
                {!usuarioEstaRegistrado && (<><div className="campo-grupo"><label className="campo-label">Contraseña *</label><input type="password" className={`campo-input ${erroresValidacion.password ? 'error' : ''}`} value={datosPago.password} onChange={e => handleInputChange('password', e.target.value)} placeholder="Mínimo 6 caracteres" /></div><div className="campo-grupo"><label className="campo-label">Confirmar Contraseña *</label><input type="password" className={`campo-input ${erroresValidacion.password ? 'error' : ''}`} value={datosPago.confirmarPassword} onChange={e => handleInputChange('confirmarPassword', e.target.value)} placeholder="Repite tu contraseña" />{erroresValidacion.password && (<span className="campo-error">{erroresValidacion.password}</span>)}</div></>)}
              </div>
              <button className="btn-continuar" onClick={continuarAlSiguientePaso} disabled={cargando}>{cargando ? (<><span className="spinner"></span>Procesando...</>) : (esGratis ? '🎉 ¡Inscribirme Gratis!' : 'Continuar al Pago 💳')}</button>
            </div>
          )}

          {pasoActual === 2 && !esGratis && (
            <div className="paso-contenido">
              <h3 className="paso-titulo">💳 Método de Pago</h3>
              <div className="resumen-pago"><div className="resumen-item"><span>Subtotal:</span><span>{formatearPrecio(precioFinal)}</span></div><div className="resumen-item total"><span>Total a Pagar:</span><span>{formatearPrecio(precioFinal)}</span></div></div>
              <div className="metodos-pago"><div className="metodo-pago activo"><div className="metodo-icono">💳</div><div className="metodo-info"><h4>Tarjeta de Crédito/Débito</h4><p>Pago seguro con ePayco</p></div></div></div>
              <button className="btn-pagar" onClick={procesarPago} disabled={procesandoPago}>{procesandoPago ? (<><span className="spinner"></span>Procesando Pago...</>) : (`💳 Pagar ${formatearPrecio(precioFinal)}`)}</button>
            </div>
          )}

          {pasoActual === 3 && pagoExitoso && (
            <div className="paso-contenido confirmacion"><div className="confirmacion-icono">✅</div><h3 className="confirmacion-titulo">{esGratis ? '¡Inscripción Exitosa!' : '¡Pago Exitoso!'}</h3><p className="confirmacion-mensaje">{esGratis ? 'Te has inscrito exitosamente. Ya puedes acceder al contenido.' : 'Tu pago ha sido procesado correctamente. Ya tienes acceso al contenido.'}</p><div className="confirmacion-loading"><span className="spinner"></span><span>Redirigiendo...</span></div></div>
          )}
        </div>
        {/* Footer con acciones como en Svelte */}
        {(pasoActual === 1 || pasoActual === 2) && (
          <div style={{background:'rgba(55,65,81,0.5)',padding:'1rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid #374151',borderBottomLeftRadius:'20px',borderBottomRightRadius:'20px'}}>
            {pasoActual === 2 ? (
              <button onClick={()=> setPasoActual(1)} className="btn-cerrar" style={{color:'#e5e7eb'}}>← Atrás</button>
            ) : (<div />)}
            <button onClick={()=> procesarPago()} disabled={cargando || procesandoPago || !contenido} className="btn-pagar" style={{width:'auto'}}>
              {cargando || procesandoPago ? (<><span className="spinner"></span> Procesando...</>) : (`💳 Pagar ${formatearPrecio(precioFinal)}`)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModalPagoInteligente

