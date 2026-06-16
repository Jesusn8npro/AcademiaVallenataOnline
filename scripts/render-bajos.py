# Render del lado de BAJOS real (fuelle + caja de los bajos del acordeón rojo CORONA) para usarlo
# como franja de fondo del panel de bajos del SimuladorApp. Misma orientación frontal que el
# diapasón (el frente del acordeón mira para el mismo lado). Oculta los botones de bajos (la app
# pinta los suyos) y todo el lado de melodía.
#
# Headless (NO toca la sesión abierta de Blender):
#   "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background --python scripts/render-bajos.py
#
# Salida: scripts/_renders-diapason/bajos.png  (luego optimizar-bajos.mjs lo lleva a public/).

import bpy
import os
import sys
import numpy as np
from mathutils import Vector, Matrix

PROY = os.getcwd()
BLEND = r"C:\Users\acord\OneDrive\Desktop\XXX ACORDEON\ACTUALIZACION\JESUS - Acordeon listo.blend"
OUT_DIR = os.path.join(PROY, "scripts", "_renders-diapason")
os.makedirs(OUT_DIR, exist_ok=True)
RES_X, RES_Y = 1550, 305   # franja ancha del fuelle (igual aspect que la imagen actual)
MARGEN = 1.0
DIAG = "--diag" in sys.argv

# Lo que SÍ se muestra: el fuelle (su colección) + la caja de los bajos.
COLS_MOSTRAR = {"Fuelle"}
OBJ_MOSTRAR = {"Caja de los bajos, izquierda", "Marco de fuelle bajos 2"}

bpy.ops.wm.open_mainfile(filepath=BLEND)

# El nombre del diapasón cambió entre versiones del .blend ("Diapason Acrden" → "Diapason Acordeon").
# Lo resolvemos por coincidencia para no romper con futuros renombres.
DIA = next(o.name for o in bpy.data.objects if o.type == "MESH" and "iapason" in o.name)

def es_subjeto(o):
    cols = {c.name for c in o.users_collection}
    return o.name in OBJ_MOSTRAR or (cols & COLS_MOSTRAR)

if not DIAG:
    for o in bpy.data.objects:
        if o.type == "MESH" and not es_subjeto(o):
            o.hide_render = True

    # FUELLE COMPLETAMENTE CERRADO: el shape key "Cerrar" está en todas las piezas del lado bajos
    # (fuelle, caja, marco, botones) → ponerlo a 1 cierra el acordeón como bloque. La acción
    # "Fuelle (abrir-cerrar)" anima ese valor en el fuelle (frame 1 = abierto), así que la quitamos
    # para que el valor manual no sea pisado al renderizar.
    fsk = bpy.data.objects["fuelle"].data.shape_keys
    if fsk and fsk.animation_data:
        fsk.animation_data.action = None
    for o in bpy.data.objects:
        if o.type == "MESH" and o.data.shape_keys:
            kb = o.data.shape_keys.key_blocks.get("Cerrar")
            if kb:
                kb.value = 1.0
    bpy.context.view_layer.update()

deps = bpy.context.evaluated_depsgraph_get()

def puntos_de(nombre):
    ob = bpy.data.objects.get(nombre)
    if not ob:
        return np.empty((0, 3))
    ev = ob.evaluated_get(deps)
    me = ev.to_mesh()
    mw = ob.matrix_world
    p = np.array([(mw @ v.co)[:] for v in me.vertices], dtype=float)
    ev.to_mesh_clear()
    return p[np.isfinite(p).all(axis=1)] if len(p) else p

def puntos_raw(nombre):
    # Malla BASE (sin modificadores) → evita NaN de modificadores rotos (Lattice del diapasón).
    ob = bpy.data.objects.get(nombre)
    if ob is None:  # por si el nombre llega con espacios raros
        ob = next(o for o in bpy.data.objects if o.name.strip() == nombre)
    mw = ob.matrix_world
    return np.array([(mw @ v.co)[:] for v in ob.data.vertices], dtype=float)

