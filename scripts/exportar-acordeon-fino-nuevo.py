# Acordeon NUEVO (fuelle nuevo) con el CONTRATO del visor Pro Max 'acordeon-fino':
#  - Pose de AGARRE (Ctrl_Bajos.007 -5.3) -> distancia entre cajas ~9.3 = la de los personajes.
#  - Morph 'Cerrar' (basis=agarre -> cerrado en el tope -15) para que el cierre del fuelle funcione igual.
#  - Nombres PLANOS (parrilla exacto, fuelle exacto, Boton_D_*/Boton_I_* originales) -> sin prefijo ACC_.
#  - Z-UP (export_yup=False) como el acordeon-fino (el visor aplica el -90 en X).
#  - SIN skins/huesos (liviano). NO destructivo (snapshots por depsgraph, restaura todo).
# Correr INLINE con Pelao_segmentos_web.blend ABIERTO (via MCP). Luego comprimir:
#   node scripts/comprimir-acordeon-personaje.mjs <raw> public/modelos3d/acordeon-fino-nuevo-v2.glb
import bpy, os
from mathutils import Vector

COL = "Acordeon - Pelao moreno"
CTRL = "Ctrl_Bajos.007"
CAJA_BAJOS = "Caja de los bajos, izquierda.007"
GRIP_OPEN = Vector((-5.3, 0, 0))   # AGARRE: mano de bajos sobre los botones (distancia cajas ~9.3)
CLOSE = Vector((-15.0, 0, 0))      # CERRADO en el tope (fuelle compacto, sin reventar)
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-fino-nuevo-raw.glb"

sc = bpy.context.scene
col = bpy.data.collections[COL]
ctrl = bpy.data.objects[CTRL]
mallas = [o for o in col.objects if o.type == 'MESH']

# Subsurf -> 1 (aros pesados)
_subsurf = []
for _o in mallas:
    for _m in _o.modifiers:
        if _m.type == 'SUBSURF':
            _subsurf.append((_m, _m.levels)); _m.levels = 1
bpy.context.view_layer.update()

loc0 = ctrl.location.copy()

# 1) BASIS = AGARRE
ctrl.location = loc0 + GRIP_OPEN
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
base = {}
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    base[o.name] = (me, ev.matrix_world.copy())

# 2) CERRADO en el tope (desmutar Tope_Fuelle_Min)
_caja = bpy.data.objects[CAJA_BAJOS]
_tope = next((c for c in _caja.constraints if c.type == 'LIMIT_DISTANCE'), None)
_tope0 = _tope.mute if _tope else None
if _tope: _tope.mute = False
ctrl.location = loc0 + CLOSE
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
snapC = {}
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    mw = ev.matrix_world.copy()
    snapC[o.name] = ([mw @ v.co for v in me.vertices], mw)
    bpy.data.meshes.remove(me)
ctrl.location = loc0
if _tope: _tope.mute = _tope0
for _m, _lv in _subsurf: _m.levels = _lv
bpy.context.view_layer.update()

# 3) coleccion temporal con nombres PLANOS + morph Cerrar
tmp = bpy.data.collections.get("_ACCFINONUEVO_TMP")
if tmp:
    for o in list(tmp.objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_ACCFINONUEVO_TMP"); sc.collection.children.link(tmp)

def nombre_plano(n):
    if n.startswith("parrilla"): return "parrilla"
    if n.startswith("Fuelle20"): return "fuelle"
    return n  # Boton_D_01.007, Caja de los bajos..., etc. (three.js sanea; el visor hace match por prefijo/includes)

errores = []
for o in mallas:
    me0, mw0 = base[o.name]
    inv0 = mw0.inverted()
    nombre = nombre_plano(o.name)
    me0.name = nombre
    nuevo = bpy.data.objects.new(nombre, me0)
    nuevo.matrix_world = mw0
    tmp.objects.link(nuevo)
    n = len(me0.vertices)
    vw, _ = snapC[o.name]
    if len(vw) != n:
        errores.append(o.name + ":topo"); continue
    maxd = 0.0
    for i in range(0, n, max(1, n // 200)):
        d = (vw[i] - (mw0 @ me0.vertices[i].co)).length
        if d > maxd: maxd = d
    if maxd < 0.001:
        continue  # pieza quieta -> sin morph
    if not me0.shape_keys:
        nuevo.shape_key_add(name="Basis", from_mix=False)
    kb = nuevo.shape_key_add(name="Cerrar", from_mix=False)
    for i, v in enumerate(vw): kb.data[i].co = inv0 @ v
    kb.value = 0.0

# 4) export Z-UP (yup=False) solo morph, sin skins, sin animacion
for o in list(bpy.context.selected_objects): o.select_set(False)
for o in tmp.objects: o.select_set(True)
bpy.context.view_layer.objects.active = tmp.objects[0]
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=RUTA, use_selection=True,
    export_animations=False, export_yup=False, export_apply=False,
    export_image_format='AUTO', export_morph=True, export_skins=False)
mb = round(os.path.getsize(RUTA) / 1e6, 2)
n_morph = sum(1 for o in tmp.objects if o.data.shape_keys)

# 5) limpiar
datas = []
for o in list(tmp.objects):
    if o.data: datas.append(o.data)
    bpy.data.objects.remove(o, do_unlink=True)
bpy.data.collections.remove(tmp)
for d in datas:
    try: bpy.data.meshes.remove(d)
    except Exception: pass
bpy.context.view_layer.update()
result = {"glb_mb": mb, "mallas": len(mallas), "con_morph_cerrar": n_morph, "errores": errores[:8]}
print("RESULT:", result)
