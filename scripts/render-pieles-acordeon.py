# Render headless de miniaturas de las pieles del acordeón.
# Carga el MISMO GLB que usa la app (acordeon-fino-v1.glb) y, por cada piel
# (original + 1..7), aplica los sets de textura de /public/texturas-acordeon/{skin}/
# a los 5 materiales con piel (cuerpo/botones/fuelle/pack/parte botones), igual que
# usePielesAcordeon en el visor. Renderiza un PNG con fondo transparente por piel.
#
# Uso (desde la raíz del proyecto):
#   "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background --factory-startup --python scripts/render-pieles-acordeon.py
#
# Salida: scripts/_renders-pieles/piel-{skin}.png  (luego se optimizan a webp con sharp).

import bpy
import os
import math
from mathutils import Vector

PROY = os.getcwd()
GLB = os.path.join(PROY, "public", "modelos3d", "acordeon-fino-v1.glb")
TEX_BASE = os.path.join(PROY, "public", "texturas-acordeon")
OUT_DIR = os.path.join(PROY, "scripts", "_renders-pieles")
os.makedirs(OUT_DIR, exist_ok=True)

# Materiales que aceptan piel (mismos que PARTES_PIEL en la app). Carpeta de textura =
# nombre con espacios -> guiones (ej. "parte botones" -> "parte-botones").
PARTES = ["cuerpo", "botones", "fuelle", "pack", "parte botones"]
SKINS = ["original", "1", "2", "3", "4", "5", "6", "7"]
RES = 640  # cuadrado; luego se reduce a ~256 en webp


def limpiar_escena():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def importar_glb():
    bpy.ops.import_scene.gltf(filepath=GLB)


def ocultar_correas():
    """Oculta del render las correas (straps): translúcidas, estorban y NO cambian con la piel."""
    for o in bpy.data.objects:
        if o.type != "MESH":
            continue
        mats = [m.name for m in o.data.materials if m]
        if any(parte_de_material(n) == "correas" for n in mats):
            o.hide_render = True


def parte_de_material(nombre):
    # "cuerpo.001" -> "cuerpo"; "parte botones.001" -> "parte botones"
    base = nombre
    if "." in base:
        # quitar sufijo .NNN final
        import re
        base = re.sub(r"\.\d+$", "", base)
    if base.startswith("acc_"):
        base = base[4:]
    return base


def imagen(ruta, no_color=False):
    img = bpy.data.images.load(ruta, check_existing=True)
    if no_color:
        img.colorspace_settings.name = "Non-Color"
    return img


def aplicar_piel(skin):
    """Aplica el set de textura `skin` a los 5 materiales con piel. Para 'original' no
    toca nada (deja los mapas baked del GLB)."""
    if skin == "original":
        return
    for mat in bpy.data.materials:
        parte = parte_de_material(mat.name)
        if parte not in PARTES:
            continue
        carpeta = parte.replace(" ", "-")
        dir_tex = os.path.join(TEX_BASE, skin, carpeta)
        base_png = dir_tex + "_base.webp"
        mr_png = dir_tex + "_mr.webp"
        nrm_png = dir_tex + "_normal.webp"
        if not os.path.exists(base_png):
            print(f"  ! falta {base_png}, salto material {mat.name}")
            continue

        mat.use_nodes = True
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if bsdf is None:
            continue

        # Base color (sRGB)
        nb = nt.nodes.new("ShaderNodeTexImage")
        nb.image = imagen(base_png)
        nt.links.new(nb.outputs["Color"], bsdf.inputs["Base Color"])

        # Metallic/Roughness empacado glTF: G=roughness, B=metallic (Non-Color)
        if os.path.exists(mr_png):
            nmr = nt.nodes.new("ShaderNodeTexImage")
            nmr.image = imagen(mr_png, no_color=True)
            sep = nt.nodes.new("ShaderNodeSeparateColor")
            nt.links.new(nmr.outputs["Color"], sep.inputs["Color"])
            nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
            nt.links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])

        # Normal map (Non-Color)
        if os.path.exists(nrm_png):
            nn = nt.nodes.new("ShaderNodeTexImage")
            nn.image = imagen(nrm_png, no_color=True)
            nmap = nt.nodes.new("ShaderNodeNormalMap")
            nt.links.new(nn.outputs["Color"], nmap.inputs["Color"])
            nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])


