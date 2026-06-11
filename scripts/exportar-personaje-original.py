import bpy, os, re
from mathutils import Matrix, Quaternion, Vector

R_PARR = (0.7678311467170715, -0.025250963866710663, -0.09746069461107254, 0.6326921582221985)
S_PARR = (0.14643797278404236, 0.13639819622039795, 0.14641721546649933)
S_CAJA = (0.14644500613212585, 0.14644497632980347, 0.14644494652748108)
D_LOCAL = Vector((-1.5393788814544678, 0.0000521540641784668, 0.0000132918357849121))
def rs3(r, s):
    q = Quaternion((r[3], r[0], r[1], r[2]))
    return q.to_matrix() @ Matrix.Diagonal(Vector(s))
CINV = Matrix(((1,0,0),(0,0,-1),(0,1,0)))
D_PARR_GLTF = rs3(R_PARR, S_PARR).inverted() @ (rs3(R_PARR, S_CAJA) @ D_LOCAL)
CON_ALPHA = re.compile(r'hair|eyelash|lashes|beard', re.I)

def limpiar_material(mat):
    """Copia el material y deja solo Diffuse->BaseColor y Normal. Alpha solo pelo/pestañas."""
    md = mat.copy()
    md.name = mat.name + "_EXP"
    if not md.use_nodes: return md
    nt = md.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not bsdf: return md
    conserva_alpha = bool(CON_ALPHA.search(mat.name))
    for nombre_in in ('Roughness', 'Specular Tint', 'Specular IOR Level', 'Metallic'):
        sock = bsdf.inputs.get(nombre_in)
        if sock:
            for l in list(sock.links): nt.links.remove(l)
    alpha = bsdf.inputs.get('Alpha')
    if alpha and not conserva_alpha:
        for l in list(alpha.links): nt.links.remove(l)
        alpha.default_value = 1.0
    if bsdf.inputs.get('Roughness'): bsdf.inputs['Roughness'].default_value = 0.7
    if bsdf.inputs.get('Metallic'): bsdf.inputs['Metallic'].default_value = 0.0
    if not conserva_alpha:
        try: md.blend_method = 'OPAQUE'
        except Exception: pass
    return md

def exportar_personaje(colname, armname, parrname, prefijo, ruta_glb):
    diag = {}
    col = bpy.data.collections[colname]
    arm = bpy.data.objects[armname]
    parr = bpy.data.objects[parrname]
    d_world = parr.matrix_world.to_3x3() @ (CINV @ D_PARR_GLTF)
    tmp = bpy.data.collections.get("_EXPORT_TMP") or bpy.data.collections.new("_EXPORT_TMP")
    if tmp.name not in [c.name for c in bpy.context.scene.collection.children]:
        bpy.context.scene.collection.children.link(tmp)
    arm_dup = arm.copy(); arm_dup.data = arm.data.copy(); arm_dup.name = "EXP_" + armname
    tmp.objects.link(arm_dup)
    arm_dup.animation_data_clear()
    mesh_dups, mats_dup = [], []
    for o in col.objects:
        if o.type != 'MESH': continue
        m = o.copy(); m.data = o.data.copy(); m.name = "EXP_" + o.name
        tmp.objects.link(m)
        m.parent = arm_dup
        for mod in m.modifiers:
            if mod.type == 'ARMATURE': mod.object = arm_dup
        # materiales LIMPIOS (copias — los del canon no se tocan)
        for slot in m.material_slots:
            if slot.material:
                md = limpiar_material(slot.material)
                slot.material = md
                mats_dup.append(md)
        mesh_dups.append(m)
    viejo = prefijo + ":"
    for b in arm_dup.data.bones:
        if b.name.startswith(viejo): b.name = "mixamorig:" + b.name[len(viejo):]
    for m in mesh_dups:
        for vg in m.vertex_groups:
            if vg.name.startswith(viejo): vg.name = "mixamorig:" + vg.name[len(viejo):]
    bpy.context.view_layer.update()
    pb = arm_dup.pose.bones["mixamorig:LeftForeArm"]
    mano_antes = (arm_dup.matrix_world @ arm_dup.pose.bones["mixamorig:LeftHand"].head).copy()
    tail_w = arm_dup.matrix_world @ pb.tail
    tgt = bpy.data.objects.new("IK_TMP_TGT", None)
    tmp.objects.link(tgt)
    tgt.location = tail_w
    tgt.keyframe_insert("location", frame=1)
    tgt.location = tail_w + d_world
    tgt.keyframe_insert("location", frame=31)
    for fc in tgt.animation_data.action.fcurves:
        for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
    con = pb.constraints.new('IK')
    con.target = tgt
    con.chain_count = 2
    for o in list(bpy.context.selected_objects): o.select_set(False)
    arm_dup.select_set(True)
    bpy.context.view_layer.objects.active = arm_dup
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
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
    bpy.context.scene.frame_set(31)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    arm_ev = arm_dup.evaluated_get(dg)
    mano_f31 = arm_ev.matrix_world @ arm_ev.pose.bones["mixamorig:LeftHand"].head
    diag["viaje_mano_cm"] = round((mano_f31 - mano_antes).length * 100, 1)
    bpy.context.scene.frame_set(1)
    ancla = bpy.data.objects.new("AnclaAcordeon", None)
    tmp.objects.link(ancla)
    ancla.matrix_world = parr.matrix_world.copy()
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

BASE = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export"
LOTE = [
  ("Pelao Pose", "Pelao armature moreno", "parrilla.001", "mixamorig9", "pelao"),
  ("Sudadera", "Armature sudadera", "parrilla.002", "mixamorig7", "sudadera"),
  ("Cuerpo Muchacha", "Cuerpo Muchacha", "parrilla.003", "mixamorig", "muchacha"),
  ("Muchacho de rojo", "Pelao de rojo", "parrilla.004", "mixamorig", "rojo"),
  ("Hembra Vacana", "Armature", "parrilla.005", "mixamorig1", "vacana"),
  ("Personaje Gris ojos verdes", "Persoanje Gris", "parrilla.006", "mixamorig5", "gris"),
]
result = {slug: exportar_personaje(c, a, p, pref, os.path.join(BASE, f"{slug}-raw.glb"))
          for c, a, p, pref, slug in LOTE}