export function initEliminarLibro() {

    const libroGridCardContainer = document.querySelector('.libro-grid-card-container');
    const isEliminarSection = document.querySelector('.eliminar-libros');
    const modalElement = document.getElementById('eliminarModal');

    if (!isEliminarSection) return;

    let libroIdParaEliminar = null;
    
    // Destruir cualquier instancia previa del modal
    const existingModal = bootstrap.Modal.getInstance(modalElement);
    if (existingModal) {
        existingModal.dispose();
    }
    
    // Remover cualquier backdrop residual y clases del modal
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    modalElement.classList.remove('show');
    document.body.classList.remove('modal-open');
    
    // Inicializar el modal con configuración específica
    const eliminarModal = new bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true
    });

    function vincularEventosEliminar() {
        // Limpiar botones existentes antes de agregar nuevos
        const existingButtons = libroGridCardContainer.querySelectorAll('.delete-book-btn-def');
        existingButtons.forEach(button => button.remove());

        libroGridCardContainer.querySelectorAll('.libro-grid-card').forEach(card => {
            if (!card.querySelector('.delete-book-btn-def')) {
                const deleteBtnHtml = `
                    <button type="button" class="btn btn-danger delete-book-btn-def ms-2">Eliminar</button>
                `;
                const linkButtonContainer = card.querySelector('.book-url-info');
                linkButtonContainer.insertAdjacentHTML('afterend', deleteBtnHtml);
            }
        });
    }

    // Usar delegación de eventos para el contenedor principal
    libroGridCardContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-book-btn-def')) {
            const libroCard = event.target.closest('.libro-grid-card');
            libroIdParaEliminar = libroCard.querySelector('.id-libro-info').textContent.split(': ')[1];
            eliminarModal.show();
        }
    });

    // Manejar el evento de cierre del modal
    modalElement.addEventListener('hidden.bs.modal', () => {
        libroIdParaEliminar = null;
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
    });

    // Manejar la confirmación de eliminación
    document.getElementById('confirmarEliminacion').addEventListener('click', async () => {
        if (libroIdParaEliminar) {
            try {
                await eliminarLibro(libroIdParaEliminar);
                const libroCard = Array.from(document.querySelectorAll('.id-libro-info'))
                    .find(el => el.textContent.includes(libroIdParaEliminar))
                    ?.closest('.libro-grid-card');

                if (libroCard) {
                    libroCard.remove();
                }
                eliminarModal.hide();
            } catch (error) {
                console.error('Error en la eliminación:', error);
                alert('Error al eliminar el libro');
            }
        }
    });

    // Vincular eventos inicialmente
    vincularEventosEliminar();

    async function eliminarLibro(id) {
        const port = await window.sessionAPI.getPort();
        const response = await fetch(`/libros/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el libro');
        }
        
        alert('Libro eliminado');
    }
}