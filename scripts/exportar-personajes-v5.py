# Export GLB de los personajes (v5) — formato pestaña Pro Max: cuerpo SKINNED liviano (sin acordeon)
# + accion 'Cierre' (brazo izq sigue la caja de bajos, sincroniza con el morph del acordeon compartido)
# + nodo AnclaAcordeon = parrilla. El visor carga 1 acordeon (acordeon-personaje-v9) y lo acopla al ancla.
# v5 vs v4: junta las mallas del cuerpo POR ARMATURE (skinned a arm), no por coleccion (las colecciones
# del archivo actual mezclan acordeon). + MAPEO empirico correcto del archivo Integracion actual.
# Correr inline via MCP con el .blend de personajes abierto. Luego comprimir cada raw:
#   node scripts/comprimir-personaje-mixamo.mjs public/modelos3d/_export/<slug>-raw.glb public/modelos3d/personaje-<slug>.glb
import bpy, os, re, math, json
from mathutils import Matrix, Quaternion, Vector

D_LOCAL_CIERRE = Vector((-0.5984, -0.0017, -0.0016))  # marco local de la caja (del morph Cerrar v2)
CON_ALPHA = re.compile(r'hair|eyelash|lashes|beard', re.I)

def _fcurves(action):
    # Blender 5.1: Action.fcurves no existe; estan en layers->strips->channelbags->fcurves.
    if hasattr(action, "fcurves") and len(getattr(action, "fcurves", [])) >= 0:
        try: return list(action.fcurves)
        except Exception: pass
    fcs = []
    for layer in action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                fcs.extend(cb.fcurves)
    return fcs

def limpiar_material(mat):
    md = mat.copy(); md.name = mat.name + "_EXP"
    if not md.use_nodes: return md
    nt = md.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not bsdf: return md
    conserva = bool(CON_ALPHA.search(mat.name))
    for ni in ('Roughness','Specular Tint','Specular IOR Level','Metallic'):
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

