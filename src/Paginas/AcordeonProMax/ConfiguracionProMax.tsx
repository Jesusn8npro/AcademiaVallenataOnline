import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Palette,
  Gamepad2,
  LogOut,
  Check,
  AlertCircle,
  Chrome,
  Facebook,
  Mail as MailIcon,
  ChevronRight,
  UserCircle,
  FileText,
  Layout,
  GraduationCap,
  Trophy,
  History,
  Lock
} from 'lucide-react';
import { supabase } from '../../servicios/clienteSupabase';
import { useUsuario } from '../../contextos/UsuarioContext';
import { usePerfilStore } from '../../stores/perfilStore';
import NavbarProMax from './Componentes/NavbarProMax';
import './ConfiguracionProMax.css';

/**
 * ⚙️ CONFIGURACIÓN PRO MAX
 * Réplica premium y FUNCIONAL de la página de cuenta/ajustes.
 * Incluye estadísticas en tiempo real y edición de información personal.
 */
const ConfiguracionProMax: React.FC = () => {
    const { usuario, estaAutenticado } = useUsuario();
    const { perfil, stats, actualizarPerfil, cargarDatosPerfil } = usePerfilStore();
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

    // Campos del formulario alineados con 'perfiles' table
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        nombre_usuario: '',
        biografia: '',
        url_foto_perfil: '',
        whatsapp: '',
        ciudad: ''
    });

    // 🔄 Efecto para cargar datos reales al montar el componente
    useEffect(() => {
        if (estaAutenticado) {
            cargarDatosPerfil(true);
        }
    }, [estaAutenticado]);

    // 📋 Sincronizar formulario con datos del perfil una vez cargados
    useEffect(() => {
        if (perfil) {
            setForm({
                nombre: perfil.nombre || '',
                apellido: perfil.apellido || '',
                nombre_usuario: perfil.nombre_usuario || '',
                biografia: perfil.biografia || '',
                url_foto_perfil: perfil.url_foto_perfil || '',
                whatsapp: perfil.whatsapp || '',
                ciudad: perfil.ciudad || perfil.pais || ''
            });
        }
    }, [perfil]);

    const handleLogin = async (provider: 'google' | 'facebook' | 'email') => {
        if (provider === 'email') {
            window.location.href = '/mi-perfil'; 
            return;
        }
        await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/acordeon-pro-max/configuracion' } });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleSave = async () => {
        if (!usuario || !perfil) return;
        setCargando(true);
        setMensaje(null);
        try {
            // Construir nombre completo
            const nombreCompleto = `${form.nombre} ${form.apellido}`.trim();
            
            // Objeto de actualización compatible con la tabla 'perfiles'
            const updates = { 
                ...form,
                nombre_completo: nombreCompleto,
                fecha_actualizacion: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('perfiles')
                .update(updates)
                .eq('id', usuario.id);

            if (error) throw error;
            
            // Actualizar el store global para que el Navbar y otros componentes se refresquen
            actualizarPerfil(updates as any);
            
            setMensaje({ tipo: 'exito', texto: '¡Información actualizada con éxito!' });
            setTimeout(() => setMensaje(null), 3000);
        } catch (err: any) {
            console.error('Error al guardar perfil:', err);
            setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar los cambios' });
        } finally {
            setCargando(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="promax-config-wrapper">
            {/* 🎬 FONDO DINÁMICO */}
            <div className="promax-space-bg">
                <video src="/videos/fondo_blue_paint.mp4" autoPlay loop muted playsInline />
                <div className="promax-bg-overlay" />
            </div>

            <NavbarProMax />

            <main className="promax-config-content">
                <AnimatePresence mode="wait">
                    {!estaAutenticado ? (
                        <motion.div 
                            key="auth-prompt"
                            className="auth-prompt-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <div className="auth-logo-area">
                                <h1>Configuración de Cuenta</h1>
                                <h3>Inicia sesión o Regístrate ahora</h3>
                                <p>Para obtener la experiencia completa y guardar tu progreso.</p>
                            </div>

                            <div className="auth-buttons-grid">
                                <button className="auth-btn google" onClick={() => handleLogin('google')}>
                                    <Chrome size={20} /> Entrar con Google
                                </button>
                                <button className="auth-btn facebook" onClick={() => handleLogin('facebook')}>
                                    <Facebook size={20} /> Entrar con Facebook
                                </button>
                                <button className="auth-btn email" onClick={() => handleLogin('email')}>
                                    <MailIcon size={20} /> Entrar con Email
                                </button>
                            </div>

                            <div className="auth-footer-links">
                                <span>Términos de Servicio</span>
                                <span className="dot">•</span>
                                <span>Privacidad</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="settings-panel"
                            className="settings-panel-container"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {/* User Header Card */}
                            <div className="settings-header-card glass-morphism">
                                <div className="user-profile-summary">
                                    <div className="user-avatar-wrapper">
                                        {form.url_foto_perfil ? (
                                            <img src={form.url_foto_perfil} alt="Avatar" />
                                        ) : (
                                            <UserCircle size={80} strokeWidth={0.5} />
                                        )}
                                    </div>
                                    <div className="user-info-text">
                                        <h2>{perfil?.nombre_completo || 'Usuario Academia'}</h2>
                                        <div className="user-status-badges">
                                            <span className={`badge-promax ${perfil?.rol === 'profesor' ? 'admin' : 'scholar'}`}>
                                                {perfil?.rol || 'Estudiante'}
                                            </span>
                                            <span className={`badge-promax ${perfil?.suscripcion === 'premium' ? 'premium' : 'free'}`}>
                                                Membresía {perfil?.suscripcion || 'Free'}
                                            </span>
                                        </div>
                                        <div className="user-level-row">
                                            <span className="level-tag">Nivel {perfil?.nivel_usuario || 1}</span>
                                            <div className="exp-bar-base">
                                                <div 
                                                    className="exp-bar-fill" 
                                                    style={{ width: `${(perfil?.experiencia_total ? (perfil.experiencia_total % 1000) / 10 : 15)}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-logout-promax" onClick={handleLogout}>
                                    <LogOut size={20} /> Salir
                                </button>
                            </div>

                            {/* Settings Grid */}
                            <div className="settings-grid">
                                {/* Profile Settings */}
                                <section className="settings-section">
                                    <div className="section-title">
                                        <User size={20} /> Información Personal
                                    </div>
                                    <div className="section-form">
                                        <div className="form-group">
                                            <label>Nombre</label>
                                            <input 
                                                name="nombre"
                                                value={form.nombre} 
                                                onChange={handleChange} 
                                                placeholder="Tu primer nombre"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Apellido</label>
                                            <input 
                                                name="apellido"
                                                value={form.apellido} 
                                                onChange={handleChange} 
                                                placeholder="Tu(s) apellido(s)"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Nombre de Usuario</label>
                                            <input 
                                                name="nombre_usuario"
                                                value={form.nombre_usuario} 
                                                onChange={handleChange} 
                                                placeholder="@usuario"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Correo Electrónico</label>
                                            <input value={usuario?.email || ''} disabled className="disabled-field" />
                                        </div>
                                        <div className="form-group">
                                            <label>Biografía</label>
                                            <textarea 
                                                name="biografia"
                                                value={form.biografia} 
                                                onChange={handleChange} 
                                                rows={3}
                                                placeholder="Cuéntanos un poco sobre ti..."
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Extra Settings */}
                                <section className="settings-section">
                                    <div className="section-title">
                                        <Shield size={20} /> Seguridad y Contacto
                                    </div>
                                    <div className="section-form">
                                        <div className="form-group">
                                            <label>WhatsApp / Contacto</label>
                                            <input 
                                                name="whatsapp"
                                                value={form.whatsapp} 
                                                onChange={handleChange} 
                                                placeholder="+57..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Ciudad</label>
                                            <input 
                                                name="ciudad"
                                                value={form.ciudad} 
                                                onChange={handleChange} 
                                                placeholder="Tu ubicación"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>URL Imagen de Perfil</label>
                                            <input 
                                                name="url_foto_perfil"
                                                value={form.url_foto_perfil} 
                                                onChange={handleChange} 
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Acciones de Seguridad</label>
                                            <button className="auth-btn email" style={{ width: '100%', fontSize: '0.9rem' }}>
                                                <Lock size={16} /> Cambiar Contraseña
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Floating Save Bar */}
                            <div className="settings-action-bar">
                                <div className="save-bar-left">
                                    {mensaje ? (
                                        <div className={`status-pill ${mensaje.tipo}`}>
                                            {mensaje.tipo === 'exito' ? <Check size={16} /> : <AlertCircle size={16} />}
                                            {mensaje.texto}
                                        </div>
                                    ) : (
                                        <div className="save-hint">Modifica tus datos y mantén tu perfil al día.</div>
                                    )}
                                </div>
                                <button 
                                    className={`btn-save-promax ${cargando ? 'loading' : ''}`}
                                    onClick={handleSave}
                                    disabled={cargando}
                                >
                                    {cargando ? 'Guardando...' : (<><ChevronRight size={18} /> Guardar Cambios</>)}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 🛡️ APP INFO FOOTER */}
                <footer className="promax-config-footer">
                    <p>App version: v2.4.0-promax · Build: {new Date().getTime().toString(16)}</p>
                    <p>Academia Vallenata Online — Módulo de Simulación Premium</p>
                </footer>
            </main>
        </div>
    );
};

export default ConfiguracionProMax;
