# Export del CUERPO de Pelao (sin acordeon) -> personaje-pelao.glb (contrato del visor).
# Correr INLINE con Integracion_Final_Pelao_BAILES.blend ABIERTO (via MCP).
# Aprovecha el rig existente de Pelao (CTRL_Muneca_Bajos: la mano de bajos sigue la caja) para
# hornear la animacion 'Cierre' = brazo izq. siguiendo la tapa de bajos del AGARRE al CERRADO.
# Renombra mixamorig9: -> mixamorig: (el visor/GLTF lo necesita). Crea nodo 'AnclaAcordeon' = marco
# de parrilla.007 (el visor alinea ahi el acordeon compartido). Export con skins + accion.
# Luego: node scripts/comprimir-personaje-mixamo.mjs <raw> public/modelos3d/personaje-pelao.glb
import bpy, os, re
from mathutils import Vector

ARM_NAME, MESH_NAME = "Pelao armature moreno", "Pelao"
PARR, CTRL_BAJOS, PREFIJO = "parrilla.007", "Ctrl_Bajos.007", "mixamorig9:"
# El brazo cierra el MISMO recorrido que el morph del acordeon (Ctrl_Bajos.007 X-20). El visor limita el
# cierre real a MAX_CIERRE (usePersonajeFrame.ts) para no rasgar; cuerpo y acordeon comparten -20 →
# mano sincronizada con la caja. OJO: la escala del personaje en el .blend quedó inconsistente (sesión
# 11d) → este export da el armature a escala distinta de la del git; usar el GLB del git si calza.
CLOSE = Vector((-20.0, 0, 0))
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\pelao-cuerpo-raw.glb"
CON_ALPHA = re.compile(r'hair|eyelash|lashes|beard', re.I)

def limpiar_material(mat):
    md = mat.copy(); md.name = mat.name + "_EXP"
    if not md.use_nodes: return md
    nt = md.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not bsdf: return md
    conserva = bool(CON_ALPHA.search(mat.name))
    for ni in ('Roughness', 'Specular Tint', 'Specular IOR Level', 'Metallic'):
        s = bsdf.inputs.get(ni)
        if s:
            for l in list(s.links): nt.links.remove(l)
    alpha = bsdf.inputs.get('Alpha')
    if alpha and not conserva:
        for l in list(alpha.links): nt.links.remove(l)
        alpha.default_value = 1.0
    if bsdf.inputs.get('Roughness'): bsdf.inputs['Roughness'].default_value = 0.7
    if bsdf.inputs.get('Metallic'): bsdf.inputs['Metallic'].default_value = 0.0
    if not conserva:
        try: md.blend_method = 'OPAQUE'
        except Exception: pass
    return md

sc = bpy.context.scene
f0 = sc.frame_current
arm = bpy.data.objects[ARM_NAME]
mesh = bpy.data.objects[MESH_NAME]
parr = bpy.data.objects[PARR]
ctrl = bpy.data.objects[CTRL_BAJOS]

