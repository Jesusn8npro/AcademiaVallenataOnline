# Pelao + acordeon HORNEADOS JUNTOS para /test-personaje-3d, copiando EXACTO los puntos de referencia
# guardados en Blender (panel Fuelle) para no tener errores:
#   BASIS  = "Posicion correcta mano BAJOS"  (abierto / pose estandar de los personajes; default al cargar)
#   'Cerrar' = "Fuelle cerrado"              (limite cerrado; al que llega cuando se pisa Q)
# Mueve la CAJA de bajos a esos caja_loc/caja_rot exactos (como el panel _aplicar). El brazo sigue por el
# rig (IK+ChildOf) y el fuelle deforma por Spline IK -> se hornean como morph 'Cerrar' (basis=abierto).
# Todo como mallas morph, SIN skins. NO destructivo (snapshots por depsgraph, restaura la caja).
# Comprimir: node scripts/comprimir-pelao-fuelle.mjs <raw> public/modelos3d/pelao-grip-vN.glb
import bpy, os
from mathutils import Vector, Euler

MESH_NAME = "Pelao"
CTRL = "Ctrl_Bajos.007"
CAJA = "Caja de los bajos, izquierda.007"
PARR = "parrilla.007"
COL_ACC = "Acordeon - Pelao moreno"
# DISTANCIA ESTÁNDAR de cajas = 16.92 (la que tienen TODOS los otros personajes: Muchacha, Sudadera,
# Muchacho rojo, Hembra Vacana). El Pelao en reposo está en 7.556 (cerrado). Ctrl_Bajos +9.4 -> ~16.92.
#   BASIS  = ABIERTO 16.92 (Ctrl_Bajos +9.4) = pose ESTÁNDAR de los personajes (default al cargar).
#   Cerrar = CERRADO (Ctrl_Bajos +0 = reposo 7.556). Q cierra desde el estándar.
OPEN_DELTA = Vector((9.4, 0, 0))    # distancia ~16.92 (estándar)
CLOSE_DELTA = Vector((0.0, 0, 0))   # distancia 7.556 (cerrado)
NMORPH = 3  # pasos intermedios del cierre (suave)
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\pelao-grip-raw.glb"

sc = bpy.context.scene
f0 = sc.frame_current
ctrl = bpy.data.objects[CTRL]
ctrl_loc0 = ctrl.location.copy()
caja = bpy.data.objects[CAJA]
_tope = next((c for c in caja.constraints if c.type == 'LIMIT_DISTANCE'), None)
_tope0 = _tope.mute if _tope else None
if _tope: _tope.mute = True   # sin tope: recorrido lineal limpio en el rango abierto
parr = bpy.data.objects[PARR]
col = bpy.data.collections[COL_ACC]
body = bpy.data.objects[MESH_NAME]
mallas = [body] + [o for o in col.objects if o.type == 'MESH']

tmp = bpy.data.collections.get("_PELAOFUELLE_TMP")
if tmp:
    for o in list(tmp.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_PELAOFUELLE_TMP")
    sc.collection.children.link(tmp)

# Subsurf -> 1 (aros pesados); se restaura al final.
_subsurf = []
for _o in mallas:
    for _m in _o.modifiers:
        if _m.type == 'SUBSURF':
            _subsurf.append((_m, _m.levels)); _m.levels = 1
bpy.context.view_layer.update()

ctrl.animation_data_clear()

def _caja_at(t):  # t=0 abierto (estandar 16.92) -> t=1 cerrado (7.556)
    ctrl.location = ctrl_loc0 + OPEN_DELTA * (1.0 - t) + CLOSE_DELTA * t
    bpy.context.view_layer.update()

# BASIS = abierto (pose estandar 16.92)
_caja_at(0.0)
dg = bpy.context.evaluated_depsgraph_get()
base = {}
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    base[o.name] = (me, ev.matrix_world.copy())

# snapshots hacia cerrado (knots 1..NMORPH)
snaps = []
for i in range(1, NMORPH + 1):
    _caja_at(i / NMORPH)
    dg = bpy.context.evaluated_depsgraph_get()
    snap = {}
    for o in mallas:
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        mw = ev.matrix_world.copy()
        snap[o.name] = [mw @ v.co for v in me.vertices]
        bpy.data.meshes.remove(me)
    snaps.append(snap)

# restaurar caja + subsurf
ctrl.location = ctrl_loc0
for _m, _lv in _subsurf:
    _m.levels = _lv
bpy.context.view_layer.update()

# construir mallas con morphs Cerrar_1..N (cuerpo + acordeon)
objs = []
errores = []
con_morph = 0
for o in mallas:
    me0, mw0 = base[o.name]
    inv0 = mw0.inverted()
    if o is body:
        nombre = "Pelao"
    elif o.name.startswith("parrilla"):
        nombre = "parrilla"
    else:
        nombre = "ACC_" + o.name
    me0.name = nombre
    nuevo = bpy.data.objects.new(nombre, me0)
    nuevo.matrix_world = mw0
    tmp.objects.link(nuevo); objs.append(nuevo)
    n = len(me0.vertices)
    vwL = snaps[-1].get(o.name)
    if not vwL or len(vwL) != n:
        if vwL is not None and len(vwL) != n:
            errores.append(o.name + ":topo")
        continue
    maxd = 0.0
    for k in range(0, n, max(1, n // 200)):
        d = (vwL[k] - (mw0 @ me0.vertices[k].co)).length
        if d > maxd:
            maxd = d
    if maxd < 0.0005:
        continue  # pieza quieta -> sin morph
    if not me0.shape_keys:
        nuevo.shape_key_add(name="Basis", from_mix=False)
    for i in range(1, NMORPH + 1):
        vw = snaps[i - 1][o.name]
        kb = nuevo.shape_key_add(name="Cerrar_%d" % i, from_mix=False)
        for k, wc in enumerate(vw):
            kb.data[k].co = inv0 @ wc
        kb.value = 0.0
    con_morph += 1

# AnclaAcordeon = marco de parrilla (abierto)
ancla = bpy.data.objects.new("AnclaAcordeon", None)
tmp.objects.link(ancla)
ancla.matrix_world = parr.matrix_world.copy()

# EXPORT (solo morphs, sin skins, sin animacion)
for o in list(bpy.context.selected_objects):
    o.select_set(False)
for o in tmp.objects:
    o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=RUTA, use_selection=True,
    export_animations=False, export_morph=True, export_skins=False,
    export_yup=True, export_apply=False, export_image_format='AUTO')
mb = round(os.path.getsize(RUTA) / 1e6, 2)

# RESTAURAR TODO
ctrl.location = ctrl_loc0
if _tope: _tope.mute = _tope0
datas = []
for o in list(tmp.objects):
    if o.data and o.type == 'MESH':
        datas.append(o.data)
    bpy.data.objects.remove(o, do_unlink=True)
bpy.data.collections.remove(tmp)
for d in datas:
    try: bpy.data.meshes.remove(d)
    except Exception: pass
sc.frame_set(f0)
bpy.context.view_layer.update()
result = {"glb_mb": mb, "mallas": len(mallas), "con_morph": con_morph, "nmorph": NMORPH, "errores": errores[:8]}
print("RESULT:", result)
