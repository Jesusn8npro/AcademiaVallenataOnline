# Export UNIVERSAL de un personaje (cuerpo + acordeon nuevo) horneados JUNTOS para /test-personaje-3d.
# Generalizacion de exportar-pelao-fuelle-libre.py para CUALQUIER personaje del .blend.
#   BASIS  = pose ESTANDAR de agarre (reposo actual; distancia de cajas = 16.92, igual para todos).
#   Cerrar = el fuelle cerrado, moviendo el CONTROL en ESPACIO MUNDO a lo largo de la linea entre cajas
#            (robusto a la escala disparatada de cada rig: Ctrl puede tener escala 1 o 100).
# Cierre universal: CLOSE_WORLD=9.36 cierra 16.92 -> 7.56 en TODOS (medido). Mano sigue por IK del rig,
# fuelle por Spline IK -> se hornean como morphs Cerrar_1..N. Todo mallas morph, SIN skins. NO destructivo.
# Comprimir: node scripts/comprimir-pelao-fuelle.mjs <raw> public/modelos3d/<slug>-grip-vN.glb
import bpy, os
from mathutils import Vector

# ---- PARAMETROS POR PERSONAJE ----
# Se puede inyectar `PERS_OVERRIDE` en el namespace antes de exec() para correr otro personaje
# sin editar el archivo. Si no, usa la Muchacha por defecto.
PERS = globals().get("PERS_OVERRIDE") or {
    "slug": "muchacha",
    "BODY_ARM": "Cuerpo Muchacha",                       # armature del cuerpo (se juntan TODAS sus mallas)
    "CTRL":     "Ctrl_Bajos.001",                        # control de la caja de bajos
    "CAJA":     "Caja de los bajos, izquierda.001",      # caja de bajos (su LIMIT_DISTANCE se mutea)
    "CAJA_PARR":"Caja de parrilla, derecha.001",         # caja de parrilla (extremo fijo)
    "PARR":     "parrilla.001",                          # malla parrilla (ancla del acordeon)
}
CLOSE_WORLD = 9.36   # delta en MUNDO para cerrar (16.92 -> 7.56), universal
NMORPH = 3           # pasos intermedios del cierre (suave)
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\%s-grip-raw.glb" % PERS["slug"]
# ------------------------------------------------------------------

sc = bpy.context.scene
f0 = sc.frame_current
body_arm = bpy.data.objects[PERS["BODY_ARM"]]
ctrl = bpy.data.objects[PERS["CTRL"]]
caja = bpy.data.objects[PERS["CAJA"]]
caja_parr = bpy.data.objects[PERS["CAJA_PARR"]]
parr = bpy.data.objects[PERS["PARR"]]

# juntar TODAS las mallas que cuelgan del armature del cuerpo (cuerpo + acordeon)
def descendientes(o):
    out = []
    for c in o.children:
        out.append(c); out.extend(descendientes(c))
    return out
todos = [body_arm] + descendientes(body_arm)
mallas = [o for o in todos if o.type == 'MESH' and len(o.data.vertices) > 0]

# clasificar cuerpo (skinned al armature del cuerpo) vs acordeon (lo demas)
def es_cuerpo(o):
    return any(m.type == 'ARMATURE' and m.object == body_arm for m in o.modifiers)

# mutear topes que clampan el recorrido (LIMIT_LOCATION en Ctrl + LIMIT_DISTANCE en caja)
_muted = []
for o in (ctrl, caja):
    for c in o.constraints:
        if c.type in ('LIMIT_LOCATION', 'LIMIT_DISTANCE') and not c.mute:
            c.mute = True; _muted.append(c)

# neutralizar una accion en el control si la hubiera (no destructivo: se restaura)
_act0 = None
if ctrl.animation_data and ctrl.animation_data.action:
    _act0 = ctrl.animation_data.action; ctrl.animation_data.action = None

bpy.context.view_layer.update()

# direccion de cierre en MUNDO: de la caja de bajos hacia la de parrilla
b0 = caja.matrix_world.translation.copy()
p0 = caja_parr.matrix_world.translation.copy()
dir_close = (p0 - b0).normalized()
mw0 = ctrl.matrix_world.copy()

tmp = bpy.data.collections.get("_PERSGRIP_TMP")
if tmp:
    for o in list(tmp.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_PERSGRIP_TMP")
    sc.collection.children.link(tmp)

# Subsurf -> 1 (aros pesados); se restaura al final.
_subsurf = []
for _o in mallas:
    for _m in _o.modifiers:
        if _m.type == 'SUBSURF':
            _subsurf.append((_m, _m.levels)); _m.levels = 1
bpy.context.view_layer.update()

def _ctrl_at(t):  # t=0 abierto (estandar 16.92) -> t=1 cerrado (~7.56)
    m = mw0.copy()
    m.translation = mw0.translation + dir_close * (CLOSE_WORLD * t)
    ctrl.matrix_world = m
    bpy.context.view_layer.update()

# BASIS = abierto (pose estandar)
_ctrl_at(0.0)
dg = bpy.context.evaluated_depsgraph_get()
base = {}
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    base[o.name] = (me, ev.matrix_world.copy())

# snapshots hacia cerrado (knots 1..NMORPH)
snaps = []
for i in range(1, NMORPH + 1):
    _ctrl_at(i / NMORPH)
    dg = bpy.context.evaluated_depsgraph_get()
    snap = {}
    for o in mallas:
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        mw = ev.matrix_world.copy()
        snap[o.name] = [mw @ v.co for v in me.vertices]
        bpy.data.meshes.remove(me)
    snaps.append(snap)

# restaurar control + subsurf
ctrl.matrix_world = mw0
for _m, _lv in _subsurf:
    _m.levels = _lv
bpy.context.view_layer.update()

# construir mallas con morphs Cerrar_1..N
objs = []
errores = []
con_morph = 0
for o in mallas:
    me0, mw0m = base[o.name]
    inv0 = mw0m.inverted()
    if o is body_arm:
        continue
    if o.name.lower().startswith("parrilla"):
        nombre = "parrilla"
    elif es_cuerpo(o):
        nombre = o.name           # mallas del cuerpo conservan nombre
    else:
        nombre = "ACC_" + o.name  # mallas del acordeon
    me0.name = nombre
    nuevo = bpy.data.objects.new(nombre, me0)
    nuevo.matrix_world = mw0m
    tmp.objects.link(nuevo); objs.append(nuevo)
    n = len(me0.vertices)
    vwL = snaps[-1].get(o.name)
    if not vwL or len(vwL) != n:
        if vwL is not None and len(vwL) != n:
            errores.append(o.name + ":topo")
        continue
    maxd = 0.0
    for k in range(0, n, max(1, n // 200)):
        d = (vwL[k] - (mw0m @ me0.vertices[k].co)).length
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
ctrl.matrix_world = mw0
for c in _muted:
    c.mute = False
if _act0 is not None:
    ctrl.animation_data.action = _act0
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
result = {"slug": PERS["slug"], "glb_mb": mb, "mallas": len(mallas),
          "con_morph": con_morph, "nmorph": NMORPH, "errores": errores[:8]}
print("RESULT:", result)
