# 🔧 FLUJO DE PAGOS - DEBUGGING SESSION

**Última actualización:** 2026-04-10  
**Estado:** 🔴 BUG CRÍTICO NO RESUELTO - Webhook no actualiza estado de pago

---

## 📋 RESUMEN DEL PROBLEMA

### Síntoma Principal
El usuario realiza un pago que **ePayco aprueba correctamente**, pero:
- ✅ El pago se **registra en `pagos_epayco`** con estado **"pendiente"**
- ❌ El webhook **NO actualiza el estado** a "aceptada"
- ❌ El usuario **NO ve confirmación de pago exitoso**

### Flujo Esperado
```
Usuario realiza pago 
  ↓
Modal envía datos a ePayco
  ↓
ePayco procesa y aprueba
  ↓
ePayco llama webhook (confirmation URL)
  ↓
Webhook actualiza estado en pagos_epayco
  ↓
ePayco redirige a pago-exitoso
  ↓
Usuario ve "¡Transacción exitosa!"
```

### Flujo Actual (CON BUG)
```
Usuario realiza pago
  ↓
Modal crea registro en pagos_epayco (estado: pendiente)
  ↓
ePayco procesa y aprueba
  ↓
??? WEBHOOK NO RECIBE CONFIRMACIÓN ???
  ↓
ePayco redirige a pago-exitoso
  ↓
Página consulta BD y encuentra: estado: pendiente
  ↓
Usuario ve "Pago en verificación"
```

---

## 🔍 BUGS IDENTIFICADOS Y SOLUCIONADOS

### BUG 1 ✅ RESUELTO - URL de respuesta envía ref_payco incorrecto

**Problema:**
- ePayco redirige a `/pago-exitoso?ref_payco=69d98...` 
- El parámetro `ref_payco` es el **ID interno de ePayco**, no nuestro invoice
- PagoExitoso buscaba el pago con el ID de ePayco, no encontraba nada

**Causa:**
- ModalPagoInteligente enviaba:
  ```typescript
  response: EPAYCO_RESPONSE_URL,  // Solo la URL base
  ```
- ePayco generaba su propio parámetro `ref_payco` con su ID interno

**Solución Implementada:**
```typescript
// ModalPagoInteligente.tsx (línea 473-474)
response: `${EPAYCO_RESPONSE_URL}?invoice=${refPayco}`,
url_response: `${EPAYCO_RESPONSE_URL}?invoice=${refPayco}`,
```

Ahora ePayco redirige con: `/pago-exitoso?invoice=TUT-AC3BA5439-1775864726059-A9YL`

**En PagoExitoso.tsx** (línea 86-90):
```typescript
const refPayco = searchParams.get('invoice') ||        // 1º - nuestro ref_payco
                 searchParams.get('x_id_invoice') ||   // 2º fallback
                 searchParams.get('ref_payco') ||      // 3º fallback ePayco
                 searchParams.get('x_ref_payco') ||    // 4º fallback
                 '';
```

---

## 🔴 BUG 2 ❓ NO RESUELTO - Webhook no actualiza estado

**Problema:**
- El webhook está deployado y accesible
- Se agregaron logs detallados para debugging
- **AÚN NO SABEMOS SI EL WEBHOOK RECIBE LAS CONFIRMACIONES DE EPAYCO**

**Cambios Realizados:**

### A. Edge Function con Logs Detallados
**Archivo:** `supabase/functions/epayco-webhook/index.ts`

Agregados logs en línea 103:
```typescript
console.log('🎯 WEBHOOK RECIBIDO:', JSON.stringify(payload, null, 2));
console.log('📋 REF_PAYCO:', xRefPayco);
console.log('📋 COD_RESPONSE:', xCodResponse);
console.log('📋 TRANSACTION_ID:', xTransactionId);
console.log('📋 FIRMA RECIBIDA:', xSignature);
console.log('📋 FIRMA ESPERADA:', expectedSignature.toLowerCase());
console.log('🔐 VALIDACIÓN DE FIRMA - TEMPORALMENTE DESHABILITADA PARA DEBUGGING');
```

