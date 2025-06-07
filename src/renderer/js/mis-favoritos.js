export function initMisFavoritos() {
    const scrollableContainer = document.querySelector('.scrollable-container');
    const searchInput = document.querySelector('.search-box input');
    const prevButton = document.querySelector('.prev-btn-style');
    const nextButton = document.querySelector('.next-btn-style');
    
    let currentPage = 1;
    let totalPages = 1;
    let searchTerm = '';

    // Inicializar la carga de favoritos
    cargarFavoritos(currentPage, searchTerm);

    // Event listener para búsqueda
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchTerm = e.target.value;
            currentPage = 1; // Reset to first page on new search
            cargarFavoritos(currentPage, searchTerm);
        }, 300);
    });

    // Event listeners para paginación
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            cargarFavoritos(currentPage, searchTerm);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            cargarFavoritos(currentPage, searchTerm);
        }
    });

    async function cargarFavoritos(page, search = '') {
        try {
            const user = await window.sessionAPI.getUser();
            if (!user) {
                window.location.href = '/login.html';
                return;
            }

            const queryParams = new URLSearchParams({
                page: page,
                search: search
            });
            const port = await window.sessionAPI.getPort();
            const response = await fetch(`https://192.168.1.244:${port}/favoritos?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user.id
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar favoritos');
            }
            
            const data = await response.json();
            
            // Actualizar variables de paginación
            currentPage = data.currentPage;
            totalPages = data.totalPages;
            
            // Actualizar contador
            const contador = document.querySelector('.contador');
            contador.textContent = `${currentPage}/${totalPages}`;
            
            // Actualizar estados de botones
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage === totalPages;
            
            renderFavoritos(data.favorites);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function renderFavoritos(favoritos) {
        const libroFavoritoContainer = document.querySelector('.libro-favorito-container');
        libroFavoritoContainer.innerHTML = '';

        if (favoritos.length === 0) {
            libroFavoritoContainer.innerHTML = `
                <div class="w-100 d-flex justify-content-center col-12 text-center mt-5">
                    <h3 class="text-muted">No se encontraron favoritos</h3>
                </div>`;
            return;
        }

        favoritos.forEach((libro) => {
            const favoritoCard = `
                <div class="favorito-grid-card col mt-5">
                    <div class="card favorito">
                        <button type="button" class="view-favorite-info">
                            <img src="${libro.imagen}" class="imagen-info card-img-top libro-img-size align-self-center border-bottom-img" alt="...">
                        </button>
                        
                        <div class="card-body">
                            <p class="card-text id-favorito-info mb-2 light-grey-color-style">ID del Libro: ${libro.id_libro}</p>
                            <h5 class="card-title brown-color-style">${libro.titulo}</h5>
                            <p class="card-text genero-info light-grey-color-style mb-2">Género: ${JSON.parse(libro.genero).genero}</p>
                            <p class="card-text autor-info light-grey-color-style mb-2">Autor: ${libro.autor}</p>
                            <a href="${libro.url}" class="favorito-url-info">
                                <button type="button" class="btn btn-dark link-info link-info-style mt-2"> Link del recurso 
                                    <img class="ms-2" src="/assets/img/link.png" alt="Icono link" width="20px" height="20px">
                                </button>
                            </a>
                            <button type="button" class="btn btn-danger remove-favorite-btn mt-4 w-75">
                                <img class="me-2" src="/assets/img/borrar-libro.png" alt="Icono eliminar" width="20px" height="20px"> Eliminar de favoritos
                            </button>
                        </div>
                        <div class="card-footer">
                            <small class="text-body-secondary light-grey-color-style">Añadido: ${libro.created_at.split('T')[0]}</small>
                        </div>
                    </div>
                </div>`;
            
            libroFavoritoContainer.innerHTML += favoritoCard;
        });

        // Event listener para eliminar favoritos
        libroFavoritoContainer.addEventListener('click', async (e) => {
            if (e.target.closest('.remove-favorite-btn')) {
                const card = e.target.closest('.favorito-grid-card');
                const idLibro = card.querySelector('.id-favorito-info').textContent.split(': ')[1];
                await eliminarFavorito(idLibro);
            }
        });
    }

    async function eliminarFavorito(idLibro) {
        try {
            const user = await window.sessionAPI.getUser();
            if (!user) {
                throw new Error('Usuario no autenticado');
            }
            const port = await window.sessionAPI.getPort();
            const response = await fetch(`https://192.168.1.244:${port}/favoritos/${idLibro}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user.id
                }
            });

            if (!response.ok) throw new Error('Error al eliminar favorito');
            
            alert('Libro eliminado de favoritos');
            cargarFavoritos(currentPage, searchTerm); // Recargar la página actual
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar de favoritos');
        }
    }
}