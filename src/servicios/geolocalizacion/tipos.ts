export interface DatosGeolocalizacion {
    ip: string;
    ciudad: string;
    region: string;
    pais: string;
    codigoPais: string;
    latitud: number;
    longitud: number;
    zonaHoraria: string;
    organizacion: string;
    codigoPostal?: string;
    moneda?: string;
    idioma?: string;
    esMovil: boolean;
    esProxy: boolean;
    esVpn: boolean;
    urlBandera: string;
    datosCompletos: any;
}

export interface ErrorGeolocalizacion {
    error: true;
    mensaje: string;
    codigo?: string;
    tipoError: 'RED' | 'API' | 'DATOS' | 'LIMITE';
}
