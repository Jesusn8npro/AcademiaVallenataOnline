<!-- Fondo espacial idéntico al de Rhythm Plus con estrellas en movimiento -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  
  // Variables para el renderizado (exactas de Rhythm Plus)
  let w: number, h: number, prevTime: number;
  
  // Estrellas (exacto como Rhythm Plus)
  let stars: Array<{
    x: number;
    y: number;
    z: number;
    vWeight: number;
    color: string;
  }> = [];
  
  // Colores de fondo que rotan (exactos de Rhythm Plus)
  const bgColors = [
    [27, 63, 171],
    [10, 166, 201],
    [169, 10, 201],
  ];
  let nextBgIdx = 1;
  let currentBg = [...bgColors[Math.floor(Math.random() * bgColors.length)]];
  
  onMount(() => {
    ctx = canvas.getContext('2d')!;
    resizeCanvas();
    makeStars(700); // 700 estrellas como Rhythm Plus
    animate();
    
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  });
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    w = canvas.width;
    h = canvas.height;
  }
  
  // Crear estrellas (función exacta de Rhythm Plus)
  function makeStars(count: number) {
    const colors = ["white"];
    stars = [];
    for (let i = 0; i < count; i++) {
      const s = {
        x: Math.random() * 1600 - 800,
        y: Math.random() * 900 - 450,
        z: Math.random() * 1000,
        vWeight: Math.random(),
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      stars.push(s);
    }
  }
  
  // Dibujar píxel de estrella (función exacta de Rhythm Plus)
  function putPixel(x: number, y: number, brightness: number, v: number) {
    const intensity = brightness * (Math.max(v * 2, 0.3) + 0.2);
    ctx.fillStyle = `rgba(255,255,255,${intensity})`;
    ctx.fillRect(x, y, 3, 3);
  }
  
  // Mover estrellas (función exacta de Rhythm Plus)
  function moveStars(distance: number, v: number) {
    const count = stars.length;
    for (let i = 0; i < count; i++) {
      const s = stars[i];
      s.z -= distance + distance * v * s.vWeight;
      while (s.z <= 1) {
        s.z += 1000;
      }
    }
  }
  
  // Actualizar color de fondo (función exacta de Rhythm Plus)
  function moveBgColor() {
    const newVal = (from: number, to: number) => {
      const delta = from - to > 0 ? -0.1 : 0.1;
      return Math.floor(from) == to ? Math.floor(from) : from + delta;
    };
    const nextBg = bgColors[nextBgIdx];
    currentBg[0] = newVal(currentBg[0], nextBg[0]);
    currentBg[1] = newVal(currentBg[1], nextBg[1]);
    currentBg[2] = newVal(currentBg[2], nextBg[2]);
    
    if (
      currentBg[0] == nextBg[0] &&
      currentBg[1] == nextBg[1] &&
      currentBg[2] == nextBg[2]
    ) {
      nextBgIdx++;
      if (nextBgIdx >= bgColors.length) nextBgIdx = 0;
    }
  }
  
  // Función de tick principal (exacta de Rhythm Plus)
  function tick(time: number, v: number) {
    let elapsed = time - prevTime;
    prevTime = time;

    moveStars(elapsed * 0.02 + v, v);

    const cx = w / 2;
    const cy = h / 2;

    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];

      const x = cx + star.x / (star.z * 0.001);
      const y = cy + star.y / (star.z * 0.001);

      if (x < 0 || x >= w || y < 0 || y >= h) {
        continue;
      }

      const d = star.z / 1000.0;
      const b = 1 - d * d;

      putPixel(x, y, b * 0.6, v);
    }
  }
  
  // Función principal de renderizado (exacta de Rhythm Plus)
  function renderSpaceVisualizer(time: number) {
    const x = w / 2;
    const y = h / 2;
    const innerRadius = 1;
    const outerRadius = Math.max(w, h);
    const v = 0.5; // Volumen simulado (en Rhythm Plus viene del audio)
    const blackColorStop = h < w ? 0.15 : 0.1; // laptop : mobile

    ctx.fillStyle = `rgba(0,0,0,0.4)`;
    ctx.clearRect(0, 0, w, h);
    ctx.fillRect(0, 0, w, h);

    // Gradiente radial (exacto de Rhythm Plus)
    const innerColour = "black";
    let grd = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
    grd.addColorStop(blackColorStop, innerColour);
    grd.addColorStop(
      1,
      `rgba(${currentBg[0]}, ${currentBg[1]}, ${currentBg[2]}, ${v - 0.25})`
    );
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    if (!prevTime) prevTime = time;
    tick(time, v);
    moveBgColor();
  }
  
  function animate(time?: number) {
    if (!time) time = performance.now();
    
    renderSpaceVisualizer(time);
    animationId = requestAnimationFrame(animate);
  }
</script>

<!-- Canvas para las estrellas en movimiento -->
<canvas bind:this={canvas} class="fondo-espacial"></canvas>

<!-- Imagen de fondo con zoom (exacta de Rhythm Plus) -->
<div class="imagen-fondo"></div>

<style>
  .fondo-espacial {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
  }
  
  .imagen-fondo {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -3;
    background: url('/assets/purpleSpace.jpg') no-repeat center center;
    background-size: cover;
    /* Animación de zoom exacta de Rhythm Plus */
    animation: zoom 20s ease-in-out infinite alternate;
  }
  
  /* Animación de zoom idéntica a Rhythm Plus */
  @keyframes zoom {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.5);
    }
  }
</style> 