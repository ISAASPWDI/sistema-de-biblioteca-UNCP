// mostrar-usuarios.js
let currentPage = 1;
let totalPages = 1;

export function initMostrarUsuarios() {
    const userTableBody = document.getElementById('user-table-body');
    const prevButton = document.querySelector('.prev-btn-style');
    const nextButton = document.querySelector('.next-btn-style');
    const contadorPagina = document.querySelector('.contador');
    const searchInput = document.querySelector('.search-box input');
    const agregarUsuarioBtn = document.querySelector('.agregar-estudiante-btn');
    const submitNewUserBtn = document.querySelector('.submit-new-user');

    const addUserPasswordInput= document.querySelector('.addUserPasswordInput')
    const addUserPasswordInputCheckBox = document.querySelector('.addUserPasswordInputCheckBox')
    addUserPasswordInputCheckBox.addEventListener('click', () => {
        if (addUserPasswordInputCheckBox.checked) {
            addUserPasswordInput.type = 'text'
        } else {
            addUserPasswordInput.type = 'password'
        }
    })
    // Bootstrap modal instance
    const agregarEstudianteModal = new bootstrap.Modal(document.getElementById('agregarEstudianteModal'));

    // Función de debounce para evitar solicitudes excesivas
    function debounce(func, delay) {
        let timeoutId;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }

    // Función para cargar usuarios
    async function cargarUsuarios(page) {
        try {
            const searchTerm = searchInput.value.trim();
            const response = await fetch(`/usuarios?page=${page}&search=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
    
            if (!response.ok || !data.users) {
                throw new Error('No se pudieron cargar los usuarios.');
            }
    
            // Limpiar tabla actual
            userTableBody.innerHTML = '';
    
            // Comprobar si hay usuarios
            if (data.users.length === 0) {
                userTableBody.innerHTML = `
                <div class="margin-error container mt-5 d-flex flex-column">
                    <div class="row justify-content-center">
                        <div class="col-md-6 text-center">
                            <div class="alert alert-danger" role="alert">
                                <h2 class="alert-heading">Error 404</h2>
                                <p class="mb-3">Lo sentimos, el usuario no fue encontrado</p>
                                <img src="/assets/img/error-img.jpg" alt="Error de usuario" width="200px" height="200px" class="mb-3 rounded">
                                <p>Verifique que el usuario existe</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
                return;
            }
    
            // Poblar tabla con usuarios
            data.users.forEach(usuario => {
                const row = `
                    <tr>
                        <td class="nombre-usuario">${usuario.Nombre}</td>
                        <td class="correo-usuario">${usuario.Correo}</td>
                        <td class="rol-usuario">${usuario.Rol}</td>
                        <td>
                            <button class="btn btn-sm ${usuario.Estado ? 'btn-success' : 'btn-danger-inactive'} ${usuario.Estado ? 'activar-usuario' : 'desactivar-usuario'}" data-id="${usuario.IdUsuario}">
                                ${usuario.Estado ? 'Activo' : 'Inactivo'}
                            </button>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-primary editar-usuario edit-user-btn me-2" data-id="${usuario.IdUsuario}">
                                <b>Editar</b>
                                <img class="me-1" width="16px" height="16px" src="/assets/img/editar-libro.png" alt="">   
                            </button>
                            <button class="btn btn-sm btn-danger eliminar-usuario" data-id="${usuario.IdUsuario}">
                                <b>Eliminar</b>
                                <img class="me-1" width="16px" height="16px" src="/assets/img/borrar-libro.png" alt="">    
                            </button>
                        </td>
                    </tr>
                `;
                userTableBody.insertAdjacentHTML('beforeend', row);
            });
    
            // Actualizar estado de paginación
            currentPage = data.currentPage;
            totalPages = data.totalPages;
            contadorPagina.textContent = `${currentPage}/${totalPages}`;
    
            // Habilitar/deshabilitar botones de navegación
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage === totalPages;
    
        } catch (error) {
            // Aquí manejamos el error sin mostrarlo en la consola
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">Hubo un error al cargar los usuarios. Por favor, inténtelo nuevamente.</td>
                </tr>
            `;
        }
    }
    



    // Eventos de botones de paginación
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            cargarUsuarios(currentPage - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            cargarUsuarios(currentPage + 1);
        }
    });

    // Evento de búsqueda con debounce
    searchInput.addEventListener('keyup', debounce(() => {
        // Si el input está vacío, recarga los usuarios desde la página 1
        searchInput.value.trim() === "" ? cargarUsuarios(1) : cargarUsuarios(1)
    }, 300));


    // Evento de clic en el botón "Agregar Usuario"
    agregarUsuarioBtn.addEventListener('click', () => {
        // Reset form inputs
        document.getElementById('nombre-input').value = '';
        document.getElementById('correo-input').value = '';
        document.getElementById('rol-input').value = 'estudiante';
        document.getElementById('contrasenia-input').value = '';
        document.getElementById('estado-input').value = 'activo';

        // Show modal
        agregarEstudianteModal.show();
    });

    function mostrarMensaje(mensaje, esError = false) {
        const modalFooterContainer = document.querySelector('.modal-footer');
        // Limpiar mensajes anteriores
        const mensajesAnteriores = modalFooterContainer.querySelectorAll('p');
        mensajesAnteriores.forEach(mensaje => mensaje.remove());
        
        const mensajeElement = document.createElement('p');
        mensajeElement.textContent = mensaje;
        mensajeElement.style.color = esError ? 'red' : 'green';
        mensajeElement.style.fontWeight = 'bold';
        modalFooterContainer.insertAdjacentElement('afterbegin', mensajeElement);
    }
    function validateEmail(email) {
        // Expresión regular para validar formato de email
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }
    // Evento de clic en el botón de enviar nuevo usuario
submitNewUserBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const nombreInput = document.getElementById('nombre-input');
    const correoInput = document.getElementById('correo-input');
    const rolInput = document.getElementById('rol-input');
    const contraseniaInput = document.getElementById('contrasenia-input');
    const estadoInput = document.getElementById('estado-input');

    
    if (correoInput.value.trim() !== '' && !validateEmail(correoInput.value)) {
        mostrarMensaje('Por favor, ingrese un correo electrónico válido', true);
        return;
    }
    
    const newUser = {
        nombre: nombreInput.value,
        email: correoInput.value,
        rol: rolInput.value,
        esta_activo: estadoInput.value === 'activo' ? 1 : 0, 
        contrasena_hash: contraseniaInput.value
    };
    
    console.log(newUser.esta_activo);
    console.log(rolInput.value);
    
    try {
        const response = await fetch('/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });
        const data = await response.json()
        if (response.ok) {
            mostrarMensaje('Usuario Agregado correctamente');
            
            // Limpiar los campos del formulario
            nombreInput.value = '';
            correoInput.value = '';
            contraseniaInput.value = '';
            rolInput.value = 'estudiante';
            estadoInput.value = 'activo';
            
            // Esperar 1.5 segundos antes de cerrar el modal y recargar la tabla
            setTimeout(() => {
                agregarEstudianteModal.hide();
                cargarUsuarios(1);
                // Limpiar el mensaje después de cerrar el modal
                setTimeout(() => {
                    const modalFooterContainer = document.querySelector('.modal-footer');
                    const mensajes = modalFooterContainer.querySelectorAll('p');
                    mensajes.forEach(msg => msg.remove());
                }, 300);
            }, 1500);
            
        } else {
            mostrarMensaje(data.message, true);
        }
    } catch (error) {
        console.error('Error al agregar usuario:', error);
        mostrarMensaje('Error al agregar usuario', true);
    }
});

    // Evento de clic en el botón de activar/desactivar usuario
    userTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('activar-usuario') || event.target.classList.contains('desactivar-usuario')) {
            const userId = event.target.dataset.id;
            const isActive = event.target.classList.contains('activar-usuario');

            try {
                await fetch(`/usuarios/${userId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ esta_activo: !isActive })
                });
                cargarUsuarios(currentPage); // Recargar la página actual después de cambiar el estado
            } catch (error) {
                console.error('Error al cambiar el estado del usuario:', error);
            }
        }
    });

    // Cargar primera página al iniciar
    cargarUsuarios(1);
}