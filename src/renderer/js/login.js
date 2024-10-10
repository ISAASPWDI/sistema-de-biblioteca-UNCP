export function login() {
    document.addEventListener('submit', (e) =>{
        e.preventDefault()
        getInterface()
    })

}
async function getInterface() {
    const d = document
    const $email = d.getElementById('email').value
    const $password = d.getElementById('password').value
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: $email, password: $password }),
        });
        const data = await response.json();
        if (response.ok) {
            window.location.href = data.url;
        } else {
            console.error('Página no encontrada');
        }
    } catch (error) {
        console.error('Error al enviar el formulario', error);
    }
}
