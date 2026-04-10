# ACORDEON HERO — Game Design Document para Claude Code

## Tu misión
Eres el arquitecto de "Acordeón Hero", el Synthesia/Guitar Hero 
del acordeón vallenato. El juego más adictivo para aprender 
acordeón en el mundo.

## Analiza PRIMERO estos archivos en orden:
1. src/Paginas/SimuladorDeAcordeon/notasAcordeonDiatonico.ts
   → Motor de transposición, TONALIDADES, 31 botones por hilera
2. src/Paginas/SimuladorDeAcordeon/mapaTecladoYFrecuencias.ts  
   → mapaTeclas: teclado PC → botones del acordeón
3. src/Paginas/SimuladorDeAcordeon/Componentes/CuerpoAcordeon.tsx
   → Cómo se renderizan los botones y se activan
4. src/Paginas/SimuladorDeAcordeon/videojuego_acordeon/
   → Tipos Hero existentes (CancionHero, etc)
5. src/Paginas/SimuladorDeAcordeon/AcordeonSimulador.css
   → Variables CSS, unidades de escala --unit

## Contexto del acordeón diatónico vallenato
- 3 hileras de pitos (mano derecha):
  H1 Afuera: 10 botones × 2 (halar/empujar) = 20 notas
  H2 Medio:  11 botones × 2 = 22 notas  
  H3 Adentro: 10 botones × 2 = 20 notas
- Cada botón produce UNA nota al abrir y OTRA al cerrar el fuelle
- El acordeón es DIATÓNICO: no es como un piano cromático
- Las tonalidades se transponen matemáticamente (ver TONALIDADES)
- Bajos: NO incluir en el juego por ahora

## Lo que debes crear: AcordeonHero
Archivo: src/Paginas/AcordeonHero/AcordeonHero.tsx

### Layout visual (full screen, fondo oscuro con luces concierto)
```
[MAESTRO - izquierda]  [=== PUENTE 3 CARRILES ===]  [ALUMNO - derecha]
  Acordeón azul            notas viajan →              Acordeón rojo
```

### Sistema de carriles (3 horizontales)
- CARRIL ROJO   = H1 Afuera
- CARRIL VERDE  = H2 Medio
- CARRIL AZUL   = H3 Adentro
- Las notas viajan de izquierda a derecha
- Zona de golpe = línea central vertical

### Cada nota es un círculo con:
- Color de su hilera (rojo/verde/azul)
- Nombre musical (Do, Re, Sol...)
- Número de botón (1-10)
- Ícono A (abriendo) o C (cerrando)

### Motor de timing (Web Audio API)
- Clock basado en AudioContext.currentTime (no setTimeout)
- PERFECTO: delta < 50ms  → +300 pts, efecto dorado
- BIEN:     delta < 120ms → +100 pts, efecto verde  
- MAL:      delta > 120ms → 0 pts, efecto rojo, rompe combo
- Multiplicador de combo: x1 → x2 (10) → x3 (20) → x5 (50)

### Input del jugador
- Teclado PC usando mapaTeclas existente
- El acordeón del ALUMNO ilumina el botón exacto en tiempo real
- Tecla ESPACIO o botón UI = cambiar fuelle (halar/empujar)

### Adictividad (obligatorio implementar)
- Puntuación grande y animada en pantalla
- Mensaje PERFECTO/BIEN/MAL con animación de partículas
- Combo counter con multiplicador visual
- Barra de salud: 3 fallos seguidos = game over
- Al final: pantalla de resultados con % precisión y stars (1-3)
- Guardar score en Supabase tabla scores_hero

### Supabase (reutilizar cliente existente)
- Leer canciones de: canciones_hero (ya existe)
- Guardar scores en: scores_hero (crear si no existe)
  campos: user_id, cancion_id, score, precision, estrellas, fecha

### Stack técnico
- React + TypeScript (igual que el resto del proyecto)
- CSS igual al del simulador (variables --unit, colores existentes)
- Web Audio API para timing preciso (NO usar setTimeout para notas)
- Canvas o divs absolutos para las notas animadas (lo que sea más 
  performante para 60fps)
- Framer Motion para animaciones de UI (ya instalado)
- Lucide React para íconos (ya instalado)

## Lo que NO debes hacer
- No cambiar ningún archivo existente del simulador
- No incluir bajos en el juego (fase 2)
- No usar librerías de juego externas (Phaser, etc) — React puro
- No setTimeout para el motor de notas — solo AudioContext

## Orden de implementación sugerido
1. Layout visual con los dos acordeones y el puente vacío
2. Motor de notas (parsing de canciones_hero → NoteEvent[])
3. Animación de notas viajando en los carriles (requestAnimationFrame)
4. Sistema de input + detección de timing
5. UI de puntuación, combo, feedback visual
6. Pantalla de resultados + guardado en Supabase
```
