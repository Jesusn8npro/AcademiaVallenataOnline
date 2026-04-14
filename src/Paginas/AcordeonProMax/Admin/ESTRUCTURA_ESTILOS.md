# 📋 ESTRUCTURA DE ESTILOS - MÓDULO ADMIN

## 🗂️ Ubicación de Archivos CSS

### **Estilos Compartidos**
```
src/Paginas/AcordeonProMax/
├── PracticaLibre/
│   └── EstudioPracticaLibre.css    ← Clases base: .estudio-practica-libre-*
│
├── Admin/
│   ├── AdminRec.css                ← Clases Admin: .admin-rec-*
│   │
│   └── Componentes/
│       ├── ReproductorRec.tsx       ← Nuevo reproductor independiente
│       └── ReproductorRec.css       ← Estilos del reproductor
```

---

## 🎨 Clases CSS por Componente

### **1. PanelAdminRec.tsx**
Usa clases de `AdminRec.css`:

```css
.admin-rec-bloque              /* Bloque principal */
.admin-rec-bloque-titulo       /* Título de sección */
.admin-rec-btn                 /* Botones genéricos */
.admin-rec-btn-primary         /* Botón azul (principal) */
.admin-rec-btn-danger          /* Botón rojo (peligro) */
.admin-rec-btn-success         /* Botón verde */
.admin-rec-btn-warning         /* Botón amarillo */
.admin-rec-controls            /* Grid de controles */
.admin-rec-slider-row          /* Fila con slider */
.admin-rec-switch              /* Toggle switch */
.admin-rec-switch-row          /* Fila con switch */
.admin-rec-countdown           /* Display de cuenta atrás */
.admin-rec-punch-display       /* Display de Punch-In */
.admin-rec-punch-badge         /* Badge de estado Punch-In */
.admin-rec-info                /* Caja de información */
.admin-rec-error               /* Caja de error */
.admin-rec-warning             /* Caja de advertencia */
```

### **2. PanelAdminLibreria.tsx**
Usa clases de `EstudioPracticaLibre.css`:

```css
.estudio-practica-libre-bloque
.estudio-practica-libre-bloque-titulo
.estudio-practica-libre-btn
.estudio-practica-libre-btn-linea
.estudio-practica-libre-item-lista
```

### **3. PanelAdminListaAcordes.tsx**
Usa clases de `EstudioPracticaLibre.css`:

```css
.estudio-practica-libre-modal
.estudio-practica-libre-modal-kicker
.estudio-practica-libre-btn
.estudio-practica-libre-grid
```

### **4. ReproductorRec.tsx (NUEVO)**
Usa clases de `ReproductorRec.css`:

```css
.reproductor-rec-container
.reproductor-rec-progress
.reproductor-rec-progress-bar
.reproductor-rec-progress-fill
.reproductor-rec-slider
.reproductor-rec-tiempo
.reproductor-rec-controles
.reproductor-rec-btn
.reproductor-rec-btn-principal
.reproductor-rec-btn-pequeño
.reproductor-rec-btn-peligro
.reproductor-rec-info
.reproductor-rec-loop
```

---

## ✅ CÓMO USAR EL NUEVO REPRODUCTOR

### **Importación**
```typescript
import ReproductorRec from './Componentes/ReproductorRec';
import './Componentes/ReproductorRec.css';  // ← IMPORTANTE
```

### **Props Requeridas**
```typescript
<ReproductorRec
  // Canción
  cancion={cancionActual}
  bpm={bpm}
  
  // Control
  reproduciendo={reproduciendo}
  pausado={pausado}
  onAlternarPausa={() => {}}
  onDetener={() => {}}
  onBuscarTick={(tick) => {}}
  
  // Estado
  tickActual={tickActual}
  totalTicks={totalTicks}
  
  // Loop (opcional)
  loopAB={loopAB}
  onSetLoop={(start, end) => {}}
/>
```

---

## 🎯 RESOLVER ERRORES DE ESTILOS

### **Error: Clase no encontrada**

**Síntoma**: Botones/elementos se ven horribles o falta styling

