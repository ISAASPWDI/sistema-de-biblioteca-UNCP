import { login } from "./login.js"
import { initLogout } from "./logout.js"
import { initAgregarLibro } from "./agregar-libro.js";
import { initMostrarLibro } from "./mostrar-libro.js";
const btnCerrarSesion = document.getElementById('cerrar-sesion');
const btnAgregarLibro = document.querySelector('.add-book-btn-green')
const loginForm = document.querySelector('.login-btn-form')
window.myAPI.toggleTheme()
if (loginForm) {
    login()
}

if (btnCerrarSesion) {
    initLogout()
}
if (btnAgregarLibro) {
    initAgregarLibro()
}
initMostrarLibro()
