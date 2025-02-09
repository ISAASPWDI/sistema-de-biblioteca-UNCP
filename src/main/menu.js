const { app, Menu, BrowserWindow } = require('electron');
const sessionStore = require('./sessionStore.js');
let mainMenu;

const setMenu = (window) => {
    const template = [
        {
            label: 'Atrás',
            accelerator: process.platform === 'darwin' ? 'Cmd+[' : 'Alt+Left',
            click: () => {
                const currentUrl = window.webContents.getURL();

                // Verificar si estamos en la página de login y si ya estamos autenticados
                if (sessionStore.isAuthenticated() && currentUrl.includes('index.html')) {
                    console.log('Bloqueando retroceso al login porque ya estás autenticado.');
                    return; // Bloquear retroceso al login
                }

                if (window.webContents.canGoBack()) {
                    window.webContents.goBack();
                } else {
                    console.log('No hay páginas para retroceder.');
                }
            },
        },
        {
            label: 'Adelante',
            accelerator: process.platform === 'darwin' ? 'Cmd+]' : 'Alt+Right',
            click: () => {
                const currentUrl = window.webContents.getURL();

                // Bloquear avance al login si ya estamos autenticados
                if (sessionStore.isAuthenticated() && currentUrl.includes('index.html')) {
                    console.log('Bloqueando avance al login (index.html).');
                    return; // Bloquear avance hacia el login
                }

                if (window.webContents.canGoForward()) {
                    window.webContents.goForward();
                } else {
                    console.log('No hay páginas para avanzar.');
                }
            },
        },
        {
            label: 'Acerca de la app',
            click: () => {
                Menu.setApplicationMenu(null);

                const aboutWindow = new BrowserWindow({
                    width: 800,
                    height: 450,
                    title: 'Acerca de la app',
                    resizable: false,
                    minimizable: false,
                    maximizable: false,
                    modal: true,
                    parent: window,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false,
                    },
                });

                const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Acerca de la App</title>
                        <style>
                            body {
                                font-family: 'Helvetica Neue', Arial, sans-serif;
                                margin: 0;
                                padding: 0;
                                background-color: #f0f4f8;
                                color: #333;
                                line-height: 1.6;
                            }
                            header {
                                background-color: #0078d4;
                                color: white;
                                padding: 20px;
                                text-align: center;
                                border-bottom: 4px solid #005a9e;
                            }
                            h1 {
                                font-size: 2.5rem;
                                margin: 0;
                            }
                            p {
                                margin: 20px 20px 0px 80px;
                                font-size: 1.1rem;
                            }
                            ul {
                                list-style-type: none;
                                padding: 0;
                                display: flex;
                                flex-wrap: wrap;
                                justify-content: center;
                            }
                            li {
                                margin: 10px;
                                padding: 15px 20px;
                                background: #ffffff;
                                border-radius: 8px;
                                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                                transition: transform 0.2s;
                            }
                            li:hover {
                                transform: translateY(-3px);
                            }
                            footer {
                                text-align: center;
                                margin-top: 40px;
                                font-size: 0.9rem;
                                color: #666;
                            }
                        </style>
                    </head>
                    <body>
                        <header>
                            <h1>Acerca de la App</h1>
                        </header>
                        <main>
                            <p>Esta aplicación de escritorio fue desarrollada utilizando las siguientes tecnologías:</p>
                            <ul>
                                <li>HTML</li>
                                <li>CSS</li>
                                <li>BootStrap</li>
                                <li>JavaScript</li>
                                <li>SQL Server</li>
                                <li>Node.js</li>
                                <li>Express</li>
                                <li>Electron</li>
                            </ul>
                        </main>
                        <footer>
                            <span>© 2025 - UNCP</span>
                        </footer>
                    </body>
                    </html>
                `;

                aboutWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

                aboutWindow.on('closed', () => {
                    Menu.setApplicationMenu(mainMenu);
                });
            },
        },
        {
            label: 'Salir',
            click: () => app.quit(),
        },
    ];

    // Bloquear retroceso al login si el usuario ya está autenticado
    window.webContents.on('will-navigate', (event, url) => {
        if (sessionStore.isAuthenticated() && url.includes('index.html')) {
            event.preventDefault();  // Bloquea la navegación
            console.log('Bloqueando navegación al login.');
        }
    });

    mainMenu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(mainMenu);

    // Monitorizar cambios en el historial de navegación
    window.webContents.on('did-navigate', (event, url) => {
        if (sessionStore.isAuthenticated() && url.includes('index.html')) {
            console.log('Bloqueando regreso al login.');
            window.webContents.goBack();  // Volver a la página anterior
        }
    });

    // Escuchar el evento F12 para abrir DevTools
    window.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            window.webContents.openDevTools();
            event.preventDefault(); // Evita que el evento se propague
        }
    });
};

module.exports = {
    setMenu,
};