// eliminar-usuario.js
export function initEliminarUsuario() {
    const userTableBody = document.getElementById('user-table-body');
    const eliminarUsuarioModal = new bootstrap.Modal(document.getElementById('eliminarUsuarioModal'));
    const confirmarEliminarBtn = document.getElementById('confirmar-eliminar-usuario');
    const eliminarUsuarioIdInput = document.getElementById('eliminar-usuario-id');

    // Event delegation for delete button
    userTableBody.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.eliminar-usuario');
        if (deleteButton) {
            const userId = deleteButton.dataset.id;

            // Set the user ID in the hidden input
            eliminarUsuarioIdInput.value = userId;

            // Show the modal
            eliminarUsuarioModal.show();
        }
    });

    // Confirm delete event
    confirmarEliminarBtn.addEventListener('click', async () => {
    const userId = eliminarUsuarioIdInput.value;
    const modalFooter = document.querySelector('#eliminarUsuarioModal .modal-footer');

    // Función para mostrar mensaje
    function mostrarMensaje(mensaje, esError = false) {
        // Limpiar mensajes anteriores
        const mensajesAnteriores = modalFooter.querySelectorAll('p');
        mensajesAnteriores.forEach(msg => msg.remove());
        
        const mensajeElement = document.createElement('p');
        mensajeElement.classList.add('me-2')
        mensajeElement.textContent = mensaje;
        mensajeElement.style.color = esError ? 'red' : 'green';
        mensajeElement.style.fontWeight = 'bold';
        mensajeElement.style.margin = '0';
        modalFooter.insertAdjacentElement('afterbegin', mensajeElement);
    }

    try {
        const response = await fetch(`/usuarios/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            mostrarMensaje('Usuario eliminado exitosamente');
            
            // Eliminar la fila de la tabla
            const deleteButton = document.querySelector(`.eliminar-usuario[data-id='${userId}']`);
            if (deleteButton) {
                const rowToDelete = deleteButton.closest('tr');
                rowToDelete.remove();
            }

            // Recargar usuarios
            const cargarUsuarios = document.querySelector('#user-table-body').dataset.cargarUsuarios;
            if (cargarUsuarios) {
                window[cargarUsuarios](1);
            }

            // Esperar un momento para que el mensaje sea visible antes de cerrar
            setTimeout(() => {
                eliminarUsuarioModal.hide();
                // Limpiar el mensaje después de cerrar el modal
                setTimeout(() => {
                    const mensajes = modalFooter.querySelectorAll('p');
                    mensajes.forEach(msg => msg.remove());
                }, 300);
            }, 1500);

        } else {
            const errorData = await response.json();
            console.warn('Error al eliminar usuario:', errorData.message);
            mostrarMensaje(errorData.message || 'Error al eliminar usuario', true);
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        mostrarMensaje('No se pudo eliminar el usuario', true);
    }
});
}