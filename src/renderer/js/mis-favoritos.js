// mis-favoritos.js
export function initMisFavoritos() {
    console.log('working');
    
    const scrollableContainer = document.querySelector('.scrollable-container');
    const isFavoritosSection = document.querySelector('.biblioteca-container');
    
    if (!isFavoritosSection) return;

    // Agregar contenedor para las tarjetas
    const favoritosContainer = document.createElement('div');
    favoritosContainer.className = 'favoritos-container row col-12 ps-5 pt-4 pe-2 pb-3 mb-4';
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'favoritos-grid-container row row-cols-1 row-cols-md-3 g-4 mt-0';
    
    favoritosContainer.appendChild(gridContainer);
    scrollableContainer.appendChild(favoritosContainer);

    // Cargar favoritos inicialmente
    cargarFavoritos();
}

async function cargarFavoritos() {
    try {
        const response = await fetch('http://localhost:3000/favoritos', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Error al cargar favoritos');
        
        const favoritos = await response.json();
        renderFavoritos(favoritos);
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderFavoritos(favoritos) {
    const gridContainer = document.querySelector('.favoritos-grid-container');
    gridContainer.innerHTML = '';

    favoritos.forEach((libro) => {
        const favoritoCard = `
            <div class="favorito-grid-card col">
                <div class="card favorito">
                    <button type="button" class="view-favorite-info">
                        <img src="${libro.imagen}" class="imagen-info card-img-top favorito-img-size align-self-center border-bottom-img" alt="...">
                    </button>
                    
                    <div class="card-body">
                        <p class="card-text id-favorito-info mb-2 light-grey-color-style">ID del Libro: ${libro.id_libro}</p>
                        <h5 class="card-title brown-color-style">${libro.titulo}</h5>
                        <p class="card-text genero-info light-grey-color-style mb-2">Género: ${JSON.parse(libro.genero).genero}</p>
                        <p class="card-text autor-info light-grey-color-style mb-2">Autor: ${libro.autor}</p>
                        <a href="${libro.url}" class="favorito-url-info">
                            <button type="button" class="btn btn-dark link-info link-info-style"> Link del recurso 
                                <img class="ms-2" src="/assets/img/link.png" alt="Icono link" width="20px" height="20px">
                            </button>
                        </a>
                        <button type="button" class="btn btn-danger remove-favorite-btn mt-2 w-100">
                            <i class="bi bi-heart-break-fill"></i> Eliminar de favoritos
                        </button>
                    </div>
                    <div class="card-footer">
                        <small class="text-body-secondary light-grey-color-style">Añadido: ${libro.created_at.split('T')[0]}</small>
                    </div>
                </div>
            </div>`;
        
        gridContainer.innerHTML += favoritoCard;
    });

    // Event listener para eliminar favoritos
    gridContainer.addEventListener('click', async (e) => {
        if (e.target.closest('.remove-favorite-btn')) {
            const card = e.target.closest('.favorito-grid-card');
            const idLibro = card.querySelector('.id-favorito-info').textContent.split(': ')[1];
            await eliminarFavorito(idLibro);
        }
    });
}

async function eliminarFavorito(idLibro) {
    try {
        const response = await fetch(`http://localhost:3000/favoritos/${idLibro}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Error al eliminar favorito');
        
        alert('Libro eliminado de favoritos');
        cargarFavoritos(); // Recargar la lista
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar de favoritos');
    }
}