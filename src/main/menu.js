const { app, Menu } = require('electron')
let isDarkTheme = true

function toggleTheme(mainWindow) {
    isDarkTheme = !isDarkTheme // Cambiar el estado del tema
    mainWindow.webContents.send('toggle-theme', isDarkTheme) // Enviar mensaje al renderer
}
const setMenu = (window) => {
    const template = [
        {
            label: 'Temas',
            submenu: [
                {

                    label: 'Cambiar a Tema Claro',
                    click: () => {
                        isDarkTheme = true
                        toggleTheme(window)
                    }

                },
                {
                    label: 'Cambiar a Tema Oscuro',
                    click: () => {
                        isDarkTheme = false
                        toggleTheme(window)
                    }
                }
            ]
        },
        {
            label: 'Desplegar herramientas de desarrollo',
            click: () => window.webContents.openDevTools()
        },
        {
            label: 'Acerca de la app',
            click: () => {
                const aboutWindow = new BrowserWindow({
                    width: 400,
                    height: 300,
                    title: 'Acerca de la app',
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false
                    }
                });
                
            }
        },
        {
            label: 'Salir',
            click: () => app.quit()
        }
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu);
}
module.exports = {
    setMenu
}