import { initMostrarLibro } from "./mostrar-libro.js";

//EJECUTAR LA LOGICA PARA EDITAR UN LIBRO
export function initEditarLibro() {

    //SELECCIONAMOS EL CONTENEDOR DEL LIBRO Y LUEGO EL BOTON PARA EDITAR Y RECORREMOS CADA GRID CARD DE LIBROS
    document.querySelectorAll('.libro-grid-card .edit-click-info').forEach(($editButton) => {
        $editButton.addEventListener('click', (e) => {
            // Obtener el card padre del botón de edición
            const modal = document.getElementById('editBookModal');
            const $card = $editButton.closest('.libro-grid-card .card');
            if (modal) {
            // Poblar el modal de edición con los datos actuales del libro
                populateEditModal($card);
            // Mostrar el modal de edición
                showEditBookModal();
            } else {
                console.warn('El modal no está presente en esta sección.');
            }
        });
    });

    const formEditarLibro = document.querySelector('.edit-book-form');
    // Verificar si el formulario existe antes de interactuar con él
    if (!formEditarLibro) {
        console.warn('El formulario de edición no se encontró en el DOM.');
        return;
    }
    // Verifica que no se agregue el evento dos veces
    if (!formEditarLibro.dataset.initialized) {
        formEditarLibro.dataset.initialized = true;
        formEditarLibro.addEventListener('submit', handleEdit);
    }
}

function populateEditModal($card) {
    // Verificar que el modal existe
    const modal = document.getElementById('editBookModal');
    
    // Obtener los elementos del modal con verificación
    const $modalTitulo = modal.querySelector('#titulo');
    const $modalAutor = modal.querySelector('#autor');
    const $modalGenero = modal.querySelector('#genero');
    const $modalLink = modal.querySelector('#link');
    const $modalCantidad = modal.querySelector('#cantidad');

    // Verificar que los elementos existen antes de establecer valores
    

    // Extraer datos de la tarjeta
    const titulo = $card.querySelector('.card-title').textContent.trim();
    const genero = $card.querySelector('.genero-info').textContent.replace('Género: ', '').trim();
    const autor = $card.querySelector('.autor-info').textContent.replace('Autor: ', '').trim();
    const link = $card.querySelector('.book-url-info').href;
    const cantidad = $card.querySelector('.cantidad-info').textContent.replace('Cantidad: ', '').trim();
    const idLibro = $card.querySelector('.id-libro-info').textContent.replace('ID del Libro: ', '').trim();

    // Poblar el modal con los datos
    $modalTitulo.value = titulo;
    $modalAutor.value = autor;
    $modalGenero.value = genero;
    $modalLink.value = link;
    $modalCantidad.value = cantidad;

    // Agregamos un campo oculto para el ID del libro
    // Si no existe, lo creamos
    let $hiddenIdInput = modal.querySelector('input[name="id_libro_info"]');
    if (!$hiddenIdInput) {
        $hiddenIdInput = document.createElement('input');
        $hiddenIdInput.type = 'hidden';
        $hiddenIdInput.name = 'id_libro_info';
        modal.querySelector('.edit-book-form').appendChild($hiddenIdInput);
    }
    $hiddenIdInput.value = idLibro;
}

//FUNCION PARA MOSTRAR EL MODAL DE EDICION DE LIBRO
function showEditBookModal() {
    const editBookModal = new bootstrap.Modal(document.getElementById('editBookModal'));
    editBookModal.show();
}
//FUNCION PARA MOSTRAR EL MODAL DE EDICION DE LIBRO CORRECTAMENTE
function showEditBookSuccessModal() {
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
}
//MANEJAR EL EVENTO DE ENVIAR INFORMACION AL EDITAR 
async function handleEdit(event) {
    event.preventDefault();
    
    const modal = document.getElementById('editBookModal');
    
    // Obtener datos del formulario de edición
    const $id_libro_info = modal.querySelector('input[name="id_libro_info"]').value;
    const $titulo = modal.querySelector('#titulo').value.trim();
    const $autor = modal.querySelector('#autor').value.trim();
    const $genero = modal.querySelector('#genero').value.trim();
    const $link = modal.querySelector('#link').value.trim();
    const $cantidad = parseInt(modal.querySelector('#cantidad').value.trim(), 10) || 0;
    const $imagen = modal.querySelector('#formFile').files[0];

    // Crear FormData con datos del formulario
    const formData = new FormData();
    formData.append('id_libro_info', $id_libro_info);
    formData.append('titulo', $titulo);
    formData.append('autor', $autor);
    formData.append('genero', $genero);
    formData.append('url', $link);
    formData.append('cantidad', $cantidad);
    
    // Agregar imagen si se seleccionó
    if ($imagen) formData.append('imagen', $imagen);


    try {
        const port = await window.sessionAPI.getPort();

        const res = await fetch(`http://192.168.1.244:${port}/libros`, {
            method: 'PUT',
            body: formData,
        });

   
        
        const data = await res.json();
        
        if (data.message === 'Libro editado con éxito') {
            // Oculta el modal de edición
            const editBookModal = bootstrap.Modal.getInstance(document.getElementById('editBookModal'));
            editBookModal.hide();

            // Recargar la lista de libros
            initMostrarLibro();
            
            // Mostrar modal de éxito
            showEditBookSuccessModal()

        }
    } catch (error) {
        console.error('Error al editar el libro:', error);
    }
}
