# Acordeon COMPARTIDO Pro Max v11: horneado desde la Muchacha .001 usando los 3 PUNTOS DE
# REFERENCIA del usuario (panel 'Fuelle: Puntos de referencia' / fuelle_refs.py), que definen el
# recorrido REAL y ASIMETRICO del fuelle:
#   AGARRE   ("Posicion correcta mano BAJOS")  -> base/reposo (morph 0, donde la mano agarra)
#   CERRADO  ("Fuelle cerrado")                -> morph 'Cerrar' (compresion maxima)
#   ABIERTO  ("Fuelle normal")                 -> morph 'Abrir'  (extension maxima)
# Se mueve caja.location (igual que el panel: en los refs el ctrl_loc NO cambia, solo caja.location)
# y el fuelle (Spline IK) sigue. NO destructivo: restaura caja.location/topes/subsurf.
# Contrato del visor: nodo 'parrilla' (matrix_world real) + ACC_<obj> + morphs 'Cerrar' y 'Abrir'.
# Comprimir: node scripts/comprimir-acordeon-personaje.mjs <raw> public/modelos3d/acordeon-personaje-v11.glb
import bpy, os
from mathutils import Vector

BODY_ARM = "Cuerpo Muchacha"
CTRL = "Ctrl_Bajos.001"
CAJA = "Caja de los bajos, izquierda.001"
PARR = "parrilla.001"
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-personaje-v11-raw.glb"

# caja.location de cada punto (de scripts/fuelle_puntos.json). Mismo rot_euler en todas las
# instancias -> estos valores locales son validos en la Muchacha .001.
AGARRE  = Vector((-0.250545, -0.321913, 1.37156))
CERRADO = Vector((-0.382521, -0.321987, 1.37598))
ABIERTO = Vector((-0.084248, -0.316395, 1.349512))

sc = bpy.context.scene
body_arm = bpy.data.objects[BODY_ARM]
ctrl = bpy.data.objects[CTRL]
caja = bpy.data.objects[CAJA]
parr = bpy.data.objects[PARR]

def descendientes(o):
    out = []
    for c in o.children:
        out.append(c); out.extend(descendientes(c))
    return out
def es_cuerpo(o):
    return any(m.type == 'ARMATURE' and m.object == body_arm for m in o.modifiers)
mallas = [o for o in descendientes(body_arm)
          if o.type == 'MESH' and len(o.data.vertices) > 0 and not es_cuerpo(o)]

# subsurf a nivel 1 para hornear liviano
_subsurf = []
for o in mallas:
    for m in o.modifiers:
        if m.type == 'SUBSURF':
            _subsurf.append((m, m.levels)); m.levels = 1

# mutear topes para que la caja se pueda mover libre a cada extremo
muted = []
for o in (ctrl, caja):
    for c in o.constraints:
        if c.type in ('LIMIT_LOCATION', 'LIMIT_DISTANCE') and not c.mute:
            c.mute = True; muted.append(c)
bpy.context.view_layer.update()

caja_orig = caja.location.copy()

def set_caja(v):
    caja.location = v
    bpy.context.view_layer.update()

def snapshot():
    """Vertices en MUNDO de cada malla, en la pose actual de la caja."""
    dg = bpy.context.evaluated_depsgraph_get()
    out = {}
    for o in mallas:
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        mw = ev.matrix_world.copy()
        out[o.name] = [mw @ v.co for v in me.vertices]
        bpy.data.meshes.remove(me)
    return out

# BASIS = AGARRE (reposo, donde la mano agarra). Se guarda la malla completa para exportar.
set_caja(AGARRE)
dg = bpy.context.evaluated_depsgraph_get()
base = {}
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    base[o.name] = (me, ev.matrix_world.copy())

snapC = (set_caja(CERRADO), snapshot())[1]   # Cerrar (cerrado)
snapA = (set_caja(ABIERTO), snapshot())[1]    # Abrir (abierto)

# restaurar escena
set_caja(caja_orig)
for m_, lv in _subsurf:
    m_.levels = lv
for c in muted:
    c.mute = False
bpy.context.view_layer.update()

# construir objetos temporales con morphs Cerrar + Abrir
tmp = bpy.data.collections.get("_ACCV11_TMP")
if tmp:
    for o in list(tmp.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_ACCV11_TMP"); sc.collection.children.link(tmp)

con_morph = 0
for o in mallas:
    me0, mw0 = base[o.name]
    inv0 = mw0.inverted()
    nombre = "parrilla" if o.name.lower().startswith("parrilla") else "ACC_" + o.name
    me0.name = nombre
    nuevo = bpy.data.objects.new(nombre, me0)
    nuevo.matrix_world = mw0
    tmp.objects.link(nuevo)
    n = len(me0.vertices)
    vwC = snapC.get(o.name); vwA = snapA.get(o.name)
    if not vwC or len(vwC) != n:
        continue
    # umbral: solo crea morph si la malla realmente se mueve entre extremos
    maxd = 0.0
    for i in range(0, n, max(1, n // 200)):
        d = (vwC[i] - (mw0 @ me0.vertices[i].co)).length
        if d > maxd:
            maxd = d
    if maxd < 0.001 and (not vwA or max((vwA[i] - (mw0 @ me0.vertices[i].co)).length for i in range(0, n, max(1, n // 200))) < 0.001):
        continue
    if not me0.shape_keys:
        nuevo.shape_key_add(name="Basis", from_mix=False)
    kb = nuevo.shape_key_add(name="Cerrar", from_mix=False)
    for i, v in enumerate(vwC):
        kb.data[i].co = inv0 @ v
    kb.value = 0.0
    if vwA and len(vwA) == n:
        ka = nuevo.shape_key_add(name="Abrir", from_mix=False)
        for i, v in enumerate(vwA):
            ka.data[i].co = inv0 @ v
        ka.value = 0.0
    con_morph += 1

for o in list(bpy.context.selected_objects): o.select_set(False)
for o in tmp.objects: o.select_set(True)
bpy.context.view_layer.objects.active = tmp.objects[0]
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
import sys
_old = sys.stdout
try:
    sys.stdout = open(os.devnull, "w")
    bpy.ops.export_scene.gltf(filepath=RUTA, use_selection=True,
        export_animations=False, export_yup=True, export_apply=False,
        export_image_format='AUTO', export_morph=True, export_skins=False)
finally:
    sys.stdout = _old
mb = round(os.path.getsize(RUTA) / 1e6, 2)
datas = []
for o in list(tmp.objects):
    if o.data: datas.append(o.data)
    bpy.data.objects.remove(o, do_unlink=True)
bpy.data.collections.remove(tmp)
for d in datas:
    try: bpy.data.meshes.remove(d)
    except Exception: pass
bpy.context.view_layer.update()
result = {"glb_mb": mb, "mallas": len(mallas), "con_morph": con_morph,
          "caja_restaurada": [round(x, 4) for x in caja.location]}
print("RESULT:", result)
