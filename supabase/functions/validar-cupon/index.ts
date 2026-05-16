import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { codigo, monto, usuario_id } = await req.json()

    if (!codigo || !monto) {
      return new Response(JSON.stringify({ valido: false, mensaje: 'Código y monto son requeridos' }), { status: 400, headers: cors })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: cupon, error } = await supabase
      .from('cupones')
      .select('*')
      .eq('codigo', codigo.toUpperCase().trim())
      .eq('activo', true)
      .single()

    if (error || !cupon) {
      return new Response(JSON.stringify({ valido: false, mensaje: 'Cupón no encontrado o inactivo' }), { headers: cors })
    }

    if (cupon.fecha_expiracion && new Date(cupon.fecha_expiracion) < new Date()) {
      return new Response(JSON.stringify({ valido: false, mensaje: 'Este cupón ha expirado' }), { headers: cors })
    }

    if (cupon.usos_maximos !== null && cupon.usos_actuales >= cupon.usos_maximos) {
      return new Response(JSON.stringify({ valido: false, mensaje: 'Este cupón ya alcanzó su límite de usos' }), { headers: cors })
    }

    if (monto < cupon.valor_minimo) {
      return new Response(JSON.stringify({
        valido: false,
        mensaje: `El monto mínimo para este cupón es $${cupon.valor_minimo.toLocaleString('es-CO')}`
      }), { headers: cors })
    }

    const descuento = cupon.tipo === 'porcentaje'
      ? Math.round(monto * (cupon.valor / 100))
      : Math.min(cupon.valor, monto)

    const precio_final = Math.max(0, monto - descuento)

    // Incrementar uso y registrar
    await supabase.from('cupones').update({ usos_actuales: cupon.usos_actuales + 1 }).eq('id', cupon.id)

    if (usuario_id) {
      await supabase.from('cupones_uso').insert({
        cupon_id: cupon.id,
        usuario_id,
        descuento_aplicado: descuento
      })
    }

    return new Response(JSON.stringify({
      valido: true,
      descuento,
      precio_final,
      tipo: cupon.tipo,
      valor: cupon.valor,
      descripcion: cupon.descripcion,
      mensaje: cupon.tipo === 'porcentaje'
        ? `${cupon.valor}% de descuento aplicado`
        : `$${descuento.toLocaleString('es-CO')} de descuento aplicado`
    }), { headers: cors })

  } catch (err: any) {
    return new Response(JSON.stringify({ valido: false, mensaje: err.message }), { status: 500, headers: cors })
  }
})
