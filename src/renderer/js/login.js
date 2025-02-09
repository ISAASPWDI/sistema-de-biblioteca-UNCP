export function login() {
    const loginForm = document.querySelector('.login-btn-form');
    const showPassword = document.querySelector('.form-check input');
    const passwordInput = document.getElementById('password');

    showPassword.addEventListener('click', () => {
        passwordInput.type = showPassword.checked ? 'text' : 'password';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });
}

async function handleLogin() {
    try {
        const emailElement = document.getElementById('email');
        const passwordElement = document.getElementById('password');

        if (!emailElement || !passwordElement) {
            console.error('No se encontraron los elementos del formulario');
            showErrorModal('Error en el formulario');
            return;
        }

        const email = emailElement.value.trim();
        const password = passwordElement.value;

        // Validaciones básicas
        if (!email || !password) {
            showErrorModal('Por favor complete todos los campos');
            return;
        }

        const result = await window.sessionAPI.login({ email, password });
        console.log('Respuesta del servidor:', result);
        
        if (result.success) {
            // Redirigir al usuario
            window.location.href = result.url;
        } else {
            showErrorModal(result.message || result.error);
        }
    } catch (error) {
        console.error('Error en el proceso de login:', error);
        showErrorModal('Error de conexión con el servidor');
    }
}

function showErrorModal(message = 'Ha ocurrido un error') {
    // Obtener el modal y sus elementos internos
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'), {});
    const errorMessageElement = document.querySelector('#errorModal .modal-body');

    // Actualizar el mensaje del modal
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }

    // Mostrar el modal
    errorModal.show();
}

