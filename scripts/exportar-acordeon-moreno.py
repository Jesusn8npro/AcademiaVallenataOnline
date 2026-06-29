# Export del ACORDEON COMPARTIDO (moreno .007) -> acordeon-personaje-v2.glb
# Correr INLINE con Integracion_Final_Pelao_BAILES.blend ABIERTO (via MCP).
# Hornea por depsgraph 2 estados del fuelle del .007 (Acordeon - Pelao moreno):
#   basis  = AGARRE (Ctrl_Bajos.007 en reposo, sep ~30.7)
#   Cerrar = CERRADO (Ctrl_Bajos.007 X -CLOSE, fuelle comprimido)
# Nombres: 'parrilla' (alineacion del visor) + ACC_<obj> (el visor quita ACC_); materiales acc_* se conservan.
# Luego comprimir:
#   node scripts/comprimir-acordeon-personaje.mjs public/modelos3d/_export/acordeon-moreno-raw.glb public/modelos3d/acordeon-personaje-v2.glb
import bpy, os
from mathutils import Vector

COL = "Acordeon - Pelao moreno"
CTRL = "Ctrl_Bajos.007"
CAJA_BAJOS = "Caja de los bajos, izquierda.007"
# El CERRADO (morph=1) se hornea donde la CAJA llega justo al tope ('Tope_Fuelle_Min' dist 8.5) y el
# FUELLE sigue COMPACTO. CLAVE: el tope frena la CAJA en 8.5, pero el fuelle sigue al Ctrl_Bajos por
# Spline IK → si se empuja el control de más (-18/-20) el fuelle se ESTIRA en picos contra la caja que
# ya paró (ancho 11.8 a -15 → 29 a -20 = reventado). -15 = caja en 8.5 + fuelle compacto (medido). Se
# desmutea el tope igual (por si -15 lo roza). Morph = basis(agarre)→cerrado, ambos limpios.
CLOSE = Vector((-15.0, 0, 0))
# El BASIS (reposo, morph=0) NO se hornea en el reposo abiertísimo (sep ~30) sino en la APERTURA DE
# AGARRE donde la mano de bajos del cuerpo (git) toca los botones — la calibración del visor medía
# restW≈0.265 del recorrido -20 → ahí está la mano. Horneando el basis a esa apertura, el reposo queda
# = geometría REAL de Blender (Spline IK, sin deformar) + mano sobre los botones (con restW=0 en el
# visor). Ajustar si la mano queda corrida (más negativo = más cerrado el reposo).
GRIP_OPEN = Vector((-5.3, 0, 0))
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-moreno-raw.glb"

sc = bpy.context.scene
col = bpy.data.collections[COL]
ctrl = bpy.data.objects[CTRL]
mallas = [o for o in col.objects if o.type == 'MESH']

# Reducir Subsurf a nivel 1 ANTES de hornear: los aros traen Subsurf 3/2 → 68 tris explotan a ~4352
# c/u (146 aros = ~635k tris) y al decimar esa malla subdividida se DEFORMA el fuelle. A nivel 1
# quedan ~270 tris (suaves, ligeros) y NO hace falta decimar → el morph se ve igual que en Blender.
_subsurf_orig = []
for _o in mallas:
    for _m in _o.modifiers:
        if _m.type == 'SUBSURF':
            _subsurf_orig.append((_m, _m.levels))
            _m.levels = 1
bpy.context.view_layer.update()

def snapshot_coords():
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    out = {}
    for o in mallas:
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        mw = ev.matrix_world.copy()
        out[o.name] = ([mw @ v.co for v in me.vertices], mw)
        bpy.data.meshes.remove(me)
    return out

# 1) BASIS = apertura de AGARRE (loc0 + GRIP_OPEN), donde la mano toca los botones (no el reposo abierto)
loc0 = ctrl.location.copy()
ctrl.location = loc0 + GRIP_OPEN
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
base = {}
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    base[o.name] = (me, ev.matrix_world.copy())

# 2) CERRADO en el TOPE (desmutear 'Tope_Fuelle_Min' → la caja se clava en 8.5, fuelle limpio sin rasgar)
_caja_bajos = bpy.data.objects[CAJA_BAJOS]
_tope = next((c for c in _caja_bajos.constraints if c.type == 'LIMIT_DISTANCE'), None)
_tope_mute0 = _tope.mute if _tope else None
if _tope: _tope.mute = False
ctrl.location = loc0 + CLOSE
snapC = snapshot_coords()
# restaurar agarre + estado del tope + Subsurf original (las mallas horneadas ya capturaron el nivel 1)
ctrl.location = loc0
if _tope: _tope.mute = _tope_mute0
for _m, _lv in _subsurf_orig: _m.levels = _lv
bpy.context.view_layer.update()

# 3) coleccion temporal de export
tmp = bpy.data.collections.get("_ACCMORENO_TMP")
if tmp:
    for o in list(tmp.objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_ACCMORENO_TMP"); sc.collection.children.link(tmp)

errores = []
for o in mallas:
    me0, mw0 = base[o.name]
    inv0 = mw0.inverted()
    nombre = "parrilla" if o.name.startswith("parrilla") else "ACC_" + o.name
    me0.name = nombre  # nombrar la MALLA (no solo el objeto): mallas multi-material se parten en
                       # primitivas y three.js usa el nombre de MALLA → si no, pierde "Caja de los bajos"
                       # y la calibración mano↔caja (cajaGrip) falla.
    nuevo = bpy.data.objects.new(nombre, me0)
    nuevo.matrix_world = mw0
    tmp.objects.link(nuevo)
    n = len(me0.vertices)
    vw, _ = snapC[o.name]
    if len(vw) != n:
        errores.append(f"{o.name}: topologia distinta"); continue
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

# 4) export GLB (solo morph, sin armature, sin animacion)
for o in list(bpy.context.selected_objects): o.select_set(False)
for o in tmp.objects: o.select_set(True)
bpy.context.view_layer.objects.active = tmp.objects[0]
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=RUTA, use_selection=True,
    export_animations=False, export_yup=True, export_apply=False,
    export_image_format='AUTO', export_morph=True, export_skins=False)

mb = round(os.path.getsize(RUTA) / 1e6, 2)
n_morph = sum(1 for o in tmp.objects if o.data.shape_keys)
# limpiar temporales
datas = []
for o in list(tmp.objects):
    if o.data: datas.append(o.data)
    bpy.data.objects.remove(o, do_unlink=True)
bpy.data.collections.remove(tmp)
for d in datas:
    try: bpy.data.meshes.remove(d)
    except Exception: pass
bpy.context.view_layer.update()
result = {"glb_mb": mb, "mallas": len(mallas), "con_morph_cerrar": n_morph, "errores": errores}
print("RESULT:", result)
