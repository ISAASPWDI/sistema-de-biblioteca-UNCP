
export function login() {
    const loginForm = document.querySelector('.login-btn-form')
    loginForm.addEventListener('submit', (e) =>{
        e.preventDefault()
        getInterface()
    })

}

async function getInterface() {
    const d = document
    const $email = d.getElementById('email')?.value
    const $password = d.getElementById('password')?.value
    


    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: $email, password: $password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.location.href = data.url;
        } else {
            console.error('Error credenciales')
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