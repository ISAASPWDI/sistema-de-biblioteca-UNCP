export function initMostrarLibro() {
    mostrarLibro().then((libros)=>{
        libros.forEach(libro => {
            const libroGridCardHtml = `
            <div class="libro-grid-card col">
                <div class="card libro">
                    <img src="${libro.imagen}" class="card-img-top libro-img-size align-self-center border-bottom-img " alt="...">
                    <div class="card-body">
                        <h5 class="card-title">${libro.titulo}</h5>
                        <p class="card-text">Genero: ${libro.genero_genre}</p>
                        <p class="card-text">Autor: ${libro.autor}</p>
                        <p class="card-text">Numero de libro: ${libro.id_libro}</p>
                        <p class="card-text">Url: ${libro.url}</p>
                    </div>
                    <div class="card-footer">
                        <small class="text-body-secondary">Added: ${libro.created_at}</small>
                    </div>
                </div>
            </div>
                `
                const libroGridCardContainer = document.querySelector('.libro-grid-card-container')
                libroGridCardContainer.innerHTML += libroGridCardHtml
                

            console.log(libro);

        });
    })
}
export async function mostrarLibro() {
    const response = await fetch('http://localhost:3000/libros', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        }
    })
    const libros = await response.json()
    return libros
}