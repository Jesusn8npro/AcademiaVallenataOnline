# Agrega 4 bailes nuevos (Salsa, Afarizado, Corriendo, Salto vacano) al PACK-BAILES.blend y
# re-exporta el pack GLB en UNA sola corrida headless. Replica EXACTO la lógica del operador
# `pack.agregar_baile` (pack_bailes.py dentro del blend): importa el FBX, remapea prefijo, quita
# brazos/hombros/manos (NOARMS), quita desplazamiento horizontal de Hips (X,Z; conserva Y vertical),
# descarta la malla. Luego corre el mismo export NLA de exportar-pack-bailes.py.
#
# Correr por CLI (NO toca la sesión abierta del usuario):
#   & "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background `
#     "C:\Users\acord\OneDrive\Desktop\Blender Personajes\PACK-BAILES.blend" `
#     --python scripts/agregar-bailes-y-exportar.py
# Luego: node scripts/comprimir-bailes.mjs public/modelos3d/_export/bailes-pack-raw.glb public/modelos3d/bailes-pack-v1.glb
import bpy, os, re, json
from mathutils import Vector

RIG = "AnimRig"
BRAZOS = ("Shoulder", "Arm", "Hand")
FBX_DIR = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\ANIMACIONES FBX"
NUEVOS = [
    ("Salsa para personaje.fbx", "Salsa"),
    ("Baile Afarizado.fbx", "Baile Afarizado"),
]
# Recorte por clip (frames del FBX original) → quitar lo que sobra y dejar la acción COMPLETA útil.
# 'Salto vacano': 14-67 = la secuencia COMPLETA del salto (despegue→ápex→aterrizaje→pararse), SIN la
# carrerilla del inicio (1-13) ni el paso final (68-72), que eran los "pasos rápidos". Se reproduce
# COMPLETA y UNA sola vez (LoopOnce, ver animaciones.ts unaVez) → no se repite/dobla. Re-inicia en frame 1.
TRIM = {}
RUTA_GLB = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\bailes-pack-raw.glb"
RE_BRAZOS = re.compile(r'(Arm|Hand|Shoulder)')


def _hueso(dp):
    return dp.split('"')[1] if dp.startswith('pose.bones[') else None

def _bags(act):
    out = []
    for L in act.layers:
        for st in L.strips:
            for cb in st.channelbags:
                out.append(cb)
    return out

def _pref(arm):
    return next((b.name.split(":")[0] + ":" for b in arm.data.bones if ":" in b.name), "")


