export interface AjustesAcordeon {
    tamano: string;
    x: string;
    y: string;
    pitosBotonTamano: string;
    pitosFuenteTamano: string;
    bajosBotonTamano: string;
    bajosFuenteTamano: string;
    teclasLeft: string;
    teclasTop: string;
    bajosLeft: string;
    bajosTop: string;
    mapeoPersonalizado: Record<string, string[]>;
    pitchPersonalizado: Record<string, number>;
}

export interface SonidoVirtual {
    id: string;
    nombre: string;
    rutaBase: string;
    pitch: number;
    tipo: 'Bajos' | 'Brillante';
}

export interface BotonActivo {
    instances: any[];
    nombre: string;
    [key: string]: any;
}

export type ModoVista = 'teclas' | 'numeros' | 'notas' | 'cifrado';

export interface AcordeonSimuladorProps {
    direccion?: 'halar' | 'empujar';
    deshabilitarInteraccion?: boolean;
    imagenFondo?: string;
    onNotaPresionada?: (data: { idBoton: string; nombre: string }) => void;
    onNotaLiberada?: (data: { idBoton: string; nombre: string }) => void;
}

export interface AcordeonSimuladorHandle {
    limpiarTodasLasNotas: () => void;
    cambiarDireccion: (nuevaDireccion: 'halar' | 'empujar') => void;
}

