interface ModalEliminarCuentaProps {
    visible: boolean;
    confirmacion: string;
    onConfirmacionChange: (valor: string) => void;
    onCerrar: () => void;
    onEliminar: () => void;
}

export default function ModalEliminarCuenta({ visible, confirmacion, onConfirmacionChange, onCerrar, onEliminar }: ModalEliminarCuentaProps) {
    if (!visible) return null;

    return (
        <div className="modal-fondo" onClick={onCerrar}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>⚠️ Eliminar cuenta</h3>
                <p>Esta acción <strong>NO se puede deshacer</strong>. Perderás acceso a todos tus cursos y datos.</p>
                <div className="campo-confirmacion">
                    <label>Para confirmar, escribe: <strong>ELIMINAR MI CUENTA</strong></label>
                    <input
                        type="text"
                        value={confirmacion}
                        onChange={(e) => onConfirmacionChange(e.target.value)}
                        placeholder="Escribe: ELIMINAR MI CUENTA"
                    />
                </div>
                <div className="botones">
                    <button className="boton-cancelar" onClick={onCerrar}>Cancelar</button>
                    <button
                        className="boton-danger"
                        onClick={onEliminar}
                        disabled={confirmacion !== 'ELIMINAR MI CUENTA'}
                    >
                        Eliminar cuenta
                    </button>
                </div>
            </div>
        </div>
    );
}
