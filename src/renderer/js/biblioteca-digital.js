export function initBibliotecaDigital() {
    const libroGridCardContainer = document.querySelector('.libro-grid-card-container');
    const isBibliotecaSection = document.querySelector('.biblioteca-digital-container');
    console.log(libroGridCardContainer);
    
    console.log(libroGridCardContainer.querySelectorAll('.libro-grid-card'));
    
    if (!isBibliotecaSection) return;

    // Agregar botones de favoritos a las tarjetas existentes
    libroGridCardContainer.querySelectorAll('.libro-grid-card').forEach(card => {
        const favoriteBtnHtml = `
            <button type="button" class="btn btn-success add-favorite-btn ms-2">
                <i class="bi bi-heart-fill"></i> Favorito
            </button>
        `;
        // Seleccionamos el contenedor del botón de Link del recurso
        const linkButtonContainer = card.querySelector('.book-url-info');

        // Insertamos el botón de favoritos justo después del botón de Link del recurso
        if (linkButtonContainer) {
            linkButtonContainer.insertAdjacentHTML('afterend', favoriteBtnHtml);
        }
    });

    // Event listener para botones de favoritos
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
        const response = await fetch('http://localhost:3000/favoritos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Enviar cookies
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
            // Opcional: Cambiar el estilo del botón para indicar que ya está en favoritos
            btnElement.classList.remove('btn-success');
            btnElement.classList.add('btn-secondary');
            btnElement.innerHTML = '<i class="bi bi-heart-fill"></i> En favoritos';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar a favoritos');
    }
}