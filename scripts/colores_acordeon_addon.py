bl_info = {
    "name": "Colores Acordeón",
    "author": "AcademiaNext",
    "version": (1, 0),
    "blender": (3, 0, 0),
    "location": "Vista 3D > Barra lateral (N) > Acordeón",
    "description": "Cambia el color de cada parte del acordeón (cinta, cueritos, metal, cuero de aros) desde un panel.",
    "category": "Material",
}

import bpy

# (Etiqueta, nombre del material, nombre del nodo RGB de control)
PARTES = [
    ("Cinta (pliegues)",   "tmp",            "COLOR CINTA"),
    ("Cueritos (esquinas)", "Cuero_Esquinas", "COLOR CUERO"),
    ("Metal (aros)",        "Metal acordeon", "COLOR METAL"),
    ("Cuero de aros",       "Aro (material)", "COLOR ARO"),
]


def _nodo_control(matname, nodename):
    mat = bpy.data.materials.get(matname)
    if not mat or not mat.use_nodes:
        return None
    return mat.node_tree.nodes.get(nodename)


class ACORDEON_PT_colores(bpy.types.Panel):
    bl_label = "Colores del Acordeón"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Acordeón"

    def draw(self, context):
        layout = self.layout
        layout.label(text="Color por parte:")
        for etiqueta, matname, nodename in PARTES:
            box = layout.box()
            box.label(text=etiqueta)
            nodo = _nodo_control(matname, nodename)
            if nodo is None:
                box.label(text="(control no encontrado)", icon='ERROR')
            else:
                box.prop(nodo.outputs[0], "default_value", text="")


classes = (ACORDEON_PT_colores,)


def register():
    for c in classes:
        bpy.utils.register_class(c)


def unregister():
    for c in reversed(classes):
        bpy.utils.unregister_class(c)


if __name__ == "__main__":
    register()
