import bpy, sys, math, json
from mathutils import Vector

RENDER_DIR = sys.argv[-1]
DEST = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\PERSONAJES T-POSE\Personajes 6 posando_acordeon_FINAL.blend"
bpy.ops.wm.open_mainfile(filepath=DEST)
bpy.context.view_layer.update()

PAIRS = [
    ("Muchacho de rojo", "Muchacho de rojo", "Acordeon Nuevo - Muchacho de rojo"),
    ("Pelao Pose", "Pelao Pose", "Acordeon Nuevo - Pelao Pose"),
    ("Sudadera", "Sudadera", "Acordeon Nuevo - Sudadera"),
    ("Cuerpo Muchacha", "Cuerpo Muchacha", "Acordeon Nuevo - Cuerpo Muchacha"),
    ("Hembra Vacana", "Hembra Vacana", "Acordeon Nuevo - Hembra Vacana"),
    ("Personaje Gris", "Personaje Gris ojos verdes", "Acordeon Nuevo - Personaje Gris"),
]
counts = {}
scn = bpy.context.scene
scn.render.engine = 'BLENDER_WORKBENCH'; scn.render.resolution_x = 600; scn.render.resolution_y = 850
scn.display.shading.light = 'STUDIO'; scn.display.shading.show_cavity = True
cam = bpy.data.objects.new("VC", bpy.data.cameras.new("VC")); scn.collection.objects.link(cam); cam.data.lens = 50; scn.camera = cam

for tag, char_col, acc_col in PAIRS:
    keep = set()
    cc = bpy.data.collections.get(char_col); ac = bpy.data.collections.get(acc_col)
    if cc: keep |= set(o.name for o in cc.objects)
    if ac: keep |= set(o.name for o in ac.objects)
    counts[tag] = {"char_objs": len(cc.objects) if cc else 0, "acc_objs": len(ac.objects) if ac else 0}
    for o in bpy.data.objects: o.hide_render = (o.name not in keep)
    dg = bpy.context.evaluated_depsgraph_get(); mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
    for n in keep:
        o = bpy.data.objects.get(n)
        if not o or o.type != 'MESH': continue
        for c in o.bound_box:
            w = o.evaluated_get(dg).matrix_world @ Vector(c)
            for i in range(3): mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
    mid = (mn + mx)/2; diag = (mx - mn).length
    a = math.radians(235); e = math.radians(8)
    dd = Vector((math.cos(e)*math.cos(a), math.cos(e)*math.sin(a), math.sin(e)))
    cam.location = mid + dd*diag*1.1; cam.rotation_euler = (mid - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scn.render.filepath = RENDER_DIR + "\\F_" + tag.replace(" ", "_") + ".png"
    bpy.ops.render.render(write_still=True)
print("COUNTS", json.dumps(counts, ensure_ascii=False))
print("TOTAL_OBJS", len(bpy.data.objects))
print("FINAL6 DONE")
