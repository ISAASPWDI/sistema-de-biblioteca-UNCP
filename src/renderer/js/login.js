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
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    try {
        const result = await window.sessionAPI.login({ email, password });
        
        if (result.success) {
            window.location.href = result.url;
        } else {
            console.error('Error credenciales');
            showErrorModal();
        }
    } catch (error) {
        console.error('Error al enviar el formulario', error);
        showErrorModal();
    }
}


function showErrorModal() {
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    errorModal.show();
}

