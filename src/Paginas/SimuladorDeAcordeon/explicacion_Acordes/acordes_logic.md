# 🗃️ Lógica Maestra de Acordes y Armonía - Acordeón Hero

Este documento explica cómo hemos configurado el sistema para que el simulador "entienda" de música y pueda calcular todos los acordes e inversiones automáticamente en cualquier tonalidad.

---

## 🎹 1. Selección de Hilera Líder (Tono Principal)

El sistema ahora permite definir cuál de las tres hileras es la "Líder". Basado en esto, la relación armónica vallenata (I - IV - V) se calcula así:

| Hilera Líder | Tono (I) | Subdominante (IV) | Dominante (V) |
|---|---|---|---|
| **AFUERA (1)** | Hilera 1 | Hilera 2 | Cruzado (1 + 2) |
| **MEDIO (2)** | Hilera 2 | Hilera 3 | Hilera 1 |
| **ADENTRO (3)** | Hilera 3 | Cruzado | Hilera 2 |

*Nota: Esta relación se mantiene idéntica sin importar si el acordeón es GCF, BESAS o Cinco Letras, gracias al motor de transposición.*

---

## 🏛️ 2. Base de Datos de Acordes (`acordes_hero`)

Hemos creado una tabla en Supabase que no guarda "puntos fijos", sino **patrones de botones**.

```sql
CREATE TABLE public.acordes_hero (
    id uuid PRIMARY KEY,
    nombre text, -- "Mayor", "Menor", "7ma"
    grado text, -- "I", "IV", "V"
    fuelle text, -- "abriendo" / "cerrando"
    botones jsonb, -- [{h: 2, b: 4}, {h: 2, b: 5}, {h: 2, b: 6}]
    inversion integer -- 0, 1, 2
);
```

### ¿Cómo funciona la "Cuenta Automática"?
1.  Tú grabas un acorde **"I Mayor"** en la **Hilera 1**.
2.  El sistema guarda la posición física (los botones).
3.  Cuando cambias el acordeón (ej: de GCF a ADG), el sistema busca la misma posición física.
4.  Debido a que el acordeón diatónico mantiene la misma estructura de intervalos, el acorde se **transporta automáticamente**.

---

## 🔄 3. El Motor de Inversiones

El sistema calculará las 3 posiciones básicas de cualquier acorde:

1.  **Fundamental:** La raíz está abajo (Ej: Do - Mi - Sol).
2.  **1ra Inversión:** Se sube la raíz una octava (Ej: Mi - Sol - Do).
3.  **2da Inversión:** Se sube la 3ra una octava (Ej: Sol - Do - Mi).

A nivel visual, el simulador **iluminará los botones** que corresponden a cada inversión para que el alumno aprenda todas las posturas en el diapasón.

---

## 🚀 4. Próxima Implementación: Calculador Armonico

Crearemos una función `getAcorde(grado, inversion, hileraLider)` que:
1.  Busque el patrón en la base de datos.
2.  Identifique los botones en el acordeón actual.
3.  Muestre visualmente las notas al usuario.

---
*Documento generado para el Administrador de Academia Vallenata Online.*
