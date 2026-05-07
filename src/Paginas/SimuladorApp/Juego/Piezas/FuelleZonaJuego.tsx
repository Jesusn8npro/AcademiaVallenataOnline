import React, { useRef } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';

interface FuelleZonaJuegoProps {
    pausado: boolean;
    manejarCambioFuelle: (dir: 'halar' | 'empujar', motor: any) => void;
}

// Zona tactil invisible entre el header y la pista de notas. Presionar = empujar,
// soltar = halar. Multi-touch correcto via contador: empujar mientras HAYA al
// menos un dedo en la zona, halar cuando se levanta el ultimo (resuelve "se
// traba" en Android cuando hay varios dedos involucrados).
const FuelleZonaJuego: React.FC<FuelleZonaJuegoProps> = ({ pausado, manejarCambioFuelle }) => {
    const contador = useRef(0);

    return (
        <div
            className="juego-sim-fuelle-zona"
            onTouchStart={(e) => {
                if (pausado) return;
                if (e.cancelable) e.preventDefault();
                const wasZero = contador.current === 0;
                contador.current += e.changedTouches.length;
                if (wasZero) manejarCambioFuelle('empujar', motorAudioPro);
            }}
            onTouchEnd={(e) => {
                if (pausado) return;
                contador.current = Math.max(0, contador.current - e.changedTouches.length);
                if (contador.current === 0) manejarCambioFuelle('halar', motorAudioPro);
            }}
            onTouchCancel={(e) => {
                contador.current = Math.max(0, contador.current - e.changedTouches.length);
                if (contador.current === 0) manejarCambioFuelle('halar', motorAudioPro);
            }}
            onPointerDown={(e) => {
                if (e.pointerType !== 'mouse' || pausado) return;
                manejarCambioFuelle('empujar', motorAudioPro);
            }}
            onPointerUp={(e) => {
                if (e.pointerType !== 'mouse' || pausado) return;
                manejarCambioFuelle('halar', motorAudioPro);
            }}
            style={{ touchAction: 'none' }}
            aria-hidden="true"
        />
    );
};

export default React.memo(FuelleZonaJuego);
