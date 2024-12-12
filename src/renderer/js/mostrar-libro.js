import { initEditarLibro } from "./editar-libro.js";
import { initEliminarLibro } from "./eliminar-libro.js";

export function initMostrarLibro() {
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
                    <button type="button" class="edit-click-info">
                        <img src="${libro.imagen}" class="imagen-info card-img-top libro-img-size align-self-center border-bottom-img " alt="...">
                    </button>
                    
                    <div class="card-body">
                        <p class="card-text id-libro-info mb-2 light-grey-color-style">ID del Libro: ${libro.id_libro}</p>
                        <h5 class="card-title brown-color-style">${libro.titulo}</h5>
                        <p class="card-text genero-info light-grey-color-style mb-2">Género: ${libro.genero_genre}</p>
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

        // Una vez que todas las tarjetas estén en el DOM, inicializa los eventos de edición
        initEditarLibro();

    });
}

// Función para consultar los libros desde la API
export async function mostrarLibro() {
    try {
        const response = await fetch('http://localhost:3000/libros', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });

        if (!response.ok) {
            throw new Error('Error al consultar los libros');
        }

        const libros = await response.json();
        return libros;
    } catch (error) {
        console.error('Error al obtener los libros:', error);
        return;
    }
}
