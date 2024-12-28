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
        // Construir URL con parámetros de búsqueda
        const url = new URL('http://localhost:3000/libros');
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
    
    // Inicializar eventos de editar y eliminar
    initEditarLibro();
    initEliminarLibro();
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
