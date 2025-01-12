export async function initBibliotecaDigital() {
    // Verificar autenticación al inicio
    const user = await window.sessionAPI.getUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    const libroGridCardContainer = document.querySelector('.libro-grid-card-container');
    const isBibliotecaSection = document.querySelector('.biblioteca-digital-container');
    
    if (!isBibliotecaSection) return;


    libroGridCardContainer.querySelectorAll('.libro-grid-card').forEach(card => {
        const favoriteBtnHtml = `
            <button type="button" class="btn btn-success add-favorite-btn ms-2">
                <i class="bi bi-heart-fill me-1"></i> Favorito
            </button>
        `;
        const linkButtonContainer = card.querySelector('.book-url-info');
        if (linkButtonContainer) {
            linkButtonContainer.insertAdjacentHTML('afterend', favoriteBtnHtml);
        }
    });

    libroGridCardContainer.addEventListener('click', async (event) => {
        if (event.target.classList.contains('add-favorite-btn')) {
            const libroCard = event.target.closest('.libro-grid-card');
            const idLibro = libroCard.querySelector('.id-libro-info').textContent.split(': ')[1];
            await agregarAFavoritos(idLibro, event.target);
        }
    });
}

async function agregarAFavoritos(idLibro, btnElement) {
    try {
        // 1. Primero verificamos si hay un usuario autenticado
        const user = await window.sessionAPI.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('http://localhost:3000/favoritos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id  // Añadimos el ID del usuario en los headers
            },
            body: JSON.stringify({
                id_libro: idLibro
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error === 'El libro ya está en favoritos') {
                alert('Este libro ya está en tus favoritos');
            } else {
                throw new Error('Error al agregar a favoritos');
            }
        } else {
            alert('Libro agregado a favoritos exitosamente');
            // Cambiar el estilo del botón
            btnElement.classList.remove('btn-success', 'ms-2');
            btnElement.classList.add('btn-secondary', 'ms-1');
            btnElement.innerHTML = '<i class="bi bi-heart-fill"></i> Agregado';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar a favoritos');
    }
}