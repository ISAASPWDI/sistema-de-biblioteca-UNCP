export function initLogout() {
    document.addEventListener('DOMContentLoaded', () => {
        const btnCerrarSesion = document.getElementById('cerrar-sesion')
        btnCerrarSesion.addEventListener('click', handleLogout)
    });
}

async function handleLogout() {
    try {
        const res = await fetch('http://localhost:3000/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // if (!res.ok) {
        //     throw new Error(`HTTP error! status: ${res.status}`);
        // }

        const data = await res.json();
        window.location.href = data.url;
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        alert('Error al cerrar sesión. Por favor intente nuevamente.');
    }
}
