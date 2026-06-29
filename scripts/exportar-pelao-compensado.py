# Re-export SOLO del Pelao con AnclaAcordeon COMPENSADO, para que el acordeon compartido v11
# (horneado de la Muchacha .001) calce sobre la mano del Pelao.
#
# Por que: las instancias del acordeon NO son identicas. Los botones de bajos quedan a distinta
# distancia de la parrilla segun la instancia:
#   Muchacha .001 (de donde sale v11): botones a Oa=[3.3708,0.0636,0.1464] de la parrilla (local)
#   Pelao   .007 (donde se poso la mano): botones a [3.1672,0.0462,0.1347]
# Diferencia ~0.20 en X -> con v11, los botones del Pelao quedan corridos y la mano atraviesa.
# Fix: el ancla del Pelao se desplaza T = target_local - Oa_local = [-0.2036,-0.0174,-0.0118]
# (en local de parrilla.007) para que, al acoplar parrilla=ancla, los botones del acordeon
# compartido (a Oa de su parrilla) caigan justo donde agarra la mano del Pelao. Verificado: err 1e-5.
#
# NOTA: el morph 'Cerrar' del personaje (accion 'Cierre') solo se usa para la pose de AGARRE (frame 0)
# en la web; el cierre/apertura en runtime lo maneja el morph del acordeon (dCerrar/dAbrir). Por eso
# re-hornear la accion con el slide viejo NO afecta el cierre. Solo importa que el AGARRE quede bien.
#
# Comprimir: node scripts/comprimir-personaje-mixamo.mjs public/modelos3d/_export/pelao-raw.glb public/modelos3d/personaje-pelao.glb
import bpy, os, re, math, json
from mathutils import Matrix, Quaternion, Vector

# --- compensacion del ancla (local de parrilla.007) ---
# v12: acordeon compartido ahora se hornea del PROPIO Pelao (Empty.002), asi que el ancla = parrilla.007
# SIN compensacion (misma instancia que las manos -> ambas calzan, como el test page).
COMP_T = Vector((0.0, 0.0, 0.0))
# Deslizamiento REAL de los botones de bajos agarre->cerrado (medido: igual al morph del v12), en el
# marco LOCAL de la caja. El viejo (-0.5984) era muy corto -> la mano se quedaba atras al cerrar.
D_LOCAL_CIERRE = Vector((-0.8992, -0.035, -0.057))
CON_ALPHA = re.compile(r'hair|eyelash|lashes|beard', re.I)

# --- 1) poner el Pelao en la pose de AGARRE correcta ("Posicion correcta mano BAJOS") ---
def _aplicar_ref(nombre):
    refs = json.loads(bpy.context.scene.get("fuelle_refs", "[]"))
    r = next((x for x in refs if x.get("name") == nombre), None)
    if not r: return False
    CAJA="Caja de los bajos, izquierda.007"; CTRL="Ctrl_Bajos.007"; ARM="Pelao armature moreno"
    caja=bpy.data.objects.get(CAJA); ctrl=bpy.data.objects.get(CTRL); arm=bpy.data.objects.get(ARM)
    caja.location=r["caja_loc"]; caja.rotation_euler=r["caja_rot_euler"]
    if ctrl and r.get("ctrl_loc"): ctrl.location=r["ctrl_loc"]
    bpy.context.view_layer.update()
    for en,mb in (r.get("ctrl_empties") or {}).items():
        o=bpy.data.objects.get(en)
        if o and mb: o.matrix_basis=Matrix(mb)
    bpy.context.view_layer.update()
    for bn,mb in (r.get("ctrl_huesos") or {}).items():
        pb=arm.pose.bones.get(bn)
        if pb and mb: pb.matrix_basis=Matrix(mb)
    bpy.context.view_layer.update()
    return True

aplicado = _aplicar_ref("Posicion correcta mano BAJOS")

def _fcurves(action):
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

