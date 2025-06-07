import { initBibliotecaDigital } from "./biblioteca-digital.js";
import { initEditarLibro } from "./editar-libro.js";
import { initEliminarLibro } from "./eliminar-libro.js";
let currentPage = 1;
let totalPages = 1;
let currentSearchTerm = '';

export function initMostrarLibro() {
    // Cargar libros iniciales
    mostrarLibro(currentPage, currentSearchTerm);

    // Configurar barra de búsqueda
    const searchInput = document.querySelector('.search-box input');
    const searchIcon = document.querySelector('.buscar-libros-icono');

    // Evento de búsqueda al hacer clic en el ícono
    searchIcon.addEventListener('click', () => {
        currentSearchTerm = searchInput.value.trim();
        currentPage = 1;
        mostrarLibro(currentPage, currentSearchTerm);
    });

    // Evento de búsqueda al escribir (keyup en vez de enter)
    searchInput.addEventListener('keyup', () => {
        currentSearchTerm = searchInput.value.trim();
        currentPage = 1;
        mostrarLibro(currentPage, currentSearchTerm);
    });

    // Configurar botones de paginación
    document.querySelector('.prev-btn-style').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            mostrarLibro(currentPage, currentSearchTerm);
        }
    });

    document.querySelector('.next-btn-style').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            mostrarLibro(currentPage, currentSearchTerm);
        }
    });
}

// Función modificada para soportar búsqueda
export async function mostrarLibro(page = 1, searchTerm = '') {
    try {
        // Cerrar el modal de eliminación si está abierto
        const eliminarModal = bootstrap.Modal.getInstance(document.getElementById('eliminarModal'));
        if (eliminarModal) {
            eliminarModal.hide(); // Cerrar el modal
        }

        // Construir URL con parámetros de búsqueda
        const port = await window.sessionAPI.getPort();
        const url = new URL(`https://192.168.1.244:${port}/libros`);
        url.searchParams.set('page', page);
        if (searchTerm) url.searchParams.set('search', searchTerm);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });

        if (!response.ok) {
            throw new Error('Error al consultar los libros');
        }

        const data = await response.json();

        // Renderizar libros
        renderLibros(data.books);

        // Actualizar variables de paginación
        currentPage = data.currentPage;
        totalPages = data.totalPages;

        // Actualizar controles de paginación
        updatePaginationControls(data);

        return data;
    } catch (error) {
        console.error('Error al obtener los libros:', error);
        return;
    }
}

// Función para renderizar libros
function renderLibros(libros) {

    const libroGridCardContainer = document.querySelector('.libro-grid-card-container');
    if (libros.length === 0) {

        libroGridCardContainer.innerHTML = `
            <div class="margin-error container mt-5 d-flex flex-column">
                <div class="row justify-content-center">
                    <div class="col-md-6 text-center">
                        <div class="alert alert-danger" role="alert">
                            <h2 class="alert-heading">Error 404</h2>
                            <p class="mb-3">Lo sentimos, el libro no fue encontrado</p>
                            <img src="/assets/img/error-img.jpg" alt="Error de usuario" width="200px" height="200px" class="mb-3 rounded">
                            <p>Verifique que el libro existe</p>
                        </div>
                    </div>
                </div>
            </div>`;
            
    } else {
        libroGridCardContainer.innerHTML = '';

        libros.forEach((libro) => {
            const libroGridCardHtml = `
            <div class="libro-grid-card col">
                <div class="card libro">
                    <button type="button" class="edit-click-info">
                        <img src="${libro.imagen}" class="imagen-info card-img-top libro-img-size align-self-center border-bottom-img " alt="...">
                    </button>
                    
                    <div class="card-body">
                        <p class="card-text id-libro-info mb-2 light-grey-color-style">ID del Libro: ${libro.id_libro}</p>
                        <h5 class="card-title brown-color-style">${libro.titulo}</h5>
                        <p class="card-text genero-info light-grey-color-style mb-2">Género: ${JSON.parse(libro.genero).genero}</p>
                        <p class="card-text autor-info light-grey-color-style mb-2">Autor: ${libro.autor}</p>
                        <p class="card-text cantidad-info orange-color-style mb-3">Cantidad: ${libro.cantidad}</p>
                        <a href="${libro.url}" class="book-url-info">
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
    }

    // Agregar event listeners para los botones después de renderizar
    document.querySelectorAll('.link-info-style').forEach(button => {
        button.addEventListener('click', (e) => {
            const url = e.currentTarget.getAttribute('data-url');
            // Navegar a la URL en la misma ventana
            window.location.href = url;
        });
    });

    if (document.querySelector('.eliminar-libros')) {
        initEliminarLibro();
    } else if (document.querySelector('.editar-libros')) {
        initEditarLibro(); 
    }

    initBibliotecaDigital();
}
// Función para actualizar controles de paginación
function updatePaginationControls(data) {
    const counterElement = document.querySelector('.contador');
    counterElement.textContent = `${data.currentPage}/${data.totalPages}`;

    // Disable/enable pagination buttons
    const prevButton = document.querySelector('.prev-btn-style');
    const nextButton = document.querySelector('.next-btn-style');

    prevButton.disabled = data.currentPage === 1;
    nextButton.disabled = data.currentPage === data.totalPages;
}
