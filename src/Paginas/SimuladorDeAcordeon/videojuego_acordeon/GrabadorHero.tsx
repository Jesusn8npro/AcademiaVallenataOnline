import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import type { NotaHero, CancionHero, DireccionFuelle } from './tipos_Hero';

/**
 * COMPONENTE: GRABADOR ACORDEÓN HERO
 * Este componente permite al usuario grabar sus pases de acordeón,
 * sincronizarlos con una pista de fondo y subirlos a Supabase.
 */

const GrabadorHero: React.FC = () => {
    // ESTADO DEL SISTEMA
    const [grabando, setGrabando] = useState(false);
    const [pausado, setPausado] = useState(false);
    const [tiempoInicio, setTiempoInicio] = useState<number | null>(null);
    const [secuencia, setSecuencia] = useState<NotaHero[]>([]);
    
    // CONFIGURACIÓN DE LA CANCIÓN
    const [titulo, setTitulo] = useState('Mi Pase Nuevo');
    const [bpm, setBpm] = useState(120);
    const [fuelleActual, setFuelleActual] = useState<DireccionFuelle>('abriendo');
    
    // REFS PARA CONTROL DE TIEMPO PRECISO
    const notasAbiertas = useRef<Map<string, number>>(new Map()); // botonId -> startTick

    // --- LÓGICA DE TIEMPO (TICKS) ---
    // Calculamos el tick actual basado en el tiempo transcurrido y el BPM
    const obtenerTickActual = () => {
        if (!tiempoInicio) return 0;
        const msTranscurridos = Date.now() - tiempoInicio;
        const segundos = msTranscurridos / 1000;
        const pulsos = segundos * (bpm / 60);
        const resolucion = 192; // Ticks por pulso
        return Math.floor(pulsos * resolucion);
    };

    // --- MANEJO DE TECLAS (SIMULACIÓN O REAL) ---
    const presionarNota = (botonId: string) => {
        if (!grabando || pausado) return;
        if (notasAbiertas.current.has(botonId)) return; // Evitar repetición si ya está hundido
        
        const tick = obtenerTickActual();
        notasAbiertas.current.set(botonId, tick);
        console.log(`Nota iniciada: ${botonId} en tick ${tick}`);
    };

    const soltarNota = (botonId: string) => {
        if (!grabando || pausado) return;
        const inicioTick = notasAbiertas.current.get(botonId);
        
        if (inicioTick !== undefined) {
            const finalTick = obtenerTickActual();
            const duracion = finalTick - inicioTick;
            
            const nuevaNota: NotaHero = {
              tick: inicioTick,
              botonId,
              duracion,
              fuelle: fuelleActual
            };

            setSecuencia(prev => [...prev, nuevaNota]);
            notasAbiertas.current.delete(botonId);
            console.log(`Nota terminada: ${botonId}, duración: ${duracion}`);
        }
    };

    // --- CONTROLES DE GRABACIÓN ---
    const iniciarGrabacion = () => {
        setSecuencia([]);
        setTiempoInicio(Date.now());
        setGrabando(true);
        setPausado(false);
        console.log("Grabación iniciada...");
    };

    const detenerGrabacion = () => {
        setGrabando(false);
        setTiempoInicio(null);
        console.log("Grabación detenida. Total notas:", secuencia.length);
    };

    const guardarEnSupabase = async () => {
        if (secuencia.length === 0) {
            alert("No hay notas grabadas para guardar.");
            return;
        }

        const nuevaCancion: any = {
            titulo,
            autor: 'Jesus Gonzalez', // Podrías sacar esto del perfil del usuario
            bpm,
            resolucion: 192,
            secuencia_json: secuencia,
            dificultad: 'basico'
        };

        const { data, error } = await (supabase.from('canciones_hero' as any).insert([nuevaCancion] as any) as any);

        if (error) {
            console.error("Error guardando:", error);
            alert("Error al guardar en la nube.");
        } else {
            console.log("¡Guardado con éxito!", data);
            alert("¡Canción guardada correctamente en Acordeón Hero!");
        }
    };

    return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#1a1a1a', borderRadius: '15px' }}>
            <h1 style={{ color: '#00d2ff' }}>Studio Acordeón Hero 🎹🎸</h1>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                <input 
                    type="text" 
                    value={titulo} 
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Nombre del Pase"
                    style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <label>BPM:</label>
                    <input 
                        type="number" 
                        value={bpm} 
                        onChange={(e) => setBpm(Number(e.target.value))}
                        style={{ width: '60px', padding: '10px', borderRadius: '5px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                {!grabando ? (
                    <button onClick={iniciarGrabacion} style={btnStyle('#28a745')}>⏺️ Iniciar Grabación</button>
                ) : (
                    <button onClick={detenerGrabacion} style={btnStyle('#dc3545')}>⏹️ Detener</button>
                )}
                <button onClick={guardarEnSupabase} style={btnStyle('#007bff')} disabled={grabando || secuencia.length === 0}>
                    ☁️ Guardar en Supabase
                </button>
            </div>

            {/* CONTROL DE FUELLE */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Dirección del Fuelle: <span style={{ color: fuelleActual === 'abriendo' ? '#00d2ff' : '#ff4b2b' }}>
                    {fuelleActual.toUpperCase()}
                </span></h3>
                <button onClick={() => setFuelleActual('abriendo')} style={toggleBtn(fuelleActual === 'abriendo', '#00d2ff')}>ABRIENDO (Halar)</button>
                <button onClick={() => setFuelleActual('cerrando')} style={toggleBtn(fuelleActual === 'cerrando', '#ff4b2b')}>CERRANDO (Empujar)</button>
            </div>

            {/* VISUALIZADOR SIMPLE DE NOTAS */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                <h4>Notas Grabadas: {secuencia.length}</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '12px', color: '#888' }}>
                    {secuencia.map((n, i) => (
                        <div key={i}>Tick: {n.tick} | Botón: {n.botonId} | Dur: {n.duracion} | {n.fuelle}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- ESTILOS RÁPIDOS ---
const btnStyle = (color: string) => ({
    padding: '12px 20px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold' as 'bold'
});

const toggleBtn = (activo: boolean, color: string) => ({
    padding: '8px 15px',
    backgroundColor: activo ? color : '#333',
    color: 'white',
    border: 'none',
    marginRight: '10px',
    borderRadius: '5px',
    cursor: 'pointer'
});

export default GrabadorHero;
