# Render del DIAPASÓN real (cara de melodía del acordeón rojo CORONA) para usarlo como
# fondo del SimuladorApp en lugar de la foto plana. Vista ORTOGRÁFICA de frente, ocultando
# los botones (la app dibuja los suyos encima) y el lado de bajos/fuelle/correas.
#
# Headless (NO toca la sesión abierta de Blender):
#   "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background --python scripts/render-diapason.py
#
# Salida: scripts/_renders-diapason/diapason.png  (luego se compone a JPG y va a public/).

import bpy
import os
from mathutils import Vector, Matrix

PROY = os.getcwd()
BLEND = r"C:\Users\acord\OneDrive\Desktop\XXX ACORDEON\ACTUALIZACION\JESUS - Acordeon listo.blend"
OUT_DIR = os.path.join(PROY, "scripts", "_renders-diapason")
os.makedirs(OUT_DIR, exist_ok=True)
RES_X, RES_Y = 1550, 550
MARGEN = 1.0  # cover: el diapasón LLENA el canvas (sin margen oscuro arriba/abajo)

# Colecciones / objetos a ocultar: botones (la app pinta los suyos), fuelle, bajos, correas.
COLS_OCULTAR = {"Fuelle", "Correas", "Broches cierra fuelle"}
OBJ_OCULTAR = {"Caja de los bajos, izquierda", "Botono broche bajos"}

import sys
DIAG = "--diag" in sys.argv

bpy.ops.wm.open_mainfile(filepath=BLEND)

SOLO = "Diapason Acrden"  # el ÚNICO componente que queremos: el diapasón (teclado de melodía)

if not DIAG:
    # Solo el diapasón: ocultamos TODOS los demás meshes.
    for o in bpy.data.objects:
        if o.type == "MESH" and o.name != SOLO:
            o.hide_render = True

if DIAG:
    MARGEN = 4.5

dia = bpy.data.objects["Diapason Acrden"]

# ── Cámara ortográfica de FRENTE a la cara del diapasón (orientación por PCA) ─
# La rotación grande + el Lattice hacen poco fiable adivinar la normal por los ejes
# locales. Sacamos los vértices YA evaluados (con modificadores) en MUNDO y hacemos PCA:
# eje de MENOR varianza = normal de la cara, eje de MAYOR varianza = horizontal.
import numpy as np

deps = bpy.context.evaluated_depsgraph_get()

def puntos_de(nombre):
    ob = bpy.data.objects.get(nombre)
    ev = ob.evaluated_get(deps)
    me = ev.to_mesh()
    mw = ob.matrix_world
    p = np.array([(mw @ v.co)[:] for v in me.vertices], dtype=float)
    ev.to_mesh_clear()
    return p

# ORIENTACIÓN: PCA del diapasón SOLO (es una placa plana → su eje de menor varianza ES la
# normal de la cara). Incluir la caja 3D rompería esto (su PCA apunta de lado).
pd = puntos_de("Diapason Acrden")
cov = np.cov((pd - pd.mean(axis=0)).T)
_, vecs = np.linalg.eigh(cov)  # ascendente: [menor, medio, mayor]
normal_w = Vector(vecs[:, 0].tolist()).normalized()
arriba_w = Vector(vecs[:, 1].tolist()).normalized()
largo_dir = Vector(vecs[:, 2].tolist()).normalized()
if normal_w.y > 0:           # la normal debe mirar al jugador (frente ≈ -Y)
    normal_w = -normal_w
if arriba_w.z > 0:           # orientación correcta del diapasón en el simulador (no al revés)
    arriba_w = -arriba_w

# ENCUADRE: SOLO el diapasón (ese es el componente que el usuario quiere, completo y lleno).
pts = pd
ejeL = np.array(largo_dir[:]); ejeA = np.array(arriba_w[:]); ejeN = np.array(normal_w[:])
pL, pA, pN = pts @ ejeL, pts @ ejeA, pts @ ejeN
cL = float((pL.max() + pL.min()) / 2); cA = float((pA.max() + pA.min()) / 2); cN = float((pN.max() + pN.min()) / 2)
centro = largo_dir * cL + arriba_w * cA + normal_w * cN
ancho = float(pL.max() - pL.min())
alto = float(pA.max() - pA.min())

cam_data = bpy.data.cameras.new("CamDia")
cam_data.type = "ORTHO"
# COVER: el diapasón debe LLENAR el canvas (sin margen oscuro arriba/abajo, para que el toolbar
# quede dentro del diapasón). ortho_scale mapea al ancho (dim mayor). Usamos el MÍNIMO entre ancho
# y alto·aspect → la placa cubre todo el alto y desborda apenas los lados (recorte mínimo).
aspect = RES_X / RES_Y
cam_data.ortho_scale = min(ancho, alto * aspect) * MARGEN
cam = bpy.data.objects.new("CamDia", cam_data)
bpy.context.collection.objects.link(cam)

zc = normal_w               # +Z de cámara (mira hacia -Z = hacia el objeto)
yc = arriba_w
xc = yc.cross(zc).normalized()
yc = zc.cross(xc).normalized()
rot = Matrix((xc, yc, zc)).transposed()
cam.matrix_world = Matrix.Translation(centro + normal_w * 1.0) @ rot.to_4x4()
bpy.context.scene.camera = cam
print(f"PCA ancho={ancho:.3f} alto={alto:.3f} ratio={ancho/alto:.2f} normal={tuple(round(v,2) for v in normal_w)}")

# ── Luces frontales suaves + mundo tenue ─────────────────────────────────────
def area(nombre, offset, energia, tam):
    ld = bpy.data.lights.new(nombre, type="AREA")
    ld.energy = energia
    ld.size = tam
    lo = bpy.data.objects.new(nombre, ld)
    bpy.context.collection.objects.link(lo)
    lo.location = centro + offset
    c = lo.constraints.new(type="TRACK_TO")
    obj_t = bpy.data.objects.new("T" + nombre, None)
    bpy.context.collection.objects.link(obj_t)
    obj_t.location = centro
    c.target = obj_t
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"

# Energías bajas: el diapasón mide ~0.27 m y las luces están a ~0.3 m → irradiancia ∝ 1/d²,
# así que con áreas grandes basta MUY poca potencia (W) para no quemar el render.
d = ancho
area("Key", normal_w * d * 1.4 + arriba_w * d * 0.5, 5.0, d * 1.6)
area("Fill", normal_w * d * 1.4 - arriba_w * d * 0.5 + xc * d * 0.6, 2.5, d * 1.8)

world = bpy.data.worlds.new("W")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.05, 0.05, 0.06, 1.0)
    bg.inputs[1].default_value = 0.25
bpy.context.scene.world = world

# ── Render ───────────────────────────────────────────────────────────────────
sc = bpy.context.scene
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        sc.render.engine = eng
        break
    except Exception:
        continue
try:
    sc.eevee.taa_render_samples = 96
except Exception:
    pass
sc.render.resolution_x = RES_X
sc.render.resolution_y = RES_Y
sc.render.film_transparent = True
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
try:
    sc.view_settings.view_transform = "Standard"
except Exception:
    pass

sc.render.filepath = os.path.join(OUT_DIR, "diapason.png")
bpy.ops.render.render(write_still=True)
print("LISTO-DIAPASON")
