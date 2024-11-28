import { mostrarLibro } from "./mostrar-libro.js";

export function initEliminarLibro() {
    console.log('working!!!');

    mostrarLibro().then((libros) => {
        // Selecciona el contenedor donde se agregarán las tarjetas de los libros
        const libroGridCardContainer = document.querySelector('.libro-grid-card-container');

        // Limpia el contenedor antes de cargar nuevos libros (opcional)
        libroGridCardContainer.innerHTML = '';

        // Genera las tarjetas dinámicamente
        libros.forEach((libro) => {
            const libroGridCardHtml = `
            <div class="libro-grid-card col">
                <div class="card libro">
                    <button type="button" class="delete-click-info">
                        <img src="${libro.imagen}" class="imagen-info card-img-top libro-img-size align-self-center border-bottom-img " alt="...">
                    </button>
                    
                    <div class="card-body">
                        <p class="card-text id-libro-info mb-2 light-grey-color-style">ID del Libro: ${libro.id_libro}</p>
                        <h5 class="card-title brown-color-style">${libro.titulo}</h5>
                        <p class="card-text genero-info light-grey-color-style mb-2">Género: ${libro.genero_genre}</p>
                        <p class="card-text autor-info light-grey-color-style mb-2">Autor: ${libro.autor}</p>
                        <p class="card-text cantidad-info orange-color-style mb-3">Cantidad: ${libro.cantidad}</p>
                        <a href="${libro.url}">
                            <button type="button" class="btn btn-dark link-info link-info-style"> Link del recurso <img class="ms-2"
                        src="/assets/img/link.png" alt="Icono cerrar-sesion" width="20px" height="20px">
                            </button>
                        </a>
                    </div>
                    <div class="card-footer">
                        <small class="text-body-secondary light-grey-color-style">Añadido: ${libro.created_at.split('T')[0]}</small>
                    </div>
                </div>
            </div>`;

            libroGridCardContainer.innerHTML += libroGridCardHtml;
        });
        document.querySelectorAll('.libro-grid-card .delete-click-info').forEach(($deleteButton) => {
            $deleteButton.addEventListener('click', (e) => {
                showDeleteBookModal();
            });
        });
    })
}

function showDeleteBookModal() {
    const deleteBookModal = new bootstrap.Modal(document.getElementById('deleteBookModal'));
    deleteBookModal.show();
}

function handleDelete(){

}