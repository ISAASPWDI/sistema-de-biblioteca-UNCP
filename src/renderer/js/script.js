//IMPORTACIONES
import { login } from "./login.js";
import { initLogout } from "./logout.js";
import { initAgregarLibro } from "./agregar-libro.js";
import { initMostrarLibro } from "./mostrar-libro.js";
import { initEditarLibro } from "./editar-libro.js";
import { initEliminarLibro } from "./eliminar-libro.js";

//OBJETO DE SELECTORES PARA EJECUTAR FUNCIONES
const elements = {
    loginForm: document.querySelector('.login-btn-form'),
    btnCerrarSesion: document.getElementById('cerrar-sesion'),
    btnAgregarLibro: document.querySelector('.add-book-btn-green'),
    formAgregarLibro: document.querySelector('.add-book-form'),
    libroGridContainer: document.querySelector('.libro-grid-card-container'),
    formEditarLibro: document.querySelector('.edit-book-form'),
    editClickInfo: document.querySelector('.edit-click-info'),
};

// Inicialización general
function initializeApp() {
    // Cambiar tema al cargar
    window.myAPI.toggleTheme();

    // Mapeo de elementos y funciones
    const actions = [
        { element: elements.loginForm, action: login },
        { element: elements.btnCerrarSesion, action: initLogout },
        { element: elements.btnAgregarLibro && elements.formAgregarLibro, action: initAgregarLibro },
        { element: elements.libroGridContainer && elements.formEditarLibro, action: initMostrarLibro },
        {element: !elements.formEditarLibro, action: initEliminarLibro},
    ];

    // Ejecutar funciones asociadas a elementos existentes
    actions.forEach(({ element, action }) => {
        if (element) action();
    });

}

// Ejecutar la inicialización
initializeApp();
