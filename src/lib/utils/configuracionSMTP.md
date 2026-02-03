# 🔧 GUÍA COMPLETA: Configurar SMTP en Supabase

## 🚨 PROBLEMA IDENTIFICADO

**Tu funcionalidad de recuperar contraseña falla porque Supabase por defecto SOLO envía emails a miembros de tu organización.**

**Síntomas:**
- ✅ Emails no registrados aparecen como "enviados" 
- ❌ Emails registrados externos no reciben nada
- ❌ AuthRetryableFetchError en algunos casos
- ❌ Ocurre tanto en localhost como en producción

## ✅ SOLUCIÓN DEFINITIVA: Configurar SMTP Personalizado

### 🎯 OPCIÓN 1: Gmail SMTP (GRATIS - Recomendado para desarrollo)

**Paso 1: Configurar Gmail**
1. Ve a [Google Account](https://myaccount.google.com/)
2. Security → 2-Step Verification (debe estar habilitado)
3. Security → App passwords
4. Genera una contraseña de aplicación para "Mail"
5. Guarda la contraseña de 16 caracteres

**Paso 2: Configurar en Supabase**
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. **Authentication** → **Settings** → **SMTP Settings**
3. **Enable custom SMTP** ✅
4. Configuración:
   ```
   Host: smtp.gmail.com
   Port: 587
   User: tu-email@gmail.com
   Password: [contraseña de aplicación de 16 caracteres]
   ```
5. **Save** y **Test** la configuración

### 🎯 OPCIÓN 2: Resend (GRATIS - Recomendado para producción)

**Paso 1: Crear cuenta Resend**
1. Ve a [Resend.com](https://resend.com)
2. Crea cuenta gratuita (3,000 emails/mes)
3. Ve a **API Keys** → **Create API Key**
4. Copia la API key

**Paso 2: Configurar dominio (opcional pero recomendado)**
1. **Domains** → **Add Domain**
2. Agrega `academiavallenataonline.com`
3. Configura los DNS records que te muestre
4. Verifica el dominio

**Paso 3: Configurar en Supabase**
1. **Authentication** → **Settings** → **SMTP Settings**
2. **Enable custom SMTP** ✅
3. Configuración:
   ```
   Host: smtp.resend.com
   Port: 587
   User: resend
   Password: [tu API key de Resend]
   ```

### 🎯 OPCIÓN 3: SendGrid (GRATIS)

**Paso 1: Crear cuenta SendGrid**
1. Ve a [SendGrid.com](https://sendgrid.com)
2. Crea cuenta gratuita (100 emails/día)
3. **Settings** → **API Keys** → **Create API Key**
4. Permisos: "Restricted Access" → **Mail Send** (Full Access)

**Paso 2: Configurar en Supabase**
1. **Authentication** → **Settings** → **SMTP Settings**
2. **Enable custom SMTP** ✅
3. Configuración:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   User: apikey
   Password: [tu API key de SendGrid]
   ```

## 🔧 CONFIGURACIÓN ADICIONAL EN SUPABASE

### **URLs de Redirección**
En **Authentication** → **Settings** → **General**:

**Site URL:**
```
https://academiavallenataonline.com
```

**Redirect URLs:**
```
https://academiavallenataonline.com/**
https://academiavallenataonline.com/recuperar-contrasena
http://localhost:5173/**
http://localhost:5173/recuperar-contrasena
```

### **Email Templates**
En **Authentication** → **Settings** → **Email Templates**:

1. ✅ **Enable email confirmations**
2. Personaliza el template de "Reset Password":

```html
<h2>Restablecer Contraseña - Academia Vallenata</h2>
<p>Haz clic en el enlace para restablecer tu contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer Contraseña</a></p>
<p>Este enlace expira en 1 hora.</p>
<p>Si no solicitaste este cambio, ignora este email.</p>
```

## 🧪 PRUEBAS DESPUÉS DE CONFIGURAR

1. **Guarda** la configuración SMTP
2. **Test** la configuración desde Supabase Dashboard
3. Prueba la funcionalidad de recuperar contraseña con un email real
4. Verifica que llegue el email (revisa spam/promociones)

## 🚀 RESULTADO ESPERADO

Después de configurar SMTP:
- ✅ Emails de recuperación llegan a cualquier dirección
- ✅ Funciona en desarrollo y producción
- ✅ Se eliminan los errores AuthRetryableFetchError
- ✅ Usuarios externos pueden restablecer contraseñas

## 📧 EMAILS DE PRUEBA RECOMENDADOS

1. **Tu email personal** (para confirmar que funciona)
2. **Email de Gmail** (para probar compatibilidad)
3. **Email corporativo** (para verificar filtros empresariales)

## ⚠️ IMPORTANTE

- **No** uses el email que configuraste como SMTP para enviar
- **Siempre** prueba con emails externos a tu organización
- **Configura** límites de rate limiting apropiados
- **Monitorea** el uso para no exceder límites gratuitos

## 🔍 TROUBLESHOOTING

**Si aún no funciona:**
1. Verifica credenciales SMTP
2. Revisa que el dominio esté verificado (Resend/SendGrid)
3. Confirma que las URLs de redirección sean correctas
4. Prueba con diferentes proveedores de email
5. Revisa logs en Supabase Dashboard

---

**¡Una vez configurado el SMTP, tu funcionalidad de recuperar contraseña funcionará perfectamente!** 🎉 