def exportar(armname, parrname, cajaname, prefijo_colon, ruta_glb):
    diag = {}
    arm = bpy.data.objects[armname]
    parr = bpy.data.objects[parrname]
    caja = bpy.data.objects[cajaname]
    d_world = caja.matrix_world.to_3x3() @ D_LOCAL_CIERRE
    # mallas del CUERPO = skinned a este armature (excluye acordeon)
    cuerpo_mallas = [o for o in bpy.data.objects if o.type == 'MESH'
                     and any(m.type == 'ARMATURE' and m.object == arm for m in o.modifiers)]

    tmp = bpy.data.collections.get("_EXPORT_TMP") or bpy.data.collections.new("_EXPORT_TMP")
    if tmp.name not in [c.name for c in bpy.context.scene.collection.children]:
        bpy.context.scene.collection.children.link(tmp)
    arm_dup = arm.copy(); arm_dup.data = arm.data.copy(); arm_dup.name = "EXP_" + armname
    tmp.objects.link(arm_dup)
    arm_dup.animation_data_clear()
    dg = bpy.context.evaluated_depsgraph_get()
    arm_ev = arm.evaluated_get(dg)
    for pb in arm_dup.pose.bones:
        src = arm_ev.pose.bones.get(pb.name)
        if src: pb.matrix_basis = src.matrix_basis.copy()
    bpy.context.view_layer.update()

    mesh_dups, mats_dup = [], []
    for o in cuerpo_mallas:
        m = o.copy(); m.data = o.data.copy(); m.name = "EXP_" + o.name
        tmp.objects.link(m)
        m.parent = arm_dup
        for mod in m.modifiers:
            if mod.type == 'ARMATURE': mod.object = arm_dup
        for slot in m.material_slots:
            if slot.material:
                md = limpiar_material(slot.material)
                slot.material = md
                mats_dup.append(md)
        mesh_dups.append(m)
    viejo = prefijo_colon
    for b in arm_dup.data.bones:
        if b.name.startswith(viejo): b.name = "mixamorig:" + b.name[len(viejo):]
    for m in mesh_dups:
        for vg in m.vertex_groups:
            if vg.name.startswith(viejo): vg.name = "mixamorig:" + vg.name[len(viejo):]
    bpy.context.view_layer.update()

    pbF = arm_dup.pose.bones["mixamorig:LeftForeArm"]
    pbH = arm_dup.pose.bones["mixamorig:LeftHand"]
    M_hand_arm_0 = pbH.matrix.copy()

    for o in list(bpy.context.selected_objects): o.select_set(False)
    arm_dup.select_set(True)
    bpy.context.view_layer.objects.active = arm_dup
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_dup.data.edit_bones.get("mixamorig:LeftHand")
    if eb: eb.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.view_layer.update()

    pbF = arm_dup.pose.bones["mixamorig:LeftForeArm"]
    pbH = arm_dup.pose.bones["mixamorig:LeftHand"]
    boneF0 = arm_dup.data.bones["mixamorig:LeftForeArm"]
    boneH0 = arm_dup.data.bones["mixamorig:LeftHand"]
    rd0 = boneF0.matrix_local.inverted() @ boneH0.matrix_local
    pbH.matrix_basis = (pbF.matrix @ rd0).inverted() @ M_hand_arm_0
    bpy.context.view_layer.update()
    mano0 = (arm_dup.matrix_world @ pbH.head).copy()
    d_arm = arm_dup.matrix_world.inverted().to_3x3() @ d_world

    tail_w = arm_dup.matrix_world @ pbF.tail
    tgt = bpy.data.objects.new("IK_TMP_TGT", None)
    tmp.objects.link(tgt)
    tgt.location = tail_w
    tgt.keyframe_insert("location", frame=1)
    tgt.location = tail_w + d_world
    tgt.keyframe_insert("location", frame=31)
    for fc in _fcurves(tgt.animation_data.action):
        for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
    con = pbF.constraints.new('IK')
    con.target = tgt
    con.chain_count = 2
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.nla.bake(frame_start=1, frame_end=31, step=2, only_selected=False,
                     visual_keying=True, clear_constraints=True, use_current_action=False,
                     bake_types={'POSE'})
    bpy.ops.object.mode_set(mode='OBJECT')
    accion = arm_dup.animation_data.action
    accion.name = "Cierre"

    boneF = arm_dup.data.bones["mixamorig:LeftForeArm"]
    boneH = arm_dup.data.bones["mixamorig:LeftHand"]
    rest_delta = boneF.matrix_local.inverted() @ boneH.matrix_local
    pbH.rotation_mode = 'QUATERNION'
    for f in range(1, 32, 2):
        bpy.context.scene.frame_set(f)
        bpy.context.view_layer.update()
        s = (f - 1) / 30.0
        M_des = Matrix.Translation(d_arm * s) @ M_hand_arm_0
        M_nat = pbF.matrix @ rest_delta
        pbH.matrix_basis = M_nat.inverted() @ M_des
        pbH.keyframe_insert("rotation_quaternion", frame=f)
        pbH.keyframe_insert("location", frame=f)
        pbH.keyframe_insert("scale", frame=f)
    bpy.context.scene.frame_set(31)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev2 = arm_dup.evaluated_get(dg)
    pbH2 = ev2.pose.bones["mixamorig:LeftHand"]
    mano31 = ev2.matrix_world @ pbH2.head
    diag["viaje_mano_cm"] = round((mano31 - mano0).length * 100, 2)
    diag["error_destino_mm"] = round(((mano31 - mano0) - d_world).length * 1000, 2)
    q0 = (arm_dup.matrix_world @ M_hand_arm_0).to_quaternion()
    q1 = (ev2.matrix_world @ pbH2.matrix).to_quaternion()
    diag["drift_orientacion_deg"] = round(math.degrees(q0.rotation_difference(q1).angle), 2)

    bpy.context.scene.frame_set(1)
    ancla = bpy.data.objects.new("AnclaAcordeon", None)
    tmp.objects.link(ancla)
    ancla.matrix_world = parr.matrix_world.copy()
    # NORMALIZAR ESCALA al tamaño del Pelao bueno: ancla -> 0.146 (factor ~0.00997 = /100).
    # Escala uniforme sobre el origen => conserva el agarre (mano/caja/ancla escalan juntos).
    F = 0.146 / parr.matrix_world.to_scale().x
    Sm = Matrix.Scale(F, 4)
    arm_dup.matrix_world = Sm @ arm_dup.matrix_world
    bpy.context.view_layer.update()
    ancla.matrix_world = Sm @ ancla.matrix_world
    bpy.context.view_layer.update()
    diag["F_escala"] = round(F, 5)
    for o in list(bpy.context.selected_objects): o.select_set(False)
    arm_dup.select_set(True)
    for m in mesh_dups: m.select_set(True)
    ancla.select_set(True)
    bpy.context.view_layer.objects.active = arm_dup
    os.makedirs(os.path.dirname(ruta_glb), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=ruta_glb, use_selection=True,
        export_animations=True, export_animation_mode='ACTIVE_ACTIONS',
        export_image_format='AUTO', export_yup=True, export_apply=False,
        export_skins=True, export_def_bones=False)
    diag["glb_mb"] = round(os.path.getsize(ruta_glb) / 1e6, 2)
    diag["mallas"] = len(mesh_dups)
    datas = [m.data for m in mesh_dups] + [arm_dup.data]
    for o in mesh_dups + [arm_dup, tgt, ancla]:
        bpy.data.objects.remove(o, do_unlink=True)
    for d in datas:
        try:
            if isinstance(d, bpy.types.Mesh): bpy.data.meshes.remove(d)
            else: bpy.data.armatures.remove(d)
        except Exception: pass
    for md in mats_dup:
        try: bpy.data.materials.remove(md)
        except Exception: pass
    try: bpy.data.actions.remove(accion)
    except Exception: pass
    return diag

f0 = bpy.context.scene.frame_current
BASE = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export"
# MAPEO EMPIRICO correcto del Integracion_Final_Pelao_BAILES.blend actual:
LOTE = [
  ("Pelao armature moreno", "parrilla.007", "Caja de los bajos, izquierda.007", "mixamorig9:", "pelao"),
  ("Armature sudadera", "parrilla.002", "Caja de los bajos, izquierda.002", "mixamorig7:", "sudadera"),
  ("Cuerpo Muchacha",   "parrilla.001", "Caja de los bajos, izquierda.001", "mixamorig:",  "muchacha"),
  ("Pelao de rojo",     "parrilla.005", "Caja de los bajos, izquierda.005", "mixamorig:",  "rojo"),
  ("Armature.001",      "parrilla.004", "Caja de los bajos, izquierda.004", "mixamorig1:", "vacana"),
  ("Persoanje Gris",    "parrilla.003", "Caja de los bajos, izquierda.003", "mixamorig5:", "gris"),
]
res = {}
for a, p, caja, pref, slug in LOTE:
    try:
        res[slug] = exportar(a, p, caja, pref, os.path.join(BASE, f"{slug}-raw.glb"))
    except Exception as ex:
        res[slug] = {"ERROR": str(ex)}
bpy.context.scene.frame_set(f0)
result = res
