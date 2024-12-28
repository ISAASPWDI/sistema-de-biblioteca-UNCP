export function initLogout() {
        const btnCerrarSesion = document.getElementById('cerrar-sesion')
        btnCerrarSesion.addEventListener('click', handleLogout)
}

async function handleLogout() {
    try {
        const res = await fetch('http://localhost:3000/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await res.json();
        window.location.href = data.url;
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        alert('Error al cerrar sesión. Por favor intente nuevamente.');
    }
}
