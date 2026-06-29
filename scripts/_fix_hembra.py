import bpy, sys, math, json
from mathutils import Vector

RENDER_DIR = sys.argv[-1]
DEST = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\PERSONAJES T-POSE\Personajes 6 posando_acordeon_FINAL.blend"
bpy.ops.wm.open_mainfile(filepath=DEST)
bpy.context.view_layer.update()

def bone_world(arm_name, bone_name):
    arm = bpy.data.objects[arm_name]
    pb = arm.pose.bones[bone_name]
    return arm.matrix_world @ pb.matrix

# reference = Cuerpo Muchacha (properly fitted, female, mixamo)
REF_ARM, REF_BONE, REF_ROOT = "Cuerpo Muchacha", "mixamorig:Spine2", "Acordeon_Nuevo_Cuerpo Muchacha"
HEM_ARM, HEM_BONE, HEM_ROOT = "Armature", "mixamorig1:Spine2", "Acordeon_Nuevo_Hembra Vacana"

ref_root = bpy.data.objects[REF_ROOT]
hem_root = bpy.data.objects[HEM_ROOT]

B_ref = bone_world(REF_ARM, REF_BONE)
W_ref = ref_root.matrix_world.copy()
L = B_ref.inverted() @ W_ref            # accordion relative to ref spine bone

B_hem = bone_world(HEM_ARM, HEM_BONE)
W_hem = B_hem @ L                        # same relative pose on Hembra's spine
hem_root.matrix_world = W_hem
bpy.context.view_layer.update()

# sanity: accordion bbox now
dg = bpy.context.evaluated_depsgraph_get()
acc_names = set(o.name for o in bpy.data.collections["Acordeon Nuevo - Hembra Vacana"].objects)
mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
for n in acc_names:
    o = bpy.data.objects.get(n)
    if not o or o.type != 'MESH': continue
    for c in o.bound_box:
        w = o.evaluated_get(dg).matrix_world @ Vector(c)
        for i in range(3): mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
print("NEW_ACCBB", [round(c,3) for c in mn], [round(c,3) for c in mx])

# render Hembra body + accordion
body_names = set(o.name for o in bpy.data.collections["Hembra Vacana"].objects)
keep = body_names | acc_names
for o in bpy.data.objects: o.hide_render = (o.name not in keep)
bmn = Vector((1e9,)*3); bmx = Vector((-1e9,)*3)
for n in keep:
    o = bpy.data.objects.get(n)
    if not o or o.type != 'MESH': continue
    for c in o.bound_box:
        w = o.evaluated_get(dg).matrix_world @ Vector(c)
        for i in range(3): bmn[i] = min(bmn[i], w[i]); bmx[i] = max(bmx[i], w[i])
scn = bpy.context.scene
scn.render.engine = 'BLENDER_WORKBENCH'; scn.render.resolution_x = 700; scn.render.resolution_y = 1000
scn.display.shading.light = 'STUDIO'; scn.display.shading.show_cavity = True
cam = bpy.data.objects.new("VC", bpy.data.cameras.new("VC")); scn.collection.objects.link(cam); cam.data.lens = 50; scn.camera = cam
mid = (bmn + bmx)/2; diag = (bmx - bmn).length
for tag, az, el in (("front", 270, 4), ("3q", 235, 8)):
    a = math.radians(az); e = math.radians(el)
    dd = Vector((math.cos(e)*math.cos(a), math.cos(e)*math.sin(a), math.sin(e)))
    cam.location = mid + dd*diag*1.1; cam.rotation_euler = (mid - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scn.render.filepath = RENDER_DIR + "\\HembraFix_" + tag + ".png"
    bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=DEST)
print("FIX DONE")
