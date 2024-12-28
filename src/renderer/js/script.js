//IMPORTACIONES
import { login } from "./login.js";
import { initLogout } from "./logout.js";
import { initAgregarLibro } from "./agregar-libro.js";
import { initMostrarLibro } from "./mostrar-libro.js";
import { initMostrarUsuarios } from "./mostrar-usuarios.js";
import { initEditarUsuario } from "./editar-usuario.js";
import { initEliminarUsuario } from "./eliminar-usuario.js";
import { initGetDataAdmin } from "./dashboard.js";
import { initBibliotecaDigital } from "./biblioteca-digital.js";
import { initMisFavoritos } from "./mis-favoritos.js";

//OBJETO DE SELECTORES PARA EJECUTAR FUNCIONES
const elements = {
    loginForm: document.querySelector('.login-btn-form'),
    btnCerrarSesion: document.getElementById('cerrar-sesion'),
    btnAgregarLibro: document.querySelector('.add-book-btn-green'),
    libroGridContainer: document.querySelector('.libro-grid-card-container'),
    estudiantesTableBody: document.getElementById('user-table-body'),
    infoAdmin: document.querySelector('.info-admin'),
    scrollableContainer: document.querySelector('.favoritos-container')
};

// Inicialización general
function initializeApp() {
    
    // Mapeo de elementos y funciones
    const actions = [
        { element: elements.loginForm, action: login },
        { element: elements.btnCerrarSesion, action: initLogout },
        { element: elements.btnAgregarLibro, action: initAgregarLibro },
        { element: elements.libroGridContainer, action: initMostrarLibro },
        { element: elements.estudiantesTableBody, action: initMostrarUsuarios },
        { element: elements.estudiantesTableBody, action: initEditarUsuario },
        { element: elements.estudiantesTableBody, action: initEliminarUsuario },
        { element: elements.infoAdmin, action: initGetDataAdmin },
        { element: elements.scrollableContainer, action: initMisFavoritos },
    ];

    // Ejecutar funciones asociadas a elementos existentes
    actions.forEach(({ element, action }) => {
        if (element) {
        try {
            action();
        } catch (error) {
            console.error(`Error al ejecutar acción: ${error.message}`);
        }
    }
    });
}

// Ejecutar la inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeApp);