tmp = bpy.data.collections.get("_PELAOCUERPO_TMP")
if tmp:
    for o in list(tmp.objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_PELAOCUERPO_TMP"); sc.collection.children.link(tmp)

# 1) duplicar armature + malla; pose EVALUADA del original -> duplicado
dg = bpy.context.evaluated_depsgraph_get()
arm_ev = arm.evaluated_get(dg)
arm_dup = arm.copy(); arm_dup.data = arm.data.copy(); arm_dup.name = "EXP_arm"
tmp.objects.link(arm_dup)
arm_dup.animation_data_clear()
for pb in arm_dup.pose.bones:
    src = arm_ev.pose.bones.get(pb.name)
    if src: pb.matrix_basis = src.matrix_basis.copy()
mesh_dup = mesh.copy(); mesh_dup.data = mesh.data.copy(); mesh_dup.name = "EXP_" + MESH_NAME
tmp.objects.link(mesh_dup); mesh_dup.parent = arm_dup
for m in mesh_dup.modifiers:
    if m.type == 'ARMATURE': m.object = arm_dup
mats_dup = []
for slot in mesh_dup.material_slots:
    if slot.material:
        md = limpiar_material(slot.material); slot.material = md; mats_dup.append(md)

# 2) re-apuntar las constraints del duplicado a SI MISMO (IK/COPY_ROT) y a la caja original (CHILD_OF)
for bn in (PREFIJO + "LeftForeArm",):
    for c in arm_dup.pose.bones[bn].constraints:
        if c.type == 'IK': c.target = arm_dup
for bn in (PREFIJO + "LeftHand",):
    for c in arm_dup.pose.bones[bn].constraints:
        if c.type == 'COPY_ROTATION': c.target = arm_dup
# CTRL_Muneca_Bajos CHILD_OF ya apunta a la Caja.007 original (la que vamos a animar) -> ok

# 3) renombrar mixamorig9: -> mixamorig: (huesos + vgroups)
for b in arm_dup.data.bones:
    if b.name.startswith(PREFIJO): b.name = "mixamorig:" + b.name[len(PREFIJO):]
for vg in mesh_dup.vertex_groups:
    if vg.name.startswith(PREFIJO): vg.name = "mixamorig:" + vg.name[len(PREFIJO):]
bpy.context.view_layer.update()

# 4) animar la caja original: AGARRE (f1) -> CERRADO (f31), lineal
loc0 = ctrl.location.copy()
ctrl.animation_data_clear()
ctrl.location = loc0;          ctrl.keyframe_insert("location", frame=1)
ctrl.location = loc0 + CLOSE;  ctrl.keyframe_insert("location", frame=31)
# interpolacion LINEAL (API slotted Blender 5.1: layers->strips->channelbags->fcurves)
_act = ctrl.animation_data.action
for _layer in _act.layers:
    for _strip in _layer.strips:
        for _cb in _strip.channelbags:
            for _fc in _cb.fcurves:
                for _kp in _fc.keyframe_points: _kp.interpolation = 'LINEAR'
ctrl.location = loc0

# 5) hornear el duplicado (la mano sigue la caja via su rig) -> accion 'Cierre'
for o in list(bpy.context.selected_objects): o.select_set(False)
arm_dup.select_set(True); bpy.context.view_layer.objects.active = arm_dup
if bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
sc.frame_set(1)
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.select_all(action='SELECT')
bpy.ops.nla.bake(frame_start=1, frame_end=31, step=1, only_selected=False,
                 visual_keying=True, clear_constraints=True, use_current_action=False,
                 bake_types={'POSE'})
bpy.ops.object.mode_set(mode='OBJECT')
arm_dup.animation_data.action.name = "Cierre"

# 6) restaurar la caja original
ctrl.animation_data_clear(); ctrl.location = loc0
bpy.context.view_layer.update()

# 7) AnclaAcordeon = marco de parrilla.007 (en AGARRE)
sc.frame_set(1)
ancla = bpy.data.objects.new("AnclaAcordeon", None)
tmp.objects.link(ancla); ancla.matrix_world = parr.matrix_world.copy()

# 8) export
for o in list(bpy.context.selected_objects): o.select_set(False)
arm_dup.select_set(True); mesh_dup.select_set(True); ancla.select_set(True)
bpy.context.view_layer.objects.active = arm_dup
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=RUTA, use_selection=True,
    export_animations=True, export_animation_mode='ACTIVE_ACTIONS',
    export_image_format='AUTO', export_yup=True, export_apply=False,
    export_skins=True, export_def_bones=False)
mb = round(os.path.getsize(RUTA) / 1e6, 2)
try:
    acc = arm_dup.animation_data.action
    nkeys = len(acc.layers[0].strips[0].channelbags[0].fcurves)
except Exception:
    nkeys = -1

# 9) limpiar
datas = [arm_dup.data, mesh_dup.data]
for o in [arm_dup, mesh_dup, ancla]: bpy.data.objects.remove(o, do_unlink=True)
for d in datas:
    try:
        if isinstance(d, bpy.types.Mesh): bpy.data.meshes.remove(d)
        else: bpy.data.armatures.remove(d)
    except Exception: pass
for md in mats_dup:
    try: bpy.data.materials.remove(md)
    except Exception: pass
bpy.data.collections.remove(tmp)
sc.frame_set(f0)
result = {"glb_mb": mb, "cierre_fcurves": nkeys}
print("RESULT:", result)