def exportar(armname, parrname, cajaname, prefijo_colon, ruta_glb, comp_local):
    diag = {}
    arm = bpy.data.objects[armname]
    parr = bpy.data.objects[parrname]
    caja = bpy.data.objects[cajaname]
    d_world = caja.matrix_world.to_3x3() @ D_LOCAL_CIERRE
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
                md = limpiar_material(slot.material); slot.material = md; mats_dup.append(md)
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
    arm_dup.select_set(True); bpy.context.view_layer.objects.active = arm_dup
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
    tgt = bpy.data.objects.new("IK_TMP_TGT", None); tmp.objects.link(tgt)
    tgt.location = tail_w; tgt.keyframe_insert("location", frame=1)
    tgt.location = tail_w + d_world; tgt.keyframe_insert("location", frame=31)
    for fc in _fcurves(tgt.animation_data.action):
        for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
    con = pbF.constraints.new('IK'); con.target = tgt; con.chain_count = 2
    bpy.context.scene.frame_set(1); bpy.context.view_layer.update()
    bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.nla.bake(frame_start=1, frame_end=31, step=2, only_selected=False,
                     visual_keying=True, clear_constraints=True, use_current_action=False,
                     bake_types={'POSE'})
    bpy.ops.object.mode_set(mode='OBJECT')
    accion = arm_dup.animation_data.action; accion.name = "Cierre"
    boneF = arm_dup.data.bones["mixamorig:LeftForeArm"]; boneH = arm_dup.data.bones["mixamorig:LeftHand"]
    rest_delta = boneF.matrix_local.inverted() @ boneH.matrix_local
    pbH.rotation_mode = 'QUATERNION'
    for f in range(1, 32, 2):
        bpy.context.scene.frame_set(f); bpy.context.view_layer.update()
        s = (f - 1) / 30.0
        M_des = Matrix.Translation(d_arm * s) @ M_hand_arm_0
        M_nat = pbF.matrix @ rest_delta
        pbH.matrix_basis = M_nat.inverted() @ M_des
        pbH.keyframe_insert("rotation_quaternion", frame=f)
        pbH.keyframe_insert("location", frame=f)
        pbH.keyframe_insert("scale", frame=f)
    bpy.context.scene.frame_set(1)
    ancla = bpy.data.objects.new("AnclaAcordeon", None); tmp.objects.link(ancla)
    # *** COMPENSACION: ancla = parrilla.matrix_world @ Translation(comp_local) ***
    ancla.matrix_world = parr.matrix_world @ Matrix.Translation(comp_local)
    F = 0.146 / parr.matrix_world.to_scale().x
    Sm = Matrix.Scale(F, 4)
    arm_dup.matrix_world = Sm @ arm_dup.matrix_world; bpy.context.view_layer.update()
    ancla.matrix_world = Sm @ ancla.matrix_world; bpy.context.view_layer.update()
    diag["F_escala"] = round(F, 5); diag["comp_local"] = [round(x,4) for x in comp_local]
    for o in list(bpy.context.selected_objects): o.select_set(False)
    arm_dup.select_set(True)
    for m in mesh_dups: m.select_set(True)
    ancla.select_set(True); bpy.context.view_layer.objects.active = arm_dup
    os.makedirs(os.path.dirname(ruta_glb), exist_ok=True)
    import sys; _old=sys.stdout
    try:
        sys.stdout=open(os.devnull,"w")
        bpy.ops.export_scene.gltf(filepath=ruta_glb, use_selection=True,
            export_animations=True, export_animation_mode='ACTIVE_ACTIONS',
            export_image_format='AUTO', export_yup=True, export_apply=False,
            export_skins=True, export_def_bones=False)
    finally:
        sys.stdout=_old
    diag["glb_mb"] = round(os.path.getsize(ruta_glb) / 1e6, 2); diag["mallas"] = len(mesh_dups)
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
diag = exportar("Pelao armature moreno", "parrilla.007", "Caja de los bajos, izquierda.007",
                "mixamorig9:", os.path.join(BASE, "pelao-raw.glb"), COMP_T)
bpy.context.scene.frame_set(f0)
result = {"aplico_ref_agarre": aplicado, **diag}
print("RESULT:", result)