# ORIENTACIÓN frontal: PCA del diapasón (placa plana → frente del acordeón). Usamos su malla BASE
# (sin el Lattice, que se rompe a NaN al recalcular) solo para sacar los ejes.
pd = puntos_raw(DIA)
cov = np.cov((pd - pd.mean(axis=0)).T)
_, vecs = np.linalg.eigh(cov)
normal_w = Vector(vecs[:, 0].tolist()).normalized()
arriba_w = Vector(vecs[:, 1].tolist()).normalized()
largo_dir = Vector(vecs[:, 2].tolist()).normalized()
if normal_w.y > 0:
    normal_w = -normal_w
# Girar 90°: el eje LARGO del diapasón es el vertical del acordeón → para la franja de bajos
# queremos el FUELLE en horizontal, así que intercambiamos el eje horizontal y el vertical.
largo_dir, arriba_w = arriba_w, largo_dir
if arriba_w.z < 0:
    arriba_w = -arriba_w

# ENCUADRE: fuelle + caja de bajos.
partes = [puntos_de(n) for n in (list(OBJ_MOSTRAR) + ["fuelle", "Marco fuelle 1"])]
pts = np.vstack([p for p in partes if len(p)])
ejeL = np.array(largo_dir[:]); ejeA = np.array(arriba_w[:]); ejeN = np.array(normal_w[:])
pL, pA, pN = pts @ ejeL, pts @ ejeA, pts @ ejeN
cL = float((pL.max() + pL.min()) / 2); cA = float((pA.max() + pA.min()) / 2); cN = float((pN.max() + pN.min()) / 2)
centro = largo_dir * cL + arriba_w * cA + normal_w * cN
ancho = float(pL.max() - pL.min())
alto = float(pA.max() - pA.min())

cam_data = bpy.data.cameras.new("CamBajos")
cam_data.type = "ORTHO"
aspect = RES_X / RES_Y
cam_data.ortho_scale = (min(ancho, alto * aspect) if not DIAG else max(ancho, alto * aspect) * 1.4) * MARGEN
cam = bpy.data.objects.new("CamBajos", cam_data)
bpy.context.collection.objects.link(cam)

zc = normal_w
yc = arriba_w
xc = yc.cross(zc).normalized()
yc = zc.cross(xc).normalized()
rot = Matrix((xc, yc, zc)).transposed()
cam.matrix_world = Matrix.Translation(centro + normal_w * 1.0) @ rot.to_4x4()
bpy.context.scene.camera = cam
print(f"PCA ancho={ancho:.3f} alto={alto:.3f} ratio={ancho/alto:.2f} normal={tuple(round(v,2) for v in normal_w)}")

# ── Luces (energía ∝ d² para irradiancia constante sin importar el tamaño) ───
def area(nombre, offset, energia, tam):
    ld = bpy.data.lights.new(nombre, type="AREA")
    ld.energy = energia
    ld.size = tam
    lo = bpy.data.objects.new(nombre, ld)
    bpy.context.collection.objects.link(lo)
    lo.location = centro + offset
    c = lo.constraints.new(type="TRACK_TO")
    t = bpy.data.objects.new("T" + nombre, None)
    bpy.context.collection.objects.link(t)
    t.location = centro
    c.target = t
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"

d = max(ancho, alto)
escala_E = (d / 0.27) ** 2     # 5 W funcionó para el diapasón (~0.27 m); escalamos al tamaño real
area("Key", normal_w * d * 1.2 + arriba_w * d * 0.4, 5.0 * escala_E, d * 1.4)
area("Fill", normal_w * d * 1.2 - arriba_w * d * 0.4 + xc * d * 0.5, 2.6 * escala_E, d * 1.6)

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

sc.render.filepath = os.path.join(OUT_DIR, "bajos.png")
bpy.ops.render.render(write_still=True)
print("LISTO-BAJOS")