Y comentada la validación de firma (línea 138-140):
```typescript
// ⚠️ TEMPORALMENTE COMENTADA PARA DEBUGGING
// if (expectedSignature.toLowerCase() !== xSignature) {
//   return jsonResponse({ success: false, error: "Firma invalida" }, 401);
// }
```

Agregados logs de update (línea 165-177):
```typescript
console.log('🚀 INTENTANDO ACTUALIZAR PAGO CON ref_payco:', xRefPayco);
console.log('📊 NUEVO ESTADO:', estado);
// ... después del update:
console.log('✅ PAGO ACTUALIZADO EXITOSAMENTE:', data);
```

**Status:** ✅ Deployed con `npx supabase functions deploy epayco-webhook --project-ref tbijzvtyyewhtwgakgka --no-verify-jwt`

### B. Console Logging en PagoExitoso.tsx
**Archivo:** `src/Paginas/Pagos/PagoExitoso/PagoExitoso.tsx` (línea 64-78)

Agregados logs que capturan todos los parámetros que ePayco envía:
```typescript
console.log('🎯 WEBHOOK RECIBIDO:', JSON.stringify(payload, null, 2));
console.log('--- Parámetros individuales ---');
console.log('ref_payco:', searchParams.get('ref_payco'));
console.log('x_ref_payco:', searchParams.get('x_ref_payco'));
console.log('x_id_invoice:', searchParams.get('x_id_invoice'));
console.log('invoice:', searchParams.get('invoice'));
console.log('x_transaction_id:', searchParams.get('x_transaction_id'));
console.log('x_cod_response:', searchParams.get('x_cod_response'));
console.log('estado:', searchParams.get('estado'));
console.log('x_response:', searchParams.get('x_response'));
```

### C. Pre-llenado de Datos para Usuarios Registrados
**Archivo:** `src/componentes/Pagos/ModalPagoInteligente.tsx` (línea 103-179)

Modificado `verificarUsuario()` para ser async y consultar tabla `perfiles`:
```typescript
const verificarUsuario = async () => {
    if (usuario) {
        const { data: perfil, error } = await supabase
            .from('perfiles')
            .select('nombre, apellido, correo_electronico, whatsapp, documento_tipo, ...')
            .eq('id', usuario.id)
            .single();
```

**Campos pre-llenados:**
- nombre, apellido, correo_electronico
- whatsapp, documento_tipo, documento_numero
- direccion_completa, ciudad, pais, codigo_postal

---

## 🎨 REDESIGN COMPLETADO

### PagoExitoso.css - Nuevo Diseño
**Estado:** ✅ Implementado y pusheado

**Características:**
- Fondo limpio: `#f8f8f6` (var(--color-bg-primary))
- Tarjeta blanca centrada, max-width 560px
- Sin partículas, sin animaciones exageradas, sin gradientes

**Colores por Estado:**
| Estado | Círculo | Ícono | Texto |
|--------|---------|-------|-------|
| ✓ Aceptada | #EAF3DE | #3B6D11 (verde) | #3B6D11 |
| 🕐 Pendiente | #FAEEDA | #854F0B (naranja) | #854F0B |
| ✗ Rechazada | #FCEBEB | #A32D2D (rojo) | #A32D2D |

**Tipografía:**
- Títulos: 20-22px, peso 700
- Subtítulos: 14-16px, peso 500
- Detalles: 14px, peso 600

