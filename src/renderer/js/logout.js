export function initLogout() {
    const btnCerrarSesion = document.getElementById('cerrar-sesion');
    btnCerrarSesion.addEventListener('click', handleLogout);
}

async function handleLogout() {
    try {
        const result = await window.sessionAPI.logout();
        if (result.success) {
            window.location.href = result.url;
        } else {
            alert('Error al cerrar sesión. Por favor intente nuevamente.');
        }
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        alert('Error al cerrar sesión. Por favor intente nuevamente.');
    }
}