
export function login() {
    const loginForm = document.querySelector('.login-btn-form')
    const showPassword = document.querySelector('.form-check input')
    const passwordInput = document.getElementById('password')
    showPassword.addEventListener('click', () => {
        if (showPassword.checked) {
            passwordInput.type = 'text'
        } else {
            passwordInput.type = 'password'
        }
    })

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault()
        getInterface()
    })

}

async function getInterface() {
    const d = document;
    const email = d.getElementById('email')?.value;
    const password = d.getElementById('password')?.value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();


        // Redirigir y luego obtener datos de la sesión
        if (response.ok) {
            console.log(data);
            window.location.href = data.url; // Redirigir a la URL proporcionada
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