def agregar_baile(filepath, nombre, rig):
    """Importa un FBX y deja una acción filtrada (sin brazos, sin desplazarse) con fake_user."""
    if not os.path.exists(filepath):
        return (False, "no existe " + filepath)
    antes_obj = set(bpy.data.objects)
    antes_act = set(bpy.data.actions)
    try:
        bpy.ops.import_scene.fbx(filepath=filepath)
    except Exception as e:
        return (False, "fallo import: " + str(e)[:80])
    nuevos = [o for o in bpy.data.objects if o not in antes_obj]
    acts = [a for a in bpy.data.actions if a not in antes_act]
    src = next((o for o in nuevos if o.type == 'ARMATURE'), None)
    if not src or not acts:
        for o in nuevos:
            try: bpy.data.objects.remove(o, do_unlink=True)
            except Exception: pass
        return (False, "el FBX no trae esqueleto+animación")
    raw = acts[0]
    pref_src = _pref(src)
    pref_rig = _pref(rig)
    huesos_rig = set(b.name for b in rig.data.bones)

    # --- Transferir el MOVIMIENTO VERTICAL REAL del clip (idéntico a Blender) a la cadera del AnimRig.
    #     Se lee la altura MUNDO de la cadera del source frame a frame (en metros, Z arriba) y se
    #     convierte al espacio LOCAL del hueso Hips del AnimRig (la cadera tiene ejes propios → hay que
    #     usar M = rig_world·rest_hueso para no torcer/escalar mal). Resultado: salto exacto, anclado al
    #     rest (en pie = offset 0 → no flota), SOLO vertical (el desplazamiento horizontal lo da el juego). ---
    hips_src = pref_src + "Hips"
    rb = rig.data.bones[pref_rig + "Hips"]
    M3 = rig.matrix_world.to_3x3() @ rb.matrix_local.to_3x3()  # dirección bone-local → mundo
    Minv = M3.inverted()
    frames = sorted({int(k.co[0]) for cb in _bags(raw) for fc in cb.fcurves
                     if _hueso(fc.data_path) == hips_src and fc.data_path.endswith('.location')
                     for k in fc.keyframe_points})
    computedLoc = {}
    if frames:
        src.animation_data_create().action = raw
        try:
            if raw.slots: src.animation_data.action_slot = raw.slots[0]
        except Exception: pass
        sphb = src.pose.bones.get(hips_src)
        worldz = {}
        for f in frames:
            bpy.context.scene.frame_set(f)
            bpy.context.view_layer.update()
            worldz[f] = (src.matrix_world @ sphb.head).z
        stand = worldz[frames[0]]
        # offset vertical en mundo (metros) → vector de location en el espacio local del Hips del rig
        computedLoc = {f: (Minv @ Vector((0.0, 0.0, worldz[f] - stand))) for f in frames}

    if nombre in bpy.data.actions:
        bpy.data.actions.remove(bpy.data.actions[nombre])
    act = raw.copy(); act.name = nombre; act.use_fake_user = True
    for cb in _bags(act):
        for fc in list(cb.fcurves):
            b = _hueso(fc.data_path)
            if b is None:
                cb.fcurves.remove(fc); continue
            if pref_src and pref_src != pref_rig and b.startswith(pref_src):
                b2 = pref_rig + b[len(pref_src):]
                fc.data_path = fc.data_path.replace('"' + b + '"', '"' + b2 + '"')
                b = b2
            if b not in huesos_rig:
                cb.fcurves.remove(fc); continue
            if any(t in b for t in BRAZOS):
                cb.fcurves.remove(fc); continue
            # Hips: reescribir las 3 location con el desplazamiento SOLO vertical (mundo) convertido a
            # local del hueso → salto idéntico a Blender, anclado al rest (no flota), sin moverse en
            # horizontal (eso lo da el controlador del juego).
            if b.endswith("Hips") and fc.data_path.endswith(".location"):
                if not computedLoc:
                    cb.fcurves.remove(fc); continue
                ax = fc.array_index
                for kp in fc.keyframe_points:
                    f = int(round(kp.co[0]))
                    loc = computedLoc.get(f) or computedLoc[min(computedLoc, key=lambda x: abs(x - f))]
                    kp.co[1] = loc[ax]
                    kp.handle_left_type = 'AUTO_CLAMPED'
                    kp.handle_right_type = 'AUTO_CLAMPED'
                fc.update()
                continue
    # Recortar el clip a su ventana útil (quita carrerilla/pasos extra) y re-iniciarlo en el frame 1.
    rango = TRIM.get(nombre)
    if rango:
        a, b = rango
        d = a - 1
        for cb in _bags(act):
            for fc in list(cb.fcurves):
                # borrar en REVERSA y SIN fast (borrar en cadena hacia adelante corrompe la colección
                # → "Keyframe not in F-Curve"); luego desplazar los que quedan.
                for kp in reversed(list(fc.keyframe_points)):
                    if kp.co[0] < a - 0.5 or kp.co[0] > b + 0.5:
                        fc.keyframe_points.remove(kp)
                for kp in fc.keyframe_points:
                    kp.co[0] -= d
                    kp.handle_left[0] -= d
                    kp.handle_right[0] -= d
                fc.update()

    # limpiar el import: soltar la acción cruda del source ANTES de borrar (si no, queda referenciada
    # y sobrevive → se colaba "Salsa para personaje" como baile fantasma).
    if src.animation_data:
        src.animation_data.action = None
    for o in nuevos:
        try: bpy.data.objects.remove(o, do_unlink=True)
        except Exception: pass
    for a in acts:
        try: a.use_fake_user = False; bpy.data.actions.remove(a)
        except Exception: pass
    return (True, nombre + " (" + str(int(act.frame_range[1])) + " frames)")


