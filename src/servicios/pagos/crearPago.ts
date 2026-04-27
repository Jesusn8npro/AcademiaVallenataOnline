import { generarReferencia, calcularIVA } from '../ePaycoService';
import { supabase } from '../clienteSupabase';
import { crearRegistroPago } from './registro';
import type { ResultadoOperacion } from '../../tipos/pagos';

export async function crearPago(datosEntrada: {
    usuarioId?: string | null;
    cursoId?: string;
    tutorialId?: string;
    email: string;
    nombre: string;
    telefono: string;
    ip_cliente?: string;
    datosAdicionales?: any;
}): Promise<ResultadoOperacion> {
    try {
        const { usuarioId, cursoId, tutorialId, email, nombre, telefono, ip_cliente, datosAdicionales } = datosEntrada;
        const paqueteId = (datosEntrada as any).paqueteId;

        let contenido;
        let precio = 0;
        let nombreProducto = '';
        let descripcion = '';

        if (cursoId) {
            const { data: curso, error } = await supabase
                .from('cursos')
                .select('id, titulo, precio_normal, precio_rebajado')
                .eq('id', cursoId)
                .single();

            if (error || !curso) {
                return { success: false, error: 'Curso no encontrado' };
            }

            contenido = curso;
            precio = curso.precio_rebajado || curso.precio_normal || 15000;
            nombreProducto = curso.titulo;
            descripcion = `Curso: ${curso.titulo}`;
        } else if (tutorialId) {
            const { data: tutorial, error } = await supabase
                .from('tutoriales')
                .select('id, titulo, precio_normal, precio_rebajado')
                .eq('id', tutorialId)
                .single();

            if (error || !tutorial) {
                return { success: false, error: 'Tutorial no encontrado' };
            }

            contenido = tutorial;
            precio = tutorial.precio_rebajado || tutorial.precio_normal || 15000;
            nombreProducto = tutorial.titulo;
            descripcion = `Tutorial: ${tutorial.titulo}`;
        } else if (paqueteId) {
            const { data: paquete, error } = await supabase
                .from('paquetes')
                .select('id, titulo, precio_normal, precio_rebajado')
                .eq('id', paqueteId)
                .single();

            if (error || !paquete) {
                return { success: false, error: 'Paquete no encontrado' };
            }

            contenido = paquete;
            precio = paquete.precio_rebajado || paquete.precio_normal || 15000;
            nombreProducto = paquete.titulo;
            descripcion = `Paquete: ${paquete.titulo}`;
        } else {
            return { success: false, error: 'Debe especificar un curso, tutorial o paquete' };
        }

        let finalUserId = usuarioId;
        if (!usuarioId) {
            finalUserId = crypto.randomUUID();
        }

        const { base, iva, total } = calcularIVA(precio);

        const refPayco = generarReferencia(
            cursoId ? 'curso' : tutorialId ? 'tutorial' : 'paquete',
            cursoId || tutorialId || paqueteId || '',
            finalUserId || ''
        );

        const datosRegistro = {
            usuario_id: finalUserId,
            curso_id: cursoId,
            tutorial_id: tutorialId,
            paquete_id: paqueteId,
            nombre_producto: nombreProducto,
            descripcion: descripcion,
            valor: total,
            iva: iva,
            base_iva: base,
            moneda: 'COP',
            ref_payco: refPayco,
            factura: refPayco,
            ip_cliente: ip_cliente,
            ...datosAdicionales
        };

        const resultadoRegistro = await crearRegistroPago(datosRegistro);
        if (!resultadoRegistro.success) {
            return resultadoRegistro;
        }

        const baseUrl = import.meta.env.VITE_BASE_URL || 'https://academiavallenataonline.com';
        const responseUrl = `${baseUrl}/pago-exitoso`;
        const confirmationUrl = `${baseUrl}/api/pagos/confirmar`;

        const calculosIVA = calcularIVA(precio);

        const limpiarTexto = (texto: string | undefined, maxLength: number): string => {
            if (!texto) return '';
            return texto
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/[^a-zA-Z0-9\s\-\.\,]/g, '')
                .trim()
                .substring(0, maxLength);
        };

        const limpiarNumero = (numero: string | undefined): string => {
            if (!numero) return '';
            return numero.replace(/[^0-9]/g, '').substring(0, 15);
        };

        const montoMinimo = Math.max(1000, total);
        const numeroDocumento = limpiarNumero(datosAdicionales?.documento_numero);
        const documentoValido = numeroDocumento.length >= 6 ? numeroDocumento : '12345678';
        const emailValido = email && email.includes('@') && email.includes('.') ?
            email.substring(0, 50) : 'test@test.com';
        const telefonoLimpio = limpiarNumero(telefono);
        const telefonoValido = telefonoLimpio.length >= 10 ?
            telefonoLimpio.substring(0, 15) : '3001234567';

        const epaycoData = {
            invoice: refPayco.substring(0, 32),
            name: limpiarTexto(nombreProducto, 80),
            description: limpiarTexto(descripcion || nombreProducto, 150),
            currency: 'cop',
            amount: String(montoMinimo),
            tax_base: String(calculosIVA.base),
            tax: String(calculosIVA.iva),
            tax_ico: '0',
            country: 'co',
            lang: 'es',
            email_billing: emailValido,
            name_billing: limpiarTexto(nombre || 'Usuario Test', 40),
            address_billing: limpiarTexto(
                datosAdicionales?.direccion_completa || 'Calle 123 #45-67 Bogota',
                80
            ),
            type_doc_billing: 'cc',
            number_doc_billing: documentoValido,
            type_person: '0',
            mobilephone_billing: telefonoValido,
            external: 'false',
            popup: 'true',
            response: responseUrl,
            confirmation: confirmationUrl
        };

        const datosFinales = {
            ...epaycoData,
            key: import.meta.env.VITE_EPAYCO_PUBLIC_KEY || 'a04d60e2e678d5bd89a58d26f3413fdb',
            test: String(import.meta.env.VITE_EPAYCO_TEST_MODE !== 'false'),
            customer_id: import.meta.env.VITE_EPAYCO_CUSTOMER_ID || '508441'
        };

        return {
            success: true,
            message: 'Pago preparado exitosamente',
            epaycoData: datosFinales
        };

    } catch (error) {
        return {
            success: false,
            message: 'Error interno del servidor en crearPago: ' + (error instanceof Error ? error.message : 'Error desconocido'),
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