def bbox_mundo():
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for o in bpy.data.objects:
        if o.type != "MESH" or o.hide_render:
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            for i in range(3):
                mn[i] = min(mn[i], w[i])
                mx[i] = max(mx[i], w[i])
    return mn, mx


def montar_camara_y_luz(direccion=None, dist_mult=3.0, lens=60):
    mn, mx = bbox_mundo()
    centro = (mn + mx) * 0.5
    tam = (mx - mn)
    radio = max(tam.x, tam.y, tam.z) * 0.5

    # Empty objetivo en el centro
    objetivo = bpy.data.objects.new("Objetivo", None)
    bpy.context.collection.objects.link(objetivo)
    objetivo.location = centro

    # Cámara: vista 3/4 frontal, ligeramente arriba.
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = lens
    cam = bpy.data.objects.new("Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    dist = radio * dist_mult
    if direccion is None:
        # Vista FRONTAL (como el Layout de Blender): rejilla izq · fuelle centro · bajos der.
        # Casi de frente (-Y) con un toque de altura para ver un poco la tapa.
        direccion = Vector((0.12, -1.5, 0.24))
    direccion = direccion.normalized()
    cam.location = centro + direccion * dist
    con = cam.constraints.new(type="TRACK_TO")
    con.target = objetivo
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    bpy.context.scene.camera = cam

    # Luces estilo estudio (3 áreas).
    def area(nombre, loc, energia, tamano):
        ld = bpy.data.lights.new(nombre, type="AREA")
        ld.energy = energia
        ld.size = tamano
        lo = bpy.data.objects.new(nombre, ld)
        bpy.context.collection.objects.link(lo)
        lo.location = centro + Vector(loc) * radio
        c = lo.constraints.new(type="TRACK_TO")
        c.target = objetivo
        c.track_axis = "TRACK_NEGATIVE_Z"
        c.up_axis = "UP_Y"
        return lo

    area("Key", (2.0, -2.0, 2.0), 550, radio * 2)
    area("Fill", (-2.2, -1.0, 0.8), 220, radio * 2.5)
    area("Rim", (-0.5, 2.0, 1.5), 350, radio * 2)

    # Mundo gris tenue para que no quede negro.
    world = bpy.data.worlds.new("W")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.05, 0.05, 0.06, 1.0)
        bg.inputs[1].default_value = 0.6
    bpy.context.scene.world = world


def config_render():
    sc = bpy.context.scene
    for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            sc.render.engine = eng
            break
        except Exception:
            continue
    try:
        sc.eevee.taa_render_samples = 64
    except Exception:
        pass
    sc.render.resolution_x = RES
    sc.render.resolution_y = RES
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    # Colores cercanos a sRGB (los webp de textura son sRGB; AgX los desaturaría).
    try:
        sc.view_settings.view_transform = "Standard"
    except Exception:
        pass


def barrido_angulos():
    """Modo prueba: renderiza 'original' desde varias direcciones para elegir el mejor ángulo."""
    mn, mx = bbox_mundo()
    print(f"BBOX min={tuple(round(v,3) for v in mn)} max={tuple(round(v,3) for v in mx)} size={tuple(round(mx[i]-mn[i],3) for i in range(3))}")
    dirs = {
        "px": (1.4, -1.0, 0.35), "nx": (-1.4, -1.0, 0.35),
        "py": (1.0, 1.4, 0.35),  "front": (0.2, -1.5, 0.3),
    }
    for nombre, d in dirs.items():
        montar_camara_y_luz(Vector(d), dist_mult=4.3, lens=50)
        bpy.context.scene.render.filepath = os.path.join(OUT_DIR, f"ang-{nombre}.png")
        bpy.ops.render.render(write_still=True)
        # limpiar cámara/luces para el siguiente
        for o in list(bpy.data.objects):
            if o.type in ("CAMERA", "LIGHT", "EMPTY"):
                bpy.data.objects.remove(o, do_unlink=True)


def main():
    import sys
    limpiar_escena()
    importar_glb()
    ocultar_correas()
    config_render()
    if "--sweep" in sys.argv:
        barrido_angulos()
        print("LISTO-SWEEP")
        return
    montar_camara_y_luz()
    for skin in SKINS:
        aplicar_piel(skin)
        out = os.path.join(OUT_DIR, f"piel-{skin}.png")
        bpy.context.scene.render.filepath = out
        print(f"== Render piel {skin} -> {out}")
        bpy.ops.render.render(write_still=True)
    print("LISTO")


main()