**Solución**:
```typescript
// 1. Verificar que el CSS esté importado
import './Componentes/ReproductorRec.css';

// 2. Verificar que la clase sea correcta
// ✓ CORRECTO: .admin-rec-btn
// ✗ INCORRECTO: .adminRecBtn o .admin_rec_btn

// 3. Verificar en DevTools (F12)
// Abrir Elements > buscar la clase > ver si está aplicada
```

### **Error: Estilos conflictivos**

**Síntoma**: Estilos se superponen o no se aplican

**Solución**:
```css
/* En el CSS, especificar mejor el selector */
.admin-rec-container .reproductor-rec-btn {
  /* ... estilos ... */
}
```

---

## 📁 ARCHIVOS CREADOS / EDITADOS

### Nuevos Archivos
✅ `/Admin/AdminRec.css` - Estilos para componentes Admin
✅ `/Admin/Componentes/ReproductorRec.tsx` - Reproductor nuevo
✅ `/Admin/Componentes/ReproductorRec.css` - Estilos del reproductor

### Archivos Modificados
✅ `/PracticaLibre/EstudioPracticaLibre.tsx` - Agregados modales y lógica de grabación

---

## 🔗 RELACIONES DE ESTILOS

```
EstudioPracticaLibre.css
├── Usado por: EstudioPracticaLibre.tsx
├── Usado por: PanelAdminLibreria.tsx
├── Usado por: PanelAdminListaAcordes.tsx
└── Usado por: PanelAdminGestorAcordes.tsx

AdminRec.css
├── Usado por: PanelAdminRec.tsx
├── Usado por: Otros componentes Admin que usen .admin-rec-*
└── Define todas las clases necesarias para AdminRec

ReproductorRec.css
├── Usado por: ReproductorRec.tsx
└── Completamente independiente
```

---

## 🎨 COLORES Y TEMA

### Colores Principales
- **Primario**: `#3b82f6` (Azul)
- **Secundario**: `#8b5cf6` (Púrpura)
- **Éxito**: `#10b981` (Verde)
- **Peligro**: `#ef4444` (Rojo)
- **Advertencia**: `#fbbf24` (Amarillo)

### Fondos
- **Base**: `rgba(15, 23, 42, 0.95)` (Muy oscuro)
- **Secundario**: `rgba(30, 41, 59, 0.9)` (Oscuro)
- **Ligero**: `rgba(255, 255, 255, 0.05)` (Muy claro)

---

## ✨ CARACTERÍSTICAS DEL NUEVO REPRODUCTOR

✅ **Totalmente Independiente** - No depende de otros reproductores
✅ **Sincronización de Ticks** - Usa BPM y resolución correctamente
✅ **Controles Completos**:
  - Play/Pause
  - Retroceder/Avanzar 5 segundos
  - Ir al inicio/final
  - Búsqueda por slider
✅ **Display de Tiempo** - Formato MM:SS
✅ **Display de BPM** - Muestra BPM actual
✅ **Loop A-B** - Soporte para loops (opcional)
✅ **Responsive** - Funciona en móvil y desktop
✅ **Dark Theme** - Integrado con tema ProMax

---

## 📞 SOPORTE Y TROUBLESHOOTING

### ¿Reproductor no muestra botones?
```typescript
// Asegúrate de importar el CSS
import ReproductorRec from './Componentes/ReproductorRec';
import './Componentes/ReproductorRec.css';  // ← Esto es CRÍTICO
```

### ¿Slider no funciona?
```typescript
// Verifica que onBuscarTick esté correctamente conectado
<ReproductorRec
  onBuscarTick={(tick) => console.log('Tick:', tick)}
  // ...
/>
```

### ¿Tiempo no se actualiza?
```typescript
// Verifica que tickActual y totalTicks se actualicen
console.log('tickActual:', tickActual);
console.log('totalTicks:', totalTicks);
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Importar ReproductorRec en PanelAdminRec.tsx
2. ✅ Reemplazar reproductor viejo con ReproductorRec
3. ✅ Probar todos los controles
4. ✅ Verificar sincronización de ticks
5. ✅ Verificar estilos en diferentes resoluciones

---

**Última actualización**: 2026-04-13
**Versión**: 1.0.0
