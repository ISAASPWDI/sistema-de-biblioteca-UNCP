// editar-usuario.js
export function initEditarUsuario() {
    const userTableBody = document.getElementById('user-table-body');
    const editarUsuarioModal = new bootstrap.Modal(document.getElementById('editarUsuarioModal'));
    
    const showPassword = document.querySelector('.editUserCheckbox')
    const passwordInput = document.getElementById('editar-contrasenia')
    showPassword.addEventListener('click', () => {
        if (showPassword.checked) {
            passwordInput.type = 'text'
        } else {
            passwordInput.type = 'password'
        }
    })

    // Selectors for modal inputs
    const usuarioIdInput = document.getElementById('editar-usuario-id');
    const nombreInput = document.getElementById('editar-nombre');
    const correoInput = document.getElementById('editar-correo');
    const rolInput = document.getElementById('editar-rol');
    const contraseniaInput = document.getElementById('editar-contrasenia');
    const guardarCambiosBtn = document.getElementById('guardar-cambios-usuario');
    function mostrarMensaje(mensaje, esError = false) {
        const modalFooter = document.querySelector('#editarUsuarioModal .modal-footer');
        // Limpiar mensajes anteriores
        const mensajesAnteriores = modalFooter.querySelectorAll('p');
        mensajesAnteriores.forEach(msg => msg.remove());
        
        const mensajeElement = document.createElement('p');
        mensajeElement.textContent = mensaje;
        mensajeElement.style.color = esError ? 'red' : 'green';
        mensajeElement.style.fontWeight = 'bold';
        mensajeElement.style.margin = '0';
        modalFooter.insertAdjacentElement('afterbegin', mensajeElement);
    }
    function validateEmail(email) {
        // Expresión regular para validar formato de email
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }
    // Event delegation for edit button
    userTableBody.addEventListener('click', async (event) => {
        const editButton = event.target.closest('.editar-usuario');
        if (editButton) {
            // Get user data from the table row
            const row = editButton.closest('tr');
            const userId = editButton.dataset.id;
            const nombre = row.querySelector('.nombre-usuario').textContent.trim();
            const correo = row.querySelector('.correo-usuario').textContent.trim();
            const rol = row.querySelector('.rol-usuario').textContent.trim().toLowerCase();

            // Populate modal with user details directly from the table
            usuarioIdInput.value = userId;
            nombreInput.value = nombre;
            correoInput.value = correo;
            rolInput.value = rol;

            // Show the modal
            editarUsuarioModal.show();
        }
    });

    // Save changes event
    guardarCambiosBtn.addEventListener('click', async () => {
        const userId = usuarioIdInput.value;
        const updateData = {
            nombre: nombreInput.value,
            email: correoInput.value,
            rol: rolInput.value
        };
 
        // Add password if provided
        if (contraseniaInput.value.trim() !== '') {
            updateData.contrasena_hash = contraseniaInput.value;
        }
        if (!validateEmail(updateData.email)) {
            mostrarMensaje('Por favor, ingrese un correo electrónico válido', true);
            return;
        }
        console.log('Datos enviados al servidor:', updateData);
 
        try {
            const response = await fetch(`/usuarios/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const responseData = await response.json();
            if (response.ok) {
                mostrarMensaje('Usuario actualizado exitosamente');
                
                setTimeout(() => {
                    // Recargar usuarios y cerrar modal
                    const cargarUsuarios = document.querySelector('#user-table-body').dataset.cargarUsuarios;
                    if (cargarUsuarios) {
                        window[cargarUsuarios](1);
                    }
                    
                    // Limpiar campos
                    contraseniaInput.value = '';
                    
                    editarUsuarioModal.hide();
                    
                    // Limpiar mensaje después de cerrar el modal
                    setTimeout(() => {
                        const modalFooter = document.querySelector('#editarUsuarioModal .modal-footer');
                        const mensajes = modalFooter.querySelectorAll('p');
                        mensajes.forEach(msg => msg.remove());
                    }, 300);
                }, 1500);
            } else {
                mostrarMensaje(responseData.message || 'No se pudo actualizar el usuario', true);
            }
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            mostrarMensaje('Error al actualizar usuario', true);
        }
    });
}