# ---------- 1) Importar + filtrar los 4 bailes nuevos ----------
rig = bpy.data.objects.get(RIG)
assert rig and rig.type == 'ARMATURE', "AnimRig no encontrado"
# Limpiar acciones crudas fantasma que quedaron de corridas previas (nombre del FBX, no del baile).
for _nm in ("Salsa para personaje",):
    _a = bpy.data.actions.get(_nm)
    if _a:
        _a.use_fake_user = False
        try: bpy.data.actions.remove(_a)
        except Exception: pass
log_add = []
for fname, nombre in NUEVOS:
    ok, msg = agregar_baile(os.path.join(FBX_DIR, fname), nombre, rig)
    log_add.append({"baile": nombre, "ok": ok, "msg": msg})
    print(("  OK  " if ok else "  ERR ") + nombre + " -> " + msg)

# ---------- 2) Guardar el .blend (persistir los bailes en el pack) ----------
bpy.ops.wm.save_mainfile()
print("blend guardado con los bailes nuevos")

# ---------- 3) Export del pack (idéntico a exportar-pack-bailes.py) ----------
arm = bpy.data.objects.get("AnimRig")
arm.hide_viewport = False
arm.hide_set(False)
bpy.context.view_layer.update()

def rutas_de(act):
    rutas = set()
    for layer in act.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    rutas.add(fc.data_path)
    return rutas

def es_baile(act):
    if act.name.endswith(']'):
        return False
    rutas = rutas_de(act)
    if not any('pose.bones' in r for r in rutas):
        return False
    if any(RE_BRAZOS.search(r) for r in rutas):
        return False
    return True

bailes = sorted([a for a in bpy.data.actions if es_baile(a)], key=lambda a: a.name)
assert bailes, "ningún baile detectado"

ad = arm.animation_data or arm.animation_data_create()
ad.action = None
for tr in list(ad.nla_tracks):
    ad.nla_tracks.remove(tr)

fps = bpy.context.scene.render.fps
diag = {"fps": fps, "agregados": log_add, "bailes": {}}
for act in bailes:
    tr = ad.nla_tracks.new()
    tr.name = act.name
    f0, f1 = act.frame_range
    strip = tr.strips.new(act.name, max(1, int(f0)), act)
    if hasattr(strip, 'action_slot') and len(act.slots):
        strip.action_slot = act.slots[0]
    diag["bailes"][act.name] = {"frames": int(f1 - f0), "seg": round((f1 - f0) / fps, 2)}

me = bpy.data.meshes.new("_DUMMY_SKIN")
me.from_pydata([(0, 0, 0), (0.01, 0, 0), (0, 0.01, 0)], [], [(0, 1, 2)])
dummy = bpy.data.objects.new("_DUMMY_SKIN", me)
bpy.context.scene.collection.objects.link(dummy)
dummy.parent = arm
vg = dummy.vertex_groups.new(name="mixamorig:Hips")
vg.add([0, 1, 2], 1.0, 'REPLACE')
mod = dummy.modifiers.new("Armature", 'ARMATURE')
mod.object = arm

for o in list(bpy.context.selected_objects):
    o.select_set(False)
arm.select_set(True)
dummy.select_set(True)
bpy.context.view_layer.objects.active = arm

os.makedirs(os.path.dirname(RUTA_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=RUTA_GLB, use_selection=True,
    export_animations=True, export_animation_mode='NLA_TRACKS',
    export_yup=True, export_apply=False, export_skins=True)
diag["glb_mb"] = round(os.path.getsize(RUTA_GLB) / 1e6, 2)
print("RESULT_JSON:" + json.dumps(diag, ensure_ascii=False))