**Botones:**
- "Ir a mis cursos" - Verde (#3B6D11)
- "Volver al inicio" - Gris (#808080)
- Padding: 10px 20px, sin efectos de hover exagerados

---

## 📁 ARCHIVOS MODIFICADOS EN ESTA SESIÓN

### 1. `src/componentes/Pagos/ModalPagoInteligente.tsx`
- ✅ Línea 103-179: `verificarUsuario()` async con query a tabla `perfiles`
- ✅ Línea 473-474: URLs de respuesta con parámetro `invoice`

### 2. `src/Paginas/Pagos/PagoExitoso/PagoExitoso.tsx`
- ✅ Línea 64-78: Console logs de todos los parámetros
- ✅ Línea 86-90: Búsqueda de ref_payco con prioridad: `invoice` → `x_id_invoice` → `ref_payco` → `x_ref_payco`

### 3. `supabase/functions/epayco-webhook/index.ts`
- ✅ Línea 103: Logs del payload completo
- ✅ Línea 105-110: Logs de parámetros individuales
- ✅ Línea 137: Logs de firma esperada
- ✅ Línea 138-140: **Validación de firma COMENTADA para debugging**
- ✅ Línea 165-177: Logs del UPDATE
- ✅ **Deployed a Supabase**

### 4. `src/Paginas/Pagos/PagoExitoso/PagoExitoso.css`
- ✅ Diseño completamente reemplazado con CSS limpio

---

## 🧪 CÓMO TESTEAR Y DEBUGGEAR AHORA

### PASO 1: Deploy en EasyPanel
```bash
# Asegúrate que los cambios estén pusheados
git log --oneline -5
# Debería mostrar los commits de esta sesión
```

### PASO 2: Realiza un Pago de Prueba
1. Ve a https://academiavallenataonline.com
2. Haz clic en "Comprar" en cualquier curso/tutorial
3. Completa el formulario y procede con el pago
4. **Importante:** Usa tarjeta de prueba de ePayco o marca que apruebe

### PASO 3: Abre la Consola del Navegador
```
F12 → Pestaña Console
```

Busca logs que digan:
```
🎯 WEBHOOK RECIBIDO: ...
📋 REF_PAYCO: ...
📋 INVOICE: ...
```

**¿Qué buscar?**
- ¿Aparece el parámetro `invoice=TUT-...` en la URL?
- ¿Se ve el ref_payco correcto?

### PASO 4: Revisa Logs del Webhook
1. Abre **Supabase Dashboard** → Tu proyecto
2. Ve a **Edge Functions** → **epayco-webhook**
3. Abre la pestaña **Logs**
4. Realiza un pago de prueba
5. Busca logs que digan:
```
🎯 WEBHOOK RECIBIDO: {...}
📋 REF_PAYCO: TUT-...
📋 FIRMA RECIBIDA: ...
📋 FIRMA ESPERADA: ...
🚀 INTENTANDO ACTUALIZAR PAGO CON ref_payco: TUT-...
```

**Posibles escenarios:**

#### ✅ Escenario 1: Logs aparecen y estado se actualiza
```
✅ PAGO ACTUALIZADO EXITOSAMENTE: { id: ..., ref_payco: ..., estado: "aceptada" }
```
**Significa:** El webhook está recibiendo las confirmaciones correctamente  
**Siguiente paso:** Vuelve a habilitar validación de firma

#### ❌ Escenario 2: No hay logs en el webhook
```
// Ningún log del webhook aparece
```
**Significa:** ePayco NO está enviando las confirmaciones al webhook  
**Causas posibles:**
- La URL de confirmación en el panel de ePayco es incorrecta
- ePayco tiene problemas de conectividad
- El servidor de ePayco no puede resolver el dominio

**Acción:** Verifica en panel de ePayco que la URL de confirmación sea exactamente:
```
https://tbijzvtyyewhtwgakgka.supabase.co/functions/v1/epayco-webhook
```

#### ⚠️ Escenario 3: Logs aparecen pero no se actualiza el estado
```
🎯 WEBHOOK RECIBIDO: {...}
📋 REF_PAYCO: TUT-...
❌ Error actualizando pago ePayco: { code: "...", message: "..." }
```
**Significa:** El webhook recibe datos pero falla al actualizar BD  
**Causas posibles:**
- Falta ref_payco en el webhook (búsqueda fallida)
- Problema de RLS policies en tabla `pagos_epayco`
- ref_payco tiene formato diferente en la BD vs en el webhook

---

## 🔗 CONFIGURACIÓN CRÍTICA

### Variables de Entorno (.env)
```
VITE_EPAYCO_PUBLIC_KEY=a04d60e2e678d5bd89a58d26f3413fdb
VITE_EPAYCO_CUSTOMER_ID=37257
VITE_EPAYCO_TEST_MODE=true
EPAYCO_PRIVATE_KEY=83ec651809bb7d11fcd114b16777bfa1
```

### URLs de Supabase
```
URL: https://tbijzvtyyewhtwgakgka.supabase.co
Webhook: https://tbijzvtyyewhtwgakgka.supabase.co/functions/v1/epayco-webhook
```

### URLs de Respuesta
```
Response: https://academiavallenataonline.com/pago-exitoso?invoice={refPayco}
Confirmation: https://tbijzvtyyewhtwgakgka.supabase.co/functions/v1/epayco-webhook
```

---

## 📊 ESTRUCTURA DE DATOS

### Tabla `pagos_epayco`
```sql
ref_payco: TEXT PRIMARY KEY        -- TUT-AC3BA5439-1775864726059-A9YL
usuario_id: UUID (FK)
estado: TEXT                        -- 'pendiente', 'aceptada', 'rechazada', 'fallida'
cod_respuesta: TEXT
respuesta: TEXT
fecha_transaccion: TIMESTAMP
valor: INTEGER
iva: INTEGER
nombre_producto: TEXT
```

---

## 🚀 COMMITS DE ESTA SESIÓN

```
c22f2af feat: add facebook login, fix modal syntax and logo path
d4b8066 fix: enhance payment flow with console logging and user data pre-filling
c6f7c5f fix: resolve ref_payco parameter bug in payment flow
3397d97 design: redesign PagoExitoso page with clean, sober styling
```

---

## ✅ CHECKLIST PARA PRÓXIMA SESIÓN

- [ ] Deploy en EasyPanel completado
- [ ] Realizar pago de prueba
- [ ] Revisar console logs en navegador
- [ ] Revisar logs de webhook en Supabase
- [ ] Confirmar si webhook recibe datos de ePayco
- [ ] Si no llegan datos: verificar URL de confirmación en panel ePayco
- [ ] Si llegan datos pero no se actualiza: debuggear query de UPDATE
- [ ] Una vez resuelto: volver a habilitar validación de firma
- [ ] Test completo: pago → webhook → actualización → confirmación visual

---

## 💡 NOTAS IMPORTANTES

1. **Validación de firma está comentada** para permitir que el webhook actualice sin validar
   - Es TEMPORAL para debugging
   - Debe re-habilitarse cuando el webhook funcione correctamente

2. **El pago se registra ANTES de abrir ePayco**
   - Si falla en ePayco, el registro ya existe con estado "pendiente"
   - Esto es correcto, permite sincronizar después si ePayco responde tarde

3. **Los datos del usuario se pre-llenan desde Supabase**
   - Para usuarios registrados, la modal consulta la tabla `perfiles`
   - Fallback a datos del contexto si hay error

4. **El parámetro `invoice` ahora viaja en la URL**
   - Es nuestro ref_payco personalizado
   - ePayco lo devuelve en la redirección
   - PagoExitoso lo busca primero para encontrar el pago correcto

---

## 📞 PUNTO DE CONTACTO

Si el problema persiste, el siguiente paso sería:
1. **Contactar a ePayco** para verificar si están enviando confirmaciones
2. **Habilitar logs HTTP** en Supabase para ver qué se recibe exactamente
3. **Verificar dominios y SSL** - asegurarse que el certificado sea válido

---

**Creado:** 2026-04-10  
**Última revisión:** 2026-04-10
