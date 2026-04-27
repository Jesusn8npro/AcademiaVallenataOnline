import ModalInscripciones from './ModalInscripciones';
import TarjetaContenidoAdmin from './TarjetaContenidoAdmin';
import { useMostradorCursosTutoriales, type Contenido } from './useMostradorCursosTutoriales';
import './MostradorCursosTutoriales.css';

interface Props {
    cursos: Contenido[];
    tutoriales: Contenido[];
    modoVista: 'cuadricula' | 'lista';
    onUpdate?: () => void;
}

const MostradorCursosTutoriales = ({ cursos, tutoriales, modoVista, onUpdate }: Props) => {
    const {
        contenidoUnificado,
        procesandoAccion,
        itemProcesando,
        modalInscripcionesOpen,
        setModalInscripcionesOpen,
        itemSeleccionado,
        confirmarEliminarItem,
        errorAccion,
        solicitarEliminar,
        cancelarEliminar,
        confirmarEliminar,
        manejarEditar,
        manejarVer,
        abrirModalInscripciones
    } = useMostradorCursosTutoriales({ cursos, tutoriales, onUpdate });

    if (contenidoUnificado.length === 0) {
        return (
            <div className="mostrador-estado-vacio">
                <div className="mostrador-contenido-vacio">
                    <div className="mostrador-icono-vacio">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 className="mostrador-titulo-vacio">No hay contenido para mostrar</h3>
                    <p className="mostrador-descripcion-vacio">Comienza creando tu primer curso o tutorial para verlo aquí.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mostrador-contenido">
            {errorAccion && (
                <div style={{ background: '#fff5f5', color: '#c53030', padding: '0.5rem 1rem', borderRadius: '0.25rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                    {errorAccion}
                </div>
            )}
            {confirmarEliminarItem && (
                <div style={{ background: '#fff5f5', border: '1px solid #fc8181', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.5rem', color: '#c53030' }}>¿Eliminar "{confirmarEliminarItem.titulo}"? Esta acción no se puede deshacer.</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={confirmarEliminar} style={{ padding: '0.3rem 0.75rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Eliminar</button>
                        <button onClick={cancelarEliminar} style={{ padding: '0.3rem 0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                </div>
            )}

            <div className={`mostrador-contenedor-items ${modoVista === 'lista' ? 'mostrador-modo-lista' : 'mostrador-modo-cuadricula'}`}>
                {contenidoUnificado.map((item) => (
                    <TarjetaContenidoAdmin
                        key={item.id}
                        item={item}
                        modoVista={modoVista}
                        procesandoAccion={procesandoAccion}
                        itemProcesando={itemProcesando}
                        onEditar={manejarEditar}
                        onVer={manejarVer}
                        onEliminar={solicitarEliminar}
                        onAbrirInscripciones={abrirModalInscripciones}
                    />
                ))}
            </div>

            {itemSeleccionado && (
                <ModalInscripciones
                    isOpen={modalInscripcionesOpen}
                    onClose={() => setModalInscripcionesOpen(false)}
                    itemId={itemSeleccionado.id}
                    itemTitulo={itemSeleccionado.titulo}
                    itemTipo={itemSeleccionado.tipo!}
                    onUpdate={onUpdate}
                />
            )}
        </div>
    );
};

export default MostradorCursosTutoriales;
