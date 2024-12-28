
export function initEliminarLibro() {
    const libroGridCardContainer = document.querySelector('.libro-grid-card-container');
    const isEliminarSection = document.querySelector('.eliminar-libros');

    if (!isEliminarSection) return; // Si no estás en la sección de eliminar, no hacer nada

    let libroIdParaEliminar; // Variable para almacenar el ID del libro a eliminar
    //Definir modal para que funcione el scope
    const eliminarModal = new bootstrap.Modal(document.getElementById('eliminarModal'));

    // Agregar evento de clic a cada botón de eliminación
    libroGridCardContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-book-btn-def')) {
            const libroCard = event.target.closest('.libro-grid-card');
            libroIdParaEliminar = libroCard.querySelector('.id-libro-info').textContent.split(': ')[1];
            // Mostrar el modal
            eliminarModal.show();
        }
    });

    // Manejar la confirmación de eliminación

    document.getElementById('confirmarEliminacion').addEventListener('click', () => {
        if (libroIdParaEliminar) {
            eliminarLibro(libroIdParaEliminar).then(() => {
                // Use a more reliable selector
                const libroCard = Array.from(document.querySelectorAll('.id-libro-info'))
                    .find(el => el.textContent.includes(libroIdParaEliminar))
                    ?.closest('.libro-grid-card');

                if (libroCard) {
                    libroCard.remove(); // Eliminar la tarjeta del DOM
                }
            }).catch(error => {
                console.error('Error en la eliminación:', error);
                // Optionally show an error message to the user
            });
        }
    });

    // Agregar botones de eliminación a las tarjetas de libros
    libroGridCardContainer.querySelectorAll('.libro-grid-card').forEach(card => {
        const deleteBtnHtml = `
            <button type="button" class="btn btn-danger delete-book-btn-def ms-2">Eliminar</button>
        `;
        // Seleccionamos el contenedor del botón de Link del recurso
        const linkButtonContainer = card.querySelector('.book-url-info');

        // Insertamos el botón de eliminar justo después del botón de Link del recurso
        linkButtonContainer.insertAdjacentHTML('afterend', deleteBtnHtml);
    });
    // Función para eliminar un libro
    async function eliminarLibro(id) {
        try {
            const response = await fetch(`http://localhost:3000/libros/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el libro');
            } else {
                alert('Libro eliminado')
                eliminarModal.hide()
            }
        } catch (error) {
            console.error('Error al eliminar el libro:', error);
        }
    }
}
