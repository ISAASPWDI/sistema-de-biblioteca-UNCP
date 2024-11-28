const d = document
export function initAgregarLibro() {
    const formAgregarLibro = d.querySelector('.add-book-form');
    formAgregarLibro.addEventListener('submit', (e) => {
        e.preventDefault()
        handleAdd()
    })
}

async function handleAdd() {

    const $titulo = d.getElementById('titulo')?.value
    const $autor= d.getElementById('autor')?.value
    const $genero = d.getElementById('genero')?.value
    const $imgLibro = d.getElementById('formFile').files[0]
    const $link = d.getElementById('link')?.value
    const $cantidad = d.getElementById('cantidad')?.value

    const formData = new FormData()
    formData.append('titulo', $titulo)
    formData.append('autor', $autor)
    formData.append('genero', $genero)
    formData.append('url', $link)
    formData.append('cantidad', $cantidad)
    if ($imgLibro) {
        formData.append('imagen', $imgLibro)
    }
    try {
        const res = await fetch('http://localhost:3000/libros',{
            method: 'POST',
            body: formData
        })
        const data = await res.json()
        console.log(data)
        if (data.message === 'Libro agregado con éxito') {
            // Puedes mostrar un mensaje de éxito o redireccionar
            showAddedBookModal()
            limpiarFormulario()
        }
    } catch (error) {
        console.error(error)
    }

}
function limpiarFormulario() {
    d.getElementById('titulo').value = ''
    d.getElementById('autor').value = ''
    d.getElementById('genero').value = ''
    d.getElementById('formFile').value = ''
    d.getElementById('link').value = ''
    d.getElementById('cantidad').value = ''
}

function showAddedBookModal() {
    const addBookModal = new bootstrap.Modal(document.getElementById('addBookModal'))
    addBookModal.show()
}