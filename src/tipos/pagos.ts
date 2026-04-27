export interface RegistroPago {
    usuario_id: string;
    curso_id?: string;
    tutorial_id?: string;
    paquete_id?: string;
    nombre_producto: string;
    descripcion?: string;
    valor: number;
    iva?: number;
    ico?: number;
    base_iva?: number;
    moneda?: string;
    ref_payco: string;
    factura?: string;
    cod_respuesta?: string;
    respuesta?: string;
    estado?: string;
    metodo_pago?: string;
    ip_cliente?: string;
    fecha_transaccion?: string;
    datos_adicionales?: any;
}

export interface ResultadoOperacion {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
    epaycoData?: any;
}
